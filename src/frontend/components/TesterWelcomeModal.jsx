import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS,
  GLASS_BORDER,
  OVERLAY_BACKDROP,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const STEPS = [
  { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', title: 'Upload an assessment', desc: 'Drop in a brief, syllabus, or course outline. We will extract your assessments and due dates.' },
  { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', title: 'Ask the tutor', desc: 'Click the Tutor panel in the editor. It asks you questions to sharpen your thinking. It will not write for you.' },
  { icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-11a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z', title: 'Try voice input', desc: 'Click the mic button in the editor. Speak your thoughts. Works best in Chrome.' },
];

/**
 * TesterWelcomeModal
 *
 * Shown once on first login for secondary-tier users.
 * Persists dismissal to profiles.has_seen_tester_welcome.
 */
export default function TesterWelcomeModal({ onDismiss }) {
  const { user } = useAuth();
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') handleDismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleDismiss = async () => {
    if (user) {
      try {
        await supabase.from('profiles').update({ has_seen_tester_welcome: true }).eq('id', user.id);
      } catch { /* network error, non-blocking */ }
    }
    onDismiss();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 16 }}
      onClick={handleDismiss}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Simplifii-OS beta"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
          background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`,
          borderRadius: 12, padding: '32px 28px', outline: 'none',
        }}
      >
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 8px' }}>
          Beta tester
        </p>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, color: TEXT_PRIMARY, margin: '0 0 8px' }}>
          Welcome to Simplifii-OS
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: TEXT_MUTED, margin: '0 0 24px' }}>
          {"You're one of the first to test this. Here are three things to try:"}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 14px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS + 4 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, background: ACCENT_GLASS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 2px' }}>
                  {i + 1}. {s.title}
                </p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, lineHeight: 1.5, margin: '20px 0 0' }}>
          Found a bug or have an idea? Tap the green feedback button in the bottom-right corner. Every message is read.
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 8,
            fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
            background: ACCENT_PULSE, border: 'none', color: '#09090b',
            cursor: 'pointer', minHeight: 44,
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {"Let's go"}
        </button>
      </div>
    </div>
  );
}
