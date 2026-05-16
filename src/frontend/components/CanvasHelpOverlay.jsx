import React from 'react';
import { createPortal } from 'react-dom';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  OVERLAY_BACKDROP,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * CanvasHelpOverlay
 *
 * "How to use this canvas" - 3 steps. Shown from "?" button.
 * Simple, dismissible, first-time friendly.
 */
export default function CanvasHelpOverlay({ onClose }) {
  const steps = [
    { num: '1', title: 'Drop in your assignment', desc: 'Tap "Add docs" to upload your brief, rubric, or course outline. AURA reads it and builds your plan.' },
    { num: '2', title: 'Use Starters on the left', desc: 'AI gives you starting ideas. Accept what helps, ignore the rest. It never writes for you.' },
    { num: '3', title: 'Write in the centre. Ask AURA anything.', desc: 'Your writing goes in the editor. Tap the orb or "What should I do next?" whenever you are stuck.' },
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 24 }}
      onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="How to use this canvas"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 400, background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 12, padding: '24px 20px' }}>

        <h2 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 16px' }}>
          How to use this canvas
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {steps.map(s => (
            <div key={s.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 14, fontWeight: 700, color: ACCENT_PULSE, flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: ACCENT_GLASS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.num}
              </span>
              <div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 2px' }}>{s.title}</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ width: '100%', padding: '12px 0', borderRadius: 8, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer', minHeight: 44 }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          Got it
        </button>
      </div>
    </div>,
    document.body
  );
}
