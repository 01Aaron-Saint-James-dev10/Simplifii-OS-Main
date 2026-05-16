/**
 * RewriteOllama.js (stub)
 *
 * Ollama local model integration is not active. This file provides
 * stub exports so RewriteService.js does not break. The actual
 * Ollama /api/chat endpoint does not exist in this deployment.
 *
 * All functions return fallback values or no-ops.
 */

export function nameCourse(rawText) {
  // Extract a reasonable name from the first line of text
  const firstLine = (rawText || '').split('\n').find(l => l.trim().length > 3) || '';
  return firstLine.slice(0, 60).trim() || 'New Course';
}

export function fallbackCourseName(rawText) {
  return nameCourse(rawText);
}

export const __ollamaInternals = {
  buildElevatePrompt: () => '',
  buildSynthesisePrompt: () => '',
  buildLogicModePrompt: () => '',
};

export default function ollama() {
  return Promise.resolve({ text: '', success: false });
}
