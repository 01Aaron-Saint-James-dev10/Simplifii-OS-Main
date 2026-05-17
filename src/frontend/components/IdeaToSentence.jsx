import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import useLearnerContext from '../hooks/useLearnerContext';
import { announceAction } from '../services/PredictabilityService';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * IdeaToSentence
 *
 * Voice button: speak a messy idea, AI structures it.
 * Shows: original voice transcript, structured version, final option.
 * User picks which to keep (or none).
 *
 * Props:
 *   onInsert       - callback(text) inserts chosen text into editor
 *   assessmentTitle - string
 *   tier           - string
 */
export default function IdeaToSentence({ onInsert, assessmentTitle, tier }) {
  const { isLiteralMode, accessibilityProfile } = useSettings();
  const { learnerContext } = useLearnerContext();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [structured, setStructured] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-AU';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const results = Array.from(e.results);
      const text = results.map(r => r[0].transcript).join(' ');
      setTranscript(text);
    };

    recognition.onerror = () => {
      setListening(false);
      setError('Could not hear you. Try again.');
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError('');
    setStructured('');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const structureIdea = async () => {
    if (!transcript || transcript.length < 5) return;
    setLoading(true);
    setError('');

    try {
      const proceed = await announceAction({
        type: 'ai_response',
        description: 'Structure your spoken idea into a sentence',
        estimatedMs: 5000,
      });
      if (proceed === 'cancel') { setLoading(false); return; }

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: `Structure this messy spoken idea into 1-2 clear academic sentences. Keep my meaning. Do not add new ideas. Just make it clearer.\n\nMy idea: "${transcript}"` }],
          assessmentTitle: assessmentTitle || '',
          tier: tier || 'tertiary',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          learnerContext: learnerContext || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setStructured(data.reply);
      } else {
        setError(data.error || 'Could not structure. Try again.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${SURFACE_RAISED}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={listening ? stopListening : startListening}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: listening ? '#09090b' : ACCENT_PULSE,
            background: listening ? '#ef4444' : ACCENT_GLASS,
            border: `1px solid ${listening ? '#ef4444' : ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS, padding: '6px 12px',
            cursor: 'pointer', minHeight: 32, outline: 'none',
            animation: listening ? 'pulse 1s infinite' : 'none',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {listening ? '\u23F9 Stop' : '\u{1F3A4} Speak your idea'}
        </button>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
          {listening ? 'Listening...' : 'Say it messy. AI will tidy it.'}
        </span>
      </div>

      {transcript && (
        <div style={{ padding: '8px 10px', background: ACCENT_GLASS, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What you said:</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, fontStyle: 'italic' }}>{transcript}</p>
        </div>
      )}

      {transcript && !structured && !loading && (
        <button type="button" onClick={structureIdea}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600,
            color: ACCENT_PULSE, background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '6px 12px', cursor: 'pointer', minHeight: 28, outline: 'none',
            alignSelf: 'flex-start',
          }}>
          Structure this
        </button>
      )}

      {loading && <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>Structuring...</p>}
      {error && <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLOUR_WARN, margin: 0 }}>{error}</p>}

      {structured && (
        <div style={{ padding: '8px 10px', border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Structured:</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 8px', lineHeight: 1.6 }}>{structured}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => { onInsert?.(structured); setTranscript(''); setStructured(''); }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600, color: ACCENT_PULSE, background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, padding: '4px 10px', cursor: 'pointer', minHeight: 24 }}>
              Use this
            </button>
            <button type="button" onClick={() => { onInsert?.(transcript); setTranscript(''); setStructured(''); }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_MUTED, background: 'none', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, padding: '4px 10px', cursor: 'pointer', minHeight: 24 }}>
              Use original
            </button>
            <button type="button" onClick={() => { setTranscript(''); setStructured(''); }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
