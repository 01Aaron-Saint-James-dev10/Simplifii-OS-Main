/**
 * /api/humanise
 *
 * Takes AI-sounding text and rewrites to sound like a specific student.
 * Reduces passive voice, adds hedging, varies sentence length,
 * introduces first-person voice, removes formal academic cliches.
 *
 * POST { draftText, studentVoiceSample? }
 * Returns { success, humanisedText, changesExplained }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 10, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { draftText, studentVoiceSample } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!draftText || draftText.length < 30) return res.status(400).json({ success: false, error: 'draftText required (min 30 chars).' });

  const hasVoice = studentVoiceSample && studentVoiceSample.trim().length > 50;

  const systemPrompt = hasVoice
    ? `You are a writing voice adapter. You take text that sounds AI-generated and rewrite it to match a specific student's natural writing voice. Australian English. No em-dashes.

STUDENT VOICE SAMPLE (match this style):
${studentVoiceSample.slice(0, 2000)}

RULES:
- Match the student's sentence length patterns
- Match their vocabulary level (do not upgrade or downgrade)
- Match their use of first-person, hedging, and colloquialisms
- Keep the meaning and argument structure identical
- Only change HOW it sounds, not WHAT it says
- Reduce passive voice to match the sample's active voice ratio
- Add natural hedging where the student would hedge
- Vary sentence length to match the sample's rhythm`
    : `You are a writing naturaliser. You take text that sounds AI-generated and make it sound like a real student wrote it. Australian English. No em-dashes.

RULES:
- Convert passive voice to active where natural
- Vary sentence lengths (mix short punchy with longer complex)
- Add occasional hedging ("I think", "perhaps", "it seems")
- Remove overused transitions ("furthermore", "moreover", "additionally")
- Remove formal cliches ("it is important to note", "in conclusion")
- Add first-person voice where appropriate ("I argue", "In my reading")
- Keep contractions where natural ("don't", "isn't", "they're")
- Preserve all factual claims and argument structure
- Do NOT add new ideas or change the meaning
- Do NOT make it worse. If a sentence is already natural, leave it.`;

  const userMsg = `Rewrite this text to sound more natural and human:

${draftText.slice(0, 4000)}

Return a JSON object:
{
  "humanisedText": "the full rewritten text",
  "changesExplained": "2-3 sentences explaining what was changed and why"
}

Return ONLY the JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: systemPrompt, messages: [{ role: 'user', content: userMsg }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    const data = await response.json();
    await recordUsage(userId, 'humanise', { tokensIn: data?.usage?.input_tokens || 0, tokensOut: data?.usage?.output_tokens || 0 });

    const rawText = data?.content?.[0]?.text || '';
    let result = null;
    try { const m = rawText.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]); } catch { /* fallback */ }

    if (result) {
      return res.status(200).json({ success: true, humanisedText: result.humanisedText || rawText, changesExplained: result.changesExplained || '' });
    }
    return res.status(200).json({ success: true, humanisedText: rawText, changesExplained: 'Text was rewritten to sound more natural.' });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
