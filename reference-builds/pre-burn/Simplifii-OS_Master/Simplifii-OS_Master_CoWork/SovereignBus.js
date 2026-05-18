/**
 * SovereignBus
 *
 * The wiring layer between ExecutiveSpine and HistoryOfThought.
 *
 * ExecutiveSpine dispatches 8 simplifii:* CustomEvents. Without this
 * bus, none of them are heard. The HistoryOfThought event log stays
 * empty, the Authenticity Report has nothing to authenticate, and
 * the per-stream PlayTime threshold never auto-fires.
 *
 * This module adds:
 *   1. Listeners for every spine event, mapping each to its
 *      HistoryOfThought event_type and forwarding via appendEvent.
 *      Vault-locked drops are silent (HistoryOfThought handles this).
 *   2. Auto PlayTime grant when SectionHealth crosses the active
 *      stream's sectionHealthUnlockThreshold (Blueprint Layer 2.2d).
 *
 * Called from ProjectContext.useEffect on stream hydrate. Idempotent.
 *
 * Hard rules from the Blueprint enforced here:
 *   - section_health_change events feed HistoryOfThought without naming
 *     the user (we pass user_id='local' until cloud sync ships)
 *   - PlayTime threshold is read from the stream profile, never inferred
 *
 * Drop this file at: src/core/SovereignBus.js
 */

import { appendEvent, isUnlocked } from './HistoryOfThought';
import { grantPlayTime } from './ExecutiveSpine';

let __busAttached = false;
let __activeStreamId = 'tertiary';
let __activeUnlockThreshold = 4;
let __activePlaytimeMinutes = 7;

const safeAppend = async (event_type, payload) => {
  try {
    if (!isUnlocked()) return; // soft-drop; HistoryOfThought already logs
    await appendEvent({ user_id: 'local', stream_id: __activeStreamId, event_type, payload });
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[SovereignBus] appendEvent failed', e);
  }
};

const onFocusStart = (e) => safeAppend('focus_session_start', {
  taskId: e.detail?.taskId,
  plannedDurationMs: e.detail?.plannedDurationMs
});

const onFocusEnd = (e) => safeAppend('focus_session_end', {
  taskId: e.detail?.taskId,
  actualDurationMs: e.detail?.actualDurationMs,
  reason: e.detail?.reason
});

const onIdle = (e) => safeAppend('nudge_triggered', {
  reason: 'idle',
  sinceMs: e.detail?.sinceMs,
  taskId: e.detail?.taskId
});

const onSectionHealth = (e) => {
  const { sectionId, fromDots, toDots } = e.detail || {};
  safeAppend('section_health_change', { sectionId, fromDots, toDots });
  // Auto-grant PlayTime when threshold is crossed.
  if (
    typeof toDots === 'number' &&
    typeof fromDots === 'number' &&
    fromDots < __activeUnlockThreshold &&
    toDots >= __activeUnlockThreshold
  ) {
    grantPlayTime({ minutes: __activePlaytimeMinutes, reason: 'section-health' });
  }
};

const onPlaytimeGranted = (e) => safeAppend('playtime_granted', {
  durationMs: (e.detail?.until || Date.now()) - Date.now()
});

const onPlaytimeExpired = () => safeAppend('playtime_expired', {});

export const start = ({ stream } = {}) => {
  if (typeof window === 'undefined') return;
  if (__busAttached) return;
  __activeStreamId = stream?.streamId || 'tertiary';
  __activeUnlockThreshold = stream?.profile?.sectionHealthUnlockThreshold ?? 4;
  __activePlaytimeMinutes = stream?.profile?.defaultPlaytimeMinutes ?? 7;

  window.addEventListener('simplifii:focus-start', onFocusStart);
  window.addEventListener('simplifii:focus-end', onFocusEnd);
  window.addEventListener('simplifii:idle', onIdle);
  window.addEventListener('simplifii:section-health', onSectionHealth);
  window.addEventListener('simplifii:playtime-granted', onPlaytimeGranted);
  window.addEventListener('simplifii:playtime-expired', onPlaytimeExpired);
  __busAttached = true;
};

export const stop = () => {
  if (typeof window === 'undefined' || !__busAttached) return;
  window.removeEventListener('simplifii:focus-start', onFocusStart);
  window.removeEventListener('simplifii:focus-end', onFocusEnd);
  window.removeEventListener('simplifii:idle', onIdle);
  window.removeEventListener('simplifii:section-health', onSectionHealth);
  window.removeEventListener('simplifii:playtime-granted', onPlaytimeGranted);
  window.removeEventListener('simplifii:playtime-expired', onPlaytimeExpired);
  __busAttached = false;
};

export const updateActiveStream = ({ stream }) => {
  __activeStreamId = stream?.streamId || 'tertiary';
  __activeUnlockThreshold = stream?.profile?.sectionHealthUnlockThreshold ?? 4;
  __activePlaytimeMinutes = stream?.profile?.defaultPlaytimeMinutes ?? 7;
};

export const __internals = { onSectionHealth, onFocusStart, onFocusEnd, onIdle };
