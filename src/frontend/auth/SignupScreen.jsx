import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  COLOUR_DANGER, COLOUR_DANGER_GLASS, COLOUR_DANGER_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

const TIERS = [
  { value: 'secondary', label: 'Secondary (Year 10 to 12)' },
  { value: 'undergrad', label: 'University (Undergraduate)' },
];

export default function SignupScreen() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('undergrad');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        tier,
        display_name: displayName || null,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not create your account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={styles.root}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Account created</h2>
          <p style={styles.doneMsg}>
            You are signed in. If email confirmation is enabled, check your inbox first.
          </p>
          <button type="button" onClick={() => navigate('/login')} style={styles.button}>
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Create your account</h2>
        <p style={styles.subtitle}>Free for all learners. No credit card.</p>

        <GoogleSignInButton label="Sign up with Google" />

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with email</span>
          <span style={styles.dividerLine} />
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="signup-name" style={styles.label}>
            Display name (optional)
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={styles.input}
            placeholder="How you would like to be called"
          />

          <label htmlFor="signup-email" style={styles.label}>Email</label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
          />

          <label htmlFor="signup-password" style={styles.label}>Password</label>
          <input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="At least 6 characters"
          />

          <fieldset style={styles.fieldset}>
            <legend style={styles.label}>I am a...</legend>
            <div style={styles.tierGroup}>
              {TIERS.map((t) => (
                <label key={t.value} style={styles.tierOption}>
                  <input
                    type="radio"
                    name="tier"
                    value={t.value}
                    checked={tier === t.value}
                    onChange={() => setTier(t.value)}
                    style={styles.radio}
                  />
                  <span style={styles.tierLabel}>{t.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
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
  heading: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 20,
    color: TEXT_PRIMARY,
    margin: '0 0 4px',
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    color: TEXT_MUTED,
    margin: '0 0 20px',
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
    border: 'none',
    padding: 0,
    margin: 0,
  },
  input: inputBase,
  fieldset: {
    border: 'none',
    padding: 0,
    margin: 0,
  },
  tierGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  tierOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  radio: {
    accentColor: ACCENT_PULSE,
  },
  tierLabel: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    color: TEXT_PRIMARY,
  },
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
  doneMsg: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 1.5,
    margin: '12px 0 20px',
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
