/**
 * /api/score-essay
 *
 * Takes draft text + rubric criteria, gives formative feedback with
 * estimated score per criterion. NOT a grade predictor. Formative only.
 *
 * POST { draftText, rubricCriteria, assessmentTitle, tier }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 15, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { draftText, rubricCriteria, assessmentTitle, tier } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!draftText || draftText.length < 50) return res.status(400).json({ success: false, error: 'draftText required (min 50 chars).' });

  const systemPrompt = `You are a formative feedback tool inside Simplifii-OS. Australian English. No em-dashes.

IMPORTANT: You are NOT predicting a grade. You are giving formative feedback to help the student improve BEFORE submission. Be honest but kind.

For each rubric criterion (or if no rubric, use general academic criteria), provide:

### [Criterion Name]
**Strength:** What the student is doing well (be specific, quote their text)
**Gap:** What is missing or could be stronger (be specific)
**Action:** One concrete thing to do to improve this section
**Estimate:** [Developing / Competent / Proficient / Advanced]

Then at the end:

## Overall
**Word count:** [actual] / [target if known]
**Strongest area:** [which criterion]
**Priority fix:** [the one thing that would most improve the mark]
**Honesty check:** [flag any claims without sources, any jargon used incorrectly, any sections that feel rushed]

RULES:
- Quote the student's actual text when giving feedback
- ${tier === 'secondary' ? 'Remember this is a Year 10-12 student. Be encouraging but honest.' : ''}
- Never say "good job" without specifics
- Never be vague. "Improve your analysis" is useless. "In paragraph 3, explain WHY the metaphor creates tension, not just THAT it does" is useful.
- Disclaimer: "This is formative feedback from an AI tool, not a mark from your teacher."`;

  try {
    const userMsg = `Assessment: "${assessmentTitle || 'Untitled'}"
${rubricCriteria ? `Rubric criteria:\n${rubricCriteria}` : 'No rubric provided. Use general academic criteria.'}

Student draft:
${draftText.slice(0, 6000)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2500, system: systemPrompt, messages: [{ role: 'user', content: userMsg }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    const data = await response.json();
    return res.status(200).json({ success: true, feedback: data?.content?.[0]?.text || '', disclaimer: 'This is formative feedback from an AI tool, not a mark from your teacher.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
