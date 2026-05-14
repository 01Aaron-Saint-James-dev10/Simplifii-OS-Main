/**
 * MetricCard.jsx
 *
 * Reusable card for Methodology Log / Reflexivity Log / Supervisor Feedback
 * counts on the Research Home dashboard.
 *
 * Props:
 *   label        - string, e.g. "Methodology Log"
 *   count        - number
 *   subLabel     - string, e.g. "Last: today" or "3 unaddressed"
 *   accent       - boolean (true: emerald accent border; default: muted)
 *   warn         - boolean (true: amber accent for unaddressed items)
 *   onClick      - callback
 */

import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
} from '../../theme/tokens';

export default function MetricCard({ label, count, subLabel, accent, warn, onClick }) {
  const border  = warn ? COLOUR_WARN_BORDER : accent ? ACCENT_BORDER : `1px solid ${SURFACE_RAISED}`;
  const bg      = warn ? COLOUR_WARN_GLASS  : accent ? ACCENT_GLASS  : 'transparent';
  const numCol  = warn ? COLOUR_WARN        : accent ? ACCENT_PULSE  : TEXT_PRIMARY;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 120,
        padding: '16px',
        border: `1px solid ${border}`,
        borderRadius: BORDER_RADIUS * 2,
        background: bg,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      aria-label={`${label}: ${count} entries. ${subLabel || ''}`}
    >
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 28, fontWeight: 700, color: numCol, margin: 0, lineHeight: 1 }}>
        {count}
      </p>
      {subLabel && (
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0, letterSpacing: '0.06em' }}>
          {subLabel}
        </p>
      )}
    </button>
  );
}
