import React, { useState, useRef, useEffect } from 'react';
import {
  TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * ReadAloudButton
 *
 * Reads text aloud using browser Web Speech API.
 * Highlights word being read (via onWordHighlight callback).
 * Adjustable speed. Pause/resume/stop.
 *
 * Props:
 *   text             - string to read
 *   label            - button label (default "Read aloud")
 *   compact          - boolean (small icon-only button)
 *   onWordHighlight  - callback(wordIndex) for highlighting
 */
export default function ReadAloudButton({ text, label = 'Read aloud', compact = false, onWordHighlight }) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const utterRef = useRef(null);

  const speak = () => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return;

    const utter = new SpeechSynthesisUtterance(plain);
    utter.lang = 'en-AU';
    utter.rate = speed;

    // Word boundary tracking for highlighting
    if (onWordHighlight) {
      let charIndex = 0;
      utter.onboundary = (e) => {
        if (e.name === 'word') {
          const words = plain.slice(0, e.charIndex).split(/\s+/).length - 1;
          onWordHighlight(words);
        }
      };
    }

    utter.onend = () => { setPlaying(false); setPaused(false); onWordHighlight?.(-1); };
    utter.onerror = () => { setPlaying(false); setPaused(false); };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
    setPaused(false);
  };

  const pause = () => {
    window.speechSynthesis?.pause();
    setPaused(true);
  };

  const resume = () => {
    window.speechSynthesis?.resume();
    setPaused(false);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
    onWordHighlight?.(-1);
  };

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  if (compact) {
    return (
      <button type="button" onClick={playing ? stop : speak}
        aria-label={playing ? 'Stop reading' : label}
        title={playing ? 'Stop reading' : label}
        style={{
          width: 28, height: 28, borderRadius: 14,
          background: playing ? ACCENT_PULSE : ACCENT_GLASS,
          border: `1px solid ${ACCENT_BORDER}`,
          cursor: 'pointer', outline: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: playing ? '#09090b' : ACCENT_PULSE,
          fontFamily: FONT_SYSTEM, fontSize: 12,
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {playing ? '\u25A0' : '\u25B6'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" onClick={playing ? (paused ? resume : pause) : speak}
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: ACCENT_PULSE, background: ACCENT_GLASS,
          border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
          padding: '4px 10px', cursor: 'pointer', minHeight: 28, outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {playing ? (paused ? '\u25B6 Resume' : '\u23F8 Pause') : `\u25B6 ${label}`}
      </button>

      {playing && (
        <button type="button" onClick={stop}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT,
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          }}>
          \u25A0 Stop
        </button>
      )}

      {/* Speed control */}
      <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
        aria-label="Reading speed"
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT,
          background: 'transparent', border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: 3, padding: '2px 4px', outline: 'none',
        }}>
        <option value={0.5}>0.5x</option>
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>
    </div>
  );
}
