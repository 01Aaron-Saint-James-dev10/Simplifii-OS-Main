import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from './SettingsContext';
import { Terminal, Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { unlockWithPassphrase } from '../core/HistoryOfThought';

/**
 * LandingPage - Stage 01: The Sovereign Handshake
 * Redesigned for Accessibility and UDL 3.0 compliance.
 * Features: High contrast light theme, clean typography, recognisable input.
 */
export default function LandingPage({ onGetStarted }) {
  const [accessCode, setAccessCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialising, setIsInitialising] = useState(false);
  const [error, setError] = useState(null);

  const { 
    lodLevel, setLodLevel, 
    isZenMode, setIsZenMode, 
    highContrast, setHighContrast 
  } = useSettings();

  // Focus Mode vs Clarity Mode (UDL 3.0 Override - Guideline 7.1)
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

  const handleInitialise = async (e) => {
    e.preventDefault();
    setError(null);

    if (accessCode.trim().length < 4) {
      setError('Passphrase must be at least 4 characters.');
      return;
    }

    setIsInitialising(true);
    try {
      await unlockWithPassphrase(accessCode.trim());
      onGetStarted();
    } catch (err) {
      console.error('[Handshake] Initialisation failed:', err);
      setError('Vault initialisation failed. Check system console.');
    } finally {
      setIsInitialising(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col selection:bg-emerald-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* UDL 3.0 Override Toggle */}
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
        <div className="w-full max-w-sm">
          <header className="mb-12 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block p-4 border border-zinc-200 mb-8 bg-white shadow-sm"
            >
              <Terminal size={40} className="text-emerald-600" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 text-zinc-900">
              Simplifii-OS
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">
              Sovereign Handshake
            </p>
          </header>

          <form onSubmit={handleInitialise} className="relative">
            <div className="mb-4">
              <label htmlFor="passphrase" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Vault Passphrase
              </label>
              <div className="relative">
                <input
                  id="passphrase"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter access code..."
                  className="w-full bg-white border border-zinc-300 rounded-md px-4 py-4 text-zinc-900 placeholder:text-zinc-400 font-mono text-sm transition-colors shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-emerald-500"
                  autoFocus
                  disabled={isInitialising}
                />
                
                {/* The Siltbrand Handshake: Perimeter Pulse */}
                <AnimatePresence>
                  {isFocused && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.5, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute -inset-[2px] border border-emerald-500 rounded-md pointer-events-none -z-10"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-4 flex items-center gap-2 text-red-600 text-[11px] font-medium"
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={accessCode.trim().length < 4 || isInitialising}
              className="w-full mt-6 py-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wide rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              {isInitialising ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Initialising Vault...</span>
                </>
              ) : (
                'Enter Gateway'
              )}
            </motion.button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              {isInitialising ? 'Decrypting Local Spine...' : 'System Status: Awaiting Authorisation'}
            </p>
          </div>
        </div>
      </main>

      {/* Zero-Disclosure Banner (Pinned Footer) */}
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
