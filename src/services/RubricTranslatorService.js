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
import { callAnthropic, isApiKeyConfigured } from '../api/anthropicClient';

const SYSTEM_PROMPT = `You are a rubric translator for university students. Convert academic rubric criteria into plain language a 16-year-old could understand. Tell the student what the marker actually wants in each band. Australian English. No em-dashes. Return JSON only, no preamble.

Return this exact JSON shape:
{
  "plainCriteria": [
    {
      "original": "the original criterion text from the rubric",
      "simplified": "what this means in plain English",
      "whatMarkerWants": "what the marker is actually looking for"
    }
  ]
}`;

function buildUserPrompt(criteria, bands) {
  const parts = ['Translate these rubric criteria into plain language.\n'];
  if (bands && bands.length > 0) parts.push(`Grade bands: ${bands.join(', ')}\n`);
  if (criteria && criteria.length > 0) {
    parts.push('Criteria:');
    criteria.forEach((c, i) => parts.push(`${i + 1}. ${c}`));
  }
  return parts.join('\n');
}

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

function validateResponse(parsed) {
  return parsed
    && Array.isArray(parsed.plainCriteria)
    && parsed.plainCriteria.every(c => c.original && c.simplified && c.whatMarkerWants);
}

export async function runRubricTranslator({ rubricCriteria, rubricBands }) {
  let result;
  let source = 'mock';
  let latencyMs = 0;
  let error = null;
  const start = Date.now();

  if (isApiKeyConfigured() && rubricCriteria && rubricCriteria.length > 0) {
    try {
      const userPrompt = buildUserPrompt(rubricCriteria, rubricBands);
      const raw = await callAnthropic(SYSTEM_PROMPT, userPrompt, {
        model: 'claude-sonnet-4-6',
        maxTokens: 4000,
        temperature: 0.3,
        timeoutMs: 30000,
      });
      latencyMs = Date.now() - start;

      const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);

      if (validateResponse(parsed)) {
        result = parsed;
        source = 'api';
      } else {
        throw new Error('Invalid response shape from API');
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
