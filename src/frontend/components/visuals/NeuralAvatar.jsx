/**
 * NeuralAvatar.jsx
 *
 * Living SVG Neural Signature avatars for Bowser-OS.
 * Three personas, each with a distinct geometric style and animation signature:
 *
 *   'browser'  (BrOWSER)  - Research mode. Heavy geometric shell, emerald glow.
 *                           Shoots flame particles on word-count milestones.
 *   'sparq'    (SP-RK)    - HSC mode. Erratic lightning lines, fast kinetic energy.
 *                           Vibrates during high-focus Deep Work sessions.
 *   'compass'  (C-MPASS)  - Undergrad mode. Smooth orbital rings, calming rotation.
 *                           Pulses slowly to reduce assessment anxiety.
 *
 * All avatars draw themselves on mount via Framer Motion pathLength transitions.
 *
 * Props:
 *   persona    - 'browser' | 'sparq' | 'compass'   (default: 'browser')
 *   wordCount  - number   (drives Drift burst on every 100-word milestone)
 *   deepWork   - boolean  (SP-RK vibrates faster; BrOWSER hardens geometry)
 *   size       - number   (SVG width/height px, default 80)
 *   style      - object   (optional container style override)
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import {
  ACCENT_PULSE,
  ACCENT_BORDER_STRONG,
  ACCENT_GLOW_50,
  SURFACE_RAISED,
  TEXT_LABEL,
  COLOUR_WARN,
  COLOUR_WARN_FOCUS,
  COLOUR_INFO,
  COLOUR_INFO_DIM,
  COLOUR_INFO_BORDER,
} from '../../../theme/tokens';

// ─── Design tokens ────────────────────────────────────────────────────────────

const EMERALD      = ACCENT_PULSE;
const EMERALD_DIM  = ACCENT_BORDER_STRONG;
const EMERALD_MID  = ACCENT_GLOW_50;
const ZINC_800     = SURFACE_RAISED;
const ZINC_700     = TEXT_LABEL;
const AMBER        = COLOUR_WARN;
const AMBER_DIM    = COLOUR_WARN_FOCUS;
const BLUE         = COLOUR_INFO;
const BLUE_DIM     = COLOUR_INFO_DIM;

// ─── Path data ────────────────────────────────────────────────────────────────

function browserPaths(deepWork) {
  // Heavy geometric Bowser shell: crown spikes, head, brow, jaw, collar, shell arc
  const spike = deepWork ? 1.8 : 1.4;
  return [
    { d: 'M 28 38 L 18 17 L 32 32', w: spike + 0.4 },
    { d: 'M 50 33 L 50 13 L 57 29', w: spike + 0.4 },
    { d: 'M 66 38 L 78 17 L 68 33', w: spike + 0.4 },
    { d: 'M 24 42 Q 24 26 50 24 Q 76 26 76 42 L 76 64 Q 76 76 50 76 Q 24 76 24 64 Z', w: deepWork ? 2.2 : 1.8 },
    { d: 'M 33 49 Q 38 44 44 49', w: 1.4 },
    { d: 'M 56 49 Q 62 44 67 49', w: 1.4 },
    { d: 'M 35 67 Q 50 73 65 67', w: 1.6 },
    { d: 'M 28 79 Q 50 86 72 79', w: 1.2 },
    { d: 'M 36 84 Q 50 92 64 84', w: 1.0 },
  ];
}

function sparqPaths() {
  // Erratic lightning bolt geometry
  return [
    { d: 'M 50 15 L 38 45 L 50 40 L 38 75', w: 2.0 },
    { d: 'M 35 25 L 22 42 L 35 38', w: 1.4 },
    { d: 'M 65 25 L 78 42 L 65 38', w: 1.4 },
    { d: 'M 30 50 L 20 60 L 32 58 L 25 72', w: 1.2 },
    { d: 'M 70 50 L 80 60 L 68 58 L 75 72', w: 1.2 },
    { d: 'M 40 20 L 30 15 L 38 28', w: 1.0 },
    { d: 'M 60 20 L 70 15 L 62 28', w: 1.0 },
  ];
}

function compassPaths() {
  // Smooth orbital circles and flowing arcs
  return [
    { d: 'M 50 20 A 30 30 0 1 1 49.9 20', w: 1.4 },
    { d: 'M 50 30 A 20 20 0 1 1 49.9 30', w: 1.2 },
    { d: 'M 50 10 L 50 90', w: 0.8 },
    { d: 'M 10 50 L 90 50',  w: 0.8 },
    { d: 'M 29 29 L 71 71',  w: 0.6 },
    { d: 'M 71 29 L 29 71',  w: 0.6 },
    { d: 'M 50 40 A 10 10 0 1 1 49.9 40', w: 1.8 },
  ];
}

// ─── Flame particle (BrOWSER milestone) ──────────────────────────────────────

function FlameParticle({ angle, onDone }) {
  const rad = (angle * Math.PI) / 180;
  const dx  = Math.cos(rad) * 38;
  const dy  = Math.sin(rad) * 38;
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, x: dx, y: dy, scale: 0.3 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position:    'absolute',
        top:         '50%',
        left:        '50%',
        width:        6,
        height:       6,
        marginTop:   -3,
        marginLeft:  -3,
        borderRadius: '50%',
        background:  EMERALD,
        boxShadow:   `0 0 6px 2px ${EMERALD_MID}`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Lightning flash (SP-RK Deep Work) ───────────────────────────────────────

function LightningFlash() {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: [0.8, 0, 0.6, 0] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position:     'absolute',
        inset:         0,
        borderRadius: '50%',
        background:   `radial-gradient(circle, ${AMBER_DIM}, transparent 70%)`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Orbital ring (C-MPASS) ───────────────────────────────────────────────────

function OrbitalRing({ size, duration, color }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{
        position:    'absolute',
        top:          '50%',
        left:         '50%',
        width:        size,
        height:       size,
        marginTop:   -(size / 2),
        marginLeft:  -(size / 2),
        borderRadius: '50%',
        border:       `1px solid ${color}`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const FLAME_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * BrOWSER 2.0 states:
 *   'idle'      - gentle breathing pulse (default)
 *   'listening' - faster pulse, expanded glow ring
 *   'thinking'  - rapid shimmer, geometry rotating slowly
 *   'speaking'  - pulsing at speech rhythm cadence
 *   'resting'   - minimal glow, near-static, low opacity
 */
export default function NeuralAvatar({ persona = 'browser', wordCount = 0, deepWork = false, size = 80, state = 'idle', style }) {
  const pathControls = useAnimation();
  const glowControls = useAnimation();
  const prevMilestone = useRef(0);
  const [flames,    setFlames]    = useState([]);
  const [flashing,  setFlashing]  = useState(false);

  const isBrowser = persona === 'browser';
  const isSparq   = persona === 'sparq';
  const isCompass  = persona === 'compass';

  const accentColor = isBrowser ? EMERALD : isSparq ? AMBER : BLUE;
  const accentDim   = isBrowser ? EMERALD_DIM : isSparq ? AMBER_DIM : BLUE_DIM;

  const paths = isBrowser
    ? browserPaths(deepWork)
    : isSparq
    ? sparqPaths()
    : compassPaths();

  // Draw on mount
  useEffect(() => {
    pathControls.start(i => ({
      pathLength: 1,
      opacity:    1,
      transition: {
        pathLength: { delay: i * 0.06, duration: isSparq ? 0.35 : isCompass ? 1.0 : 0.65, ease: 'easeOut' },
        opacity:    { delay: i * 0.06, duration: 0.2 },
      },
    }));
    // BrOWSER 2.0: glow pulse varies by state
    const stateConfig = {
      idle:      { duration: isSparq ? 0.8 : isCompass ? 4 : 3, peak: isSparq ? 0.9 : 0.65 },
      listening: { duration: 1.2, peak: 0.85 },
      thinking:  { duration: 0.6, peak: 0.95 },
      speaking:  { duration: 0.9, peak: 0.75 },
      resting:   { duration: 6, peak: 0.3 },
    };
    const cfg = stateConfig[state] || stateConfig.idle;
    glowControls.start({
      opacity: [state === 'resting' ? 0.1 : 0.3, cfg.peak, state === 'resting' ? 0.1 : 0.3],
      transition: { duration: cfg.duration, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [state]); // eslint-disable-line

  // Redraw when deepWork changes (BrOWSER geometry hardens)
  useEffect(() => {
    if (!isBrowser) return;
    pathControls.start({ pathLength: 1, opacity: 1, transition: { duration: 0.4 } });
  }, [deepWork, isBrowser, pathControls]);

  // Drift milestone: emit flame particles (BrOWSER) or lightning flash (SP-RK)
  useEffect(() => {
    const milestone = Math.floor(wordCount / 100) * 100;
    if (milestone > 0 && milestone !== prevMilestone.current) {
      prevMilestone.current = milestone;
      if (isBrowser) {
        const newFlames = FLAME_ANGLES.map(angle => ({ id: `${Date.now()}-${angle}`, angle }));
        setFlames(prev => [...prev, ...newFlames]);
      } else if (isSparq) {
        setFlashing(true);
        setTimeout(() => setFlashing(false), 400);
      }
    }
  }, [wordCount, isBrowser, isSparq]);

  function removeFlame(id) {
    setFlames(prev => prev.filter(f => f.id !== id));
  }

  const containerStyle = {
    position: 'relative', width: size, height: size, flexShrink: 0,
    opacity: state === 'resting' ? 0.5 : 1,
    transition: 'opacity 0.8s ease',
    ...style,
  };

  return (
    <div style={containerStyle}>
      {/* C-MPASS orbital rings (behind SVG) */}
      {isCompass && (
        <>
          <OrbitalRing size={size * 0.95} duration={8}  color={BLUE_DIM} />
          <OrbitalRing size={size * 0.70} duration={5}  color={COLOUR_INFO_BORDER} />
        </>
      )}

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        style={{
          display: 'block', position: 'relative', zIndex: 1,
          animation: state === 'thinking' ? 'browserThinkSpin 8s linear infinite' : 'none',
        }}
      >
        <circle cx="50" cy="50" r="48" fill={ZINC_800} stroke={ZINC_700} strokeWidth="1" />

        {/* Outer glow ring */}
        <motion.circle
          cx="50" cy="50" r="46"
          stroke={accentDim}
          strokeWidth="1.5"
          fill="none"
          animate={glowControls}
        />

        {/* Persona paths */}
        {paths.map((p, i) => (
          <motion.path
            key={i}
            custom={i}
            d={p.d}
            stroke={accentColor}
            strokeWidth={p.w}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={pathControls}
            style={{ filter: `drop-shadow(0 0 3px ${accentDim})` }}
          />
        ))}
      </svg>

      {/* BrOWSER flame particles */}
      <AnimatePresence>
        {flames.map(f => (
          <FlameParticle key={f.id} angle={f.angle} onDone={() => removeFlame(f.id)} />
        ))}
      </AnimatePresence>

      {/* SP-RK lightning flash */}
      <AnimatePresence>
        {flashing && <LightningFlash key="flash" />}
      </AnimatePresence>

      {/* BrOWSER 2.0 state keyframes */}
      <style>{`
        @keyframes browserThinkSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
