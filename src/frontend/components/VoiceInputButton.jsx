import React, { useState, useEffect, useCallback } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useSettings } from '../SettingsContext';
import {
  GLASS_SURFACE, GLASS_BORDER,
  SURFACE_CARD, SURFACE_RAISED,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_FOCUS,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  COLOUR_WARN, COLOUR_WARN_BORDER,
  OVERLAY_BACKDROP,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const PERM_KEY = 'simplifii_voice_permission_acknowledged';

/**
 * VoiceInputButton
 *
 * Floating mic button for CanvasEditor. Web Speech API (en-AU).
 * Speech is processed by the browser (Chrome: Google, Safari: on-device).
 * Recordings are never stored. Transcripts live only in the editor.
 */
export default function VoiceInputButton() {
  const { isListening, interimTranscript, start, stop, isSupported, error } = useSpeechToText();
  const { reducedMotion } = useSettings();
  const [showPermission, setShowPermission] = useState(false);

  const hasAcknowledged = () => {
    try { return localStorage.getItem(PERM_KEY) === 'true'; } catch { return false; }
  };

  const handleClick = useCallback(() => {
    if (isListening) {
      stop();
      return;
    }
    if (!hasAcknowledged()) {
      setShowPermission(true);
      return;
    }
    start();
  }, [isListening, start, stop]);

  const handleGrantPermission = () => {
    try { localStorage.setItem(PERM_KEY, 'true'); } catch { /* storage unavailable */ }
    setShowPermission(false);
    start();
  };

  // Keyboard shortcut: Cmd/Ctrl+Shift+V
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        handleClick();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClick]);

  if (!isSupported) return null;

  return (
    <>
      {/* Mic button */}
      <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Interim transcript pill */}
        {isListening && interimTranscript && (
          <div
            aria-live="polite"
            style={{
              position: 'absolute', bottom: '100%', marginBottom: 8,
              padding: '6px 12px', borderRadius: 20,
              background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`,
              fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, /* allow-style */
              whiteSpace: 'nowrap', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {interimTranscript}
          </div>
        )}

        {/* Error tooltip */}
        {error && !isListening && (
          <div
            role="alert"
            style={{
              position: 'absolute', bottom: '100%', marginBottom: 8,
              padding: '6px 12px', borderRadius: 8,
              background: SURFACE_CARD, border: `1px solid ${COLOUR_WARN_BORDER}`,
              fontFamily: FONT_SYSTEM, fontSize: 10, color: COLOUR_WARN, /* allow-style */
              whiteSpace: 'nowrap', maxWidth: 280,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          style={{
            width: 44, height: 44, borderRadius: 22,
            background: isListening ? ACCENT_PULSE : GLASS_SURFACE,
            border: `1px solid ${isListening ? ACCENT_PULSE : GLASS_BORDER}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: 'none',
            animation: isListening && !reducedMotion ? 'voicePulse 1.5s ease-in-out infinite' : 'none',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            transition: 'background 150ms ease, border-color 150ms ease', /* allow-style */
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {/* Mic icon (lucide) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={isListening ? '#09090b' : ACCENT_PULSE}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>

        {/* ARIA live region for state changes */}
        <div aria-live="assertive" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          {isListening ? 'Voice input started' : ''}
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${ACCENT_FOCUS}; }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
      `}</style>

      {/* Permission modal */}
      {showPermission && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP }}
          onClick={() => setShowPermission(false)}
        >
          <div
            role="dialog" aria-modal="true" aria-label="Voice input permission"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400, padding: '28px 24px',
              background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`,
              borderRadius: 12, outline: 'none',
            }}
          >
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: TEXT_PRIMARY, margin: '0 0 8px' }}>
              Voice input
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.6 }}>
              {"Simplifii-OS would like to use your microphone for voice input. We don't store recordings."}
            </p>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, margin: '0 0 20px', lineHeight: 1.5 }}>
              In Chrome, speech is processed by Google's free speech service. In Safari, speech is processed on-device. Your browser will ask for microphone permission separately.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={handleGrantPermission}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer' }}>
                Enable voice input
              </button>
              <button type="button" onClick={() => setShowPermission(false)}
                style={{ padding: '12px 20px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_MUTED, cursor: 'pointer' }}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
