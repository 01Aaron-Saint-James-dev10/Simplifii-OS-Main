import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import GoogleSignInButton from './GoogleSignInButton';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_HOVER, ACCENT_BORDER, ACCENT_FOCUS,
  COLOUR_DANGER, COLOUR_DANGER_GLASS, COLOUR_DANGER_BORDER,
  OVERLAY_BACKDROP,
  FONT_BODY, FONT_SYSTEM, FOCUS_RING,
  BORDER_RADIUS,
} from '../../theme/tokens';

const TAB_PASSWORD = 'password';
const TAB_MAGIC = 'magic';

export default function LoginScreen() {
  const { signInWithPassword, signInWithOtp } = useAuth();
  const [activeTab, setActiveTab] = useState(TAB_PASSWORD);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem('simplifii_remember_me') !== 'false'; } catch { return true; }
  });

  // Persist remember-me choice and set up session cleanup if unchecked
  const applyRememberMe = (checked) => {
    try { localStorage.setItem('simplifii_remember_me', String(checked)); } catch {}
    if (!checked) {
      // Clear auth on tab/browser close so session does not persist
      const cleanup = () => { supabase.auth.signOut().catch(() => {}); };
      window.addEventListener('beforeunload', cleanup, { once: true });
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      applyRememberMe(rememberMe);
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetError('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetErr) throw resetErr;
      setResetSent(true);
    } catch (err) {
      setResetError(err.message || 'Could not send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithOtp(email);
      setMagicSent(true);
      applyRememberMe(rememberMe);
    } catch (err) {
      setError(err.message || 'Could not send the magic link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span>
          <span style={styles.title}>Simplifii-OS</span>
        </div>
        <p style={styles.subtitle}>Sign in to continue</p>

        <GoogleSignInButton />

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with email</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Tabs */}
        <div style={styles.tabs} role="tablist" aria-label="Sign in method">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_PASSWORD}
            onClick={() => { setActiveTab(TAB_PASSWORD); setError(''); setMagicSent(false); }}
            style={activeTab === TAB_PASSWORD ? styles.tabActive : styles.tab}
          >
            Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_MAGIC}
            onClick={() => { setActiveTab(TAB_MAGIC); setError(''); }}
            style={activeTab === TAB_MAGIC ? styles.tabActive : styles.tab}
          >
            Email sign-in
          </button>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            {error}
          </div>
        )}

        {activeTab === TAB_PASSWORD && (
          <form onSubmit={handlePasswordLogin} style={styles.form}>
            <label htmlFor="login-email" style={styles.label}>Email</label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
            <label htmlFor="login-password" style={styles.label}>Password</label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Your password"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: ACCENT_PULSE, cursor: 'pointer' }}
              />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED }}>
                Remember me on this device (30 days)
              </span>
            </label>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button type="button" onClick={() => setShowForgot(true)}
              style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: '8px 0', marginTop: 4 }}>
              Forgot your password?
            </button>
          </form>
        )}

        {activeTab === TAB_MAGIC && (
          <form onSubmit={handleMagicLink} style={styles.form}>
            {magicSent ? (
              <div style={styles.successMsg}>
                <p style={{ margin: '0 0 8px' }}>Check your inbox. We sent a sign-in link to <strong>{email}</strong>.</p>
                <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>The link arrives in about a minute. Click it to sign in. Check spam if you do not see it. Link expires in 1 hour.</p>
              </div>
            ) : (
              <>
                <label htmlFor="magic-email" style={styles.label}>Email</label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                />
                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </>
            )}
          </form>
        )}

        <p style={styles.switchText}>
          No account yet?{' '}
          <Link to="/signup" style={styles.link}>
            Create one
          </Link>
        </p>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 16 }}
          onClick={() => setShowForgot(false)}>
          <div role="dialog" aria-modal="true" aria-label="Reset password"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 400, background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 12, padding: '28px 24px', position: 'relative' }}>
            <button type="button" onClick={() => setShowForgot(false)} aria-label="Close"
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, fontSize: 18, lineHeight: 1, padding: 4 }}>{'\u2715'}</button>
            <h2 style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Reset your password</h2>
            {resetSent ? (
              <div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6 }}>
                  Check your inbox. We sent a password reset link to <strong>{resetEmail}</strong>.
                </p>
                <button type="button" onClick={() => { setShowForgot(false); setResetSent(false); }}
                  style={{ ...styles.button, marginTop: 16 }}>Back to sign in</button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: '0 0 16px' }}>
                  Enter your email and we will send you a link to reset your password.
                </p>
                {resetError && <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_DANGER, margin: '0 0 8px' }}>{resetError}</p>}
                <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="you@example.com" style={styles.input} />
                <button type="submit" disabled={loading} style={{ ...styles.button, marginTop: 12 }}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputBase = {
  width: '100%',
  padding: '10px 12px',
  background: SURFACE_RAISED,
  border: `1px solid ${ACCENT_BORDER}`,
  borderRadius: BORDER_RADIUS,
  color: TEXT_PRIMARY,
  fontFamily: FONT_BODY,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: SURFACE_BASE,
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: SURFACE_CARD,
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS + 2,
    padding: '32px 28px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS,
    background: ACCENT_PULSE,
    color: SURFACE_BASE,
    fontFamily: FONT_SYSTEM,
    fontWeight: 800,
    fontSize: 16,
  },
  title: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 20,
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    color: TEXT_MUTED,
    margin: '8px 0 20px',
  },
  tabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 16,
    borderBottom: `1px solid ${SURFACE_RAISED}`,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: TEXT_MUTED,
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  tabActive: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${ACCENT_PULSE}`,
    color: ACCENT_PULSE,
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: TEXT_FAINT,
  },
  input: inputBase,
  button: {
    width: '100%',
    padding: '10px 0',
    background: ACCENT_PULSE,
    border: 'none',
    borderRadius: BORDER_RADIUS,
    color: SURFACE_BASE,
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  errorBox: {
    padding: '8px 12px',
    background: COLOUR_DANGER_GLASS,
    border: `1px solid ${COLOUR_DANGER_BORDER}`,
    borderRadius: BORDER_RADIUS,
    color: COLOUR_DANGER,
    fontFamily: FONT_BODY,
    fontSize: 13,
    marginBottom: 12,
  },
  successMsg: {
    color: ACCENT_PULSE,
    fontFamily: FONT_BODY,
    fontSize: 14,
    lineHeight: 1.5,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '18px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: SURFACE_RAISED,
  },
  dividerText: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: TEXT_FAINT,
    whiteSpace: 'nowrap',
  },
  switchText: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: FONT_BODY,
    fontSize: 13,
    color: TEXT_MUTED,
  },
  link: {
    background: 'none',
    border: 'none',
    color: ACCENT_PULSE,
    fontFamily: FONT_BODY,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
};
