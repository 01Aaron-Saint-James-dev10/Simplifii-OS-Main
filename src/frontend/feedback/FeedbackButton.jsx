import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import {
  GLASS_SURFACE, GLASS_BORDER,
  ACCENT_PULSE, ACCENT_FOCUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * FeedbackButton
 *
 * Floating button (bottom-right, z-index 40).
 * Opens FeedbackModal on click.
 * Visible on all /app/* routes. Hidden during onboarding/FirstRunModal.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        style={{
          position: 'fixed', right: 24, bottom: 24, zIndex: 40,
          width: 48, height: 48, borderRadius: 24,
          background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          outline: 'none', transition: 'box-shadow 150ms ease, border-color 150ms ease', /* allow-style */
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; e.currentTarget.style.boxShadow = `0 0 20px ${ACCENT_FOCUS}`; }} /* allow-style */
        onMouseLeave={e => { e.currentTarget.style.borderColor = GLASS_BORDER; e.currentTarget.style.boxShadow = 'none'; }} /* allow-style */
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* MessageCircle icon (lucide) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
        </svg>
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
