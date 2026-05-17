import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_BORDER,
  COLOUR_DANGER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * EmailCapture
 *
 * Inline waitlist signup form. Inserts into public.waitlist table.
 * Props:
 *   source - string (tracking where the form appeared)
 */
export default function EmailCapture({ source = 'organic' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase(), source });

    if (error) {
      if (error.code === '23505') {
        setErrorMsg('Already registered.');
      } else {
        setErrorMsg('Something went wrong. Try again.');
      }
      setStatus('error');
    } else {
      setStatus('success');
    }
  };

  if (status === 'success') {
    return (
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: ACCENT_PULSE, margin: 0 }}>
        You are on the list.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-label="Email for waitlist"
        style={{
          minHeight: 44,
          padding: '8px 12px',
          background: SURFACE_RAISED,
          border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: BORDER_RADIUS,
          color: TEXT_PRIMARY,
          fontFamily: FONT_BODY,
          fontSize: 13,
          outline: 'none',
          flex: '1 1 180px',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          minHeight: 44,
          padding: '8px 16px',
          background: ACCENT_PULSE,
          border: 'none',
          borderRadius: BORDER_RADIUS,
          color: SURFACE_BASE,
          fontFamily: FONT_SYSTEM,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}
      >
        {status === 'loading' ? 'Joining...' : 'Join waitlist'}
      </button>
      {errorMsg && (
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_DANGER, width: '100%' }}>
          {errorMsg}
        </span>
      )}
    </form>
  );
}
