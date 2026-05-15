/**
 * /api/joke
 *
 * Generates a clean, ND-friendly joke via Claude.
 * Style preferences: puns, wordplay, observational, nerdy, dad-jokes.
 *
 * POST { style?: string }
 * Returns { success, joke }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const { style } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });

  const styleHint = style || 'observational';
  const systemPrompt = `You are a joke generator inside Simplifii-OS, a neuroinclusive education tool for Australian students.

Generate ONE joke. Style: ${styleHint}.

RULES:
- Clean, appropriate for ages 13+
- No references to: violence, substances, sexual content, self-harm, bullying
- ND-friendly: no jokes about forgetting things, being "slow", being "weird"
- Avoid idioms that EAL/D students might not understand
- Australian English preferred but universal humour is fine
- Short: max 3 lines
- Return ONLY the joke text, nothing else`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 150, system: systemPrompt, messages: [{ role: 'user', content: 'Tell me a joke.' }] }),
    });
    if (!response.ok) return res.status(502).json({ success: false, error: 'Claude unavailable.' });
    const data = await response.json();
    return res.status(200).json({ success: true, joke: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
