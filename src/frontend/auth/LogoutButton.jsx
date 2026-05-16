import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { endSession } from '../../core/StudyPatternTracker';
import { saveSessionSummary } from '../../services/SessionSummaryService';
import SessionFeedbackModal from '../components/SessionFeedbackModal';
import {
  TEXT_MUTED, ACCENT_PULSE,
  FONT_SYSTEM, BORDER_RADIUS, SURFACE_RAISED, ACCENT_BORDER,
} from '../../theme/tokens';

/**
 * Small logout button for the top nav. Subtle by default.
 */
export default function LogoutButton() {
  const { signOut, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    endSession();
    // Save session summary for AURA cross-session memory
    if (user?.id) {
      saveSessionSummary({
        userId: user.id,
        sessionEndState: 'normal',
      }).catch(() => {});
    }
    try {
      await signOut();
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('[LogoutButton] signOut error (proceeding anyway):', err?.message);
    }
    // CRITICAL: Clear ALL user data to prevent data leaking to next user.
    // sessionStorage: all keys (AURA chat, queues, greeting flags)
    sessionStorage.clear();
    // localStorage: all simplifii_* and sb-* keys plus settings keys
    const keysToKeep = new Set(['simplifii_beta_banner_dismissed']);
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (keysToKeep.has(key)) continue;
      if (key.startsWith('simplifii') || key.startsWith('sb-') || key.startsWith('aura_greeted') ||
          ['gritLevel', 'scaffoldingLevel', 'lodLevel', 'persona', 'mode', 'eduLevel',
           'darkMode', 'highContrast', 'reducedMotion', 'fontScale', 'lineSpacing',
           'isBionicActive', 'bionicIntensity', 'isLiteralMode', 'isZenMode',
           'isRulerActive', 'isDriveAttached', 'overlayTint', 'isLeftCollapsed',
           'isRightCollapsed', 'gcp_access_token'].includes(key)) {
        localStorage.removeItem(key);
      }
    }
    // Full page reload resets React context, IndexedDB handles, and
    // ensures AuthProvider re-initialises with no cached session.
    window.location.replace('/login');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        disabled={busy}
        aria-label="Sign out"
        style={styles.button}
      >
        {busy ? 'Signing out...' : 'Sign out'}
      </button>
      {showFeedback && (
        <SessionFeedbackModal onDone={() => { setShowFeedback(false); handleLogout(); }} />
      )}
    </>
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
