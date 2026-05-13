import React from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  ACCENT_PULSE,
  ACCENT_HOVER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * DecisionButton
 *
 * "What should I do next?" button with sub-line.
 * Implements decision externalisation per spec 1.7:
 * "The system picks ONE task and tells the student:
 *  Open this for 15 minutes. I'll check on you then."
 *
 * Props:
 *   onDecide  - callback() fired when the student clicks. Parent picks
 *               the most urgent task and navigates to it.
 */

export default function DecisionButton({ onDecide }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '8px 0',
      }}
    >
      <button
        type="button"
        onClick={onDecide}
        aria-label="Let the system pick one task for 15 minutes"
        style={{
          fontFamily: FONT_BODY,
          fontSize: 15,
          fontWeight: 700,
          color: '#000',
          background: ACCENT_PULSE,
          border: 'none',
          borderRadius: BORDER_RADIUS,
          padding: '14px 28px',
          cursor: 'pointer',
          minHeight: 44,
          minWidth: 44,
          transition: 'background 150ms ease',
          outline: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = ACCENT_HOVER; }}
        onMouseLeave={e => { e.currentTarget.style.background = ACCENT_PULSE; }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        What should I do next?
      </button>
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: TEXT_MUTED,
          textAlign: 'center',
        }}
      >
        We will pick one task. 15 minutes. We will check in after.
      </span>
    </div>
  );
}
