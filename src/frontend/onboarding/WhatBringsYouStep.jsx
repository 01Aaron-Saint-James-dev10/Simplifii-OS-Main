import React from 'react';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const TIERS = [
  { value: 'primary', label: 'Primary school', desc: 'I help you break down schoolwork into steps you can follow.' },
  { value: 'secondary', label: 'Secondary school', desc: 'I decode your rubrics and help you write with confidence.' },
  { value: 'tertiary', label: 'University student', desc: 'I turn your assessment briefs into a plan and guide you through each step.' },
  { value: 'postgrad', label: 'Postgrad and research', desc: 'I help you manage research, writing, and deadlines.' },
  { value: 'tafe', label: 'TAFE and vocational', desc: 'I help you understand competency requirements and build your evidence.' },
  { value: 'homeschool', label: 'Homeschooling', desc: 'I help you and your child work through curriculum together.' },
  { value: 'educator', label: 'Educator', desc: 'I give you anonymised insights about how your students engage.' },
];

/**
 * WhatBringsYouStep
 *
 * Step A of onboarding: visual tier selection cards.
 * Replaces the old radio button list from SignupScreen.
 */
export default function WhatBringsYouStep({ onSelect }) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
      <h2 style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 8px', textAlign: 'center' }}>
        What brings you here?
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
        This helps me adapt to how you work. You can change it anytime.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIERS.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: '14px 18px',
              background: SURFACE_CARD,
              border: `1px solid ${SURFACE_RAISED}`,
              borderRadius: BORDER_RADIUS + 4,
              cursor: 'pointer',
              textAlign: 'left',
              outline: 'none',
              minHeight: 44,
              transition: 'border-color 0.15s, background 0.15s', // allow-style
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; e.currentTarget.style.background = ACCENT_GLASS; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; e.currentTarget.style.background = SURFACE_CARD; }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>
              {t.label}
            </span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.4 }}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
