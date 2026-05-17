import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createLogger } from '../utils/logger';

const log = createLogger('AuthContext');

const AuthContext = createContext();

// Test mode: bypass auth for Playwright regression tests.
// SAFETY: requires BOTH REACT_APP_TEST_MODE=true AND non-production NODE_ENV.
// Vercel production builds always set NODE_ENV=production, so this is dead code in prod.
const IS_TEST_MODE =
  process.env.REACT_APP_TEST_MODE === 'true' &&
  process.env.NODE_ENV !== 'production';

const TEST_USER = IS_TEST_MODE ? {
  id: process.env.REACT_APP_TEST_USER_ID || 'test-user-00000000-0000-0000-0000-000000000001',
  email: process.env.REACT_APP_TEST_USER_EMAIL || 'qa@simplifii-test.com',
  app_metadata: { provider: 'test' },
  user_metadata: { display_name: 'QA Tester' },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
} : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(IS_TEST_MODE ? TEST_USER : null);
  const [session, setSession] = useState(IS_TEST_MODE ? { user: TEST_USER, access_token: 'test-token' } : null);
  const [loading, setLoading] = useState(!IS_TEST_MODE);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // In test mode, skip all Supabase auth. User is already set.
    if (IS_TEST_MODE) {
      log.info('TEST MODE ACTIVE: using mock user', TEST_USER.email);
      return;
    }

    const handleSession = ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setAuthError(null);
      setLoading(false);
    };

    const handleFailure = (err, isRetry) => {
      log.error('Supabase session check failed:', err);
      if (!isRetry) {
        setAuthError('RETRYING');
        setTimeout(() => {
          supabase.auth.getSession()
            .then(handleSession)
            .catch((retryErr) => handleFailure(retryErr, true));
        }, 3000);
      } else {
        setUser(null);
        setAuthError('CONNECTION_FAILED');
        setLoading(false);
      }
    };

    supabase.auth.getSession()
      .then(handleSession)
      .catch((err) => handleFailure(err, false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signInWithIdToken = async (googleCredential) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: googleCredential
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  };

  const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signInWithOtp = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (IS_TEST_MODE) { log.info('TEST MODE: signOut is a no-op'); return; }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated: !!user,
      authError,
      signInWithIdToken,
      signUp,
      signInWithPassword,
      signInWithOtp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
