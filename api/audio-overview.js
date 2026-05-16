/**
 * /api/audio-overview
 *
 * Generates a spoken script from an assessment brief. The frontend
 * plays it via browser Web Speech API (SpeechSynthesis). No audio
 * files generated or stored.
 *
 * POST { briefText, assessmentTitle, tier }
 * Returns { success, script }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 5, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { briefText, assessmentTitle, tier, literalMode, accessibilityProfile, learnerContext } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!briefText || briefText.length < 20) return res.status(400).json({ success: false, error: 'briefText required.' });

  let systemPrompt = `You are a friendly audio overview narrator inside Simplifii-OS. Australian English. No em-dashes.

Convert this assessment brief into a 60-second spoken script. Write it as if you are a calm, friendly senior student explaining the assignment to a ${tier === 'secondary' ? 'stressed Year 11 friend' : 'classmate'}.

RULES:
- Conversational tone. Short sentences. Pauses between ideas.
- Start with: "OK so here is what this assignment is actually asking you to do."
- Cover: what the task is, how many words, when it is due (if known), what the rubric wants
- End with: "Start with step one and go from there. You have got this."
- No jargon. Explain any unavoidable terms.
- Max 150 words (about 60 seconds spoken).
- Return ONLY the script text. No formatting, no headers.`;

  if (literalMode) systemPrompt += '\n\nLITERAL MODE: No metaphors, no idioms. Use concrete, specific language only.';
  if (accessibilityProfile && accessibilityProfile !== 'standard') systemPrompt += `\n\nAdapt script for ${accessibilityProfile} accessibility profile.`;
  if (learnerContext) systemPrompt += learnerContext;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 300, system: systemPrompt,
        messages: [{ role: 'user', content: `Assessment: "${assessmentTitle || 'Untitled'}"\n\nBrief:\n${briefText.slice(0, 3000)}` }],
      }),
    });
    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    const data = await response.json();
    await recordUsage(userId, 'audio-overview', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    return res.status(200).json({ success: true, script: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
