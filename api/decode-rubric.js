/**
 * /api/decode-rubric
 *
 * Takes rubric criteria and translates into plain language with
 * concrete examples of what markers actually want.
 *
 * POST { rubricText, assessmentTitle, tier }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';
import { sanitiseLearnerContext } from './_sanitize.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 15, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { rubricText, assessmentTitle, tier, literalMode, accessibilityProfile, learnerContext } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!rubricText || rubricText.length < 10) return res.status(400).json({ success: false, error: 'rubricText required.' });

  const levelLabel = tier === 'secondary' ? 'Year 10-12' : tier === 'postgrad' ? 'postgraduate' : 'undergraduate';

  let systemPrompt = `You are a rubric translator inside Simplifii-OS. Your job is to read any rubric and translate it into a clear action plan students can follow. Handle ANY grade scale: HD/D/C/P, Excellent/Very Good/Satisfactory, numeric, percentage, or custom bands. Australian English. No em-dashes. No markdown formatting. Return ONLY valid JSON.

Rubrics are written for markers, not students. The student reading this may be neurodivergent, time-poor, returning to study, or carrying the weight of past educational harm. Translate the rubric into language they can act on without needing to decode it themselves.`;

  if (literalMode) systemPrompt += '\n\nLITERAL MODE: No metaphors, no idioms, no ambiguity. Use concrete, specific language only.';
  if (accessibilityProfile && accessibilityProfile !== 'standard') systemPrompt += `\n\nAdapt output for ${accessibilityProfile} accessibility profile.`;
  const safeContext = sanitiseLearnerContext(learnerContext);
  if (safeContext) systemPrompt += safeContext;

  try {
    const userMsg = `Read this rubric for a ${levelLabel} assessment "${assessmentTitle || 'Untitled'}" and extract every criterion.

Rubric:
${rubricText.slice(0, 5000)}

Return ONLY a JSON object:
{
  "scaleDetected": "the grading scale found (e.g. HD/D/C/P or Excellent/Good/Satisfactory or 1-7 numeric). Auto-detect from the rubric text.",
  "overallStrategy": "2-3 sentences on how to approach this rubric as a whole. Which criteria carry the most weight? Where should the student focus?",
  "criteria": [
    {
      "name": "exact criterion name from rubric",
      "weighting": "percentage or mark value if stated in the rubric, null if not",
      "plainEnglish": "one sentence: what this criterion is actually asking in plain language",
      "gradeBands": [
        {
          "label": "exact grade level from rubric (do NOT rename)",
          "description": "what the student must do to achieve this level",
          "evidence": "one concrete example of what evidence the marker looks for at this level"
        }
      ],
      "microTaskChecklist": ["specific action 1", "action 2", "action 3"],
      "selfAssessmentQuestion": "one 'I have...' statement the student can check off before submitting",
      "topBandSecret": "what specifically separates the highest grade from the one below it for this criterion"
    }
  ],
  "normalisingMessage": "Warm paragraph. Acknowledge that rubrics are written for markers, not students. Acknowledge the student may be neurodivergent, time-poor, or returning to study. Name the difficulty without minimising it. Never a productivity tip."
}

RULES:
- Extract EVERY criterion. Do not skip any.
- For each criterion include EVERY grade band using EXACT labels from the rubric.
- Do NOT rename grade bands. Use what the rubric says.
- Auto-detect the grading scale from the rubric text. Never assume HD/D/C/P.
- weighting: extract if stated, null if not
- plainEnglish: translate academic jargon into one sentence a Year 10 student could understand
- microTaskChecklist: 3-4 specific actions per criterion
- selfAssessmentQuestion: must start with "I have..." so it works as a checkbox
- topBandSecret: specific to this criterion, not generic advice
- overallStrategy: reference the actual criteria and their relative importance
- normalisingMessage: warm, direct, acknowledges difficulty. Never generic. Never a productivity tip.
- Australian English
- Return ONLY the JSON, nothing else`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, system: systemPrompt, messages: [{ role: 'user', content: userMsg }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    const data = await response.json();
    await recordUsage(userId, 'decode-rubric', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    const rawText = data?.content?.[0]?.text || '';
    let rubricData = null;
    try { const m = rawText.match(/\{[\s\S]*\}/); if (m) rubricData = JSON.parse(m[0]); } catch { /* fallback to raw */ }
    return res.status(200).json({ success: true, decoded: rawText, rubricData });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
