/**
 * _rateLimit.js
 *
 * Sliding-window rate limiter for Vercel serverless functions.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are set. Falls back to in-memory Map when Redis is not configured.
 *
 * Usage:
 *   import { rateLimit } from './_rateLimit';
 *   const limited = rateLimit(identifier, { maxRequests: 30, windowMs: 60000 });
 *   if (limited) return res.status(429).json({ success: false, error: limited.error });
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redis rate limiter (persistent across cold starts)
let upstashLimiter = null;
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (upstashUrl && upstashToken) {
  try {
    const redis = new Redis({ url: upstashUrl, token: upstashToken });
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      analytics: false,
    });
  } catch {
    upstashLimiter = null;
  }
}

// In-memory fallback (resets on cold start)
const store = new Map();
const EVICT_INTERVAL = 5 * 60 * 1000;
let lastEvict = Date.now();

function evictExpired() {
  const now = Date.now();
  if (now - lastEvict < EVICT_INTERVAL) return;
  lastEvict = now;
  for (const [key, record] of store) {
    if (now - record.windowStart > 2 * 60 * 1000) {
      store.delete(key);
    }
  }
}

function memoryRateLimit(identifier, { maxRequests, windowMs = 60000 }) {
  evictExpired();
  const now = Date.now();
  let record = store.get(identifier);

  if (!record || now - record.windowStart >= windowMs) {
    record = { windowStart: now, count: 1 };
    store.set(identifier, record);
    return null;
  }

  record.count += 1;

  if (record.count > maxRequests) {
    const retryAfterMs = windowMs - (now - record.windowStart);
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return { error: `Rate limit exceeded. Try again in ${retryAfterSec}s.`, retryAfterSec };
  }

  return null;
}

/**
 * Check and increment rate limit for an identifier.
 * Uses Upstash Redis when available, falls back to in-memory.
 */
export async function rateLimit(identifier, { maxRequests = 20, windowMs = 60000 }) {
  // Upstash path: persistent, survives cold starts
  if (upstashLimiter) {
    try {
      const { success, reset } = await upstashLimiter.limit(identifier);
      if (!success) {
        const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
        return { error: `Rate limit exceeded. Try again in ${Math.max(retryAfterSec, 1)}s.`, retryAfterSec };
      }
      return null;
    } catch {
      // Redis error: fall through to in-memory
    }
  }

  // In-memory fallback
  return memoryRateLimit(identifier, { maxRequests, windowMs });
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
