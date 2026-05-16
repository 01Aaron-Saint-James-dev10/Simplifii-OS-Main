/**
 * SessionSummaryService.js
 *
 * Persists session summaries to Supabase for AURA cross-session continuity.
 * Called at session end (sign-out, tab close, or focus session complete).
 * Loaded at session start so AURA can reference what happened last time.
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Load the most recent session summary for a user.
 * @param {string} userId
 * @returns {object|null} last session data or null
 */
export async function loadLastSession(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from('session_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const daysAgo = Math.floor((Date.now() - new Date(data.session_date).getTime()) / (1000 * 60 * 60 * 24));
    return { ...data, days_ago: daysAgo };
  } catch { return null; }
}

/**
 * Save a session summary.
 * @param {object} summary
 */
export async function saveSessionSummary({
  userId,
  courseId = null,
  tasksTouched = [],
  blocksCompleted = 0,
  paretoStepsCompleted = [],
  strongestMoment = null,
  growthSignals = [],
  sessionEndState = 'normal',
  timeSpentMinutes = 0,
  authenticitySplit = { human_percent: 100, ai_percent: 0 },
}) {
  if (!userId) return;
  try {
    await supabase.from('session_summaries').insert({
      user_id: userId,
      course_id: courseId,
      tasks_touched: tasksTouched,
      blocks_completed: blocksCompleted,
      pareto_steps_completed: paretoStepsCompleted,
      strongest_moment: strongestMoment,
      growth_signals: growthSignals,
      session_end_state: sessionEndState,
      time_spent_minutes: timeSpentMinutes,
      authenticity_split: authenticitySplit,
    });
  } catch { /* non-blocking */ }
}

/**
 * Load cross-session patterns (aggregated from recent sessions).
 * @param {string} userId
 * @returns {object} patterns
 */
export async function loadCrossSessionPatterns(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from('session_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(10);
    if (!data || data.length === 0) return null;
    return {
      total_sessions: data.length,
      average_time_minutes: Math.round(data.reduce((s, d) => s + (d.time_spent_minutes || 0), 0) / data.length),
      common_growth_signals: extractCommonSignals(data),
      average_authenticity: averageAuth(data),
      recent_tasks: [...new Set(data.flatMap(d => d.tasks_touched || []))].slice(0, 5),
    };
  } catch { return null; }
}

function extractCommonSignals(sessions) {
  const counts = {};
  for (const s of sessions) {
    for (const sig of (s.growth_signals || [])) {
      counts[sig] = (counts[sig] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
}

function averageAuth(sessions) {
  const totals = { human: 0, ai: 0, count: 0 };
  for (const s of sessions) {
    if (s.authenticity_split) {
      totals.human += s.authenticity_split.human_percent || 0;
      totals.ai += s.authenticity_split.ai_percent || 0;
      totals.count++;
    }
  }
  if (totals.count === 0) return { human_percent: 100, ai_percent: 0 };
  return {
    human_percent: Math.round(totals.human / totals.count),
    ai_percent: Math.round(totals.ai / totals.count),
  };
}
