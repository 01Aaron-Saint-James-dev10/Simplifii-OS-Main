/**
 * BriefSimplifierService.js
 *
 * Decodes assessment brief into weekly plan, jargon glossary,
 * rubric alignment, and hidden curriculum expectations.
 *
 * Backend: Anthropic API (claude-sonnet-4-6) when key is configured.
 * Fallback: mock output (identical shape) when key is missing or call fails.
 * The mock path MUST continue to work identically to before this sprint.
 *
 * Contract: docs/TOOLS_SPEC.md Tool #1
 */

import { appendEvent } from '../core/HistoryOfThought';
import { callAnthropic, isApiKeyConfigured } from '../api/anthropicClient';

const SYSTEM_PROMPT = `You are an assessment briefing tool for university students. Decode assignment briefs into actionable weekly tasks, plain-language criteria, and unstated expectations. Australian English. No em-dashes. Return JSON only, no preamble.

Return this exact JSON shape:
{
  "weeklyTasks": [{ "week": 1, "tasks": ["task description"] }],
  "rubricAlignment": [{ "criterion": "name", "weekCovered": 1 }],
  "jargonDecoded": [{ "term": "academic term", "plainLanguage": "plain explanation" }],
  "hiddenCurriculum": [{ "unstatedExpectation": "what markers really want", "evidence": "where you can see it" }]
}`;

function buildUserPrompt(brief, context) {
  const parts = [];
  if (brief?.title) parts.push(`Assessment title: ${brief.title}`);
  if (brief?.weight) parts.push(`Weight: ${brief.weight}`);
  if (brief?.wordCountGoal) parts.push(`Word count target: ${brief.wordCountGoal}`);
  if (brief?.dueDate) parts.push(`Due date: ${brief.dueDate}`);
  if (context?.rubricCriteria?.length > 0) parts.push(`Rubric criteria: ${context.rubricCriteria.join('; ')}`);
  if (context?.rawText) parts.push(`\nBrief text:\n${context.rawText.slice(0, 4000)}`);
  return parts.join('\n') || 'Decode this assessment brief.';
}

function mockBriefSimplifierOutput(brief) {
  const title = brief?.title || 'Assessment';
  return {
    weeklyTasks: [
      { week: 1, tasks: ['Read the brief twice. Highlight the action verbs.', `Identify the ${title} topic from the provided list.`] },
      { week: 2, tasks: ['Find 3 sources from the reading list.', 'Write one sentence summarising each source.'] },
      { week: 3, tasks: ['Draft the introduction (plain English first).', 'Map your sources to each rubric criterion.'] },
      { week: 4, tasks: ['Write the main body. One paragraph per criterion.', 'Check word count against target.'] },
      { week: 5, tasks: ['Revise: read aloud, fix flow.', 'Format references. Export and submit.'] },
    ],
    rubricAlignment: [
      { criterion: 'Understanding of topic', weekCovered: 1 },
      { criterion: 'Use of evidence', weekCovered: 2 },
      { criterion: 'Critical analysis', weekCovered: 3 },
      { criterion: 'Structure and coherence', weekCovered: 4 },
      { criterion: 'Referencing and formatting', weekCovered: 5 },
    ],
    jargonDecoded: [
      { term: 'Critical analysis', plainLanguage: 'Say what you think about the evidence, not just what it says.' },
      { term: 'Synthesise', plainLanguage: 'Combine ideas from multiple sources into one argument.' },
      { term: 'Evaluate', plainLanguage: 'Weigh up the strengths and weaknesses.' },
    ],
    hiddenCurriculum: [
      { unstatedExpectation: 'The marker expects you to use the readings from weeks 1-5, not just any source.', evidence: 'Reading list is referenced in the rubric under "use of course materials".' },
      { unstatedExpectation: 'A "literature review" means you compare sources, not just summarise them one by one.', evidence: 'The rubric criterion "synthesis" implies comparative analysis.' },
    ],
  };
}

function validateResponse(parsed) {
  return parsed
    && Array.isArray(parsed.weeklyTasks)
    && Array.isArray(parsed.rubricAlignment)
    && Array.isArray(parsed.jargonDecoded)
    && Array.isArray(parsed.hiddenCurriculum);
}

export async function runBriefSimplifier({ assessmentBrief, courseContext }) {
  let result;
  let source = 'mock';
  let latencyMs = 0;
  let error = null;
  const start = Date.now();

  if (isApiKeyConfigured()) {
    try {
      const userPrompt = buildUserPrompt(assessmentBrief, courseContext);
      const raw = await callAnthropic(SYSTEM_PROMPT, userPrompt, {
        model: 'claude-sonnet-4-6',
        maxTokens: 4000,
        temperature: 0.3,
        timeoutMs: 30000,
      });
      latencyMs = Date.now() - start;

      // Parse JSON from response (strip markdown fences if present)
      const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);

      if (validateResponse(parsed)) {
        result = parsed;
        source = 'api';
      } else {
        throw new Error('Invalid response shape from API');
      }
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('[BriefSimplifier] API call failed, falling back to mock:', err?.message);
      error = err?.message || 'unknown';
      result = mockBriefSimplifierOutput(assessmentBrief);
      source = 'mock';
    }
  } else {
    result = mockBriefSimplifierOutput(assessmentBrief);
  }

  try {
    await appendEvent({
      event_type: 'brief_simplifier_run',
      payload: {
        courseId: courseContext?.courseId || 'unknown',
        assessmentTitle: assessmentBrief?.title || 'unknown',
        timestamp: Date.now(),
        source,
        latencyMs: source === 'api' ? latencyMs : undefined,
        error: error || undefined,
        weekCount: result.weeklyTasks.length,
        jargonCount: result.jargonDecoded.length,
      },
    });
  } catch { /* vault may be locked */ }

  return result;
}
