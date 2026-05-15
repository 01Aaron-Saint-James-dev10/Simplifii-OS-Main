/**
 * RubricTranslatorService.js
 *
 * Translates rubric criteria into plain language with
 * "what the marker wants" for each criterion.
 *
 * Backend: Anthropic API (claude-sonnet-4-6) when key is configured.
 * Fallback: mock output (identical shape) when key is missing or call fails.
 * The mock path MUST continue to work identically to before this sprint.
 *
 * Contract: docs/TOOLS_SPEC.md Tool #2
 */

import { appendEvent } from '../core/HistoryOfThought';

function mockRubricTranslatorOutput(criteria, bands) {
  const bandNames = bands && bands.length > 0 ? bands : ['Excellent', 'Good', 'Satisfactory', 'Unsatisfactory'];
  return {
    plainCriteria: (criteria || []).map(c => ({
      original: c,
      simplified: `In plain terms: ${c.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`,
      whatMarkerWants: `The marker is checking whether you can demonstrate ${c.toLowerCase()}. Use specific examples from your sources.`,
    })),
    bandNames,
  };
}

export async function runRubricTranslator({ rubricCriteria, rubricBands }) {
  let result;
  let source = 'mock';
  let latencyMs = 0;
  let error = null;
  const start = Date.now();

  if (rubricCriteria && rubricCriteria.length > 0) {
    try {
      const rubricText = rubricCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
      const resp = await fetch('/api/decode-rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubricText, assessmentTitle: 'Assessment' }),
      });
      latencyMs = Date.now() - start;

      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json();

      if (data.success && data.decoded) {
        // The serverless endpoint returns markdown; wrap in the expected shape
        result = {
          plainCriteria: rubricCriteria.map(c => ({
            original: c,
            simplified: c,
            whatMarkerWants: data.decoded,
          })),
        };
        source = 'api';
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('[RubricTranslator] API call failed, falling back to mock:', err?.message);
      error = err?.message || 'unknown';
      result = mockRubricTranslatorOutput(rubricCriteria, rubricBands);
      source = 'mock';
    }
  } else {
    result = mockRubricTranslatorOutput(rubricCriteria, rubricBands);
  }

  try {
    await appendEvent({
      event_type: 'rubric_translator_run',
      payload: {
        timestamp: Date.now(),
        source,
        latencyMs: source === 'api' ? latencyMs : undefined,
        error: error || undefined,
        criteriaCount: rubricCriteria?.length || 0,
      },
    });
  } catch { /* vault may be locked */ }

  return result;
}
