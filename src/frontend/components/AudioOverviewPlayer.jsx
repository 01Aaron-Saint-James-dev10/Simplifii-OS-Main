import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import AsciiLoader from './AsciiLoader';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const SPEEDS = [
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
];

/**
 * AudioOverviewPlayer
 *
 * Generates a spoken script from assessment brief via /api/audio-overview,
 * then plays it using browser Web Speech API (SpeechSynthesis).
 * No audio files stored. Privacy: script generated per-session.
 *
 * Props:
 *   briefText       - string
 *   assessmentTitle - string
 */
export default function AudioOverviewPlayer({ briefText, assessmentTitle }) {
  const { activeTier } = useSettings();
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState(1);
  const utterRef = useRef(null);

  const generate = async () => {
    if (!briefText || briefText.length < 20) {
      setError('Add a document to generate a listening version.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audio-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefText, assessmentTitle, tier: activeTier }),
      });
      const data = await res.json();
      if (data.success) setScript(data.script);
      else setError(data.error || 'Could not generate audio script.');
    } catch {
      setError('Network error.');
    }
    setLoading(false);
  };

  const play = () => {
    if (!script || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = 'en-AU';
    utter.rate = speed;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  return (
    <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 4px' }}>
          Audio Overview
        </h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0 }}>
          Listen to a 60-second summary of your assessment brief.
        </p>
      </div>

      {!script && !loading && (
        <button type="button" onClick={generate}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '10px 14px', cursor: 'pointer', minHeight: 44, outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          Generate audio overview
        </button>
      )}

      {loading && <AsciiLoader status="Writing your audio script..." />}
      {error && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{error}</p>}

      {script && (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={playing ? stop : play}
              aria-label={playing ? 'Stop audio' : 'Play audio'}
              style={{
                width: 40, height: 40, borderRadius: 20,
                background: playing ? ACCENT_PULSE : ACCENT_GLASS,
                border: `1px solid ${ACCENT_BORDER}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                outline: 'none', color: playing ? '#09090b' : ACCENT_PULSE,
                fontFamily: FONT_SYSTEM, fontSize: 14,
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {playing ? '\u25A0' : '\u25B6'}
            </button>

            {/* Speed selector */}
            <div style={{ display: 'flex', gap: 4 }}>
              {SPEEDS.map(s => (
                <button key={s.value} type="button" onClick={() => setSpeed(s.value)}
                  style={{
                    fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
                    padding: '3px 6px', borderRadius: 3, cursor: 'pointer',
                    background: speed === s.value ? ACCENT_GLASS : 'transparent',
                    border: `1px solid ${speed === s.value ? ACCENT_BORDER : SURFACE_RAISED}`,
                    color: speed === s.value ? ACCENT_PULSE : TEXT_FAINT,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            <button type="button" onClick={() => { setScript(''); generate(); }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, background: 'none', border: `1px solid ${SURFACE_RAISED}`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', marginLeft: 'auto' }}>
              Regenerate
            </button>
          </div>

          {/* Script display */}
          <details>
            <summary style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, cursor: 'pointer' }}>
              View script
            </summary>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6, marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {script}
            </p>
          </details>
        </>
      )}

      {!briefText && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: 0 }}>
          Upload your assessment to generate a listening version.
        </p>
      )}
    </div>
  );
}
