import React, { useEffect, useRef } from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  COLOUR_WARN_GLASS,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
  OVERLAY_BACKDROP,
} from '../../theme/tokens';

/**
 * ToolModal
 *
 * Generic modal shell for all canvas tools (Tier 1-4).
 * Focus trap, Escape closes, ARIA modal.
 *
 * Props:
 *   title       - string
 *   statusBadge - 'alpha' | 'beta' | null
 *   description - string
 *   children    - tool UI
 *   onClose     - callback
 */

const BADGE_STYLES = {
  alpha: { background: COLOUR_WARN_GLASS, border: `1px solid ${COLOUR_WARN}`, color: COLOUR_WARN }, // allow-style
  beta: { background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, color: ACCENT_PULSE }, // allow-style
};

export default function ToolModal({ title, statusBadge, description, children, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const badge = statusBadge ? BADGE_STYLES[statusBadge] || null : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: OVERLAY_BACKDROP,
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{
          background: SURFACE_CARD,
          border: `1px solid ${SURFACE_RAISED}`,
          borderRadius: BORDER_RADIUS,
          padding: 0,
          maxWidth: 560,
          width: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${SURFACE_RAISED}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
              {title}
            </h2>
            {badge && (
              <span style={{
                fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2, lineHeight: 1,
                ...badge,
              }}>
                {statusBadge}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 8, minHeight: 44, minWidth: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: 'none', borderRadius: BORDER_RADIUS,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M11 3L3 11M3 3L11 11" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {description && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, padding: '12px 20px 0', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {/* Body */}
        <div style={{ padding: '16px 20px 20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
