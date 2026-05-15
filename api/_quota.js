/**
 * _quota.js
 *
 * Per-user monthly usage quota enforcement for Vercel serverless functions.
 *
 * Strategy:
 *   - Free tier: $10 USD hard cap per rolling 30 days.
 *   - Checked against the `user_monthly_usage` view in Supabase.
 *   - Usage is recorded after each successful AI call via `recordUsage()`.
 *   - Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage in an endpoint:
 *   import { checkQuota, recordUsage } from './_quota.js';
 *
 *   const quota = await checkQuota(userId);
 *   if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });
 *
 *   // ... call Claude ...
 *
 *   await recordUsage(userId, 'tutor', { tokensIn: 1200, tokensOut: 180 });
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONTHLY_COST_LIMIT_USD = parseFloat(process.env.USER_MONTHLY_QUOTA_USD || '10');

// Anthropic claude-sonnet-4 pricing (per million tokens)
const PRICE_PER_MTK_IN  = 3.0;
const PRICE_PER_MTK_OUT = 15.0;

function costUsd(tokensIn, tokensOut) {
  return (tokensIn / 1_000_000) * PRICE_PER_MTK_IN
       + (tokensOut / 1_000_000) * PRICE_PER_MTK_OUT;
}

// ---------------------------------------------------------------------------
// Supabase client (service role -- never expose this key to the browser)
// ---------------------------------------------------------------------------

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// checkQuota
// ---------------------------------------------------------------------------

/**
 * Returns { exceeded: false } if the user is under quota,
 * or { exceeded: true, error: string } if they have hit the monthly cap.
 *
 * If quota infrastructure is unavailable (missing env vars, DB error),
 * the function logs the problem and returns { exceeded: false } so a config
 * issue never silently blocks real users. The safe failure mode is permissive.
 */
export async function checkQuota(userId) {
  if (!userId) return { exceeded: false };

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('user_monthly_usage')
      .select('total_cost_usd')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[_quota] checkQuota DB error:', error.message);
      return { exceeded: false };
    }

    const spent = parseFloat(data?.total_cost_usd ?? 0);
    if (spent >= MONTHLY_COST_LIMIT_USD) {
      return {
        exceeded: true,
        error: `Monthly usage limit reached ($${MONTHLY_COST_LIMIT_USD.toFixed(2)} / 30 days). Resets on a rolling basis.`,
        spent,
        limit: MONTHLY_COST_LIMIT_USD,
      };
    }

    return { exceeded: false, spent, limit: MONTHLY_COST_LIMIT_USD };
  } catch (err) {
    console.error('[_quota] checkQuota unexpected error:', err.message);
    return { exceeded: false };
  }
}

// ---------------------------------------------------------------------------
// recordUsage
// ---------------------------------------------------------------------------

/**
 * Inserts one row into `usage_events`. Fire-and-forget: awaited but errors
 * are only logged, never re-thrown. A failed usage record must never cause
 * the user to lose their AI response.
 */
export async function recordUsage(userId, endpoint, { tokensIn = 0, tokensOut = 0 } = {}) {
  if (!userId) return;

  const cost = costUsd(tokensIn, tokensOut);

  try {
    const supabase = getClient();
    const { error } = await supabase.from('usage_events').insert({
      user_id:   userId,
      endpoint,
      tokens_in:  tokensIn,
      tokens_out: tokensOut,
      cost_usd:   cost,
    });
    if (error) {
      console.error('[_quota] recordUsage insert error:', error.message);
    }
  } catch (err) {
    console.error('[_quota] recordUsage unexpected error:', err.message);
  }
}
