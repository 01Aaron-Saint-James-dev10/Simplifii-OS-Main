import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AccessibilityContext = createContext(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};

const NEUROTYPE_PRESETS = {
  adhd: { fontSizePx: 17, lineHeight: 1.8, letterSpacing: 0.02, reduceMotion: false, highContrast: true },
  dyslexic: { fontSizePx: 18, lineHeight: 2.0, letterSpacing: 0.05, dyslexiaFont: true, reduceMotion: true },
  autistic: { fontSizePx: 16, lineHeight: 1.6, letterSpacing: 0, reduceMotion: true, highContrast: false },
  anxious: { fontSizePx: 16, lineHeight: 1.8, letterSpacing: 0.01, reduceMotion: true, highContrast: false },
  multiple: { fontSizePx: 17, lineHeight: 1.8, letterSpacing: 0.02, reduceMotion: true, highContrast: false },
};

const FONT_SIZES = { small: 14, medium: 16, large: 18, xl: 22 };
const LINE_SPACINGS = { normal: 1.6, wide: 2.0, 'extra-wide': 2.4 };

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');
  const [fontSizePx, setFontSizePx] = useState(() => parseInt(localStorage.getItem('fontSizePx') || '16', 10));
  const [lineSpacing, setLineSpacing] = useState(() => localStorage.getItem('lineSpacing') || 'normal');
  const [lineHeight, setLineHeight] = useState(() => parseFloat(localStorage.getItem('lineHeight') || '1.6'));
  const [letterSpacing, setLetterSpacing] = useState(() => parseFloat(localStorage.getItem('letterSpacing') || '0'));
  const [dyslexiaFont, setDyslexiaFont] = useState(() => localStorage.getItem('dyslexiaFont') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('reduceMotion') === 'true');
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('focusMode') === 'true');
  const [readingRuler, setReadingRuler] = useState(() => localStorage.getItem('readingRuler') === 'true');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [cognitiveMode, setCognitiveMode] = useState('standard');
  const [neurotype, setNeurotype] = useState(() => localStorage.getItem('neurotype') || null);
  const [neurotypeConfig, setNeurotypeConfig] = useState(null);

  useEffect(() => {
    const fetchNeurotypeUI = async () => {
      try {
        const API = process.env.REACT_APP_BACKEND_URL;
        const res = await axios.get(`${API}/api/user/neurotype-ui`, { withCredentials: true });
        const nt = res.data.neurotype;
        setNeurotype(nt);
        setNeurotypeConfig(res.data.ui_config);
        localStorage.setItem('neurotype', nt || '');
        const hasCustomised = localStorage.getItem('accessibility_customised');
        if (!hasCustomised && nt && NEUROTYPE_PRESETS[nt]) {
          const preset = NEUROTYPE_PRESETS[nt];
          setFontSizePx(preset.fontSizePx);
          setLineHeight(preset.lineHeight);
          setLetterSpacing(preset.letterSpacing);
          if (preset.dyslexiaFont) setDyslexiaFont(true);
          if (preset.reduceMotion) setReduceMotion(true);
          if (preset.highContrast) setHighContrast(true);
        }
      } catch {}
    };
    fetchNeurotypeUI();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${fontSizePx}px`);
    document.documentElement.style.setProperty('--app-line-height', `${lineHeight}`);
    document.documentElement.style.setProperty('--app-letter-spacing', `${letterSpacing}em`);
    localStorage.setItem('fontSizePx', fontSizePx);
    localStorage.setItem('lineHeight', lineHeight);
    localStorage.setItem('letterSpacing', letterSpacing);
  }, [fontSizePx, lineHeight, letterSpacing]);

  useEffect(() => { localStorage.setItem('fontSize', fontSize); }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('dyslexiaFont', dyslexiaFont);
    document.body.classList.toggle('dyslexia-font', dyslexiaFont);
  }, [dyslexiaFont]);

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast);
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('reduceMotion', reduceMotion);
    document.body.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    localStorage.setItem('focusMode', focusMode);
    document.body.classList.toggle('focus-mode', focusMode);
  }, [focusMode]);

  useEffect(() => {
    localStorage.setItem('readingRuler', readingRuler);
  }, [readingRuler]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);

  const setFontSizePreset = useCallback((preset) => {
    markCustomised();
    setFontSize(preset);
    setFontSizePx(FONT_SIZES[preset] || 16);
  }, []);

  const setLineSpacingPreset = useCallback((preset) => {
    markCustomised();
    setLineSpacing(preset);
    setLineHeight(LINE_SPACINGS[preset] || 1.6);
    localStorage.setItem('lineSpacing', preset);
  }, []);

  const toggleFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'xl'];
    const next = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
    setFontSizePreset(next);
  };

  const markCustomised = () => localStorage.setItem('accessibility_customised', 'true');

  const resetAll = () => {
    setFontSizePx(16); setFontSize('medium');
    setLineHeight(1.6); setLineSpacing('normal');
    setLetterSpacing(0);
    setDyslexiaFont(false); setHighContrast(false);
    setReduceMotion(false); setFocusMode(false);
    setReadingRuler(false); setDarkMode(true);
    localStorage.removeItem('accessibility_customised');
  };

  return (
    <AccessibilityContext.Provider value={{
      fontSize, setFontSize, toggleFontSize, setFontSizePreset,
      fontSizePx, setFontSizePx: (v) => { markCustomised(); setFontSizePx(v); },
      lineHeight, setLineHeight: (v) => { markCustomised(); setLineHeight(v); },
      lineSpacing, setLineSpacingPreset,
      letterSpacing, setLetterSpacing: (v) => { markCustomised(); setLetterSpacing(v); },
      dyslexiaFont, setDyslexiaFont: (v) => { markCustomised(); setDyslexiaFont(v); },
      highContrast, setHighContrast: (v) => { markCustomised(); setHighContrast(v); },
      reduceMotion, setReduceMotion: (v) => { markCustomised(); setReduceMotion(v); },
      focusMode, setFocusMode: (v) => { markCustomised(); setFocusMode(v); },
      readingRuler, setReadingRuler: (v) => { markCustomised(); setReadingRuler(v); },
      darkMode, setDarkMode: (v) => { markCustomised(); setDarkMode(v); },
      cognitiveMode, setCognitiveMode,
      neurotype, neurotypeConfig,
      resetAll,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
