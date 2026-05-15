import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  COLOUR_WARN, COLOUR_WARN_BORDER,
  COLOUR_DANGER,
  OVERLAY_BACKDROP,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * CrisisResourcesModal
 *
 * Comprehensive crisis support resources for Australian learners.
 * All phone numbers verified 2026-05-15 via web search.
 *
 * Privacy: opening this modal is NOT logged. No analytics. No HistoryOfThought.
 * This is a load-bearing privacy decision. Do not add tracking here.
 */

const CATEGORIES = [
  {
    title: 'Immediate crisis support',
    defaultOpen: true,
    accent: COLOUR_DANGER,
    resources: [
      { name: 'Emergency Services', phone: '000', note: 'If you or someone else is in immediate danger', url: null },
      { name: 'Lifeline', phone: '13 11 14', note: '24/7 crisis support for all Australians', url: 'https://lifeline.org.au' },
      { name: 'Kids Helpline', phone: '1800 55 1800', note: 'Ages 5 to 25, 24/7, free from mobiles', url: 'https://kidshelpline.com.au' },
      { name: 'Suicide Call Back Service', phone: '1300 659 467', note: '24/7 phone, online, and video counselling', url: 'https://suicidecallbackservice.org.au' },
    ],
  },
  {
    title: 'If you are Aboriginal or Torres Strait Islander',
    defaultOpen: false,
    accent: ACCENT_PULSE,
    resources: [
      { name: '13YARN', phone: '13 92 76', note: '24/7 crisis support, yarn with an Aboriginal or Torres Strait Islander person', url: 'https://13yarn.org.au' },
    ],
  },
  {
    title: 'If you are LGBTQI+',
    defaultOpen: false,
    accent: ACCENT_PULSE,
    resources: [
      { name: 'QLife', phone: '1800 184 527', note: 'Anonymous LGBTQI+ peer support, 3pm to midnight', url: 'https://qlife.org.au' },
      { name: 'QLife Webchat', phone: null, note: 'No phone needed, same hours', url: 'https://qlife.org.au' },
    ],
  },
  {
    title: 'If you are facing disability discrimination',
    defaultOpen: false,
    accent: ACCENT_PULSE,
    resources: [
      { name: 'People with Disability Australia', phone: '1800 422 015', note: 'Advocacy and discrimination support', url: 'https://pwd.org.au' },
      { name: 'Australian Human Rights Commission', phone: '1300 656 419', note: 'Formal discrimination complaints', url: 'https://humanrights.gov.au' },
    ],
  },
  {
    title: 'Mental health support (not in crisis)',
    defaultOpen: false,
    accent: ACCENT_PULSE,
    resources: [
      { name: 'Beyond Blue', phone: '1300 22 4636', note: '24/7 support, also webchat', url: 'https://beyondblue.org.au' },
      { name: 'headspace', phone: null, note: 'Ages 12 to 25, online and in-person', url: 'https://headspace.org.au' },
      { name: 'eheadspace', phone: null, note: 'Free webchat counselling for 12 to 25 year olds', url: 'https://headspace.org.au/eheadspace' },
      { name: 'ReachOut', phone: null, note: 'Youth mental health resources, no phone needed', url: 'https://au.reachout.com' },
    ],
  },
  {
    title: 'Domestic and family violence',
    defaultOpen: false,
    accent: COLOUR_WARN,
    resources: [
      { name: '1800RESPECT', phone: '1800 737 732', note: '24/7 confidential counselling and support', url: 'https://1800respect.org.au' },
    ],
  },
  {
    title: 'Student-specific support',
    defaultOpen: false,
    accent: ACCENT_PULSE,
    resources: [],
    customContent: 'Check your school or university\'s student support service. Most offer free, confidential counselling. Ask at your front office or search "[your school name] student wellbeing" online.',
  },
];

export default function CrisisResourcesModal({ onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 24, overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Crisis support resources"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', margin: 'auto',
          background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`,
          borderRadius: 12, padding: '28px 24px', outline: 'none',
        }}
      >
        {/* Compassionate opening */}
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 12px' }}>
          You are not alone.
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.7, color: TEXT_MUTED, margin: '0 0 8px' }}>
          {"School is one of the hardest things to go through, especially when the system wasn't built for you."}
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.7, color: TEXT_MUTED, margin: '0 0 24px' }}>
          {"Please don't feel bad for needing help or reaching out. That is one of the bravest things you can do."}
        </p>

        {/* Categories */}
        {CATEGORIES.map((cat, ci) => (
          <details key={ci} open={cat.defaultOpen} style={{ marginBottom: 14 }}>
            <summary style={{
              fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: cat.accent, cursor: 'pointer', padding: '10px 0',
              borderBottom: `1px solid ${SURFACE_RAISED}`,
              listStyle: 'none',
            }}>
              {cat.title}
            </summary>
            <div style={{ padding: '8px 0 12px' }}>
              {cat.resources.map((r, ri) => (
                <div key={ri} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', marginBottom: 6,
                  border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                  minHeight: 44,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
                      {r.name}
                    </p>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: '2px 0 0' }}>
                      {r.note}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    {r.phone && (
                      <a
                        href={`tel:${r.phone.replace(/\s/g, '')}`}
                        aria-label={`Call ${r.name} on ${r.phone}`}
                        style={{
                          fontFamily: FONT_SYSTEM, fontSize: 12, fontWeight: 700,
                          color: ACCENT_PULSE, textDecoration: 'none', whiteSpace: 'nowrap',
                        }}
                      >
                        {r.phone}
                      </a>
                    )}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${r.name} website`}
                        style={{
                          fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600,
                          color: TEXT_FAINT, textDecoration: 'underline', textUnderlineOffset: 2,
                        }}
                      >
                        Web
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {cat.customContent && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, margin: '4px 0 0', padding: '0 12px' }}>
                  {cat.customContent}
                </p>
              )}
            </div>
          </details>
        ))}

        {/* Footer disclaimer */}
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, lineHeight: 1.6, margin: '16px 0 0', borderTop: `1px solid ${SURFACE_RAISED}`, paddingTop: 12 }}>
          This is not a replacement for professional help. If you are in immediate danger, please call 000.
        </p>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%', marginTop: 16, padding: '10px 0', borderRadius: BORDER_RADIUS,
            fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: TEXT_MUTED, background: 'transparent',
            border: `1px solid ${SURFACE_RAISED}`, cursor: 'pointer',
            minHeight: 44, outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
