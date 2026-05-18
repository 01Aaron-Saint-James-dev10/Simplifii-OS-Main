import React, { useState } from 'react';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
  OVERLAY_BACKDROP,
} from '../../theme/tokens';

/**
 * ExamBreakOverlay
 *
 * Calm, non-alarming overlay shown when exam energy is fully depleted.
 * Offers regulation activities. Student chooses one, waits, then returns.
 * Dismissing resets energy (fires simplifii:energy-reset event).
 *
 * Props:
 *   onReturn  fn() -- called when student is ready to come back
 */

const ACTIVITIES = [
  { id: 'breathe',   emoji: '\u{1F9D8}', label: 'Breathe',      desc: '4-7-8 breathing: breathe in 4 counts, hold 7, breathe out 8. Repeat 3 times.' },
  { id: 'stretch',   emoji: '\u{1F4AA}', label: 'Stretch',       desc: 'Roll your shoulders back, tilt your head side to side, stretch your arms above your head. Take your time.' },
  { id: 'eat',       emoji: '\u{1F34E}', label: 'Eat something', desc: 'Grab a snack or a glass of water. Your brain needs fuel. Even a few crackers helps.' },
  { id: 'music',     emoji: '\u{1F3A7}', label: 'Music',         desc: 'Put on something you enjoy. One or two songs. Let your mind wander away from the paper.' },
  { id: 'walk',      emoji: '\u{1F6B6}', label: 'Move',          desc: 'Stand up and walk around, even just to the kitchen and back. Movement resets focus.' },
  { id: 'rest',      emoji: '\u{1F634}', label: 'Rest your eyes', desc: 'Close your eyes for two minutes. No screens. Just sit and be still.' },
];

export default function ExamBreakOverlay({ onReturn }) {
  const [chosen, setChosen] = useState(null);
  const [ready, setReady] = useState(false);

  const handleReturn = () => {
    window.dispatchEvent(new CustomEvent('simplifii:energy-reset'));
    onReturn?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Time for a break"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: OVERLAY_BACKDROP,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{
        maxWidth: 480,
        width: '100%',
        background: SURFACE_CARD,
        border: `1px solid ${SURFACE_RAISED}`,
        borderRadius: BORDER_RADIUS + 2,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>

        {/* Header */}
        <div>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 8px' }}>
            Energy check
          </p>
          <h2 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600,
            color: TEXT_PRIMARY, margin: '0 0 8px', lineHeight: 1.3 }}>
            Your energy is running low.
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED,
            margin: 0, lineHeight: 1.6 }}>
            That is a lot of thinking. Your brain works better after a short reset.
            Pick something that sounds good right now.
          </p>
        </div>

        {/* Activity grid */}
        {!chosen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ACTIVITIES.map(act => (
              <button
                key={act.id}
                type="button"
                onClick={() => setChosen(act)}
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  background: ACCENT_GLASS,
                  border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: BORDER_RADIUS,
                  color: TEXT_PRIMARY,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>{act.emoji}</span>
                <span style={{ fontWeight: 600 }}>{act.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Activity instruction */}
        {chosen && !ready && (
          <div style={{
            background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS,
            padding: '16px 18px',
          }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY,
              margin: '0 0 14px', lineHeight: 1.6 }}>
              <span style={{ fontSize: 22, marginRight: 8 }}>{chosen.emoji}</span>
              {chosen.desc}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setReady(true)}
                style={{
                  fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: BORDER_RADIUS, color: ACCENT_PULSE,
                  padding: '8px 16px', cursor: 'pointer', minHeight: 36,
                }}
              >
                I'm ready to come back
              </button>
              <button
                type="button"
                onClick={() => setChosen(null)}
                style={{
                  fontFamily: FONT_SYSTEM, fontSize: 10,
                  background: 'none', border: `1px solid ${SURFACE_RAISED}`,
                  borderRadius: BORDER_RADIUS, color: TEXT_FAINT,
                  padding: '8px 16px', cursor: 'pointer', minHeight: 36,
                }}
              >
                Different activity
              </button>
            </div>
          </div>
        )}

        {/* Return confirmation */}
        {ready && (
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY,
              margin: '0 0 16px', lineHeight: 1.5 }}>
              Good. Your energy is reset. Pick up where you left off whenever you are ready.
            </p>
            <button
              type="button"
              onClick={handleReturn}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: BORDER_RADIUS, color: ACCENT_PULSE,
                padding: '10px 20px', cursor: 'pointer', minHeight: 40,
                width: '100%',
              }}
            >
              Back to the exam
            </button>
          </div>
        )}

        {/* Skip (no guilt) */}
        {!ready && (
          <button
            type="button"
            onClick={handleReturn}
            style={{
              fontFamily: FONT_BODY, fontSize: 12, background: 'none',
              border: 'none', color: TEXT_FAINT, cursor: 'pointer',
              textAlign: 'center', padding: 0,
            }}
          >
            Skip break and keep going
          </button>
        )}

      </div>
    </div>
  );
}
