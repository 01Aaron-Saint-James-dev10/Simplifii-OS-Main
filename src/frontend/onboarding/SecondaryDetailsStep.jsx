import React, { useState } from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS_FAINT,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const YEARS = ['Year 10', 'Year 11', 'Year 12'];
const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

/**
 * SecondaryDetailsStep
 *
 * Year level + state selection for Y10-12 users.
 *
 * Props:
 *   onContinue({ yearLevel, state })
 *   onSkip()
 */
export default function SecondaryDetailsStep({ onContinue, onSkip }) {
  const [yearLevel, setYearLevel] = useState(null);
  const [state, setState] = useState('');

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)', textAlign: 'center', margin: '0 0 8px', color: TEXT_PRIMARY }}>
        A bit about where you are
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, textAlign: 'center', margin: '0 0 24px' }}>
        This helps us show you the right resources.
      </p>

      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 8px' }}>
        Which year are you in?
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {YEARS.map(y => {
          const active = yearLevel === y;
          return (
            <button key={y} type="button" onClick={() => setYearLevel(y)}
              aria-pressed={active}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600,
                background: active ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
                border: `1px solid ${active ? ACCENT_PULSE : GLASS_BORDER}`,
                color: active ? ACCENT_PULSE : TEXT_MUTED,
                cursor: 'pointer', boxShadow: active ? GLOW_EMERALD : 'none',
                minHeight: 44,
              }}>
              {y}
            </button>
          );
        })}
      </div>

      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 8px' }}>
        Which state?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {STATES.map(s => {
          const active = state === s;
          return (
            <button key={s} type="button" onClick={() => setState(s)}
              aria-pressed={active}
              style={{
                padding: '8px 14px', borderRadius: 6,
                fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 600,
                background: active ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
                border: `1px solid ${active ? ACCENT_PULSE : GLASS_BORDER}`,
                color: active ? ACCENT_PULSE : TEXT_MUTED,
                cursor: 'pointer', minHeight: 36,
              }}>
              {s}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button type="button" onClick={() => onContinue({ yearLevel, state })}
          disabled={!yearLevel}
          style={{
            padding: '12px 40px', borderRadius: 8,
            fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
            background: yearLevel ? ACCENT_PULSE : GLASS_SURFACE,
            border: `1px solid ${yearLevel ? ACCENT_PULSE : GLASS_BORDER}`,
            color: yearLevel ? '#09090b' : TEXT_FAINT,
            cursor: yearLevel ? 'pointer' : 'not-allowed',
            opacity: yearLevel ? 1 : 0.5, minHeight: 44,
          }}>
          Continue
        </button>
        <button type="button" onClick={onSkip}
          style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 44 }}>
          Skip
        </button>
      </div>
    </div>
  );
}
