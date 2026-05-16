import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useAuraVoice
 *
 * Full voice conversation engine for AURA:
 * - TTS output via ElevenLabs API (with browser fallback)
 * - Voice Activity Detection (auto-send after silence)
 * - Audio waveform data for orb reactivity
 * - Interruption support (stop speaking on new input)
 */

const SILENCE_THRESHOLD_MS = 1500; // Auto-send after 1.5s silence

export function useAuraVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningContinuous, setIsListeningContinuous] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const onTranscriptRef = useRef(null);

  // Speak text via ElevenLabs TTS (fallback to browser SpeechSynthesis)
  const speak = useCallback(async (text) => {
    if (!text) return;
    stopSpeaking();
    setIsSpeaking(true);
    window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state: 'speaking' } }));

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      // Check if we got audio or a fallback JSON response
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('audio')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        // Connect to analyser for waveform data
        try {
          if (!audioContextRef.current) audioContextRef.current = new AudioContext();
          const ctx = audioContextRef.current;
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
          pollAudioLevel();
        } catch { /* audio context not available, still play */ }

        audio.onended = () => {
          setIsSpeaking(false);
          setAudioLevel(0);
          URL.revokeObjectURL(url);
          window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state: 'idle' } }));
        };
        await audio.play();
        return;
      }

      // Fallback: browser SpeechSynthesis
      fallbackSpeak(text);
    } catch {
      fallbackSpeak(text);
    }
  }, []);

  // Browser TTS fallback
  const fallbackSpeak = useCallback((text) => {
    if (!window.speechSynthesis) { setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-AU';
    utterance.rate = 0.95;
    utterance.onend = () => {
      setIsSpeaking(false);
      window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state: 'idle' } }));
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // Stop speaking (for interruption)
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  // Poll audio analyser for waveform level (drives orb distortion via event)
  const pollAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    const poll = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      const level = avg / 255;
      setAudioLevel(level);
      // Dispatch to orb for real-time reactivity
      window.dispatchEvent(new CustomEvent('simplifii:aura-audio-level', { detail: { level } }));
      if (isSpeaking) requestAnimationFrame(poll);
    };
    poll();
  }, [isSpeaking]);

  // Continuous listening with Voice Activity Detection (auto-send on silence)
  const startContinuousListening = useCallback((onTranscript) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    onTranscriptRef.current = onTranscript;
    stopSpeaking(); // Interrupt AURA if speaking

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-AU';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onstart = () => setIsListeningContinuous(true);

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      // Reset silence timer on any speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      if (finalTranscript) {
        // Start silence timer: auto-send after SILENCE_THRESHOLD_MS
        silenceTimerRef.current = setTimeout(() => {
          if (finalTranscript.trim() && onTranscriptRef.current) {
            onTranscriptRef.current(finalTranscript.trim());
            finalTranscript = '';
          }
        }, SILENCE_THRESHOLD_MS);
      }
    };

    recognition.onerror = () => { setIsListeningContinuous(false); };
    recognition.onend = () => {
      // Auto-restart for continuous mode
      if (isListeningContinuous && recognitionRef.current) {
        try { recognition.start(); } catch { setIsListeningContinuous(false); }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListeningContinuous(true);
    window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state: 'listening' } }));
  }, [isListeningContinuous, stopSpeaking]);

  // Stop continuous listening
  const stopContinuousListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setIsListeningContinuous(false);
    window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state: 'idle' } }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopContinuousListening();
    };
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    audioLevel,
    startContinuousListening,
    stopContinuousListening,
    isListeningContinuous,
  };
}
