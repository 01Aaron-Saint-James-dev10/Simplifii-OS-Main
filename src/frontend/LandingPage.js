import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from './SettingsContext';
import { Terminal, Shield, Eye, EyeOff, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { unlockWithPassphrase } from '../core/HistoryOfThought';

/**
 * LandingPage - Stage 01: The Sovereign Handshake
 * Redesigned for Accessibility and UDL 3.0 compliance.
 * Features: Theme-aware design, clean typography, recognisable input.
 */
export default function LandingPage({ onGetStarted }) {
  const [accessCode, setAccessCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialising, setIsInitialising] = useState(false);
  const [error, setError] = useState(null);

  const { 
    lodLevel, setLodLevel, 
    isZenMode, setIsZenMode, 
    highContrast, setHighContrast,
    darkMode, setDarkMode
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

  const toggleTheme = () => {
    setDarkMode(!darkMode);
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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-primary/30 transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Top Controls: Theme Toggle + UDL Mode */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 border border-border bg-card hover:bg-muted rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <Sun size={18} className="text-muted-foreground hover:text-primary transition-colors" />
          ) : (
            <Moon size={18} className="text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        {/* UDL Mode Toggle */}
        <button
          onClick={toggleUDLMode}
          className="flex items-center gap-3 px-4 py-2.5 border border-border hover:border-primary/50 bg-card hover:bg-muted rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-pressed={isFocusModeActive}
        >
          {isFocusModeActive ? (
            <>
              <EyeOff size={14} className="text-muted-foreground group-hover:text-primary" />
              <span className="text-foreground">Focus Mode</span>
            </>
          ) : (
            <>
              <Eye size={14} className="text-muted-foreground group-hover:text-primary" />
              <span className="text-foreground">Clarity Mode</span>
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
              className="inline-block p-4 border border-border mb-8 bg-card rounded-xl shadow-lg"
            >
              <Terminal size={40} className="text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">
              Simplifii-OS
            </h1>
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">
              Sovereign Handshake
            </p>
          </header>

          <form onSubmit={handleInitialise} className="relative">
            <div className="mb-4">
              <label htmlFor="passphrase" className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                  className="w-full bg-card border border-border rounded-lg px-4 py-4 text-foreground placeholder:text-muted-foreground font-mono text-sm transition-all duration-200 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                  autoFocus
                  disabled={isInitialising}
                />
                
                {/* The Siltbrand Handshake: Perimeter Pulse */}
                <AnimatePresence>
                  {isFocused && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.6, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute -inset-[3px] border-2 border-primary rounded-lg pointer-events-none -z-10"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-4 flex items-center gap-2 text-destructive text-[11px] font-medium bg-destructive/10 px-3 py-2 rounded-lg"
                role="alert"
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
              className="w-full mt-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
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
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {isInitialising ? 'Decrypting Local Spine...' : 'System Status: Awaiting Authorisation'}
            </p>
          </div>
        </div>
      </main>

      {/* Zero-Disclosure Banner (Pinned Footer) */}
      <footer className="w-full border-t border-border py-6 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center bg-card gap-4">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Shield size={18} className="text-primary" />
          <span className="text-[11px] font-medium">
            Zero-Disclosure: Local processing only. No data leaves this device.
          </span>
        </div>
        <div className="flex items-center gap-6 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          <span>AU-EN Protocol</span>
          <span>Sovereign v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
