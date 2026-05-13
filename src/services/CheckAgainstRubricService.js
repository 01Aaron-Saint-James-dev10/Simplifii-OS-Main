/**
 * CheckAgainstRubricService.js
 *
 * Tier 1 stub. Compares draft text against rubric criteria,
 * identifies gaps, and provides word count analysis.
 *
 * Contract: docs/TOOLS_SPEC.md Tool #4
 */

import { appendEvent } from '../core/HistoryOfThought';

function mockCheckOutput(draftText, criteria, targetWords) {
  const wordCount = (draftText || '').trim().split(/\s+/).filter(Boolean).length;
  const pct = targetWords > 0 ? Math.round((wordCount / targetWords) * 100) : 0;

  const criteriaResults = (criteria || []).map(c => {
    const lower = (draftText || '').toLowerCase();
    const keywords = c.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const found = keywords.filter(k => lower.includes(k));
    const missing = keywords.filter(k => !lower.includes(k));
    return {
      criterion: c,
      found: found.length > 0 ? `Found keywords: ${found.join(', ')}` : 'No matching keywords found',
      missing: missing.length > 0 ? `Missing keywords: ${missing.join(', ')}` : 'All keywords present',
      suggestion: found.length === 0
        ? `Your draft does not appear to address "${c}". Add a paragraph covering this criterion.`
        : missing.length > 0
          ? `Partially addressed. Consider expanding on: ${missing.join(', ')}.`
          : 'Well covered.',
    };
  });

  const gapCount = criteriaResults.filter(r => r.found.startsWith('No matching')).length;

  return {
    overallScore: criteria && criteria.length > 0 ? Math.round(((criteria.length - gapCount) / criteria.length) * 100) : 0,
    criteriaResults,
    wordAnalysis: {
      current: wordCount,
      target: targetWords,
      percentage: pct,
      status: pct < 50 ? 'under' : pct <= 90 ? 'building' : pct <= 110 ? 'on-target' : 'over',
      guidance: pct < 50 ? 'Keep writing. You are under half the target.'
        : pct <= 90 ? 'Good progress. Keep going.'
        : pct <= 110 ? 'On target. Review and refine.'
        : `Over target by ${wordCount - targetWords} words. Consider trimming.`,
    },
  };
}

// TODO: wire to /api/tools/check-against-rubric (Anthropic API)
export async function runCheckAgainstRubric({ draftText, rubricCriteria, targetWords, courseId, assessmentTitle }) {
  const result = mockCheckOutput(draftText, rubricCriteria, targetWords);

  try {
    await appendEvent({
      event_type: 'check_against_rubric_run',
      payload: {
        courseId: courseId || 'unknown',
        assessmentTitle: assessmentTitle || 'unknown',
        timestamp: Date.now(),
        overallScore: result.overallScore,
        gapCount: result.criteriaResults.filter(r => r.found.startsWith('No matching')).length,
      },
    });
  } catch { /* vault may be locked */ }

  return result;
}
