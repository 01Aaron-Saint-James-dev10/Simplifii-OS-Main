import { createLogger } from '../utils/logger';

const log = createLogger('StudyPatternTracker');

/**
 * StudyPatternTracker
 *
 * Captures time-of-day patterns and session telemetry for personalisation.
 * All data stays local (localStorage). No recordings, no location, no PII.
 *
 * Signals captured:
 *   - Session start/end timestamps
 *   - Session duration
 *   - Time-of-day band (morning/afternoon/evening/late-night)
 *   - Tasks switched per session
 *   - Idle periods (from ExecutiveSpine idle events)
 *   - Focus session lengths (from focus-start/focus-end events)
 *
 * Inferred (read-only, never sent to server):
 *   - Chronotype tendency (early bird vs night owl)
 *   - Peak focus windows
 *   - Average session length
 *
 * Architecture: listens to window CustomEvents dispatched by EventBus/Spine.
 * Does NOT modify any existing event flow. Pure observer.
 */

const STORAGE_KEY = 'simplifii_study_patterns';
const MAX_SESSIONS = 100; // Rolling window

function getTimeBand(hour) {
  if (hour < 6) return 'late-night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'late-night';
}

function loadPatterns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { sessions: [], focusSessions: [] };
  } catch { return { sessions: [], focusSessions: [] }; }
}

function savePatterns(patterns) {
  try {
    // Trim to rolling window
    if (patterns.sessions.length > MAX_SESSIONS) {
      patterns.sessions = patterns.sessions.slice(-MAX_SESSIONS);
    }
    if (patterns.focusSessions.length > MAX_SESSIONS * 3) {
      patterns.focusSessions = patterns.focusSessions.slice(-MAX_SESSIONS * 3);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch { /* storage unavailable */ }
}

let sessionStart = null;
let taskSwitchCount = 0;
let idleCount = 0;
let focusStart = null;
let listeners = [];

function onFocusStart() {
  focusStart = Date.now();
}

function onFocusEnd() {
  if (!focusStart) return;
  const duration = Math.round((Date.now() - focusStart) / 1000);
  const patterns = loadPatterns();
  patterns.focusSessions.push({
    start: new Date(focusStart).toISOString(),
    durationSecs: duration,
    timeBand: getTimeBand(new Date(focusStart).getHours()),
  });
  savePatterns(patterns);
  focusStart = null;
}

function onIdle() {
  idleCount++;
}

function onTaskSwitch() {
  taskSwitchCount++;
}

/**
 * Start tracking a study session. Call on app mount.
 */
export function startSession() {
  sessionStart = Date.now();
  taskSwitchCount = 0;
  idleCount = 0;

  const handlers = [
    ['simplifii:focus-start', onFocusStart],
    ['simplifii:focus-end', onFocusEnd],
    ['simplifii:idle', onIdle],
    ['simplifii:sprint-switch', onTaskSwitch],
  ];
  handlers.forEach(([evt, fn]) => window.addEventListener(evt, fn));
  listeners = handlers;

  if (typeof console !== 'undefined') {
    log.info('session started at', new Date(sessionStart).toLocaleTimeString());
  }
}

/**
 * End the current session and persist metrics. Call on app unmount or logout.
 */
export function endSession() {
  if (!sessionStart) return;
  const now = Date.now();
  const durationSecs = Math.round((now - sessionStart) / 1000);
  const startDate = new Date(sessionStart);

  const patterns = loadPatterns();
  patterns.sessions.push({
    start: startDate.toISOString(),
    durationSecs,
    timeBand: getTimeBand(startDate.getHours()),
    hour: startDate.getHours(),
    taskSwitches: taskSwitchCount,
    idleEvents: idleCount,
  });
  savePatterns(patterns);

  if (typeof console !== 'undefined') {
    log.info('session ended:', durationSecs, 'secs,', taskSwitchCount, 'task switches,', idleCount, 'idle events');
  }

  // Cleanup
  listeners.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
  listeners = [];
  sessionStart = null;
}

/**
 * Read-only analytics derived from stored patterns.
 * Returns null if insufficient data (< 3 sessions).
 */
export function getPatternInsights() {
  const { sessions, focusSessions } = loadPatterns();
  if (sessions.length < 3) return null;

  // Chronotype: count sessions by band
  const bandCounts = { 'morning': 0, 'afternoon': 0, 'evening': 0, 'late-night': 0 };
  for (const s of sessions) bandCounts[s.timeBand] = (bandCounts[s.timeBand] || 0) + 1;
  const peakBand = Object.entries(bandCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Average session length
  const totalSecs = sessions.reduce((sum, s) => sum + s.durationSecs, 0);
  const avgSessionMins = Math.round(totalSecs / sessions.length / 60);

  // Average focus session length
  const avgFocusMins = focusSessions.length > 0
    ? Math.round(focusSessions.reduce((sum, f) => sum + f.durationSecs, 0) / focusSessions.length / 60)
    : null;

  // Peak hours (top 3)
  const hourCounts = {};
  for (const s of sessions) hourCounts[s.hour] = (hourCounts[s.hour] || 0) + 1;
  const peakHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => parseInt(h));

  return {
    totalSessions: sessions.length,
    peakBand,
    peakHours,
    avgSessionMins,
    avgFocusMins,
    chronotype: peakBand === 'morning' ? 'early bird' : peakBand === 'late-night' ? 'night owl' : 'flexible',
  };
}

/**
 * Clear all stored patterns. Used on logout or user request.
 */
export function clearPatterns() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
}
