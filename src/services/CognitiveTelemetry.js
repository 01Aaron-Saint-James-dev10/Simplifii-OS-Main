/**
 * CognitiveTelemetry: Shadow Profiler
 *
 * Passive cognitive monitoring. Observes real interaction behaviour so
 * AURA can profile the learner without asking them anything.
 *
 * Tracks (all computed in-memory, never persisted raw):
 *   time_to_first_action  ms from session start to first keystroke or click
 *   click_latency         rolling average of inter-click intervals (ms)
 *   scroll_velocity       average scroll speed (px/ms, sampled over 2 s windows)
 *   idle_gaps             count of gaps > 30 s with no interaction
 *
 * Outputs (via onUpdate callback):
 *   passiveFrictionEstimate  0-100  analogous to CFS but derived from behaviour
 *   shadowTags               string[]  same tag format as AuraTagWriter
 *   isProfileReady           bool  true after PROFILE_WINDOW ms OR first friction point
 *
 * Rules:
 *   - Zero UI. Zero questions. Zero network calls.
 *   - Attaches to window in browser only. No-ops in SSR / test environments.
 *   - Designed to run alongside HistoryOfThought, not replace it.
 *   - Caller must call destroy() when the session ends or the component unmounts.
 *
 * Friction heuristics:
 *   click_latency avg > LATENCY_WARN_MS AND time_to_first_action > SLOW_START_MS
 *     -> passiveFrictionEstimate >= 70, shadowTags includes burnout_risk
 *   idle_gaps >= IDLE_WARN_COUNT
 *     -> passiveFrictionEstimate += 20
 *   scroll_velocity near-zero during active session
 *     -> contributes +10 (learner is not engaging with content)
 */

const PROFILE_WINDOW      = 10 * 60 * 1000; // 10 minutes
const SLOW_START_MS       = 5 * 60 * 1000;  // 5 minutes: late first action
const LATENCY_WARN_MS     = 4_000;          // 4 s avg inter-click: hesitant
const IDLE_GAP_MS         = 30_000;         // 30 s: single idle gap threshold
const IDLE_WARN_COUNT     = 3;             // 3+ idle gaps: friction signal
const SCROLL_WINDOW_MS    = 2_000;          // scroll velocity sampling window
const CALLBACK_INTERVAL   = 15_000;        // emit update every 15 s

// ============================================================
// Factory
// ============================================================

/**
 * createCognitiveTelemetry
 *
 * @param {object} opts
 * @param {function} opts.onUpdate  Called with { passiveFrictionEstimate, shadowTags, isProfileReady }
 *                                  at CALLBACK_INTERVAL and whenever friction thresholds cross.
 * @returns {{ destroy: function }}
 */
export function createCognitiveTelemetry({ onUpdate } = {}) {
  if (typeof window === 'undefined') {
    return { destroy: () => {} };
  }

  const sessionStart = Date.now();
  let firstActionAt  = null;
  let lastActionAt   = sessionStart;
  let idleGapCount   = 0;
  let isProfileReady = false;

  // Click latency
  const clickTimes = [];

  // Scroll tracking
  let lastScrollY      = window.scrollY || 0;
  let lastScrollTime   = Date.now();
  const scrollSamples  = [];

  // ---- Event handlers ----

  const recordAction = () => {
    const now = Date.now();
    const gap = now - lastActionAt;
    if (lastActionAt !== sessionStart && gap > IDLE_GAP_MS) {
      idleGapCount += 1;
    }
    if (!firstActionAt) firstActionAt = now;
    lastActionAt = now;
  };

  const onPointerDown = () => {
    const now = Date.now();
    if (clickTimes.length > 0) {
      const latency = now - clickTimes[clickTimes.length - 1];
      clickTimes.push(latency);
      if (clickTimes.length > 20) clickTimes.shift(); // rolling window
    } else {
      clickTimes.push(now); // seed first timestamp
    }
    recordAction();
  };

  const onKeyDown = () => recordAction();

  const onScroll = () => {
    const now = Date.now();
    const dy  = Math.abs((window.scrollY || 0) - lastScrollY);
    const dt  = now - lastScrollTime;
    if (dt > 0) {
      scrollSamples.push(dy / dt); // px/ms
      if (scrollSamples.length > 30) scrollSamples.shift();
    }
    lastScrollY    = window.scrollY || 0;
    lastScrollTime = now;
    recordAction();
  };

  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('keydown',     onKeyDown,     { passive: true });
  window.addEventListener('scroll',      onScroll,      { passive: true });

  // ---- Compute & emit ----

  const compute = () => {
    const now          = Date.now();
    const elapsed      = now - sessionStart;
    const timeToFirst  = firstActionAt ? firstActionAt - sessionStart : elapsed;

    // Average click latency (skip the seed timestamp)
    const latencies     = clickTimes.slice(1);
    const avgLatency    = latencies.length
      ? latencies.reduce((s, v) => s + v, 0) / latencies.length
      : 0;

    // Average scroll velocity
    const avgScroll     = scrollSamples.length
      ? scrollSamples.reduce((s, v) => s + v, 0) / scrollSamples.length
      : null;

    // Component scores (0-100 scale)
    let score = 0;

    // Late start (0-40): proportional to slow_start threshold
    const startScore = Math.min(timeToFirst / SLOW_START_MS, 1.0) * 40;
    score += startScore;

    // High click latency (0-30)
    if (avgLatency > 0) {
      const latencyScore = Math.min(avgLatency / (LATENCY_WARN_MS * 2), 1.0) * 30;
      score += latencyScore;
    }

    // Idle gaps (0-20)
    score += Math.min(idleGapCount / IDLE_WARN_COUNT, 1.0) * 20;

    // Near-zero scroll during active session (0-10)
    if (avgScroll !== null && elapsed > 60_000 && avgScroll < 0.05) {
      score += 10;
    }

    const passiveFrictionEstimate = Math.round(Math.min(score, 100));

    // Tag emission
    const shadowTags = [];
    if (passiveFrictionEstimate >= 70) {
      shadowTags.push('burnout_risk');
      shadowTags.push('scaffolder_trigger');
      shadowTags.push('micro_task_only');
    } else if (passiveFrictionEstimate >= 50) {
      shadowTags.push('high_friction');
      shadowTags.push('scaffolder_trigger');
    }
    if (idleGapCount >= IDLE_WARN_COUNT) {
      shadowTags.push('high_friction');
    }

    // Profile is ready after PROFILE_WINDOW or first friction point
    if (!isProfileReady && (elapsed >= PROFILE_WINDOW || passiveFrictionEstimate >= 50)) {
      isProfileReady = true;
    }

    return { passiveFrictionEstimate, shadowTags, isProfileReady };
  };

  const emitUpdate = () => {
    if (typeof onUpdate === 'function') {
      onUpdate(compute());
    }
  };

  const intervalId = setInterval(emitUpdate, CALLBACK_INTERVAL);

  // Emit immediately on first friction crossing (checked every 5 s)
  let lastEstimate = 0;
  const fastCheckId = setInterval(() => {
    const result = compute();
    if (result.passiveFrictionEstimate >= 50 && lastEstimate < 50) {
      emitUpdate();
    }
    lastEstimate = result.passiveFrictionEstimate;
  }, 5_000);

  // ---- Destroy ----

  const destroy = () => {
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown',     onKeyDown);
    window.removeEventListener('scroll',      onScroll);
    clearInterval(intervalId);
    clearInterval(fastCheckId);
  };

  return { destroy, getSnapshot: compute };
}

// ============================================================
// React hook wrapper
// ============================================================

import { useEffect, useRef, useState } from 'react';

/**
 * useCognitiveTelemetry
 *
 * React hook that runs the shadow profiler for the lifetime of the
 * component that mounts it. Returns the latest telemetry snapshot.
 *
 * @returns {{ passiveFrictionEstimate: number, shadowTags: string[], isProfileReady: boolean }}
 */
export function useCognitiveTelemetry() {
  const [snapshot, setSnapshot] = useState({
    passiveFrictionEstimate: 0,
    shadowTags: [],
    isProfileReady: false,
  });
  const telemetryRef = useRef(null);

  useEffect(() => {
    const instance = createCognitiveTelemetry({ onUpdate: setSnapshot });
    telemetryRef.current = instance;
    return () => instance.destroy();
  }, []);

  return snapshot;
}
