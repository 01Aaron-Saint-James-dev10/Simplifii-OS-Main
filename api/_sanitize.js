/**
 * _sanitize.js
 *
 * Server-side input sanitisation for AI endpoint parameters.
 * Prevents prompt injection via learnerContext and other free-text fields.
 */

const MAX_LEARNER_CONTEXT_LENGTH = 1500;
const LEARNER_CONTEXT_PREFIX = 'LEARNER CONTEXT';

/**
 * Validate and sanitise learnerContext before it reaches the system prompt.
 *
 * The legitimate learnerContext is built by LearnerContextService.js and
 * always starts with "LEARNER CONTEXT (adapt your responses...)".
 * Anything that doesn't match this pattern is rejected.
 *
 * @param {string|undefined} raw - raw learnerContext from req.body
 * @returns {string} sanitised context string, or empty string if invalid
 */
export function sanitiseLearnerContext(raw) {
  if (!raw || typeof raw !== 'string') return '';
  if (raw.length > MAX_LEARNER_CONTEXT_LENGTH) return '';
  if (!raw.includes(LEARNER_CONTEXT_PREFIX)) return '';
  return raw;
}

/**
 * Validate text input size. Returns null if valid, error string if invalid.
 * @param {string} text - input text
 * @param {number} maxChars - maximum allowed characters
 * @param {string} fieldName - field name for error message
 * @returns {string|null} error message or null
 */
export function validateInputSize(text, maxChars, fieldName) {
  if (!text || typeof text !== 'string') return `${fieldName} is required.`;
  if (text.length > maxChars) return `${fieldName} exceeds ${maxChars} characters.`;
  return null;
}
