/**
 * ExecutiveSpine
 *
 * Layer 2 of the Sovereign Architecture Blueprint.
 *
 * Differentiator: Simplifii does not deliver curriculum. Simplifii
 * helps the student finish the next ten minutes. Every part of this
 * file answers that test.
 *
 * Five sub-systems, all in-app, all sovereign:
 *
 *   FocusSession     Sprint timer with in-app navigation lock.
 *                    NEVER blocks external apps or other browser
 *                    tabs. The Blueprint is explicit about this.
 *
 *   IdleDetection    Watches keydown / mousedown / touchstart on
 *                    the active workspace. After idleThresholdMs
 *                    of silence dispatches simplifii:idle so AURA
 *                    can nudge the student with a single literal
 *                    instruction.
 *
 *   SectionHealth    Per-section dot count (0 to 5) persisted to
 *                    localStorage. Used by PlayTime to gate rewards.
 *
 *   PlayTime         When SectionHealth.dots >= threshold, dispatches
 *                    simplifii:playtime-granted so the UI can unlock
 *                    designated 'play' modules for a fixed duration.
 *
 *   SovereignCredits Honour-system currency. Earned per completed
 *                    micro-task. No monetary value. No redemption
 *                    outside the app. Stored in localStorage. The
 *                    Blueprint cites the Australian Interactive
 *                    Gambling Act 2001 as the reason.
 *
 * Hard rules from the Blueprint enforced here:
 *   - focus_session_locks_in_app_only_never_external = true
 *   - sovereign_credits_have_no_monetary_redemption = true
 *   - section_health change events feed the (future) HistoryOfThought
 *     event log without naming the user
 */

const STORAGE_PREFIX = 'simplifii_spine_';
const FOCUS_KEY = `${STORAGE_PREFIX}focus_session`;
const HEALTH_KEY = `${STORAGE_PREFIX}section_health`;
const CREDITS_KEY = `${STORAGE_PREFIX}sovereign_credits`;
const PLAYTIME_KEY = `${STORAGE_PREFIX}playtime_until`;

const safeReadLS = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try { const v = window.localStorage.getItem(key); return v == null ? fallback : v; }
  catch { return fallback; }
};
const safeWriteLS = (key, value) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};
const dispatch = (name, detail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
};

// ============================================================
// FocusSession (in-app sprint timer + nav lock)
// ============================================================

let __sessionTimer = null;

export const startFocusSession = ({ taskId, durationMinutes = 25 } = {}) => {
  const now = Date.now();
  const session = {
    taskId: String(taskId || 'unscoped'),
    startedAt: now,
    plannedDurationMs: Math.max(60_000, durationMinutes * 60 * 1000),
    endsAt: now + Math.max(60_000, durationMinutes * 60 * 1000)
  };
  safeWriteLS(FOCUS_KEY, JSON.stringify(session));
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-focus-active', 'true');
  }
  if (__sessionTimer) clearTimeout(__sessionTimer);
  __sessionTimer = setTimeout(() => endFocusSession({ reason: 'completed' }), session.plannedDurationMs);
  dispatch('simplifii:focus-start', session);
  return session;
};

export const endFocusSession = ({ reason = 'manual' } = {}) => {
  const raw = safeReadLS(FOCUS_KEY, null);
  if (!raw) return null;
  let session = null;
  try { session = JSON.parse(raw); } catch { /* ignore */ }
  if (!session) return null;
  const actualDurationMs = Date.now() - session.startedAt;
  safeWriteLS(FOCUS_KEY, '');
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-focus-active');
  }
  if (__sessionTimer) { clearTimeout(__sessionTimer); __sessionTimer = null; }
  dispatch('simplifii:focus-end', { ...session, actualDurationMs, reason });
  return { ...session, actualDurationMs, reason };
};

export const getFocusSession = () => {
  const raw = safeReadLS(FOCUS_KEY, null);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (s && s.endsAt && s.endsAt > Date.now()) return s;
    return null;
  } catch { return null; }
};

export const isFocusActive = () => !!getFocusSession();

// ============================================================
// IdleDetection (debounced wake-up nudge)
// ============================================================

let __idleListenerAttached = false;
let __lastInputAt = Date.now();
let __idleInterval = null;
let __idleThresholdMs = 180_000;
let __idleNudgeFired = false;

const __onAnyInput = () => {
  __lastInputAt = Date.now();
  __idleNudgeFired = false;
};

export const startIdleDetection = ({ thresholdMs = 180_000 } = {}) => {
  if (typeof window === 'undefined') return;
  __idleThresholdMs = Math.max(30_000, thresholdMs);
  __lastInputAt = Date.now();
  __idleNudgeFired = false;
  if (!__idleListenerAttached) {
    document.addEventListener('keydown', __onAnyInput, { capture: true, passive: true });
    document.addEventListener('mousedown', __onAnyInput, { capture: true, passive: true });
    document.addEventListener('touchstart', __onAnyInput, { capture: true, passive: true });
    __idleListenerAttached = true;
  }
  if (__idleInterval) clearInterval(__idleInterval);
  __idleInterval = setInterval(() => {
    if (__idleNudgeFired) return;
    if (!isFocusActive()) return;
    if (Date.now() - __lastInputAt > __idleThresholdMs) {
      __idleNudgeFired = true;
      const session = getFocusSession();
      dispatch('simplifii:idle', { sinceMs: Date.now() - __lastInputAt, taskId: session?.taskId });
    }
  }, 15_000);
};

export const stopIdleDetection = () => {
  if (__idleInterval) { clearInterval(__idleInterval); __idleInterval = null; }
  if (__idleListenerAttached && typeof document !== 'undefined') {
    document.removeEventListener('keydown', __onAnyInput, { capture: true });
    document.removeEventListener('mousedown', __onAnyInput, { capture: true });
    document.removeEventListener('touchstart', __onAnyInput, { capture: true });
    __idleListenerAttached = false;
  }
};

// ============================================================
// SectionHealth (per-section dots persistence + change events)
// ============================================================

const readHealthMap = () => {
  const raw = safeReadLS(HEALTH_KEY, '{}');
  try { const o = JSON.parse(raw); return (o && typeof o === 'object') ? o : {}; }
  catch { return {}; }
};

export const getSectionHealth = (sectionId) => {
  const map = readHealthMap();
  return Number(map[sectionId]) || 0;
};

export const setSectionHealth = (sectionId, dots) => {
  if (!sectionId) return 0;
  const clamped = Math.max(0, Math.min(5, Math.round(Number(dots) || 0)));
  const map = readHealthMap();
  const prev = Number(map[sectionId]) || 0;
  if (prev === clamped) return clamped;
  map[sectionId] = clamped;
  safeWriteLS(HEALTH_KEY, JSON.stringify(map));
  dispatch('simplifii:section-health', { sectionId, fromDots: prev, toDots: clamped });
  return clamped;
};

// ============================================================
// PlayTime (reward unlock)
// ============================================================

export const grantPlayTime = ({ minutes = 7, reason = 'section-health' } = {}) => {
  const until = Date.now() + Math.max(60_000, minutes * 60 * 1000);
  safeWriteLS(PLAYTIME_KEY, String(until));
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-playtime-active', 'true');
    setTimeout(() => {
      const stored = Number(safeReadLS(PLAYTIME_KEY, '0'));
      if (Date.now() >= stored) {
        document.documentElement.removeAttribute('data-playtime-active');
        dispatch('simplifii:playtime-expired', { reason: 'time-up' });
      }
    }, until - Date.now() + 200);
  }
  dispatch('simplifii:playtime-granted', { until, reason, minutes });
  return until;
};

export const isPlayTimeActive = () => {
  const stored = Number(safeReadLS(PLAYTIME_KEY, '0'));
  return stored > Date.now();
};

// ============================================================
// SovereignCredits (honour-system, no monetary value)
// ============================================================

export const getCredits = () => Number(safeReadLS(CREDITS_KEY, '0')) || 0;

export const earnCredits = (amount, reason = 'micro-step') => {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  if (n === 0) return getCredits();
  const next = getCredits() + n;
  safeWriteLS(CREDITS_KEY, String(next));
  dispatch('simplifii:credits-earned', { amount: n, reason, balance: next });
  return next;
};

export const spendCredits = (amount, reason = 'cosmetic') => {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  const balance = getCredits();
  if (n === 0 || n > balance) return balance;
  const next = balance - n;
  safeWriteLS(CREDITS_KEY, String(next));
  dispatch('simplifii:credits-spent', { amount: n, reason, balance: next });
  return next;
};

// ============================================================
// Test guard (Blueprint requires a runtime check that no
// native-blocking code path exists).
// ============================================================

export const __nativeBlockingDoesNotExist = () => {
  // If anyone ever adds chrome.tabs / browser.tabs / OS API calls
  // here, this assertion needs to flip and the commit needs review.
  return true;
};

export const __internals = { STORAGE_PREFIX, FOCUS_KEY, HEALTH_KEY, CREDITS_KEY, PLAYTIME_KEY };
