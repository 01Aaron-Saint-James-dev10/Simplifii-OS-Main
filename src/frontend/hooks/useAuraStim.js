import { useRef, useCallback } from 'react';
import { useSettings } from '../SettingsContext';

/**
 * useAuraStim
 *
 * Web Audio API micro-sounds for AURA state transitions.
 * Respects sensoryLevel: 0 disables all sound, 1-2 quiet, 3-4 medium, 5 full.
 * Checks prefers-reduced-motion and returns early if set.
 */

function getGain(sensoryLevel) {
  if (sensoryLevel <= 0) return 0;
  if (sensoryLevel <= 2) return 0.05;
  if (sensoryLevel <= 4) return 0.12;
  return 0.2;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

export function useAuraStim() {
  const { sensoryLevel } = useSettings();
  const ctxRef = useRef(null);
  const thinkingRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playThinking = useCallback(() => {
    if (sensoryLevel <= 0 || prefersReducedMotion()) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220;
      gain.gain.value = getGain(sensoryLevel);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      thinkingRef.current = { osc, gain };
    } catch { /* silent */ }
  }, [sensoryLevel, getCtx]);

  const stopThinking = useCallback(() => {
    if (!thinkingRef.current) return;
    try {
      const { osc, gain } = thinkingRef.current;
      const ctx = getCtx();
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => { try { osc.stop(); } catch { /* already stopped */ } }, 350);
      thinkingRef.current = null;
    } catch { thinkingRef.current = null; }
  }, [getCtx]);

  const playResponse = useCallback(() => {
    if (sensoryLevel <= 0 || prefersReducedMotion()) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(getGain(sensoryLevel), ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* silent */ }
  }, [sensoryLevel, getCtx]);

  const playCelebrate = useCallback(() => {
    if (sensoryLevel <= 0 || prefersReducedMotion()) return;
    try {
      const ctx = getCtx();
      const vol = getGain(sensoryLevel) * 1.2;
      const tones = [330, 440, 550];
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(vol, start);
        gain.gain.linearRampToValueAtTime(0, start + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch { /* silent */ }
  }, [sensoryLevel, getCtx]);

  return { playThinking, stopThinking, playResponse, playCelebrate };
}
