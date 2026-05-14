import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Voice-to-text via Web Speech API.
 *
 * Privacy posture:
 * - Audio NEVER touches Simplifii-OS servers.
 * - Audio processing is delegated to the browser's speech service:
 *   - Chrome/Edge: Google's speech service
 *   - Safari: on-device (since Safari 14.1)
 *   - Firefox: unsupported (hook returns isSupported: false)
 * - Transcripts are NEVER persisted to Supabase.
 * - Transcripts are NEVER logged to HistoryOfThought.
 * - Transcripts are NEVER sent through any Simplifii-OS analytics.
 * - The only place a transcript lives is wherever the consuming component
 *   inserts it (e.g. inside the TipTap editor as user-owned content).
 */

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const isSupported = Boolean(SpeechRecognitionAPI);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError({ type: 'unsupported', message: 'Voice input is not supported in this browser.' });
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-AU';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }
      if (finalChunk) {
        setTranscript(finalChunk);
        setInterimTranscript('');
        window.dispatchEvent(new CustomEvent('simplifii:voice-transcript', { detail: { text: finalChunk } }));
      } else {
        setInterimTranscript(interimChunk);
      }
    };

    recognition.onerror = (event) => {
      const map = {
        'not-allowed': 'Microphone permission denied. Enable it in your browser settings.',
        'service-not-allowed': 'Microphone permission denied. Enable it in your browser settings.',
        'no-speech': 'No speech detected. Try speaking closer to the mic.',
        'audio-capture': 'No microphone found. Check your audio setup.',
        'network': 'Speech service unavailable. Try again.',
      };
      setError({
        type: event.error,
        message: map[event.error] || 'Voice input failed. Please try again.',
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  // Cleanup on unmount: release mic
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return { isListening, transcript, interimTranscript, start, stop, reset, isSupported, error };
}
