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

  let systemPrompt = `You are a rubric translator inside Simplifii-OS. Your job is to read any rubric and translate it into a clear action plan students can follow. Handle ANY grade scale: HD/D/C/P, Excellent/Very Good/Satisfactory, numeric, percentage, or custom bands. Australian English. No em-dashes. Return ONLY valid JSON.`;

  if (literalMode) systemPrompt += '\n\nLITERAL MODE: No metaphors, no idioms, no ambiguity. Use concrete, specific language only.';
  if (accessibilityProfile && accessibilityProfile !== 'standard') systemPrompt += `\n\nAdapt output for ${accessibilityProfile} accessibility profile.`;
  const safeContext = sanitiseLearnerContext(learnerContext);
  if (safeContext) systemPrompt += safeContext;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2500, system: systemPrompt, messages: [{ role: 'user', content: `Read this rubric for a ${levelLabel} assessment "${assessmentTitle || 'Untitled'}" and extract every criterion.\n\nRubric:\n${rubricText.slice(0, 5000)}\n\nReturn ONLY a JSON object:\n{\n  "criteria": [\n    {\n      "name": "exact criterion name from rubric",\n      "gradeBands": [\n        {"label": "exact grade level from rubric", "description": "what student must do", "evidence": "specific evidence marker looks for"}\n      ],\n      "microTaskChecklist": ["specific action 1", "action 2", "action 3"],\n      "selfAssessmentQuestion": "one question the student asks themselves to check this criterion"\n    }\n  ],\n  "normalisingMessage": "warm paragraph acknowledging rubrics are confusing",\n  "scaleDetected": "the grading scale found (e.g. HD/D/C/P or Excellent/Good/Satisfactory)"\n}\n\nRULES:\n- Extract EVERY criterion. Do not skip any.\n- For each criterion include EVERY grade band using EXACT labels from the rubric.\n- microTaskChecklist: 3-4 specific actions per criterion.\n- Do NOT rename grade bands. Use what the rubric says.\n- Australian English. Return ONLY the JSON.` }] }),
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
