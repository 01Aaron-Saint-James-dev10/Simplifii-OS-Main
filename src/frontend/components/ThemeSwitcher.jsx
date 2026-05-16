import React, { useState, useEffect, useCallback } from 'react';
import {
  FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const THEMES = [
  { id: 'obsidian', label: 'Dark' },
  { id: 'vaporwave', label: 'Neon' },
  { id: 'surreal', label: 'Paper' },
  { id: 'minimal', label: 'Light' },
];

const STORAGE_KEY = 'simplifii_sovereign_theme';

/**
 * ThemeSwitcher
 *
 * Small pill button that cycles through 4 Sovereign-OS themes.
 * Press T key to cycle. Click to cycle. Theme persists to localStorage
 * and applies via html[data-theme] attribute.
 */
export default function ThemeSwitcher() {
  const [themeIndex, setThemeIndex] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const idx = THEMES.findIndex(t => t.id === stored);
    return idx >= 0 ? idx : 0;
  });

  const theme = THEMES[themeIndex];

  const applyTheme = useCallback((idx) => {
    const t = THEMES[idx];
    document.documentElement.setAttribute('data-theme', t.id);
    localStorage.setItem(STORAGE_KEY, t.id);
    setThemeIndex(idx);
  }, []);

  // Apply on mount
  useEffect(() => {
    applyTheme(themeIndex);
  }, []); // eslint-disable-line

  // T key cycles themes
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 't' || e.key === 'T') {
        // Don't trigger if user is typing in an input
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.contentEditable === 'true') return;
        e.preventDefault();
        setThemeIndex(prev => {
          const next = (prev + 1) % THEMES.length;
          applyTheme(next);
          return next;
        });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [applyTheme]);

  const handleClick = () => {
    const next = (themeIndex + 1) % THEMES.length;
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Current theme: ${theme.label}. Press T or click to switch.`}
      title={`Theme: ${theme.label} (press T to cycle)`}
      style={{
        fontFamily: FONT_SYSTEM,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--sov-line, #10b981)', /* allow-style */
        background: 'transparent',
        border: '1px solid var(--sov-hairline, rgba(16,185,129,0.18))', /* allow-style */
        borderRadius: BORDER_RADIUS,
        padding: '4px 10px',
        cursor: 'pointer',
        outline: 'none',
        minHeight: 28,
        whiteSpace: 'nowrap',
        transition: 'border-color 150ms ease', /* allow-style */
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {theme.label}
    </button>
  );
}
