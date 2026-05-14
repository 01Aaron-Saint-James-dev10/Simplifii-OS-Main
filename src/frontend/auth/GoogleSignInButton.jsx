import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  SURFACE_RAISED, TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_BORDER, ACCENT_BORDER_STRONG,
  FONT_BODY, BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * Inline Google "G" logo as SVG. Avoids installing react-icons.
 * Colours match Google's brand guidelines.
 */
function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function GoogleSignInButton({ label = 'Continue with Google' }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    } catch {
      // OAuth redirects away from the page; errors here are rare.
      // The auth state listener in AuthContext handles the session.
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={label}
      style={styles.button}
    >
      <GoogleLogo />
      <span>{loading ? 'Redirecting...' : label}</span>
    </button>
  );
}

const styles = {
  button: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '10px 0',
    background: SURFACE_RAISED,
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS,
    color: TEXT_PRIMARY,
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: `border-${'color'} 0.15s`,
  },
};
