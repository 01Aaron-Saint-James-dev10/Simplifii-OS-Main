import React from 'react';
import AuraOrb from '../components/AuraOrb';
import {
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * MeetAuraStep
 *
 * Step B of onboarding: introduces AURA to the learner.
 * Shows the orb, explains what it does in 3 points, one button to continue.
 */
export default function MeetAuraStep({ onContinue }) {
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
      {/* AURA orb preview */}
      <div style={{ width: 80, height: 80, margin: '0 auto 20px', position: 'relative' }}>
        <AuraOrb onClick={() => {}} auraState="idle" />
      </div>

      <h2 style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 8px' }}>
        Meet AURA
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 28px', lineHeight: 1.5 }}>
        Your AI study companion. Always there. Never judges.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 16, color: ACCENT_PULSE, flexShrink: 0, marginTop: 2 }}>1</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
            <strong>AURA is your cognitive GPS.</strong> It knows what you are working on and guides you through it, step by step.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 16, color: ACCENT_PULSE, flexShrink: 0, marginTop: 2 }}>2</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
            <strong>Click the orb at any time</strong> to ask for help, get unstuck, or find out what to do next. You can also speak to it.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 16, color: ACCENT_PULSE, flexShrink: 0, marginTop: 2 }}>3</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
            <strong>AURA adapts to how you work.</strong> The more you use it, the better it knows what you need.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '14px 0',
          fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700,
          background: ACCENT_PULSE, border: 'none', color: '#09090b',
          borderRadius: BORDER_RADIUS + 2, cursor: 'pointer', minHeight: 44,
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        Got it, let us start
      </button>
    </div>
  );
}
