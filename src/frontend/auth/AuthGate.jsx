import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import {
  SURFACE_BASE, TEXT_MUTED, ACCENT_PULSE,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * AuthGate: renders children only when the user is authenticated.
 * Shows LoginScreen or SignupScreen otherwise.
 */
export default function AuthGate({ children }) {
  const { isAuthenticated, loading, authError } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'signup'

  if (loading) {
    return (
      <div style={styles.loadingRoot}>
        <p style={styles.loadingText}>
          {authError === 'RETRYING' ? 'Reconnecting...' : 'Checking your sign-in...'}
        </p>
      </div>
    );
  }

  if (authError === 'CONNECTION_FAILED' && !isAuthenticated) {
    return (
      <div style={styles.loadingRoot}>
        <p style={styles.loadingText}>
          Could not reach the server. Check your connection and refresh.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (view === 'signup') {
      return <SignupScreen onSwitchToLogin={() => setView('login')} />;
    }
    return <LoginScreen onSwitchToSignup={() => setView('signup')} />;
  }

  return children;
}

const styles = {
  loadingRoot: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: SURFACE_BASE,
  },
  loadingText: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    color: TEXT_MUTED,
  },
};
