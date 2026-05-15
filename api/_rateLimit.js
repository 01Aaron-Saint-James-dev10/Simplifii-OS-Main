/**
 * _rateLimit.js
 *
 * In-memory sliding-window rate limiter for Vercel serverless functions.
 * Vercel Fluid Compute reuses function instances across requests, so this
 * Map persists between invocations on the same instance. Cold starts reset
 * the counters, which means this is slightly permissive rather than strict:
 * the safe failure mode for a beta.
 *
 * For production scale, replace with Upstash Redis (@upstash/ratelimit).
 *
 * Usage:
 *   import { rateLimit } from './_rateLimit';
 *   const limited = rateLimit(identifier, { maxRequests: 30, windowMs: 60000 });
 *   if (limited) return res.status(429).json({ success: false, error: limited.error });
 */

const store = new Map();

// Evict expired entries every 5 minutes to prevent memory leaks
const EVICT_INTERVAL = 5 * 60 * 1000;
let lastEvict = Date.now();

function evictExpired() {
  const now = Date.now();
  if (now - lastEvict < EVICT_INTERVAL) return;
  lastEvict = now;
  for (const [key, record] of store) {
    // Remove entries with no hits in the last 2 minutes
    if (now - record.windowStart > 2 * 60 * 1000) {
      store.delete(key);
    }
  }
}

/**
 * Check and increment rate limit for an identifier.
 *
 * @param {string} identifier - user ID, IP address, or combined key
 * @param {Object} opts
 * @param {number} opts.maxRequests - max requests allowed in the window
 * @param {number} opts.windowMs - window size in milliseconds (default 60000)
 * @returns {null | { error: string }} - null if allowed, object with error message if limited
 */
export function rateLimit(identifier, { maxRequests, windowMs = 60000 }) {
  evictExpired();

  const now = Date.now();
  const key = identifier;
  let record = store.get(key);

  if (!record || now - record.windowStart >= windowMs) {
    // New window
    record = { windowStart: now, count: 1 };
    store.set(key, record);
    return null;
  }

  record.count += 1;

  if (record.count > maxRequests) {
    const retryAfterMs = windowMs - (now - record.windowStart);
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return {
      error: `Rate limit exceeded. Try again in ${retryAfterSec}s.`,
      retryAfterSec,
    };
  }

  return null;
}

/**
 * Extract a usable identifier from the request.
 * Prefers user_id from body, falls back to IP.
 */
export function getIdentifier(req) {
  const userId = req.body?.user_id || req.body?.userId;
  const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers?.['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
  return userId || ip;
}
