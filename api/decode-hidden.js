/**
 * /api/decode-hidden
 *
 * Takes assessment brief and decodes the hidden curriculum:
 * what markers actually want vs what the brief literally says.
 *
 * POST { briefText, assessmentTitle, tier }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const { briefText, assessmentTitle, tier } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!briefText || briefText.length < 20) return res.status(400).json({ success: false, error: 'briefText required.' });

  const systemPrompt = `You are a hidden curriculum decoder inside Simplifii-OS. Australian English. No em-dashes.

The "hidden curriculum" is everything a student needs to know to succeed that is never explicitly taught: what markers really mean, what the brief assumes you already know, what separates a pass from a distinction.

Analyse this brief and decode:

## What the Brief Says vs What It Means

| Brief says | Actually means | What to do |
|-----------|---------------|------------|
| "Critically analyse" | [decode] | [action] |
| "Demonstrate understanding" | [decode] | [action] |
...for every key instruction word...

## Assumed Knowledge
Things this brief expects you already know (but does not say):
- [list each assumption]
- [for each: where to learn it if you do not know it]

## The Unwritten Rules
- What format the marker expects (even if the brief does not specify)
- How to open (what a strong first sentence looks like for this type)
- How to close (what a strong conclusion does)
- Citation expectations (how many sources, what type)
- Word allocation (how to split the word count across sections)

## Marker Psychology
- What makes a marker think "this student gets it" in the first paragraph
- What makes a marker stop reading carefully (and why that costs marks)
- The difference between a Credit and a Distinction for this specific task

RULES:
- Be specific to THIS brief, not generic advice
- ${tier === 'secondary' ? 'Explain for Year 10-12. No academic jargon without definition.' : ''}
- Honest. If the brief is badly written, say so diplomatically.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2500, system: systemPrompt, messages: [{ role: 'user', content: `Assessment: "${assessmentTitle || 'Untitled'}"\n\nBrief:\n${briefText.slice(0, 5000)}` }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    const data = await response.json();
    return res.status(200).json({ success: true, decoded: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
