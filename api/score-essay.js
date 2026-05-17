/**
 * /api/score-essay
 *
 * Takes draft text + rubric criteria, gives formative feedback with
 * estimated score per criterion. NOT a grade predictor. Formative only.
 *
 * POST { draftText, rubricCriteria, assessmentTitle, tier }
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

  const { draftText, rubricCriteria, assessmentTitle, tier, literalMode, accessibilityProfile, learnerContext } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!draftText || draftText.length < 50) return res.status(400).json({ success: false, error: 'draftText required (min 50 chars).' });

  let systemPrompt = `You are a formative feedback tool inside Simplifii-OS. Australian English. No em-dashes.

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

  if (literalMode) systemPrompt += '\n\nLITERAL MODE: No metaphors, no idioms, no ambiguity. Use concrete, specific language only.';
  if (accessibilityProfile && accessibilityProfile !== 'standard') systemPrompt += `\n\nAdapt feedback tone and length for ${accessibilityProfile} accessibility profile.`;
  const safeContext = sanitiseLearnerContext(learnerContext);
  if (safeContext) systemPrompt += safeContext;

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

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    const data = await response.json();
    await recordUsage(userId, 'score-essay', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    // Compute AI Risk Score (text analysis, no LLM needed)
    const aiRisk = computeAIRiskScore(draftText);

    return res.status(200).json({
      success: true,
      feedback: data?.content?.[0]?.text || '',
      disclaimer: 'This is formative feedback from an AI tool, not a mark from your teacher.',
      aiRiskScore: aiRisk.score,
      aiRiskLabel: aiRisk.label,
      aiRiskBreakdown: aiRisk.breakdown,
      humanisingSuggestions: aiRisk.suggestions,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}

/**
 * AI Risk Score: computes 0-100 likelihood of triggering AI detection.
 * Ported from Emergent build (tools.py:25-100).
 */
function computeAIRiskScore(text) {
  if (!text || !text.trim()) return { score: 50, label: 'Medium', breakdown: {}, suggestions: [] };

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const totalSents = Math.max(sentences.length, 1);
  const words = text.split(/\s+/);
  const totalWords = Math.max(words.length, 1);
  const textLower = text.toLowerCase();

  // 1. Passive voice
  const passiveHits = (text.match(/\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en|ised|ized|ated)\b/gi) || []).length;
  const passiveRatio = Math.min(passiveHits / totalSents, 1.0);

  // 2. Sentence length uniformity
  const sentLengths = sentences.map(s => s.trim().split(/\s+/).length);
  let uniformity = 0.5;
  if (sentLengths.length > 2) {
    const mean = sentLengths.reduce((s, l) => s + l, 0) / sentLengths.length;
    const variance = sentLengths.reduce((s, l) => s + (l - mean) ** 2, 0) / sentLengths.length;
    uniformity = Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / 8));
  }

  // 3. Transition word density
  const transitions = ['however', 'furthermore', 'moreover', 'therefore', 'additionally', 'consequently', 'nevertheless', 'in conclusion', 'in contrast', 'as a result'];
  const transCount = transitions.filter(t => textLower.includes(t)).length;
  const transDensity = Math.min(transCount / totalSents, 1.0);

  // 4. Formal phrase density
  const formalPhrases = ['it is important to note', 'this essay will examine', 'in conclusion', 'it can be argued', 'it is evident that', 'one must consider', 'the findings suggest', 'in order to', 'play a crucial role'];
  const formalCount = formalPhrases.filter(p => textLower.includes(p)).length;
  const formalDensity = Math.min(formalCount / Math.max(totalSents / 3, 1), 1.0);

  // 5. First-person absence (AI rarely uses I/my/we)
  const fpCount = (text.match(/\b(?:I|my|me|we|our|myself)\b/g) || []).length;
  const fpAbsence = 1 - Math.min(fpCount / (totalWords * 0.02), 1.0);

  // Weighted score
  const raw = (passiveRatio * 15) + (uniformity * 25) + (transDensity * 20) + (formalDensity * 20) + (fpAbsence * 20);
  const score = Math.round(Math.min(100, Math.max(0, raw)));
  const label = score <= 30 ? 'Low' : score <= 60 ? 'Medium' : 'High';

  const suggestions = [];
  if (passiveRatio > 0.3) suggestions.push('Reduce passive voice. Write "I analysed..." instead of "It was analysed..."');
  if (uniformity > 0.7) suggestions.push('Vary your sentence lengths. Mix short punchy sentences with longer complex ones.');
  if (transDensity > 0.5) suggestions.push('Reduce transition words like "furthermore" and "moreover". Use simpler connectors.');
  if (formalDensity > 0.3) suggestions.push('Remove overly formal phrases. Write how you would explain it to a classmate.');
  if (fpAbsence > 0.8) suggestions.push('Add first-person voice. Use "I argue" or "In my analysis" where appropriate.');

  return {
    score,
    label,
    breakdown: { passiveVoice: Math.round(passiveRatio * 100), sentenceUniformity: Math.round(uniformity * 100), transitionDensity: Math.round(transDensity * 100), formalPhrases: Math.round(formalDensity * 100), firstPersonAbsence: Math.round(fpAbsence * 100) },
    suggestions,
  };
}
