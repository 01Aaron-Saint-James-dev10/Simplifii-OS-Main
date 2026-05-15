import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE,
  GLASS_BORDER,
  OVERLAY_BACKDROP,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const EMOJIS = [
  { emoji: '\uD83D\uDE0A', label: 'Great' },
  { emoji: '\uD83D\uDE42', label: 'Good' },
  { emoji: '\uD83D\uDE10', label: 'Neutral' },
  { emoji: '\uD83D\uDE41', label: 'Struggling' },
  { emoji: '\uD83D\uDE1E', label: 'Rough' },
];

/**
 * SessionFeedbackModal
 *
 * Shown on sign-out. 5 emoji buttons + optional text. Skip always available.
 */
export default function SessionFeedbackModal({ onDone }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');

  const submit = async () => {
    if (user && selected) {
      try {
        await supabase.from('session_feedback').insert({
          user_id: user.id,
          emoji_rating: EMOJIS[selected].emoji,
          anything_else: text.trim() || null,
        });
      } catch { /* non-blocking */ }
    }
    onDone();
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 24, overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label="How was your session?"
        style={{ width: '100%', maxWidth: 380, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', margin: 'auto', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12, padding: '28px 24px', textAlign: 'center' }}>

        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
          How did Simplifii-OS feel today?
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: '0 0 20px' }}>
          Quick check-in. No wrong answers.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          {EMOJIS.map((e, i) => (
            <button key={i} type="button" onClick={() => setSelected(i)}
              aria-label={e.label}
              style={{
                fontSize: 28, background: 'none', border: selected === i ? `2px solid ${ACCENT_PULSE}` : '2px solid transparent',
                borderRadius: 8, padding: 6, cursor: 'pointer', opacity: selected !== null && selected !== i ? 0.4 : 1,
                transition: 'opacity 0.15s, border-color 0.15s', /* allow-style */
                minWidth: 44, minHeight: 44,
              }}>
              {e.emoji}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Anything else? (optional)"
          maxLength={500}
          style={{
            width: '100%', padding: '8px 10px', fontFamily: FONT_BODY, fontSize: 12,
            color: TEXT_PRIMARY, background: 'transparent', border: `1px solid ${GLASS_BORDER}`,
            borderRadius: BORDER_RADIUS, resize: 'vertical', minHeight: 60, outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={submit}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer' }}>
            {selected !== null ? 'Send' : 'Skip'}
          </button>
          <button type="button" onClick={onDone}
            style={{ padding: '10px 16px', borderRadius: 8, fontFamily: FONT_SYSTEM, fontSize: 12, color: TEXT_FAINT, background: 'none', border: `1px solid ${GLASS_BORDER}`, cursor: 'pointer' }}>
            Skip
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
