import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleSession = ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setAuthError(null);
      setLoading(false);
    };

    const handleFailure = (err, isRetry) => {
      console.error('[AuthContext] Supabase session check failed:', err);
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
