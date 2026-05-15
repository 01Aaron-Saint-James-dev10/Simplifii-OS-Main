/**
 * /api/decode-rubric
 *
 * Takes rubric criteria and translates into plain language with
 * concrete examples of what markers actually want.
 *
 * POST { rubricText, assessmentTitle, tier }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 15, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { rubricText, assessmentTitle, tier } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!rubricText || rubricText.length < 10) return res.status(400).json({ success: false, error: 'rubricText required.' });

  const systemPrompt = `You are a rubric decoder inside Simplifii-OS. Australian English. No em-dashes.

Take each rubric criterion and translate it into THREE things:

1. **What it actually means** (plain English, max 2 sentences)
2. **What a top-band response looks like** (specific, concrete example)
3. **Common mistake to avoid** (what students lose marks for)

Format EXACTLY like this:

### Criterion: [original criterion text]

**What this means:** [plain English translation]

**Top response:** [what markers want to see, with example]

**Avoid:** [common mistake]

---

Repeat for every criterion in the rubric.

RULES:
- Use ${tier === 'secondary' ? 'Year 10-12' : tier === 'postgrad' ? 'postgraduate' : 'undergraduate'} appropriate language
- Be specific. "Analyse effectively" means nothing. "Use 2-3 quotes per paragraph and explain how the language technique creates meaning" is useful.
- If a criterion says "demonstrates understanding", explain WHAT understanding looks like in practice
- Honest. If a criterion is genuinely vague, say so: "This criterion is broad. Focus on..."`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: systemPrompt, messages: [{ role: 'user', content: `Assessment: "${assessmentTitle || 'Untitled'}"\n\nRubric:\n${rubricText.slice(0, 4000)}` }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    const data = await response.json();
    return res.status(200).json({ success: true, decoded: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
