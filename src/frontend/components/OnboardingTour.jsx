import React, { useState, useEffect, useRef } from 'react';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const TOUR_KEY = 'simplifii-tour-complete';
const SPOT_PAD = 10;
const TIP_W = 280;
const TIP_H = 120; // approximate, used for placement calculation
const TIP_GAP = 14; // gap between spotlight and tooltip card

const STEPS = [
  {
    target: '[data-tour="add-work"]',
    label: 'Start here. Upload your assignment brief, rubric, or exam paper. Simplifii reads it and builds your workspace automatically.',
    button: 'Next',
  },
  {
    target: '[data-tour="settings-btn"]',
    label: 'Choose how AURA communicates with you and how the app looks. Sensory dial, reading mode, accessibility profile: all here.',
    button: 'Next',
  },
  {
    target: '[data-tour="course-list"]',
    label: 'Your subjects live here, sorted by urgency. Each card opens a full workspace: planning, writing, and checking in one place.',
    button: 'Next',
  },
  {
    target: '[data-tour="aura-orb"]',
    label: 'This is AURA, your Socratic study guide. It asks you questions instead of writing for you. Open it any time you are stuck.',
    button: "Let's go",
  },
];

/**
 * computePosition: four-direction smart tooltip placement.
 * Returns { tipTop, tipLeft, arrowSide } where arrowSide is
 * 'top' | 'bottom' | 'left' | 'right' (the side of the tooltip
 * that points toward the spotlight target).
 */
function computePosition(rect, vw, vh) {
  const spotLeft = rect.left - SPOT_PAD;
  const spotTop = rect.top - SPOT_PAD;
  const spotRight = rect.right + SPOT_PAD;
  const spotBottom = rect.bottom + SPOT_PAD;
  const spotCX = (spotLeft + spotRight) / 2;
  const spotCY = (spotTop + spotBottom) / 2;

  const spaceBelow = vh - spotBottom - TIP_GAP;
  const spaceAbove = spotTop - TIP_GAP;
  const spaceRight = vw - spotRight - TIP_GAP;
  const spaceLeft = spotLeft - TIP_GAP;

  let tipTop, tipLeft, arrowSide;

  if (spaceBelow >= TIP_H) {
    // Place below
    tipTop = spotBottom + TIP_GAP;
    tipLeft = spotCX - TIP_W / 2;
    arrowSide = 'top';
  } else if (spaceAbove >= TIP_H) {
    // Place above
    tipTop = spotTop - TIP_GAP - TIP_H;
    tipLeft = spotCX - TIP_W / 2;
    arrowSide = 'bottom';
  } else if (spaceRight >= TIP_W) {
    // Place right
    tipLeft = spotRight + TIP_GAP;
    tipTop = spotCY - TIP_H / 2;
    arrowSide = 'left';
  } else {
    // Place left
    tipLeft = spotLeft - TIP_GAP - TIP_W;
    tipTop = spotCY - TIP_H / 2;
    arrowSide = 'right';
  }

  // Clamp within viewport with margin
  const M = 12;
  tipLeft = Math.max(M, Math.min(tipLeft, vw - TIP_W - M));
  tipTop = Math.max(M, Math.min(tipTop, vh - TIP_H - M));

  return { tipTop, tipLeft, arrowSide };
}

/**
 * OnboardingTour
 *
 * Four-step spotlight tour shown once to new users (localStorage guard).
 * Smart four-direction tooltip placement: below, above, right, or left
 * based on available viewport space. Arrow indicator shows which element
 * the step refers to. Re-measures on resize and scroll.
 */
export default function OnboardingTour() {
  const [done, setDone] = useState(() => !!localStorage.getItem(TOUR_KEY));
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState(null); // { spotX, spotY, spotW, spotH, tipTop, tipLeft, arrowSide }
  const rafRef = useRef(null);

  useEffect(() => {
    if (done) return;
    const measure = () => {
      const el = document.querySelector(STEPS[step]?.target);
      if (!el) { setPos(null); return; }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPos(null); return; }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { tipTop, tipLeft, arrowSide } = computePosition(rect, vw, vh);
      setPos({
        spotX: rect.left - SPOT_PAD,
        spotY: rect.top - SPOT_PAD,
        spotW: rect.width + SPOT_PAD * 2,
        spotH: rect.height + SPOT_PAD * 2,
        tipTop,
        tipLeft,
        arrowSide,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    rafRef.current = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [step, done]);

  if (done || !pos) return null;

  const current = STEPS[step];

  // Arrow triangle: points from tooltip toward the spotlight element
  const ARROW = 8;
  const arrowStyle = {
    position: 'absolute',
    width: 0,
    height: 0,
    ...(pos.arrowSide === 'top' && {
      top: -ARROW,
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: `${ARROW}px solid transparent`,
      borderRight: `${ARROW}px solid transparent`,
      borderBottom: `${ARROW}px solid ${SURFACE_CARD}`,
    }),
    ...(pos.arrowSide === 'bottom' && {
      bottom: -ARROW,
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: `${ARROW}px solid transparent`,
      borderRight: `${ARROW}px solid transparent`,
      borderTop: `${ARROW}px solid ${SURFACE_CARD}`,
    }),
    ...(pos.arrowSide === 'left' && {
      left: -ARROW,
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: `${ARROW}px solid transparent`,
      borderBottom: `${ARROW}px solid transparent`,
      borderRight: `${ARROW}px solid ${SURFACE_CARD}`,
    }),
    ...(pos.arrowSide === 'right' && {
      right: -ARROW,
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: `${ARROW}px solid transparent`,
      borderBottom: `${ARROW}px solid transparent`,
      borderLeft: `${ARROW}px solid ${SURFACE_CARD}`,
    }),
  };

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
      {/* Spotlight: box-shadow spread creates viewport-wide dark overlay with transparent cutout */}
      <div style={{
        position: 'absolute',
        top: pos.spotY,
        left: pos.spotX,
        width: pos.spotW,
        height: pos.spotH,
        borderRadius: BORDER_RADIUS + 2,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.76)',
        pointerEvents: 'none',
        transition: 'top 220ms ease, left 220ms ease, width 220ms ease, height 220ms ease',
      }} />

      {/* Tooltip card */}
      <div style={{
        position: 'absolute',
        top: pos.tipTop,
        left: pos.tipLeft,
        width: TIP_W,
        background: SURFACE_CARD,
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: BORDER_RADIUS + 4,
        padding: '16px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'all',
        transition: 'top 220ms ease, left 220ms ease',
      }}>
        {/* Arrow indicator */}
        <div style={arrowStyle} />

        <p style={{
          fontFamily: FONT_BODY,
          fontSize: 13,
          color: TEXT_PRIMARY,
          margin: '0 0 14px',
          lineHeight: 1.6,
        }}>
          {current.label}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            {step + 1} of {STEPS.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                style={{
                  background: 'none',
                  border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: BORDER_RADIUS,
                  color: TEXT_MUTED,
                  cursor: 'pointer',
                  fontFamily: FONT_SYSTEM,
                  fontSize: 10,
                  padding: '6px 12px',
                }}
              >
                Back
              </button>
            )}
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
                padding: '6px 16px',
              }}
            >
              {current.button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
