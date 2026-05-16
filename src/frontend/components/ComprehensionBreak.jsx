import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../SettingsContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  SHADOW_CARD,
  FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * ComprehensionBreak
 *
 * Fires a non-intrusive break reminder after a configurable focus
 * interval. Displays a calm, non-coercive prompt with three options:
 *   - Take a 2-minute break (snooze 2 min)
 *   - Do a quick comprehension check
 *   - Keep going (dismiss)
 *
 * Respects autism-first and reduced-motion settings.
 * Never punishes dismissal. Never auto-escalates.
 *
 * Props:
 *   intervalMinutes  - number (default 25, Pomodoro-aligned)
 *   onCheckRequest   - callback() open the Check panel
 */

const DEFAULT_INTERVAL_MS = 25 * 60 * 1000;
const SNOOZE_MS = 2 * 60 * 1000;

const BREAK_MESSAGES = [
  'You have been working for a while. A short pause helps memory consolidation.',
  'Brain check: your memory consolidates better after short breaks.',
  'Focus interval complete. A 2-minute pause now saves time later.',
  'Good sustained work. Your brain will thank you for a moment away.',
];

export default function ComprehensionBreak({ intervalMinutes, onCheckRequest }) {
  const { autismFirstEnabled, reducedMotion } = useSettings();
  const [visible, setVisible] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [message] = useState(() => BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)]);
  const timerRef = useRef(null);

  const intervalMs = (intervalMinutes || 25) * 60 * 1000;

  const schedule = (ms) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
      setSnoozed(false);
    }, ms);
  };

  useEffect(() => {
    schedule(intervalMs);
    return () => clearTimeout(timerRef.current);
  }, [intervalMs]);

  const dismiss = () => {
    setVisible(false);
    schedule(intervalMs); // restart full interval
  };

  const snooze = () => {
    setVisible(false);
    setSnoozed(true);
    schedule(SNOOZE_MS);
  };

  const openCheck = () => {
    setVisible(false);
    schedule(intervalMs);
    onCheckRequest?.();
  };

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-label="Break reminder"
      style={{
        position: 'fixed',
        bottom: 48,
        right: 16,
        zIndex: 800,
        width: 280,
        background: SURFACE_CARD,
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: BORDER_RADIUS,
        padding: '14px 16px',
        boxShadow: `0 4px 24px ${SHADOW_CARD}`,
        animation: reducedMotion ? 'none' : 'slideUpFade 0.25s ease-out',
      }}
    >
      <style>{`@keyframes slideUpFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <p style={{ margin: '0 0 12px', fontFamily: FONT_SYSTEM, fontSize: 12, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
        {message}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={snooze}
          style={{
            background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: 6,
            color: TEXT_PRIMARY,
            cursor: 'pointer',
            fontFamily: FONT_SYSTEM,
            fontSize: 11,
            padding: '6px 10px',
            textAlign: 'left',
          }}
          onFocus={e => { e.currentTarget.style.outline = FOCUS_RING; }}
          onBlur={e => { e.currentTarget.style.outline = 'none'; }}
        >
          Take a 2-minute break
        </button>

        {!autismFirstEnabled && (
          <button
            type="button"
            onClick={openCheck}
            style={{
              background: 'none',
              border: `1px solid ${SURFACE_RAISED}`,
              borderRadius: 6,
              color: TEXT_MUTED,
              cursor: 'pointer',
              fontFamily: FONT_SYSTEM,
              fontSize: 11,
              padding: '6px 10px',
              textAlign: 'left',
            }}
            onFocus={e => { e.currentTarget.style.outline = FOCUS_RING; }}
            onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          >
            Quick comprehension check
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            color: TEXT_FAINT,
            cursor: 'pointer',
            fontFamily: FONT_SYSTEM,
            fontSize: 10,
            padding: '4px 0',
            textAlign: 'left',
          }}
          onFocus={e => { e.currentTarget.style.outline = FOCUS_RING; }}
          onBlur={e => { e.currentTarget.style.outline = 'none'; }}
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
