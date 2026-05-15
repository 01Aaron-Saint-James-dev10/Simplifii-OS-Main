/**
 * RewriteService.js
 *
 * Thin orchestrator for the rewrite subsystem. Delegates to:
 *   - RewriteConstants.js: shared config, synonyms, prompts, helpers
 *   - RewriteLocalMock.js: deterministic transforms (no AI)
 *   - RewriteOllama.js: Ollama-powered rewrites + nameCourse
 *   - AssessmentExtractor.js: Ollama-powered assessment brief extraction
 *
 * All downstream imports should continue to use RewriteService.js as the
 * single entry point. The public API is unchanged.
 */

import {
  REASONING_START_EVENT,
  REASONING_END_EVENT,
  REASONING_MIN_MS,
  getProviderName,
  SYSTEM_PROMPT,
  LOGIC_LENSES,
  cleanModelOutput,
  safeReadLocalStorage,
} from './RewriteConstants';

import localMock from './RewriteLocalMock';
import ollama, {
  nameCourse,
  fallbackCourseName,
  __ollamaInternals,
} from './RewriteOllama';

import {
  extractAssessmentsWithOllama,
  extractAssessmentBriefs,
} from './AssessmentExtractor';

// Re-export events for AURA Avatar pulse
export { REASONING_START_EVENT, REASONING_END_EVENT };

// Re-export provider name for consumers that gate on it
export { getProviderName };

// Re-export nameCourse and assessment extractors
export { nameCourse, extractAssessmentsWithOllama, extractAssessmentBriefs };

// ---------------------------------------------------------------------------
// Provider resolution
// ---------------------------------------------------------------------------

const PROVIDERS = { 'local-mock': localMock, ollama };

const getProvider = () => {
  const name = getProviderName();
  return PROVIDERS[name] || PROVIDERS['ollama'];
};

// ---------------------------------------------------------------------------
// Reasoning wrapper: dispatches start/end events + enforces minimum delay
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function reason(method, args) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
  }
  const start = Date.now();
  try {
    const provider = getProvider();
    const result = await provider[method](...args);
    const elapsed = Date.now() - start;
    if (elapsed < REASONING_MIN_MS) await sleep(REASONING_MIN_MS - elapsed);
    return result;
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
    }
  }
}

// ---------------------------------------------------------------------------
// Public API (unchanged)
// ---------------------------------------------------------------------------

export const elevateRigour = (text, ctx) => reason('elevateRigour', [text, ctx]);
export const synthesise = (text, ctx) => reason('synthesise', [text, ctx]);
export const applyLogicMode = (text, mode, ctx) => reason('applyLogicMode', [text, mode, ctx]);

// pingOllama: 3 second health check against the active endpoint.
export const pingOllama = async () => {
  try {
    const { getOllamaEndpoint } = await import('./RewriteConstants');
    const endpoint = getOllamaEndpoint().replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${endpoint}/api/tags`, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
};

// Exported for unit tests and DevTools poking.
export const __internals = {
  SYSTEM_PROMPT,
  buildElevatePrompt: __ollamaInternals.buildElevatePrompt,
  buildSynthesisePrompt: __ollamaInternals.buildSynthesisePrompt,
  buildLogicModePrompt: __ollamaInternals.buildLogicModePrompt,
  cleanModelOutput,
  LOGIC_LENSES,
  fallbackCourseName,
  buildNameCoursePrompt: __ollamaInternals.buildNameCoursePrompt,
  safeReadLocalStorage,
};
