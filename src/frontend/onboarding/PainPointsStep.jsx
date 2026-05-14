import React, { useState } from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS_FAINT,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const PAIN_POINTS = [
  'Starting tasks',
  'Staying focused',
  'Understanding what teachers want',
  'Time management',
  'Anxiety before assessments',
  'Reading long texts',
  'Writing essays',
  'Maths concepts',
  'Memorising for exams',
  'Group work',
  'Asking for help',
  'Getting started after a break',
];

/**
 * PainPointsStep
 *
 * Multi-select chips for Y10-12 pain points.
 * Trauma-informed: "These are common. Nothing is broken about you."
 *
 * Props:
 *   onContinue(selectedPoints: string[])
 *   onSkip()
 */
export default function PainPointsStep({ onContinue, onSkip }) {
  const [selected, setSelected] = useState([]);

  const toggle = (point) => {
    setSelected(prev => prev.includes(point)
      ? prev.filter(p => p !== point)
      : [...prev, point]
    );
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)', textAlign: 'center', margin: '0 0 8px', color: TEXT_PRIMARY }}>
        Which of these feels hardest right now?
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, textAlign: 'center', margin: '0 0 20px' }}>
        Pick any that fit. These are common. Nothing is broken about you.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
        {PAIN_POINTS.map(p => {
          const active = selected.includes(p);
          return (
            <button key={p} type="button" onClick={() => toggle(p)}
              aria-pressed={active}
              style={{
                padding: '8px 16px', borderRadius: 20,
                fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
                background: active ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
                border: `1px solid ${active ? ACCENT_PULSE : GLASS_BORDER}`,
                color: active ? ACCENT_PULSE : TEXT_MUTED, /* allow-style */
                cursor: 'pointer', minHeight: 36,
                boxShadow: active ? GLOW_EMERALD : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s', /* allow-style */
              }}>
              {p}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button type="button" onClick={() => onContinue(selected)}
          style={{
            padding: '12px 40px', borderRadius: 8,
            fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
            background: ACCENT_PULSE, border: 'none', color: '#09090b',
            cursor: 'pointer', minHeight: 44,
          }}>
          {selected.length > 0 ? 'Continue' : 'Skip'}
        </button>
        <button type="button" onClick={onSkip}
          style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 44 }}>
          Skip
        </button>
      </div>
    </div>
  );
}
