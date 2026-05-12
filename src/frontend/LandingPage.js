import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useSettings } from './SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { unlockWithUserId, enableCloudSync } from '../core/HistoryOfThought';
import NeuroProfiler from './NeuroProfiler';

export default function LandingPage({ onGetStarted }) {
  const [error, setError] = useState(null);
  const { signInWithIdToken, isAuthenticated, user, loading: authLoading } = useAuth();
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

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    try {
      await signInWithIdToken(credentialResponse.credential);
    } catch (err) {
      console.error('[Landing] Google sign-in error:', err);
      setError('Google sign-in failed. Check console.');
    }
  };

  // Called by NeuroProfiler when the learner completes all 4 steps.
  // Stores the profile for useProject to hydrate on mount, seeds the vault
  // from the Google user ID (no passphrase required), enables cloud sync,
  // then hands off to the main OS.
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col selection:bg-emerald-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleUDLMode}
          className="flex items-center gap-3 px-4 py-2 border border-zinc-300 hover:border-zinc-400 bg-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all group focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          {isFocusModeActive ? (
            <>
              <EyeOff size={14} className="text-zinc-400 group-hover:text-emerald-600" />
              <span>Focus Mode Active</span>
            </>
          ) : (
            <>
              <Eye size={14} className="text-zinc-400 group-hover:text-emerald-600" />
              <span>Clarity Mode Active</span>
            </>
          )}
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Brand header: visible on auth gate only; hidden once profiler starts */}
          {!isAuthenticated && (
            <header className="mb-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block p-4 border border-zinc-200 mb-8 bg-white shadow-sm"
              >
                <Terminal size={40} className="text-emerald-600" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2 text-zinc-900">Simplifii-OS</h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">
                Sovereign Handshake
              </p>
            </header>
          )}

          {/* Auth loading */}
          {authLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
            </div>
          )}

          {/* Google OAuth gate */}
          {!authLoading && !isAuthenticated && (
            <div className="flex flex-col items-center gap-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed.')}
                size="large"
                shape="rectangular"
                theme="outline"
                text="signin_with"
              />
              <p className="text-[11px] text-zinc-400 text-center">
                Your data stays on this device. Zero disclosure to institutions.
              </p>
            </div>
          )}

          {/* NeuroProfiler: renders immediately after Google auth confirms */}
          {!authLoading && isAuthenticated && (
            <NeuroProfiler
              onComplete={handleProfileComplete}
              userName={user?.user_metadata?.full_name || user?.email}
            />
          )}

          {/* Error surface */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-6 flex items-center gap-2 text-red-600 text-[11px] font-medium justify-center"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Status line: only shown on the auth gate */}
          {!isAuthenticated && !authLoading && (
            <div className="mt-10 text-center">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                System Status: Awaiting Authorisation
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full border-t border-zinc-200 py-6 px-10 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
        <div className="flex items-center gap-4 text-zinc-600">
          <Shield size={16} className="text-emerald-600" />
          <span className="text-[11px] font-medium">
            Zero-Disclosure: Local processing only. No data leaves this device.
          </span>
        </div>
        <div className="flex items-center gap-6 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          <span>AU-EN Protocol</span>
          <span>Sovereign v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
