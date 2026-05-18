import React, { useState } from 'react';
import {
  TEXT_FAINT, TEXT_MUTED,
  ACCENT_PULSE,
  SURFACE_CARD, SURFACE_RAISED,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../../theme/tokens';

/**
 * AiDisclaimerFooter (Layer 2)
 *
 * Persistent footer badge across all app screens.
 * Compact on narrow viewports, expanded on desktop.
 */
export default function AiDisclaimerFooter() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={s.root}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      {/* Compact (always visible) */}
      <span style={s.compact}>
        AI assists. You decide.
      </span>

      {/* Expanded tooltip */}
      {showTooltip && (
        <div style={s.tooltip} role="tooltip">
          <p style={s.tooltipText}>
            Simplifii-OS uses AI to support your work. AI suggestions can be wrong, incomplete, or misinterpret your context. Always verify important information. You are responsible for what you submit.
          </p>
          <a href="/ai-use" style={s.tooltipLink}>Read our AI Use Policy</a>
        </div>
      )}
    </div>
  );
}

const s = {
  root: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
  },
  compact: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    color: TEXT_MUTED, // allow-style
  },
  learnMore: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: 2,
    marginLeft: 4,
    color: ACCENT_PULSE, // allow-style
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 8,
    width: 320,
    padding: '14px 16px',
    background: SURFACE_CARD,
    border: `1px solid ${SURFACE_RAISED}`,
    borderRadius: BORDER_RADIUS + 2,
    zIndex: 100,
  },
  tooltipText: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    lineHeight: 1.6,
    margin: '0 0 8px',
  },
  tooltipLink: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    fontWeight: 700,
    textDecoration: 'underline',
    color: ACCENT_PULSE, // allow-style
  },
};
