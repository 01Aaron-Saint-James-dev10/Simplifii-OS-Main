import React, { useState, useCallback } from 'react';
import { useProject } from '../ProjectContext';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
  OVERLAY_BACKDROP,
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

const SERVICES = [
  { name: 'Kids Helpline',  phone: '1800 55 1800', note: 'Ages 5 to 25',                         url: 'https://kidshelpline.com.au' },
  { name: 'Lifeline',       phone: '13 11 14',      note: 'All ages, 24/7',                       url: 'https://lifeline.org.au' },
  { name: 'Beyond Blue',    phone: '1300 22 4636',   note: 'Mental health support',                url: 'https://beyondblue.org.au' },
  { name: 'headspace',      phone: '1800 650 890',   note: 'Ages 12 to 25, mental health',         url: 'https://headspace.org.au' },
  { name: '13YARN',         phone: '13 92 76',       note: 'Aboriginal and Torres Strait Islander', url: 'https://13yarn.org.au' },
];

export default function TalkToSomeoneLink({ canHide = false }) {
  const [open, setOpen] = useState(false);
  const { profile } = useProject();

  // Institutional counselling for postgrad
  const institution = profile?.institution || null;
  const isPostgrad = profile?.level === 'postgrad' || profile?.level === 'phd';

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

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crisis support contacts"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: OVERLAY_BACKDROP,
          }}
          onClick={handleClose}
          onKeyDown={e => { if (e.key === 'Escape') handleClose(); }}
        >
          <div
            style={{
              background: SURFACE_CARD,
              border: `1px solid ${SURFACE_RAISED}`,
              borderRadius: BORDER_RADIUS,
              padding: '28px 24px',
              maxWidth: 440,
              width: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, margin: '0 0 8px', lineHeight: 1.5 }}>
              It is OK to need help. These services are free and confidential.
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: '0 0 16px', lineHeight: 1.5 }}>
              Simplifii-OS is a thinking tool, not a mental health service. If you are struggling, please reach out to a trusted person, your GP, or a crisis line.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SERVICES.map(svc => (
                <li key={svc.name}>
                  <a
                    href={`tel:${svc.phone.replace(/\s/g, '')}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'transparent',
                      border: `1px solid ${SURFACE_RAISED}`,
                      borderRadius: BORDER_RADIUS,
                      textDecoration: 'none',
                      minHeight: 44,
                      outline: 'none',
                      transitionProperty: 'border-color', transitionDuration: '150ms', // allow-style
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_BORDER; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}
                    onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                    onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>
                        {svc.name}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                        {svc.note}
                      </div>
                    </div>
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 12, fontWeight: 700, color: ACCENT_PULSE, whiteSpace: 'nowrap' }}>
                      {svc.phone}
                    </span>
                  </a>
                </li>
              ))}

              {isPostgrad && institution && (
                <li>
                  <div
                    style={{
                      padding: '12px 14px',
                      border: `1px solid ${SURFACE_RAISED}`,
                      borderRadius: BORDER_RADIUS,
                    }}
                  >
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>
                      {institution} Counselling
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                      Contact your institution's student support service directly.
                    </div>
                  </div>
                </li>
              )}
            </ul>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              style={{
                fontFamily: FONT_SYSTEM,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: TEXT_MUTED,
                background: 'transparent',
                border: `1px solid ${SURFACE_RAISED}`,
                borderRadius: BORDER_RADIUS,
                padding: '10px 20px',
                cursor: 'pointer',
                minHeight: 44,
                minWidth: 44,
                marginTop: 16,
                width: '100%',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
