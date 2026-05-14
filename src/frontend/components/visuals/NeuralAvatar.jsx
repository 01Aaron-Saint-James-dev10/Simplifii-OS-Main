/**
 * NeuralAvatar.jsx
 *
 * Living SVG line-work avatar for Bowser-OS (Research mode).
 * Composed of geometric zinc-950 outlines with emerald-500 glow.
 *
 * Animations (Framer Motion):
 *   1. "Draw" on mount: pathLength 0 -> 1 for each line segment.
 *   2. "Pulse": opacity cycles on the glow ring every 3s.
 *   3. "Drift" burst: triggered externally via wordCount prop.
 *      Every 100-word milestone fires a high-speed line-stroke
 *      across the HUD (mimics a Mario Kart speed boost).
 *
 * Props:
 *   wordCount  - number  (current editor word count, drives Drift)
 *   size       - number  (SVG width/height in px, default 80)
 *   style      - object  (optional container style override)
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

const EMERALD   = '#10b981';
const EMERALD_DIM = 'rgba(16,185,129,0.3)';
const ZINC_800  = '#27272a';
const ZINC_700  = '#3f3f46';

function bowserPaths() {
  // Geometric Bowser silhouette rendered as line segments.
  // All coordinates are in a 100x100 viewBox.
  // Shapes: crown spikes, brow ridge, jaw, collar, shell highlight.
  return [
    // Crown spike left
    'M 30 38 L 22 20 L 34 32',
    // Crown spike centre
    'M 50 35 L 50 16 L 56 30',
    // Crown spike right
    'M 64 38 L 74 20 L 66 34',
    // Head outline
    'M 26 40 Q 26 28 50 26 Q 74 28 74 40 L 74 62 Q 74 74 50 74 Q 26 74 26 62 Z',
    // Left brow
    'M 34 46 Q 38 43 44 46',
    // Right brow
    'M 56 46 Q 62 43 66 46',
    // Jaw line
    'M 36 64 Q 50 70 64 64',
    // Collar
    'M 30 76 Q 50 82 70 76',
    // Shell highlight arc
    'M 38 80 Q 50 90 62 80',
  ];
}

function SpeedBurst({ onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0.9, scaleX: 0, x: -40 }}
      animate={{ opacity: 0, scaleX: 1, x: 80 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '140%',
        height: 2,
        background: `linear-gradient(90deg, transparent, ${EMERALD}, transparent)`,
        transformOrigin: 'left center',
        boxShadow: `0 0 8px 2px ${EMERALD_DIM}`,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function NeuralAvatar({ wordCount = 0, size = 80, style }) {
  const controls     = useAnimation();
  const glowControls = useAnimation();
  const prevMilestone = useRef(0);
  const [drifting, setDrifting] = useState(false);

  // Draw on mount
  useEffect(() => {
    controls.start(i => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.06, duration: 0.7, ease: 'easeOut' },
        opacity:    { delay: i * 0.06, duration: 0.2 },
      },
    }));
    // Start glow pulse loop
    glowControls.start({
      opacity: [0.3, 0.7, 0.3],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    });
  }, []); // eslint-disable-line

  // Drift burst every 100-word milestone
  useEffect(() => {
    const milestone = Math.floor(wordCount / 100) * 100;
    if (milestone > 0 && milestone !== prevMilestone.current) {
      prevMilestone.current = milestone;
      setDrifting(true);
    }
  }, [wordCount]);

  const paths = bowserPaths();

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      {/* Speed burst overlay */}
      <AnimatePresence>
        {drifting && (
          <SpeedBurst key="burst" onDone={() => setDrifting(false)} />
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        {/* Dark base fill */}
        <circle cx="50" cy="50" r="48" fill={ZINC_800} stroke={ZINC_700} strokeWidth="1" />

        {/* Outer glow ring */}
        <motion.circle
          cx="50" cy="50" r="46"
          stroke={EMERALD_DIM}
          strokeWidth="1.5"
          fill="none"
          animate={glowControls}
        />

        {/* Geometric line segments */}
        {paths.map((d, i) => (
          <motion.path
            key={i}
            custom={i}
            d={d}
            stroke={EMERALD}
            strokeWidth={i < 3 ? 1.8 : 1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={controls}
            style={{
              filter: `drop-shadow(0 0 3px ${EMERALD_DIM})`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
