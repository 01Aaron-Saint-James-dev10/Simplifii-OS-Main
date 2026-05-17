/**
 * /api/simplify-brief
 *
 * Takes assessment brief text and returns a week-by-week action plan
 * with checkboxes, tips, and plain-language explanations.
 *
 * POST { briefText, assessmentTitle, assessmentType, tier, wordCount }
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

  const { briefText, assessmentTitle, assessmentType, tier, wordCount, documentType, literalMode, accessibilityProfile, learnerContext } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!briefText || briefText.length < 20) return res.status(400).json({ success: false, error: 'briefText required.' });

  const levelLabel = tier === 'secondary' ? 'Year 10-12 high school' : tier === 'postgrad' ? 'postgraduate research' : 'university undergraduate';
  const literalPreamble = literalMode ? '\nLITERAL MODE: No metaphors, no idioms, no ambiguity. Label emotions [feeling: X]. Mark uncertainty [uncertain] vs [confirmed]. Number all steps.\n' : '';
  const profilePreamble = accessibilityProfile && accessibilityProfile !== 'standard' ? `\nAdapt output for ${accessibilityProfile} accessibility profile.\n` : '';
  const learnerPreamble = sanitiseLearnerContext(learnerContext);

  // Type-specific prompt overrides
  if (documentType === 'exam_paper') {
    const examPrompt = `You are a study planner inside Simplifii-OS. Australian English. No em-dashes.${literalPreamble}${profilePreamble}${learnerPreamble}

You are reading an ACTUAL exam paper. Analyse it and create a PRACTICE PLAN.

First, summarise the exam structure: total marks, time allowed, number of sections, question types (multiple choice, short answer, extended response).

Then create a practice plan:

## Exam Overview
- Total marks: [extract from document]
- Sections: [list each section with mark allocation]
- Question types: [breakdown]

## Priority Questions (highest marks first)
- [ ] Question X (Y marks): [brief description of what it asks]
- [ ] Question Z (W marks): [brief description]

## Practice Strategy
### Session 1: Multiple Choice (if present)
- [ ] Attempt all MC questions under timed conditions
- [ ] Review incorrect answers against textbook
- Tip: [specific tip for this exam's MC style]

### Session 2: Short Answer
- [ ] Pick the 3 highest-mark short answer questions
- [ ] Write practice responses, check against marking criteria
- Tip: [specific tip]

### Session 3: Extended Response
- [ ] Plan the extended response structure before writing
- [ ] Focus on the rubric criteria for top marks
- Tip: [specific tip]

RULES:
- Reference ACTUAL questions and sections from the document
- Never use generic templates or placeholder text
- Adjust for ${levelLabel} level
- If the document is too short to analyse properly, say so`;

    try {
      const userMsg = `Exam paper: "${assessmentTitle || 'Untitled'}"

Document content:
${briefText.slice(0, 5000)}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: examPrompt, messages: [{ role: 'user', content: userMsg }] }),
      });

      if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
      const data = await response.json();
      await recordUsage(userId, 'simplify-brief', { tokensIn: data?.usage?.input_tokens || 0, tokensOut: data?.usage?.output_tokens || 0 });
      return res.status(200).json({ success: true, plan: data?.content?.[0]?.text || '' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (documentType === 'rubric') {
    const rubricPrompt = `You are a study planner inside Simplifii-OS. Australian English. No em-dashes.${literalPreamble}${profilePreamble}${learnerPreamble}

You are reading an ACTUAL marking rubric. Decode it for the student.

For EACH criterion found in the rubric:

## [Criterion Name]
**What it means:** [plain language explanation]
**What markers look for:** [specific behaviours/evidence for top band]
**Common mistake:** [what students typically get wrong]
- [ ] Action: [specific thing to do to hit this criterion]
- [ ] Action: [second thing]

RULES:
- Reference the ACTUAL criteria text from the document
- Decode academic language into plain ${levelLabel} language
- Never use generic templates
- If the rubric has grade bands, explain what separates each band`;

    try {
      const userMsg = `Rubric: "${assessmentTitle || 'Untitled'}"

Document content:
${briefText.slice(0, 5000)}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: rubricPrompt, messages: [{ role: 'user', content: userMsg }] }),
      });

      if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
      const data = await response.json();
      await recordUsage(userId, 'simplify-brief', { tokensIn: data?.usage?.input_tokens || 0, tokensOut: data?.usage?.output_tokens || 0 });
      return res.status(200).json({ success: true, plan: data?.content?.[0]?.text || '' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const systemPrompt = `You are Simplifii's Assessment Scaffolder. Australian English. No em-dashes.${literalPreamble}${profilePreamble}${learnerPreamble}

A student cannot start. The blank page is the problem. You solve it by giving them a complete structural blueprint that is so specific and clear they can open a document and immediately know what to write.

This tool is especially important for students with ADHD, executive function challenges, perfectionism, or writing anxiety: any student for whom "just start writing" is not sufficient instruction.

Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;

  const wordTarget = wordCount || 1500;

  try {
    const userMsg = `Analyse this document and create a scaffold for a ${wordTarget}-word ${assessmentType || 'essay'} on "${assessmentTitle || 'Untitled'}" at ${levelLabel} level.

DOCUMENT:
${briefText.slice(0, 5000)}

Return ONLY a JSON object:
{
  "suggestedStructure": [
    {
      "sectionName": "section name",
      "wordCount": 300,
      "keyQuestion": "the one question this section must answer",
      "starterSentence": "one example opening sentence the student can adapt",
      "commonMistakes": "specific mistake that loses marks for this section",
      "rubricCriteriaLink": "which rubric criterion this addresses",
      "bloomsPrompt": "one higher-order thinking question (Analyse/Evaluate/Create level)"
    }
  ],
  "beforeYouStart": ["specific preparation step 1", "step 2", "step 3"],
  "timeEstimate": {
    "research": "X hours",
    "planning": "X hours",
    "writing": "X hours",
    "editing": "X hours",
    "neurodivergentBuffer": "X hours extra for processing time"
  },
  "normalisingMessage": "warm paragraph acknowledging starting is hard and this scaffold is here to help",
  "hiddenExpectations": ["implicit expectation 1", "implicit expectation 2"],
  "rubricAlignment": [
    {"criterion": "criterion name", "sections": ["which sections address it"], "whatSeparatesHDFromP": "specific difference"}
  ],
  "thinkingFramework": "one paragraph: what cognitive moves this assessment requires (analyse, evaluate, synthesise, etc.)"
}

RULES:
- 5-8 sections. Word counts must sum to EXACTLY ${wordTarget}
- keyQuestion: THE question the student writes to answer for each section
- starterSentence: one example opening sentence per section to break the blank page
- beforeYouStart: 3 specific preparation steps BEFORE writing
- timeEstimate: realistic breakdown including neurodivergent buffer
- normalisingMessage: warm, specific, encouraging. Not generic.
- Reference ACTUAL content from the document, not generic advice
- rubricAlignment: map every criterion found to sections
- Australian English
- Return ONLY the JSON, nothing else`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: systemPrompt, messages: [{ role: 'user', content: userMsg }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    const data = await response.json();
    await recordUsage(userId, 'simplify-brief', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    const rawText = data?.content?.[0]?.text || '';
    // Try to parse structured JSON; fall back to raw text
    let scaffold = null;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) scaffold = JSON.parse(jsonMatch[0]);
    } catch { /* JSON parse failed, return raw */ }
    return res.status(200).json({ success: true, plan: rawText, scaffold });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
