import React, { useState, useEffect, useRef } from 'react';
import { listEvents } from '../../core/HistoryOfThought';
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
  OVERLAY_BACKDROP,
} from '../../theme/tokens';

/**
 * ReentryOverlay
 *
 * Conditional modal. Fires if user's last edit on this assessment was
 * 3+ days ago (research: ADHD students lose context after a few days).
 *
 * Shows: "Welcome back . N days away . Where are you stuck?"
 * Three options:
 *   - "I lost my flow" (tutor reads what was written)
 *   - "I am overwhelmed" (pick one tiny next step)
 *   - "I forgot what I was doing" (summarise brief + draft)
 *
 * Dismissable. Re-fires after 3 more days dormancy.
 *
 * Props:
 *   courseId        - string
 *   assessmentTitle - string
 *   onDismiss       - callback
 *   onChoice        - callback(choiceId)
 */

const DORMANCY_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const CHOICES = [
  { id: 'lost-flow', label: 'I lost my flow', description: 'The tutor will read what you wrote and remind you of your argument.' },
  { id: 'overwhelmed', label: 'I am overwhelmed', description: 'We will pick one tiny next step. 15 minutes. That is it.' },
  { id: 'forgot', label: 'I forgot what I was doing', description: 'We will summarise your brief and what you have written so far.' },
];

export default function ReentryOverlay({ courseId, assessmentTitle, onDismiss, onChoice }) {
  const [show, setShow] = useState(false);
  const [daysAway, setDaysAway] = useState(0);
  const dialogRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const events = await listEvents({ limit: 500 });
        const relevant = (events || []).filter(e =>
          e.payload?.courseId === courseId &&
          e.payload?.assessmentTitle === assessmentTitle &&
          e.event_type === 'text_edit'
        );
        if (relevant.length === 0) {
          // First visit: do not show re-entry
          return;
        }
        const lastTs = Math.max(...relevant.map(e => e.payload?.timestamp || e.timestamp || 0));
        const gap = Date.now() - lastTs;
        const gapDays = Math.floor(gap / MS_PER_DAY);
        if (!cancelled && gapDays >= DORMANCY_DAYS) {
          setDaysAway(gapDays);
          setShow(true);
        }
      } catch { /* vault may be locked, skip re-entry */ }
    })();
    return () => { cancelled = true; };
  }, [courseId, assessmentTitle]);

  useEffect(() => {
    if (show && dialogRef.current) dialogRef.current.focus();
  }, [show]);

  if (!show) return null;

  const handleChoice = (choiceId) => {
    setShow(false);
    onChoice?.(choiceId);
  };

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: OVERLAY_BACKDROP,
      }}
      onClick={handleDismiss}
      onKeyDown={e => { if (e.key === 'Escape') handleDismiss(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome back"
        tabIndex={-1}
        style={{
          background: SURFACE_CARD,
          border: `1px solid ${SURFACE_RAISED}`,
          borderRadius: BORDER_RADIUS,
          padding: '28px 24px',
          maxWidth: 440,
          width: '90vw',
          outline: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
          Welcome back
        </h2>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, margin: '0 0 16px', letterSpacing: '0.04em' }}>
          {daysAway} day{daysAway === 1 ? '' : 's'} away from this assessment.
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, margin: '0 0 20px', lineHeight: 1.5 }}>
          Where are you stuck?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHOICES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleChoice(c.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '12px 14px',
                background: 'transparent',
                border: `1px solid ${SURFACE_RAISED}`,
                borderRadius: BORDER_RADIUS,
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                minHeight: 44,
                transition: 'border-color 150ms ease', // allow-style
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_BORDER; }}  // allow-style
              onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}  // allow-style
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>
                {c.label}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED }}>
                {c.description}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600,
            color: TEXT_FAINT, background: 'transparent', border: 'none',
            cursor: 'pointer', padding: '10px 0', marginTop: 12,
            outline: 'none', width: '100%', textAlign: 'center',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
