/**
 * /api/simplify-brief
 *
 * Takes assessment brief text and returns a week-by-week action plan
 * with checkboxes, tips, and plain-language explanations.
 *
 * POST { briefText, assessmentTitle, assessmentType, tier, wordCount }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 15, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { briefText, assessmentTitle, assessmentType, tier, wordCount } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!briefText || briefText.length < 20) return res.status(400).json({ success: false, error: 'briefText required.' });

  const systemPrompt = `You are a study planner inside Simplifii-OS. Australian English. No em-dashes.

Take this assessment brief and create a WEEK-BY-WEEK ACTION PLAN.

Format your response EXACTLY like this:

## Week 1: Getting Started
- [ ] Read the brief twice. Highlight words you do not understand.
- [ ] Look up any terms you do not know.
- [ ] Write one sentence: "This assessment is asking me to..."
- Tip: Start with the rubric. It tells you exactly what markers want.

## Week 2: Research
- [ ] Find 3 sources from your course readings.
- [ ] For each source, write 2 sentences about what it says.
- [ ] Tip: Your library database is better than Google for this.

...continue for as many weeks as the assessment needs...

## Final Week: Polish and Submit
- [ ] Read your work out loud. Fix anything that sounds wrong.
- [ ] Check every claim has a source.
- [ ] Run spell check.
- [ ] Submit before the deadline (not at 11:59pm).

RULES:
- Each week should have 3-5 concrete checkbox tasks
- Each task must be specific and completable in under 30 minutes
- Include a practical tip per week
- Adjust complexity for ${tier === 'secondary' ? 'Year 10-12 high school' : tier === 'postgrad' ? 'postgraduate research' : 'university undergraduate'} level
- If word count is provided, suggest word allocation per section
- Total plan should be realistic for the assessment scope`;

  try {
    const userMsg = `Assessment: "${assessmentTitle || 'Untitled'}"
Type: ${assessmentType || 'Essay'}
${wordCount ? `Word count: ${wordCount}` : ''}

Brief content:
${briefText.slice(0, 5000)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: systemPrompt, messages: [{ role: 'user', content: userMsg }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    const data = await response.json();
    return res.status(200).json({ success: true, plan: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
