import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../SettingsContext';
import { ANNOUNCEMENT_EVENT, respondToAnnouncement } from '../services/PredictabilityService';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * AnnouncementBanner
 *
 * Slides in from top of canvas when an AI action is about to happen.
 * Shows: "About to: [action]. Ready?" with countdown.
 * Buttons: "Ready" | "Wait" | "Skip announcements"
 *
 * When predictability_announcements is off, shows a brief flash (1.5s)
 * then auto-proceeds.
 */

const ESTIMATE_LABELS = {
  0: '',
  1000: '1 second',
  2000: '2 seconds',
  3000: '3 seconds',
  4000: '4 seconds',
  5000: '5 seconds',
  8000: '8 seconds',
  10000: '10 seconds',
  15000: '15 seconds',
};

const estimateLabel = (ms) => {
  if (!ms || ms <= 0) return '';
  const keys = Object.keys(ESTIMATE_LABELS).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => Math.abs(curr - ms) < Math.abs(prev - ms) ? curr : prev);
  return ESTIMATE_LABELS[closest] || `${Math.round(ms / 1000)} seconds`;
};

export default function AnnouncementBanner() {
  const { autismFirstEnabled, predictabilityAnnouncements, setPredictabilityAnnouncements } = useSettings();
  const [announcement, setAnnouncement] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const { id, type, description, estimatedMs, requireAck } = e.detail;

      // If autism-first is off, auto-proceed silently
      if (!autismFirstEnabled) {
        respondToAnnouncement(id, 'proceed');
        return;
      }

      // If predictability announcements off, brief flash then auto-proceed
      if (!predictabilityAnnouncements) {
        setAnnouncement({ id, type, description, estimatedMs, requireAck: false });
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          setAnnouncement(null);
          respondToAnnouncement(id, 'proceed');
        }, 1500);
        return;
      }

      // Full announcement with countdown
      if (!requireAck) {
        // Transition announcements: show briefly, auto-dismiss
        setAnnouncement({ id, type, description, estimatedMs, requireAck: false });
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          setAnnouncement(null);
        }, 2000);
        return;
      }

      setAnnouncement({ id, type, description, estimatedMs, requireAck: true });
      setCountdown(3);
      setVisible(true);
    };

    window.addEventListener(ANNOUNCEMENT_EVENT, handler);
    return () => window.removeEventListener(ANNOUNCEMENT_EVENT, handler);
  }, [autismFirstEnabled, predictabilityAnnouncements]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const handleReady = () => {
    if (announcement) respondToAnnouncement(announcement.id, 'proceed');
    setVisible(false);
    setAnnouncement(null);
  };

  const handleWait = () => {
    // Reset countdown, keep banner visible
    setCountdown(3);
  };

  const handleCancel = () => {
    if (announcement) respondToAnnouncement(announcement.id, 'cancel');
    setVisible(false);
    setAnnouncement(null);
  };

  const handleSkipAnnouncements = () => {
    setPredictabilityAnnouncements(false);
    handleReady();
  };

  if (!visible || !announcement) return null;

  const timeLabel = estimateLabel(announcement.estimatedMs);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 16px',
        animation: 'slideDown 400ms ease-out',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: SURFACE_CARD,
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: BORDER_RADIUS,
        maxWidth: 600,
        width: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        {/* Icon */}
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 16, color: ACCENT_PULSE, flexShrink: 0 }}>
          {announcement.type === 'transition' ? '\u2192' : '\u23F3'}
        </span>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
            {announcement.type === 'transition'
              ? announcement.description
              : `About to: ${announcement.description}`}
          </p>
          {timeLabel && (
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, margin: '2px 0 0' }}>
              Estimated time: {timeLabel}
            </p>
          )}
        </div>

        {/* Actions */}
        {announcement.requireAck ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleReady}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: ACCENT_PULSE, background: ACCENT_GLASS,
                border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
                padding: '6px 12px', cursor: 'pointer', minHeight: 32, outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {countdown > 0 ? `Ready (${countdown})` : 'Ready'}
            </button>
            <button
              type="button"
              onClick={handleWait}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600,
                color: TEXT_MUTED, background: 'transparent',
                border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                padding: '6px 10px', cursor: 'pointer', minHeight: 32, outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              Wait
            </button>
            <button
              type="button"
              onClick={handleSkipAnnouncements}
              title="Turn off announcements (you can re-enable in Settings)"
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT,
                background: 'none', border: 'none', padding: '4px',
                cursor: 'pointer', outline: 'none', textDecoration: 'underline',
              }}
            >
              Skip
            </button>
          </div>
        ) : (
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
            {'\u2713'}
          </span>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
