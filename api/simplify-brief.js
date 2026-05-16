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
  const learnerPreamble = learnerContext || '';

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

  const systemPrompt = `You are a study planner inside Simplifii-OS. Australian English. No em-dashes.${literalPreamble}${profilePreamble}${learnerPreamble}

You are reading an ACTUAL student document. Generate a plan SPECIFIC to this document's content. Cite specific sections, due dates, criteria, topics, and questions found in the text. Do NOT produce generic 5-week templates. If the document does not contain enough information to generate a specific plan, return: "This document does not contain enough detail to generate a plan. Please upload a more complete version."

CRITICAL RULES:
1. Reference the ACTUAL content provided. If the document mentions "cell biology", "Question 27", "due Friday Week 5", or "2000 words", your plan must reference those specifics.
2. If this is an exam paper: list the sections, total marks, question count, and suggest a practice strategy per section.
3. If this is an assignment brief: create a week-by-week plan tied to the actual requirements, criteria, and deadlines in the document.
4. If this is a rubric: decode each criterion into plain language with specific actions.
5. Never use placeholder text like "the [title] topic" or "[COURSE_NAME]".

Format your response as a WEEK-BY-WEEK ACTION PLAN with checkboxes:

## Week 1: [Context-specific title]
- [ ] [Specific task referencing actual document content]
- [ ] [Specific task]
- Tip: [Practical tip relevant to this document]

...continue for as many weeks as the assessment needs...

RULES:
- Each week should have 3-5 concrete checkbox tasks
- Each task must be specific and completable in under 30 minutes
- Include a practical tip per week
- Adjust complexity for ${levelLabel} level
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

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    const data = await response.json();
    await recordUsage(userId, 'simplify-brief', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    return res.status(200).json({ success: true, plan: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
