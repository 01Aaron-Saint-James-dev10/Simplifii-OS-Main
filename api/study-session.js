/**
 * /api/study-session
 *
 * Stub endpoints for study session tracking.
 * POST with action: 'start' or 'end'
 *
 * Returns 501 until client-side integration is wired.
 * Schema is live (study_sessions table with RLS).
 */
import { rateLimit, getIdentifier } from './_rateLimit.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 20, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { action } = req.body || {};

  if (action === 'start') {
    return res.status(501).json({
      success: false,
      error: 'Study session start tracking not yet wired to client.',
      message: 'Schema is ready. Client integration pending.',
    });
  }

  if (action === 'end') {
    return res.status(501).json({
      success: false,
      error: 'Study session end tracking not yet wired to client.',
      message: 'Schema is ready. Client integration pending.',
    });
  }

  return res.status(400).json({ success: false, error: 'action must be "start" or "end".' });
}
