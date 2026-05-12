import React, { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useSettings } from './SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { unlockWithUserId, enableCloudSync } from '../core/HistoryOfThought';
import NeuroProfiler from './NeuroProfiler';
import { COLOUR_WARN, COLOUR_WARN_GLASS, COLOUR_WARN_BORDER, COLOUR_WARN_BORDER_STRONG, FONT_SYSTEM, BORDER_RADIUS, ACCENT_GLOW_60, ACCENT_BORDER, SURFACE_CARD_GLASS, ACCENT_FOCUS, WHITE_TINT_FAINT, OVERLAY_HEAVY, COLOUR_DANGER_GLASS, COLOUR_DANGER_BORDER, ACCENT_GLASS_FAINT } from '../theme/tokens';

// ============================================================
// Injected styles: cursor blink + JetBrains Mono import
// ============================================================

const INJECTED_CSS = `
@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.smf-cursor {
  animation: cursor-blink 0.9s step-end infinite;
  text-shadow: 0 0 18px ${ACCENT_GLOW_60}, 0 0 40px ${ACCENT_BORDER};
  color: #10b981;
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1;
  display: inline-block;
}

.smf-mono {
  font-family: 'JetBrains Mono', monospace;
}

.smf-glass-btn {
  background: ${SURFACE_CARD_GLASS};
  border: 1px solid #27272a;
  color: #71717a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  cursor: pointer;
  border-radius: 3px;
  transition: border-color 0.15s, color 0.15s;
  outline: none;
}

.smf-glass-btn:hover,
.smf-glass-btn:focus-visible {
  border-color: #10b981;
  color: #10b981;
}

.smf-glass-btn:focus-visible {
  box-shadow: 0 0 0 2px ${ACCENT_FOCUS};
}
`;

// ============================================================
// GoogleAuthGate: memoised so it never remounts when parent
// state changes (e.g. error text updating). StrictMode double-
// invokes effects but a stable component prevents GoogleLogin
// from calling renderButton() more than once per true mount.
// ============================================================

const GoogleAuthGate = memo(function GoogleAuthGate({ onSuccess, onError }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4,
      }}>
        <div style={{ flex: 1, height: 1, background: '#27272a' }} />
        <span className="smf-mono" style={{ fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em' }}>
          AUTHORISE
        </span>
        <div style={{ flex: 1, height: 1, background: '#27272a' }} />
      </div>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        size="large"
        shape="rectangular"
        theme="filled_black"
        text="signin_with"
        auto_select={false}
        use_fedcm_for_prompt={false}
      />
      <p className="smf-mono" style={{
        fontSize: 10, color: '#52525b', textAlign: 'center',
        lineHeight: 1.6, letterSpacing: '0.04em', margin: 0,
      }}>
        {'>'} Your data stays on this device.<br />
        Zero disclosure to institutions.
      </p>
    </div>
  );
});

// ============================================================
// LandingPage
// ============================================================

export default function LandingPage({ onGetStarted }) {
  const [error, setError] = useState(null);
  const { signInWithIdToken, isAuthenticated, user, loading: authLoading, authError } = useAuth();
  const { lodLevel, setLodLevel, isZenMode, setIsZenMode, highContrast, setHighContrast } = useSettings();

  const isFocusModeActive = isZenMode && lodLevel === 'compass';

  const toggleUDLMode = () => {
    if (isFocusModeActive) {
      setLodLevel('map');
      setIsZenMode(false);
      setHighContrast(true);
    } else {
      setLodLevel('compass');
      setIsZenMode(true);
      setHighContrast(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    setError(null);
    // Purge stale session keys so the NeuroProfiler always starts clean.
    // Does not touch the encrypted vault or the neuro profile itself.
    try {
      sessionStorage.clear();
      localStorage.removeItem('simplifii_activeCourseId');
      localStorage.removeItem('simplifii_view');
    } catch { /* storage unavailable */ }
    try {
      await signInWithIdToken(credentialResponse.credential);
    } catch (err) {
      console.error('[Landing] Google sign-in error:', err);
      setError('Google sign-in failed. Check console.');
    }
  }, [signInWithIdToken]);

  const handleProfileComplete = async (profile) => {
    setError(null);
    try {
      try {
        localStorage.setItem('simplifii_neuro_profile', JSON.stringify(profile));
      } catch { /* storage unavailable */ }
      if (user?.id) {
        await unlockWithUserId(user.id);
        enableCloudSync(user.id);
      }
      onGetStarted();
    } catch (err) {
      console.error('[NeuroProfiler] Vault unlock failed:', err);
      setError('Could not initialise vault. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, ${ACCENT_GLASS_FAINT} 0%, transparent 60%),
        #09090b
      `,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      color: '#e4e4e7',
      position: 'relative',
    }}>
      <style>{INJECTED_CSS}</style>

      {/* UDL Mode toggle: top-right */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}>
        <button
          onClick={toggleUDLMode}
          className="smf-glass-btn"
          aria-label={isFocusModeActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}
        >
          {isFocusModeActive
            ? <><EyeOff size={12} /> Focus Mode Active</>
            : <><Eye size={12} /> Clarity Mode</>
          }
        </button>
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          {/* Glass Gate card */}
          <div style={{
            background: SURFACE_CARD_GLASS,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid #27272a',
            borderRadius: 4,
            boxShadow: `0 0 0 1px ${WHITE_TINT_FAINT} inset, 0 24px 48px ${OVERLAY_HEAVY}`,
            padding: '40px 36px',
          }}>

            {/* Brand header: auth gate only */}
            {!isAuthenticated && (
              <header style={{ marginBottom: 32, textAlign: 'center' }}>
                <div style={{ marginBottom: 20 }}>
                  <span className="smf-cursor" aria-hidden="true">_</span>
                </div>
                <p className="smf-mono" style={{
                  fontSize: 13, letterSpacing: '0.38em', textTransform: 'uppercase',
                  color: '#a1a1aa', margin: '0 0 6px',
                }}>
                  Simplifii-OS
                </p>
                <p className="smf-mono" style={{
                  fontSize: 10, letterSpacing: '0.2em', color: '#52525b', margin: 0,
                }}>
                  {'>'} Sovereign Handshake
                </p>
              </header>
            )}

            {/* Auth loading */}
            {authLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
                <span className="smf-mono" style={{ fontSize: 10, color: '#52525b', letterSpacing: '0.15em' }}>
                  AUTHENTICATING...
                </span>
              </div>
            )}

            {/* Connection error: Supabase unreachable after one silent retry */}
            {!authLoading && authError === 'CONNECTION_FAILED' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  background: COLOUR_WARN_GLASS,
                  border: `1px solid ${COLOUR_WARN_BORDER}`,
                  borderRadius: BORDER_RADIUS, padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={13} style={{ color: COLOUR_WARN, flexShrink: 0 }} />
                  <span className="smf-mono" style={{
                    fontSize: 10, color: COLOUR_WARN, letterSpacing: '0.04em',
                  }}>
                    Connection issue. Reload to retry.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: FONT_SYSTEM,
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    background: 'none', color: COLOUR_WARN,
                    border: `1px solid ${COLOUR_WARN_BORDER_STRONG}`,
                    borderRadius: BORDER_RADIUS, padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={11} /> Reload
                </button>
              </motion.div>
            )}

            {/* Google OAuth gate: rendered via memoised component to prevent
                GoogleLogin remounting on parent state changes (error text etc).
                Stable identity stops the library calling initialize() more than once. */}
            {!authLoading && !isAuthenticated && authError !== 'CONNECTION_FAILED' && (
              <GoogleAuthGate
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed.')}
              />
            )}

            {/* NeuroProfiler: mounts immediately after auth confirms */}
            {!authLoading && isAuthenticated && (
              <NeuroProfiler
                onComplete={handleProfileComplete}
                userName={user?.user_metadata?.full_name || user?.email}
              />
            )}

            {/* Error surface */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  marginTop: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: COLOUR_DANGER_GLASS,
                  border: `1px solid ${COLOUR_DANGER_BORDER}`,
                  borderRadius: 3, padding: '8px 12px',
                }}
              >
                <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span className="smf-mono" style={{ fontSize: 10, color: '#f87171', letterSpacing: '0.04em' }}>
                  {error}
                </span>
              </motion.div>
            )}

            {/* System status line */}
            {!isAuthenticated && !authLoading && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <p className="smf-mono" style={{
                  fontSize: 9,
                  color: authError === 'CONNECTION_FAILED' ? COLOUR_WARN : '#3f3f46',
                  letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0,
                }}>
                  {authError === 'CONNECTION_FAILED' ? 'Status: Connection Failed' : 'Status: Awaiting Authorisation'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{
        width: '100%',
        borderTop: '1px solid #18181b',
        padding: '14px 24px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <span className="smf-mono" style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.15em' }}>
          [ SYSTEM // LOCAL_VAULT_ENCRYPTED ]
        </span>
        <span className="smf-mono" style={{ fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em' }}>
          AU-EN // SOVEREIGN v1.0.0
        </span>
      </footer>
    </div>
  );
}
