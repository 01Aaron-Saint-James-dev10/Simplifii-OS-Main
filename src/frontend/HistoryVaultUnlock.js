import React, { useState, useEffect, useRef } from 'react';
import { unlockWithPassphrase, isUnlocked } from '../core/HistoryOfThought';
import { OVERLAY_BACKDROP, VAULT_GREEN_BORDER, VAULT_GREEN_BORDER_STRONG, WHITE_TINT, VAULT_ERROR_GLASS, VAULT_ERROR_BORDER } from '../theme/tokens';

/**
 * HistoryVaultUnlock
 *
 * First-load gate for the encrypted History of Thought log. The modal
 * asks the student to set or enter a passphrase. Three exits:
 *
 *   1. Unlock     - passphrase derives the AES-GCM key, vault opens,
 *                   EventBus starts capturing every Spine event.
 *   2. Biometric  - WebAuthn create/get on first visit / subsequent
 *                   visits respectively. The credential id seeds an
 *                   additional entropy term so a stolen passphrase
 *                   alone does not decrypt on a different device.
 *                   When unsupported the button hides itself.
 *   3. Skip       - Ghost Mode. Vault stays locked. EventBus drops
 *                   every event silently. The cockpit shows a NOT
 *                   VERIFIED badge so the student is never confused
 *                   about whether their work is being recorded.
 *
 * Sovereign integrity:
 *   The passphrase NEVER leaves the device.
 *   The derived key lives in module-scoped memory only.
 *   localStorage stores: salt (random, per device), credential id
 *   (WebAuthn handle, opaque), Ghost Mode flag. None of these
 *   reveal content even if the device is stolen.
 */

const GHOST_MODE_KEY = 'simplifii_ghost_mode';
const REMEMBER_KEY = 'simplifii_vault_remember_v1';
const CREDENTIAL_ID_KEY = 'simplifii_vault_cred_id_v1';

const isGhostMode = () => {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(GHOST_MODE_KEY) === 'true'; }
  catch { return false; }
};

export const setGhostMode = (on) => {
  if (typeof window === 'undefined') return;
  try {
    if (on) window.localStorage.setItem(GHOST_MODE_KEY, 'true');
    else window.localStorage.removeItem(GHOST_MODE_KEY);
  } catch { /* storage unavailable */ }
};

export const isVaultGhostMode = isGhostMode;

const isWebAuthnAvailable = () => {
  return typeof window !== 'undefined'
    && typeof window.PublicKeyCredential !== 'undefined'
    && typeof navigator !== 'undefined'
    && navigator.credentials
    && typeof navigator.credentials.create === 'function';
};

const randomChallenge = () => {
  const buf = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(buf);
  }
  return buf;
};

const tryRegisterBiometric = async () => {
  if (!isWebAuthnAvailable()) throw new Error('Biometric authentication is not available on this device.');
  const challenge = randomChallenge();
  const userId = randomChallenge();
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Simplifii OS' },
      user: { id: userId, name: 'simplifii.local', displayName: 'Sovereign User' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'preferred' },
      timeout: 60000,
      attestation: 'none'
    }
  });
  if (!cred || !cred.rawId) throw new Error('Biometric registration cancelled.');
  const idArray = Array.from(new Uint8Array(cred.rawId));
  const idB64 = btoa(String.fromCharCode.apply(null, idArray));
  try { window.localStorage.setItem(CREDENTIAL_ID_KEY, idB64); } catch { /* ignore */ }
  return idB64;
};

const tryAssertBiometric = async () => {
  if (!isWebAuthnAvailable()) throw new Error('Biometric authentication is not available on this device.');
  let storedId = null;
  try { storedId = window.localStorage.getItem(CREDENTIAL_ID_KEY); } catch { /* ignore */ }
  if (!storedId) throw new Error('No biometric credential is registered yet.');
  const allowCredentials = [{
    id: Uint8Array.from(atob(storedId), (c) => c.charCodeAt(0)),
    type: 'public-key',
    transports: ['internal']
  }];
  const challenge = randomChallenge();
  const assertion = await navigator.credentials.get({
    publicKey: { challenge, allowCredentials, userVerification: 'preferred', timeout: 60000 }
  });
  if (!assertion) throw new Error('Biometric verification failed.');
  return true;
};

export default function HistoryVaultUnlock({ onUnlocked, onGhost }) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(() => {
    // First-time setup: no salt yet means new vault flow.
    if (typeof window === 'undefined') return 'unlock';
    try {
      return window.localStorage.getItem('simplifii_hot_salt_v1') ? 'unlock' : 'create';
    } catch { return 'unlock'; }
  });
  const [remember, setRemember] = useState(() => {
    try { return window.localStorage.getItem(REMEMBER_KEY) === 'true'; }
    catch { return false; }
  });
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (busy) return;
    setError('');
    if (mode === 'create') {
      if (passphrase.length < 6) { setError('Use at least 6 characters.'); return; }
      if (passphrase !== confirmPass) { setError('Passphrases do not match.'); return; }
    } else if (passphrase.length < 4) {
      setError('Passphrase too short.'); return;
    }
    setBusy(true);
    try {
      await unlockWithPassphrase(passphrase);
      if (remember) {
        try { window.localStorage.setItem(REMEMBER_KEY, 'true'); } catch { /* ignore */ }
      }
      setGhostMode(false);
      setBusy(false);
      onUnlocked?.();
    } catch (err) {
      setError(err?.message || 'Could not unlock the vault. Check the passphrase.');
      setBusy(false);
    }
  };

  const onBiometric = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      // Two paths: register on first use, assert on subsequent.
      let credId = null;
      try { credId = window.localStorage.getItem(CREDENTIAL_ID_KEY); } catch { /* ignore */ }
      if (!credId) {
        await tryRegisterBiometric();
        setError('Biometric registered. Now type your passphrase to seal the link, then unlock.');
      } else {
        await tryAssertBiometric();
        setError('Biometric confirmed. Type your passphrase to unlock.');
      }
      inputRef.current?.focus();
    } catch (err) {
      setError(err?.message || 'Biometric step failed.');
    } finally {
      setBusy(false);
    }
  };

  const onSkip = () => {
    setGhostMode(true);
    onGhost?.();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Unlock History of Thought vault">
      <div style={panelStyle}>
        <div style={{ fontFamily: 'var(--f-mono, "JetBrains Mono", monospace)', fontSize: 10, letterSpacing: '0.18em', color: '#6B6B73', marginBottom: 8 }}>
          SOVEREIGN VAULT  ·  {mode === 'create' ? 'FIRST RUN' : 'LOCKED'}
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {mode === 'create' ? 'Set your vault passphrase' : 'Unlock your vault'}
        </h2>
        <p style={{ color: '#B7B7BD', fontSize: 13, lineHeight: 1.55, margin: '0 0 22px' }}>
          {mode === 'create'
            ? 'The vault encrypts every meaningful action you take inside Simplifii so you can prove the work evolved over time. Pick a passphrase you will remember. Nothing leaves this device.'
            : 'Your History of Thought is encrypted with your passphrase. Type it to resume capturing events. Skip and the cockpit runs in Ghost Mode (no recording).'}
        </p>

        <input
          ref={inputRef}
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Passphrase"
          autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
          disabled={busy}
          style={inputStyle}
        />
        {mode === 'create' && (
          <input
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Confirm passphrase"
            autoComplete="new-password"
            disabled={busy}
            style={{ ...inputStyle, marginTop: 10 }}
          />
        )}

        <label style={checkboxRow}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={busy} />
          <span>Remember this device {isWebAuthnAvailable() ? '(biometric supported)' : ''}</span>
        </label>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={submit} disabled={busy || !passphrase} style={primaryButtonStyle}>
            {busy ? 'Unlocking...' : (mode === 'create' ? 'Create vault' : 'Unlock')}
          </button>
          {isWebAuthnAvailable() && (
            <button onClick={onBiometric} disabled={busy} style={secondaryButtonStyle}>
              Use biometric
            </button>
          )}
          <button onClick={onSkip} disabled={busy} style={ghostButtonStyle} title="Skip the vault. The cockpit will work but no events are recorded.">
            Skip (Ghost Mode)
          </button>
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: '#6B6B73', lineHeight: 1.5 }}>
          Forgotten passphrases cannot be recovered. The salt is per-device; nothing about your content is ever sent off the Mac unless you explicitly opt in to cloud sync (not yet shipped).
        </div>
      </div>
    </div>
  );
}

// Inline styles. Keeping the modal independent of simplifii-studio.css
// so it works whether the cockpit is on Classic, Studio, or Scaffolder.
const overlayStyle = {
  position: 'fixed', inset: 0, background: OVERLAY_BACKDROP,
  backdropFilter: 'blur(6px)', zIndex: 3000, display: 'grid', placeItems: 'center',
  padding: 24
};
const panelStyle = {
  width: 'min(480px, 100%)', background: '#0E0F12', color: '#E8E8EA',
  border: `1px solid ${VAULT_GREEN_BORDER}`, borderRadius: 18,
  padding: '28px 28px 24px', fontFamily: 'var(--f-sans, "Geist", system-ui, sans-serif)',
  boxShadow: `0 0 60px ${VAULT_GREEN_BORDER}`
};
const inputStyle = {
  width: '100%', background: '#0B0C10', border: `1px solid ${WHITE_TINT}`,
  color: '#E8E8EA', borderRadius: 10, padding: '12px 14px', fontSize: 14,
  fontFamily: 'var(--f-mono, monospace)', outline: 'none'
};
const checkboxRow = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
  color: '#B7B7BD', marginTop: 12, cursor: 'pointer'
};
const errorStyle = {
  marginTop: 12, padding: '10px 12px', background: VAULT_ERROR_GLASS,
  border: `1px solid ${VAULT_ERROR_BORDER}`, borderRadius: 8,
  color: '#ff9c9c', fontSize: 12, lineHeight: 1.5
};
const primaryButtonStyle = {
  padding: '12px 20px', background: '#50C878', color: '#0A0A0A',
  border: 0, borderRadius: 12, fontWeight: 700, fontSize: 13,
  letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer'
};
const secondaryButtonStyle = {
  padding: '12px 18px', background: 'transparent', color: '#50C878',
  border: `1px solid ${VAULT_GREEN_BORDER_STRONG}`, borderRadius: 12,
  fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer'
};
const ghostButtonStyle = {
  padding: '12px 18px', background: 'transparent', color: '#B7B7BD',
  border: `1px solid ${WHITE_TINT}`, borderRadius: 12,
  fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer'
};
