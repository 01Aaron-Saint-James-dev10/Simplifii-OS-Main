import React, { useEffect, useRef, useState } from 'react';
import { Shield, ArrowRight, Loader2, Lock } from 'lucide-react';
import { unlockWithPassphrase, isUnlocked } from '../core/HistoryOfThought';
import { useSettings } from './SettingsContext';

/**
 * LandingPage  -  Stage 01: The Sovereign Handshake
 *
 * High-contrast light-theme gateway per SIMPLIFII_ARCHITECTURE.md.
 * Single 4-character passphrase decrypts the local HistoryOfThought
 * AES-GCM-256 vault. No Google auth. No cloud sync. No telemetry.
 *
 * Visual contract:
 *   - Zinc-50 background, zinc-900 text, white card surface
 *   - JetBrains Mono on the passphrase field and the footer banner
 *     (terminal cue without committing the whole gateway to dark)
 *   - Center-aligned single-column frame
 *   - Siltbrand Pulse: 1px emerald-500 perimeter ring on input focus
 *   - UDL Toggle: Focus Mode (Compass LOD) vs Clarity Mode (Map LOD),
 *     persisted via SettingsContext.lodLevel
 *   - Pinned Zero-Disclosure banner in the footer
 *
 * Mechanics:
 *   1. Student types a passphrase (min 4 chars).
 *   2. unlockWithPassphrase derives the AES-GCM key via PBKDF2 600k.
 *   3. On success, onGetStarted advances the app into the dashboard.
 *   4. Skip path lands the cockpit in Ghost Mode without unlocking.
 *      The NOT VERIFIED badge in MasterDashboard reminds the student
 *      that nothing is being recorded.
 */

const MONO_STACK = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

export default function LandingPage({ onGetStarted }) {
  const { lodLevel, setLodLevel } = useSettings();
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isUnlocked()) {
      onGetStarted?.();
    }
  }, [onGetStarted]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleUnlock = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (busy) return;
    const value = (passphrase || '').trim();
    if (value.length < 4) {
      setError('Passphrase must be at least 4 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await unlockWithPassphrase(value);
      onGetStarted?.();
    } catch (err) {
      setError(err && err.message ? err.message : 'Could not unlock the vault. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    try { window.localStorage.setItem('simplifii_vault_ghost', 'true'); } catch { /* storage unavailable */ }
    onGetStarted?.();
  };

  const focusMode = lodLevel === 'compass';
  const setFocusMode = () => setLodLevel('compass');
  const setClarityMode = () => setLodLevel('map');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        color: '#18181b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative'
      }}
    >
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#10b981', marginBottom: 12, fontFamily: MONO_STACK }}>
            Simplifii-OS  ·  Sovereign Handshake
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#18181b' }}>
            Initialise the Vault
          </h1>
          <p style={{ fontSize: 13, color: '#52525b', marginTop: 12, lineHeight: 1.55 }}>
            Enter your passphrase to decrypt the local History of Thought vault. Everything stays on this device. No cloud, no telemetry, no account required.
          </p>
        </header>

        <form
          onSubmit={handleUnlock}
          aria-label="Sovereign Handshake passphrase form"
          style={{
            padding: 24,
            borderRadius: 14,
            background: '#ffffff',
            border: focused ? '1px solid #10b981' : '1px solid #e4e4e7',
            boxShadow: focused
              ? '0 0 0 1px #10b981, 0 0 24px rgba(16, 185, 129, 0.18)'
              : '0 1px 0 rgba(0,0,0,0.04)',
            transition: 'all 220ms ease'
          }}
        >
          <label
            htmlFor="handshake-passphrase"
            style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#71717a', marginBottom: 10, fontFamily: MONO_STACK }}
          >
            Passphrase  ·  4 characters minimum
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={14}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused ? '#10b981' : '#a1a1aa', transition: 'all 220ms ease' }}
              aria-hidden="true"
            />
            <input
              id="handshake-passphrase"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); if (error) setError(''); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={busy}
              spellCheck={false}
              style={{
                width: '100%',
                padding: '14px 14px 14px 36px',
                borderRadius: 10,
                border: '1px solid #e4e4e7',
                background: '#fafafa',
                color: '#18181b',
                fontFamily: MONO_STACK,
                fontSize: 14,
                letterSpacing: '0.18em',
                outline: 'none',
                transition: 'all 220ms ease'
              }}
            />
          </div>
          {error && (
            <div role="alert" style={{ marginTop: 10, fontSize: 11, color: '#be123c', fontWeight: 600 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || passphrase.trim().length < 4}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '14px 18px',
              borderRadius: 10,
              border: 'none',
              background: busy ? '#a7f3d0' : '#10b981',
              color: '#052e1f',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              cursor: busy || passphrase.trim().length < 4 ? 'not-allowed' : 'pointer',
              opacity: passphrase.trim().length < 4 ? 0.45 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 200ms ease'
            }}
            aria-label="Unlock the History of Thought vault"
          >
            {busy
              ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Decrypting</>
              : <>Initiate Handshake <ArrowRight size={14} aria-hidden="true" /></>}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e4e4e7',
              background: 'transparent',
              color: '#52525b',
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
            aria-label="Skip the Handshake and enter Ghost Mode"
            title="Continue without the vault. No History of Thought will be recorded this session."
          >
            Skip  ·  Enter Ghost Mode
          </button>
        </form>

        <section
          aria-label="UDL Toggle"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            padding: 10,
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: 12
          }}
        >
          <div style={{ gridColumn: '1 / span 2', fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#71717a', marginBottom: 4, fontFamily: MONO_STACK }}>
            UDL Toggle  ·  Level of Detail
          </div>
          <button
            type="button"
            role="radio"
            aria-checked={focusMode}
            onClick={setFocusMode}
            style={{
              padding: '10px 8px',
              borderRadius: 8,
              border: 'none',
              background: focusMode ? '#10b981' : 'transparent',
              color: focusMode ? '#052e1f' : '#3f3f46',
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Focus Mode (Compass)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!focusMode}
            onClick={setClarityMode}
            style={{
              padding: '10px 8px',
              borderRadius: 8,
              border: 'none',
              background: !focusMode ? '#10b981' : 'transparent',
              color: !focusMode ? '#052e1f' : '#3f3f46',
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Clarity Mode (Map)
          </button>
        </section>
      </div>

      <footer
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 24px',
          borderTop: '1px solid #e4e4e7',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#71717a',
          fontFamily: MONO_STACK
        }}
      >
        <Shield size={11} color="#10b981" aria-hidden="true" />
        <span>Zero-Disclosure  ·  Local-First  ·  AES-GCM-256  ·  PBKDF2 600k</span>
      </footer>
    </div>
  );
}
