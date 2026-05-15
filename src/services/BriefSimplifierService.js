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

export async function runBriefSimplifier({ assessmentBrief, courseContext }) {
  let result;
  let source = 'mock';
  let latencyMs = 0;
  let error = null;
  const start = Date.now();

  try {
    const briefText = courseContext?.rawText || assessmentBrief?.title || '';
    if (briefText.length < 20) throw new Error('Brief text too short for API');

    const resp = await fetch('/api/simplify-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefText,
        assessmentTitle: assessmentBrief?.title || 'Assessment',
        assessmentType: assessmentBrief?.type || 'Essay',
        wordCount: assessmentBrief?.wordCountGoal,
      }),
    });
    latencyMs = Date.now() - start;

    if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
    const data = await resp.json();

    if (data.success && data.plan) {
      // The serverless endpoint returns markdown; wrap as weekly plan
      result = {
        weeklyTasks: [{ week: 1, tasks: [data.plan] }],
        rubricAlignment: [],
        jargonDecoded: [],
        hiddenCurriculum: [],
        rawPlan: data.plan,
      };
      source = 'api';
    } else {
      throw new Error(data.error || 'Invalid response from server');
    }
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[BriefSimplifier] API call failed, falling back to mock:', err?.message);
    error = err?.message || 'unknown';
    result = mockBriefSimplifierOutput(assessmentBrief);
    source = 'mock';
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
        weekCount: result.weeklyTasks?.length || 0,
        jargonCount: result.jargonDecoded?.length || 0,
      },
    });
  } catch { /* vault may be locked */ }

  return result;
}
