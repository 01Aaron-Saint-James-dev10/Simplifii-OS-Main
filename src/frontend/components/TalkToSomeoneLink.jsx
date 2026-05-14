import React, { useState, useCallback } from 'react';
import CrisisResourcesModal from './CrisisResourcesModal';
import {
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SYSTEM,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * TalkToSomeoneLink
 *
 * P0 safety link. Always visible on every screen.
 * Spec: PRODUCT_SPEC_INCLUSION_AND_MOAT.md Section 1.2
 *
 * If user is a minor (under 18), this link cannot be hidden or disabled.
 * Opens a modal with crisis support services.
 *
 * Props:
 *   canHide  - boolean (default false). Adults can move to Settings, minors cannot.
 */

export default function TalkToSomeoneLink() {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Talk to someone: open crisis support contacts"
        style={{
          fontFamily: FONT_SYSTEM,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: TEXT_MUTED,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          minHeight: 44,
          minWidth: 44,
          borderRadius: BORDER_RADIUS,
          outline: 'none',
          transitionProperty: 'color', transitionDuration: '150ms', // allow-style
        }}
        onMouseEnter={e => { e.currentTarget.style.color = TEXT_PRIMARY; }}
        onMouseLeave={e => { e.currentTarget.style.color = TEXT_MUTED; }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        Talk to someone
      </button>

      {open && <CrisisResourcesModal onClose={handleClose} />}
    </>
  );
}
