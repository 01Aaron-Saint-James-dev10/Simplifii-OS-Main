import React, { useState, useEffect, useRef } from 'react';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER, ACCENT_FOCUS,
  GLASS_BORDER,
  FONT_DISPLAY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const PHASES = [
  { label: 'Breathe in', duration: 4000, scale: 1.6 },
  { label: 'Hold', duration: 7000, scale: 1.6 },
  { label: 'Breathe out', duration: 8000, scale: 1.0 },
];
const CYCLE_MS = PHASES.reduce((s, p) => s + p.duration, 0);

/**
 * BreathBubble
 *
 * 4-7-8 breathing exercise. Circle expands/holds/contracts.
 * 2-minute preset (approx 6 cycles). Respects reduced-motion.
 */
export default function BreathBubble() {
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!active) return;
    startRef.current = Date.now();
    const tick = () => {
      const ms = Date.now() - startRef.current;
      setElapsed(ms);
      const cyclePos = ms % CYCLE_MS;
      let acc = 0;
      for (let i = 0; i < PHASES.length; i++) {
        acc += PHASES[i].duration;
        if (cyclePos < acc) { setPhaseIdx(i); break; }
      }
      // Stop after 2 minutes
      if (ms >= 120000) { setActive(false); return; }
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timerRef.current);
  }, [active]);

  const phase = PHASES[phaseIdx];
  const cycleCount = Math.floor(elapsed / CYCLE_MS);
  const remaining = Math.max(0, Math.ceil((120000 - elapsed) / 1000));

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: 0 }}>
        Breathing Exercise
      </h3>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, margin: 0, textAlign: 'center' }}>
        4-7-8 pattern. Inhale 4s, hold 7s, exhale 8s. Two minutes.
      </p>

      {!active ? (
        <button type="button" onClick={() => { setActive(true); setElapsed(0); }}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '12px 24px', cursor: 'pointer', minHeight: 44, outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          Start 2-minute break
        </button>
      ) : (
        <>
          {/* Breathing circle */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: ACCENT_GLASS,
              border: `2px solid ${ACCENT_PULSE}`,
              boxShadow: `0 0 ${phase.scale > 1 ? 24 : 8}px ${ACCENT_FOCUS}`,
              transform: reducedMotion ? 'none' : `scale(${phase.scale})`,
              transition: `transform ${phase.duration}ms ease-in-out, box-shadow ${phase.duration}ms ease`,
            }} />
          </div>

          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }} aria-live="polite">
            {phase.label}
          </p>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, margin: 0 }}>
            Cycle {cycleCount + 1} | {remaining}s remaining
          </p>

          <button type="button" onClick={() => setActive(false)}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, background: 'none', border: `1px solid ${GLASS_BORDER}`, borderRadius: 3, padding: '6px 14px', cursor: 'pointer', minHeight: 28 }}>
            Stop
          </button>
        </>
      )}

      {!active && elapsed > 0 && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: ACCENT_PULSE, margin: 0 }}>
          {cycleCount} cycle{cycleCount !== 1 ? 's' : ''} complete. Well done.
        </p>
      )}
    </div>
  );
}
