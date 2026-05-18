/**
 * /api/generate-task-sequence
 *
 * Generates a 5-phase task sequence for an assessment, calibrated to the
 * actual brief and rubric content. Called at ingestion time and stored in
 * Supabase against the assessment record.
 *
 * POST { briefText, rubricText, assessmentTitle, tier, userId }
 * Returns { success: true, taskSequence: { phases: [...] } }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';
import { sanitiseLearnerContext } from './_sanitize.js';

const SYSTEM_PROMPT = `You are a task sequence generator for Simplifii-OS, a neuroinclusive academic operating system for Australian students.

You will receive two inputs:
- briefText: the assessment task description (XN1 content)
- rubricText: the rubric criteria (YN1 content)

Your job is to generate exactly 5 phases for this specific assessment. The phases must be calibrated to what the brief actually asks and what the rubric actually rewards. Do not produce generic phases.

The 5 phases are always in this order, with these IDs:
1. understand
2. plan
3. gather
4. draft
5. review

For each phase, produce the following fields:

id
  The phase ID from the list above.

label
  A short display name for the phase (2 to 4 words, title case, Australian English).

instruction
  One to two sentences telling the student what to do in this phase. Refer directly to the brief. Do not use the word "you". Use plain, direct language. No em-dashes. No markdown.

whyThisPhase
  Exactly one sentence explaining why this phase matters for this specific assessment. Tie it to a rubric criterion or a feature of the brief where possible. No em-dashes. No markdown.

auraOpeningPrompt
  An open question that AURA asks the student when they enter this phase. The question must be specific to this assessment, not generic. It must invite the student to think, not to confirm. It must be answerable in a few sentences. It must not presuppose what the student already knows. No em-dashes. No markdown.

toolsForThisPhase
  An array of panel IDs relevant to this phase. Choose only from this set:
  ["brief", "tutor", "sources", "provenance", "check", "udl", "simplify", "rubric", "scorer", "hidden", "humanise", "analysis", "pastqs", "preview"]

  Suggested defaults (adjust based on the brief):
  - understand: ["brief", "udl", "tutor"]
  - plan: ["simplify", "rubric", "hidden"]
  - gather: ["sources", "tutor"]
  - draft: ["tutor", "check"]
  - review: ["scorer", "humanise", "provenance"]

completionSignal
  A short string describing the observable condition that indicates this phase is done. Be concrete. Examples: "student has answered all three understanding questions", "outline has one section per rubric criterion", "at least two sources added to source list", "draft word count exceeds 80 percent of target", "rubric check run and all criteria addressed".

estimatedMinutes
  A number. Estimate the realistic time in minutes for a typical student to complete this phase for this specific assessment. Then add 25 percent to that estimate (the neurodivergent buffer). Round to the nearest 5 minutes. Do not include a note about the buffer in the output.

lockedUntil
  The ID of the phase that must be completed before this one unlocks. Use null for the understand phase. For all other phases, set this to the ID of the immediately preceding phase.

Output a single JSON object with this structure:

{
  "phases": [
    {
      "id": string,
      "label": string,
      "instruction": string,
      "whyThisPhase": string,
      "auraOpeningPrompt": string,
      "toolsForThisPhase": string[],
      "completionSignal": string,
      "estimatedMinutes": number,
      "lockedUntil": string | null
    }
  ]
}

If briefText or rubricText is missing or too short to calibrate from, produce the sequence using the information available and include a "calibrationWarning" field at the top level of the JSON object with a short plain-English note describing what was missing.

Rules:
- Output valid JSON only. No markdown fences, no explanation, no preamble.
- All text fields use Australian English spelling (organise, recognise, analyse, colour, behaviour).
- No em-dashes anywhere. Use colons or parentheses instead.
- No markdown formatting inside any string value.
- Every auraOpeningPrompt must be a genuine open question, not a yes/no question.
- estimatedMinutes must already include the 25 percent neurodivergent buffer.
- Calibrate every field to the actual assessment content. If the brief is a report on a specific topic, the instruction and auraOpeningPrompt must name that topic. If the rubric emphasises critical analysis, the review phase instruction and completionSignal must reference it.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = await rateLimit(getIdentifier(req), { maxRequests: 10, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { briefText, rubricText, assessmentTitle, tier, learnerContext } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!briefText && !rubricText) {
    return res.status(400).json({ success: false, error: 'At least one of briefText or rubricText is required.' });
  }

  const levelLabel = tier === 'secondary' ? 'Year 10-12'
    : tier === 'postgrad' ? 'postgraduate'
    : 'undergraduate';

  let systemPrompt = SYSTEM_PROMPT;
  const safeContext = sanitiseLearnerContext(learnerContext);
  if (safeContext) systemPrompt += safeContext;

  const briefSection = briefText
    ? `[ASSESSMENT BRIEF]\n${briefText.slice(0, 4000)}`
    : '[ASSESSMENT BRIEF]\nNot provided.';

  const rubricSection = rubricText
    ? `[RUBRIC CRITERIA]\n${rubricText.slice(0, 3000)}`
    : '[RUBRIC CRITERIA]\nNot provided.';

  const userMsg = `Generate a 5-phase task sequence for this ${levelLabel} assessment: "${assessmentTitle || 'Untitled'}".

${briefSection}

${rubricSection}

Return ONLY the JSON object. No markdown, no explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });

    const data = await response.json();
    await recordUsage(userId, 'generate-task-sequence', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });

    const rawText = data?.content?.[0]?.text || '';
    let taskSequence = null;
    try {
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) taskSequence = JSON.parse(m[0]);
    } catch {
      // fallback: return raw text for the caller to surface an error
    }

    if (!taskSequence || !Array.isArray(taskSequence.phases) || taskSequence.phases.length !== 5) {
      return res.status(502).json({ success: false, error: 'Task sequence could not be parsed. Try again.' });
    }

    return res.status(200).json({ success: true, taskSequence });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
