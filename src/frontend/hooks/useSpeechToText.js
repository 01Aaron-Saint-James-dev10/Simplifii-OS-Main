import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechToText
 *
 * Wraps the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Returns controls for start/stop and live transcript state.
 *
 * - Continuous mode ON, interim results ON
 * - Language: en-AU
 * - Handles permission denied, no-speech, network errors
 * - Does NOT store recordings or send data anywhere
 */

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const isSupported = !!SpeechRecognition;

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-AU';
    recognition.continuous = true;
    recognition.interimResults = true;

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
        // Dispatch event so CanvasEditor can insert at cursor
        window.dispatchEvent(new CustomEvent('simplifii:voice-transcript', { detail: { text: finalChunk } }));
      } else {
        setInterimTranscript(interimChunk);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Check your browser permissions.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (event.error === 'network') {
        setError('Network error. Voice input requires an internet connection in Chrome.');
      } else {
        setError(`Voice error: ${event.error}`);
      }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { isListening, transcript, interimTranscript, start, stop, isSupported, error };
}
