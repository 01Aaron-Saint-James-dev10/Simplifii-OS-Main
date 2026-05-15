import React from 'react';
import { createPortal } from 'react-dom';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  GLASS_BORDER,
  OVERLAY_BACKDROP,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const TYPE_LABELS = {
  brief: { label: 'Assignment Brief', icon: '\u2709', desc: 'We found assessment tasks, due dates, or rubric criteria.' },
  exam_paper: { label: 'Exam Paper', icon: '\u270D', desc: 'We found numbered questions with mark allocations.' },
  rubric: { label: 'Marking Rubric', icon: '\u2611', desc: 'We found grading criteria and band descriptors.' },
  reading: { label: 'Reading or Article', icon: '\u2709', desc: 'We found academic citations and publication info.' },
  notes: { label: 'Study Notes', icon: '\u270D', desc: 'This looks like study notes or lecture content.' },
  unknown: { label: 'Document', icon: '\u2753', desc: 'We could not determine the document type.' },
};

/**
 * DocumentClassifiedModal
 *
 * Shown after PDF upload when the document type is detected.
 * Offers suggested actions based on type.
 *
 * Props:
 *   type             - string
 *   confidence       - number
 *   suggestedActions - string[]
 *   onAction         - callback(actionIndex)
 *   onOverride       - callback(newType)
 *   onDismiss        - callback()
 */
export default function DocumentClassifiedModal({ type, confidence, suggestedActions, onAction, onOverride, onDismiss }) {
  const info = TYPE_LABELS[type] || TYPE_LABELS.unknown;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 24, overflowY: 'auto' }}
      onClick={onDismiss}>
      <div role="dialog" aria-modal="true" aria-label="Document classified"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 440, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', margin: 'auto', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12, padding: '28px 24px', outline: 'none' }}>

        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 8px' }}>
          Document detected
        </p>

        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
          {info.icon} This looks like a {info.label.toLowerCase()}
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: '0 0 20px' }}>
          {info.desc}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {(suggestedActions || []).map((action, i) => (
            <button key={i} type="button" onClick={() => onAction(i)}
              style={{
                padding: '10px 14px', textAlign: 'left',
                background: i === 0 ? ACCENT_GLASS : 'transparent',
                border: `1px solid ${i === 0 ? ACCENT_BORDER : SURFACE_RAISED}`,
                borderRadius: BORDER_RADIUS + 4, cursor: 'pointer',
                fontFamily: FONT_BODY, fontSize: 13,
                color: i === 0 ? ACCENT_PULSE : TEXT_MUTED,
                fontWeight: i === 0 ? 600 : 400,
                minHeight: 44, outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {action}
            </button>
          ))}
        </div>

        <button type="button" onClick={onDismiss}
          style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>
          {"Actually it's something else"}
        </button>
      </div>
    </div>,
    document.body
  );
}
