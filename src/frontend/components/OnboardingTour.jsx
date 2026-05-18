import React, { useState, useEffect, useRef } from 'react';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const TOUR_KEY = 'simplifii-tour-complete';
const SPOT_PAD = 10; // spotlight padding around target element

const STEPS = [
  {
    target: '[data-tour="add-work"]',
    label: 'This is where everything starts. Upload your assignment brief, rubric, or exam paper.',
    button: 'Next',
  },
  {
    target: '[data-tour="aura-orb"]',
    label: 'This is AURA, your study guide. It asks questions instead of writing for you.',
    button: 'Next',
  },
  {
    target: '[data-tour="course-list"]',
    label: 'Your subjects live here. Each one has a workspace for thinking, planning, and writing.',
    button: 'Next',
  },
  {
    target: '[data-tour="settings-btn"]',
    label: 'Adjust how AURA talks to you and how everything looks.',
    button: "Let's go",
  },
];

/**
 * OnboardingTour
 *
 * Four-step spotlight tour shown once to new users.
 * Guards on localStorage key simplifii-tour-complete.
 * Uses getBoundingClientRect to position spotlight over data-tour targets.
 * No dangerouslySetInnerHTML: spotlighting done via CSS box-shadow spread.
 */
export default function OnboardingTour() {
  const [done, setDone] = useState(() => !!localStorage.getItem(TOUR_KEY));
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (done) return;
    const update = () => {
      const el = document.querySelector(STEPS[step]?.target);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    rafRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [step, done]);

  if (done || !rect) return null;

  const current = STEPS[step];
  const spotX = rect.left - SPOT_PAD;
  const spotY = rect.top - SPOT_PAD;
  const spotW = rect.width + SPOT_PAD * 2;
  const spotH = rect.height + SPOT_PAD * 2;

  const tipLeft = Math.max(16, Math.min(spotX, window.innerWidth - 284));
  const tipTopBelow = spotY + spotH + 12;
  const showAbove = tipTopBelow + 110 > window.innerHeight;
  const tipTop = showAbove ? spotY - 110 : tipTopBelow;

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem(TOUR_KEY, 'true');
      setDone(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Guided tour, step ${step + 1} of ${STEPS.length}`}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
    >
      {/* Spotlight: box-shadow spread creates dark overlay with transparent window */}
      <div style={{
        position: 'absolute',
        top: spotY,
        left: spotX,
        width: spotW,
        height: spotH,
        borderRadius: BORDER_RADIUS + 2,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
        pointerEvents: 'none',
      }} />

      {/* Tooltip card */}
      <div style={{
        position: 'absolute',
        top: tipTop,
        left: tipLeft,
        width: 260,
        background: SURFACE_CARD,
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: BORDER_RADIUS + 4,
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.48)',
        pointerEvents: 'all',
      }}>
        <p style={{
          fontFamily: FONT_BODY,
          fontSize: 13,
          color: TEXT_PRIMARY,
          margin: '0 0 12px',
          lineHeight: 1.55,
        }}>
          {current.label}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_MUTED }}>
            {step + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={advance}
            style={{
              background: ACCENT_PULSE,
              border: 'none',
              borderRadius: BORDER_RADIUS,
              color: '#000',
              cursor: 'pointer',
              fontFamily: FONT_SYSTEM,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '7px 16px',
            }}
          >
            {current.button}
          </button>
        </div>
      </div>
    </div>
  );
}
