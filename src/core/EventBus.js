/**
 * EventBus
 *
 * Bridges ExecutiveSpine's window CustomEvents into the
 * HistoryOfThought encrypted log. The bus is a one-way pipe:
 * Spine dispatches, Bus listens, HoT appends (only when the vault
 * is unlocked).
 *
 * Sovereign integrity (Blueprint hard rule):
 *   When the vault is locked, events are SILENTLY DROPPED. No
 *   localStorage shadow queue. No pending buffer. No leakage.
 *   The student's typing happens; the cockpit forgets it. When
 *   they unlock later, capture resumes from that point forward.
 *   Past silence is the cost of refusing to hold plaintext.
 *
 * Event mapping:
 *   simplifii:focus-start         -> focus_session_start
 *   simplifii:focus-end           -> focus_session_end
 *   simplifii:idle                -> nudge_triggered
 *   simplifii:section-health      -> section_health_change
 *   simplifii:playtime-granted    -> playtime_granted
 *   simplifii:playtime-expired    -> playtime_expired
 *   simplifii:credits-earned      -> ai_assist_invoked    (placeholder
 *                                                          mapping)
 *   simplifii:reasoning-start     -> ai_assist_invoked    (RewriteService /
 *                                                          ChatService /
 *                                                          MicroStepService)
 *
 * Lifecycle: startEventBus() once on app mount; stopEventBus() on
 * unmount. Re-entrant safe (start clears any prior listeners).
 */

import { isUnlocked, appendEvent, EVENT_TYPES } from './HistoryOfThought';

const SPINE_TO_HOT = {
  'simplifii:focus-start':      'focus_session_start',
  'simplifii:focus-end':        'focus_session_end',
  'simplifii:idle':              'nudge_triggered',
  'simplifii:section-health':    'section_health_change',
  'simplifii:playtime-granted':  'playtime_granted',
  'simplifii:playtime-expired':  'playtime_expired',
  'simplifii:reasoning-start':   'ai_assist_invoked',
  'simplifii:credits-earned':    'ai_assist_invoked'
};

const __listeners = new Map();
let __started = false;

const safeAppend = async (eventType, payload, streamId, userId) => {
  if (!isUnlocked()) return;
  if (!EVENT_TYPES.includes(eventType)) return;
  try {
    await appendEvent({
      user_id: userId || 'local',
      stream_id: streamId || 'tertiary',
      event_type: eventType,
      payload: payload || {}
    });
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[EventBus] append failed:', err.message);
  }
};

/**
 * startEventBus(getContext)
 *   getContext: () => { streamId, userId } - called per event so the
 *   bus picks up the current stream / user without a stale closure.
 */
export const startEventBus = (getContext = () => ({ streamId: 'tertiary', userId: 'local' })) => {
  if (typeof window === 'undefined') return;
  if (__started) stopEventBus();
  __started = true;

  for (const [windowEventName, hotEventType] of Object.entries(SPINE_TO_HOT)) {
    const handler = (e) => {
      const ctx = getContext() || {};
      // Strip noisy / large fields from payloads before they hit
      // encryption. The encrypted log is for proof of process, not
      // for storing every keystroke verbatim.
      const detail = e?.detail || {};
      const payload = pickSafePayload(hotEventType, detail);
      safeAppend(hotEventType, payload, ctx.streamId, ctx.userId);
    };
    window.addEventListener(windowEventName, handler);
    __listeners.set(windowEventName, handler);
  }

  if (typeof console !== 'undefined') {
    console.info('[EventBus] started; listening for', __listeners.size, 'spine events');
  }
};

export const stopEventBus = () => {
  if (typeof window === 'undefined') return;
  for (const [name, handler] of __listeners.entries()) {
    window.removeEventListener(name, handler);
  }
  __listeners.clear();
  __started = false;
};

/**
 * recordTextEdit({ sectionId, words, debounceWindowMs }):
 *   Convenience appender for the cockpit text editors. Debounce
 *   handled by the caller; this is a single 'a meaningful change
 *   landed' beacon.
 */
export const recordTextEdit = async ({ sectionId, wordsAfter, debounceWindowMs, streamId, userId }) => {
  if (!isUnlocked()) return;
  await safeAppend('text_edit', {
    sectionId: String(sectionId || 'unscoped'),
    wordsAfter: Number(wordsAfter) || 0,
    debounceWindowMs: Number(debounceWindowMs) || 0
  }, streamId, userId);
};

/**
 * recordCitation({ added, source }): payload-shaped helper for the
 * AURA chat / source ingest path.
 */
export const recordCitation = async ({ added = true, source, sourceId, streamId, userId }) => {
  const type = added ? 'citation_added' : 'citation_removed';
  await safeAppend(type, {
    source: String(source || '').slice(0, 120),
    sourceId: String(sourceId || '').slice(0, 60)
  }, streamId, userId);
};

const pickSafePayload = (hotEventType, detail) => {
  switch (hotEventType) {
    case 'focus_session_start':
      return { taskId: detail.taskId, plannedDurationMs: detail.plannedDurationMs };
    case 'focus_session_end':
      return { taskId: detail.taskId, actualDurationMs: detail.actualDurationMs, reason: detail.reason };
    case 'nudge_triggered':
      return { sinceMs: detail.sinceMs, taskId: detail.taskId, reason: detail.reason || 'idle' };
    case 'section_health_change':
      return { sectionId: detail.sectionId, fromDots: detail.fromDots, toDots: detail.toDots };
    case 'playtime_granted':
      return { minutes: detail.minutes, reason: detail.reason };
    case 'playtime_expired':
      return { reason: detail.reason || 'time-up' };
    case 'ai_assist_invoked':
      return { mode: detail.mode || 'reasoning', source: detail.source || 'spine' };
    default:
      return {};
  }
};

export const __internals = { SPINE_TO_HOT };
