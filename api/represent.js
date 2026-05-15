/**
 * /api/represent
 *
 * Generates UDL 3.0 multiple representations of an assessment brief.
 * 4 types: plain_english, visual_outline, audio_script, chunked_tasks
 *
 * POST { briefText, type, assessmentTitle?, tier? }
 * Returns { success, content, type }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

const PROMPTS = {
  plain_english: `Translate this assessment brief into plain English suitable for a Year 10 student.
Use short sentences (max 12 words each). Remove all jargon.
If you must use a technical term, explain it in parentheses immediately after.
Output as bullet points. Start with "What you need to do:" then list each requirement.
End with "How you will be marked:" summarising the rubric in plain language.
Australian English. No em-dashes.`,

  visual_outline: `Convert this assessment brief into a step-by-step text flowchart.
Use this format exactly:
[START] Your task title
  |
[STEP 1] First thing to do (5 words max)
  |
[STEP 2] Second thing to do
  |
...continue for all steps...
  |
[CHECK] What to verify before submitting
  |
[SUBMIT] Final submission action

Keep each step label under 8 words. Include estimated time per step if possible.
Australian English. No em-dashes.`,

  audio_script: `Convert this assessment brief into a 60-second spoken script.
Write it as if you are a calm, friendly senior student explaining the assignment to a stressed Year 11 friend.
Conversational tone. No jargon. Short sentences.
Start with "OK so here is what this assignment is actually asking you to do."
End with "You have got this. Start with the first step and go from there."
Do not use the phrase "you've got this" or any toxic positivity. Be honest and direct.
Australian English. No em-dashes.`,

  chunked_tasks: `Break this assessment brief into the smallest possible discrete tasks.
Each task should take under 15 minutes to complete.
Output as a numbered list in this format:
1. [TASK TITLE] (estimated: X min)
   What to do: one sentence description
   Depends on: none OR task number(s)

Order tasks so a student can start from task 1 and work sequentially.
Group related tasks under section headers if the brief has sections.
Australian English. No em-dashes.`,
};

const TYPE_LABELS = {
  plain_english: 'Plain English',
  visual_outline: 'Visual Outline',
  audio_script: 'Audio Script',
  chunked_tasks: 'Chunked Tasks',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 20, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { briefText, type, assessmentTitle, tier, literalMode, accessibilityProfile, learnerContext } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ success: false, error: 'Anthropic API key not configured.' });
  if (!briefText || briefText.length < 20) return res.status(400).json({ success: false, error: 'briefText required (min 20 chars).' });
  if (!PROMPTS[type]) return res.status(400).json({ success: false, error: `Invalid type. Use: ${Object.keys(PROMPTS).join(', ')}` });

  const tierContext = tier === 'secondary' ? 'The student is in Year 10-12 (Australian high school).'
    : tier === 'primary' ? 'The student is in primary school (age 5-12).'
    : tier === 'tafe' ? 'The student is in TAFE/vocational education.'
    : 'The student is at university.';

  let systemPrompt = `You are a UDL 3.0 representation generator inside Simplifii-OS.
${tierContext}
${PROMPTS[type]}`;

  if (literalMode) systemPrompt += '\n\nLITERAL MODE: No metaphors, no idioms, no ambiguity. Use concrete, specific language only.';
  if (accessibilityProfile && accessibilityProfile !== 'standard') systemPrompt += `\n\nAdapt output for ${accessibilityProfile} accessibility profile.`;
  if (learnerContext) systemPrompt += learnerContext;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Assessment: "${assessmentTitle || 'Untitled'}"\n\nBrief content:\n${briefText.slice(0, 4000)}` }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    }

    const data = await response.json();
    await recordUsage(userId, 'represent', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    const content = data?.content?.[0]?.text || '';

    return res.status(200).json({
      success: true,
      content,
      type,
      label: TYPE_LABELS[type],
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Generation failed.' });
  }
}
