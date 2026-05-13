/**
 * anthropicClient.js
 *
 * Wraps Anthropic API calls. Reads REACT_APP_ANTHROPIC_API_KEY from
 * process.env (CRA exposes REACT_APP_ prefixed vars at build time).
 *
 * IMPORTANT: This is a client-side wrapper for v1 prototyping only.
 * Production must proxy through a server to avoid exposing the key.
 * The key is read from .env.local which is gitignored.
 */

const getApiKey = () => {
  const key = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!key || key === 'your_key_here' || key.length < 10) return null;
  return key;
};

/**
 * Call the Anthropic Messages API directly.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Object} options - { model, maxTokens, temperature, timeoutMs }
 * @returns {Promise<string>} - the assistant's text response
 * @throws on network error, timeout, or missing key
 */
export async function callAnthropic(systemPrompt, userPrompt, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const model = options.model || 'claude-sonnet-4-6';
  const maxTokens = options.maxTokens || 4000;
  const temperature = options.temperature ?? 0.3;
  const timeoutMs = options.timeoutMs || 30000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error('Empty response from Anthropic API');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if the API key is configured (without making a call).
 */
export function isApiKeyConfigured() {
  return getApiKey() !== null;
}
