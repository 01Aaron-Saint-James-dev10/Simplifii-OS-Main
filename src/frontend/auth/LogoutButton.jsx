import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  TEXT_MUTED, ACCENT_PULSE,
  FONT_SYSTEM, BORDER_RADIUS, SURFACE_RAISED, ACCENT_BORDER,
} from '../../theme/tokens';

/**
 * Small logout button for the top nav. Subtle by default.
 */
export default function LogoutButton() {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOut();
    } catch {
      // Auth state listener will handle the UI regardless.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      aria-label="Sign out"
      style={styles.button}
    >
      {busy ? 'Signing out...' : 'Sign out'}
    </button>
  );
}

const styles = {
  button: {
    padding: '4px 10px',
    background: 'transparent',
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS,
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    cursor: 'pointer',
  },
};
