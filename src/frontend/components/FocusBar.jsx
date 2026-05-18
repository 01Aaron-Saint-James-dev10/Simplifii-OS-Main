import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SURFACE_CARD, SHADOW_HEAVY,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER, ACCENT_BORDER_FAINT,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  FONT_SYSTEM, FONT_BODY, BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * FocusBar
 *
 * Slim 52px ambient presence bar rendered via portal at top of viewport.
 * Replaces the fullscreen takeover from BodyDoublingLine active phase.
 * Canvas editor, tabs, and tools all remain accessible below.
 *
 * Props:
 *   timeLeft        - number (seconds remaining)
 *   totalSeconds    - number (total session seconds)
 *   isRunning       - bool
 *   studentsNow     - number | null
 *   ambientSound    - string ('none' | 'brown' | 'rain' | 'ocean')
 *   onAmbientChange - fn(key)
 *   checkInShown    - bool
 *   onCheckInYes    - fn
 *   onCheckInBreak  - fn
 *   onPause         - fn
 *   onEnd           - fn
 */

const AMBIENT_OPTIONS = [
  { key: 'none', label: 'Silence' },
  { key: 'brown', label: 'Brown noise' },
  { key: 'rain', label: 'Rain' },
  { key: 'ocean', label: 'Ocean' },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusBar({
  timeLeft, totalSeconds, isRunning, studentsNow,
  ambientSound, onAmbientChange,
  checkInShown, onCheckInYes, onCheckInBreak,
  onPause, onEnd,
}) {
  const [ambientOpen, setAmbientOpen] = useState(false);

  const bar = (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 52,
        background: '#0d0d0d', borderBottom: `1px solid ${ACCENT_BORDER}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        zIndex: 200, boxSizing: 'border-box',
      }}
      role="status"
      aria-label="Focus session active"
    >
      {/* AURA dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%', background: ACCENT_PULSE,
            display: 'inline-block', animation: 'auraFocusPulse 1.2s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, whiteSpace: 'nowrap' }}>
          AURA is here with you
        </span>
      </div>

      {/* Timer - centre */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontFamily: 'monospace', fontSize: 20, fontWeight: 600,
            color: TEXT_PRIMARY, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em',
          }}
          aria-live="polite"
          aria-label={`${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds remaining`}
        >
          {formatTime(timeLeft)}
        </span>
        <button
          type="button"
          onClick={onPause}
          style={{
            background: 'none', border: `1px solid ${ACCENT_BORDER_FAINT}`,
            borderRadius: BORDER_RADIUS, color: TEXT_MUTED, cursor: 'pointer',
            fontFamily: FONT_SYSTEM, fontSize: 10, padding: '3px 10px', minHeight: 26,
          }}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Right side: ambient, students badge, exit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>

        {/* Ambient sound picker */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setAmbientOpen(o => !o)}
            aria-label="Ambient sound"
            aria-expanded={ambientOpen}
            style={{
              background: ambientSound !== 'none' ? ACCENT_GLASS : 'none',
              border: `1px solid ${ACCENT_BORDER_FAINT}`,
              borderRadius: BORDER_RADIUS, color: TEXT_FAINT, cursor: 'pointer',
              fontFamily: FONT_SYSTEM, fontSize: 10, padding: '3px 8px', minHeight: 26,
            }}
          >
            {ambientSound === 'none' ? 'Sound' : AMBIENT_OPTIONS.find(o => o.key === ambientSound)?.label || 'Sound'}
          </button>
          {ambientOpen && (
            <div style={{
              position: 'absolute', top: 30, right: 0,
              background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`,
              borderRadius: BORDER_RADIUS, padding: 6,
              display: 'flex', flexDirection: 'column', gap: 2, zIndex: 201, minWidth: 110,
            }}>
              {AMBIENT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { onAmbientChange(opt.key); setAmbientOpen(false); }}
                  style={{
                    background: ambientSound === opt.key ? ACCENT_GLASS : 'transparent',
                    border: 'none', borderRadius: 3,
                    color: ambientSound === opt.key ? ACCENT_PULSE : TEXT_MUTED,
                    cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10,
                    padding: '4px 8px', textAlign: 'left',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Students working badge */}
        {studentsNow !== null && studentsNow > 0 && (
          <span style={{
            fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT,
            background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: 10, padding: '2px 8px', whiteSpace: 'nowrap',
          }}>
            {studentsNow} working
          </span>
        )}

        {/* Exit button */}
        <button
          type="button"
          onClick={onEnd}
          aria-label="Exit focus mode"
          style={{
            background: 'none', border: `1px solid ${ACCENT_BORDER_FAINT}`,
            borderRadius: BORDER_RADIUS, color: TEXT_FAINT, cursor: 'pointer',
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
            padding: '3px 10px', minHeight: 26,
          }}
        >
          Exit
        </button>
      </div>

      {/* Halfway check-in: non-blocking dropdown below bar */}
      {checkInShown && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: BORDER_RADIUS + 2, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 4px 16px ${SHADOW_HEAVY}`, zIndex: 201, whiteSpace: 'nowrap',
        }}
          role="alertdialog"
          aria-label="AURA halfway check-in"
        >
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY }}>
            Still going? You are halfway through.
          </span>
          <button type="button" onClick={onCheckInYes}
            style={{ background: ACCENT_PULSE, border: 'none', borderRadius: BORDER_RADIUS, color: '#000', cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, padding: '5px 12px' }}>
            Yes
          </button>
          <button type="button" onClick={onCheckInBreak}
            style={{ background: 'none', border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10, padding: '5px 12px' }}>
            Take a break
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(bar, document.body);
}
