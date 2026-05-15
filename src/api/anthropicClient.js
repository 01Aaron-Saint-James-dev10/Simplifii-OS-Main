/**
 * anthropicClient.js
 *
 * DEPRECATED: This file previously made direct browser-to-Anthropic API calls
 * with the API key embedded in the client bundle. That is a critical security
 * vulnerability (anyone could read the key from DevTools).
 *
 * All AI calls now route through serverless API endpoints in /api/ which hold
 * the key server-side. See: api/decode-rubric.js, api/simplify-brief.js, etc.
 *
 * This file is kept only to prevent import errors from any code that has not
 * yet been migrated. Both exports throw clear errors directing developers to
 * the correct serverless endpoints.
 */

export async function callAnthropic() {
  throw new Error(
    'callAnthropic is removed. Use the serverless API endpoints instead (e.g. /api/decode-rubric, /api/simplify-brief). '
    + 'Direct browser-to-Anthropic calls are a security vulnerability.'
  );
}

export function isApiKeyConfigured() {
  return false;
}
