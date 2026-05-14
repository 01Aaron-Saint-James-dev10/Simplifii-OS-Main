import React, { useState } from 'react';
import {
  GLASS_SURFACE, GLASS_BORDER,
  TEXT_MUTED,
  ACCENT_PULSE,
  FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const DISMISS_KEY = 'simplifii_beta_banner_dismissed';

/**
 * BetaBanner
 *
 * Thin dismissible banner for beta testers. Shown below nav on /app routes.
 * Persists dismissal in localStorage.
 */
export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* storage unavailable */ }
  };

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '8px 16px',
        background: GLASS_SURFACE, borderBottom: `1px solid ${GLASS_BORDER}`,
        fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
        color: TEXT_MUTED, /* allow-style */
      }}
    >
      {/* Info icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span>
        Beta. Some features are still being built. Found a bug? Tap the feedback button bottom-right.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss beta banner"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: TEXT_MUTED, fontSize: 14, lineHeight: 1, flexShrink: 0, /* allow-style */
          minHeight: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: BORDER_RADIUS, outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {'\u2715'}
      </button>
    </div>
  );
}
