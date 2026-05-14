import React, { useState, useEffect, useRef } from 'react';
import { FRAMES } from './asciiFrames';
import {
  ACCENT_PULSE,
  TEXT_MUTED,
  FONT_DISPLAY, FONT_GEIST_MONO,
} from '../../theme/tokens';

const MQ_REDUCE = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const MIDPOINT = Math.floor(FRAMES.length / 2);
const INTERVAL_MS = 200; // 5fps, full loop ~4.8s

/**
 * AsciiLoader
 *
 * Branded ASCII art loader for ingestion and save operations.
 * Renders a breathing sine-wave pattern in emerald monospace.
 *
 * Props:
 *   status - string: the message shown above the ASCII art
 */
export default function AsciiLoader({ status }) {
  const [frameIndex, setFrameIndex] = useState(MQ_REDUCE ? MIDPOINT : 0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (MQ_REDUCE) return;
    intervalRef.current = setInterval(() => {
      setFrameIndex(i => (i + 1) % FRAMES.length);
    }, INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={status}
      style={{ textAlign: 'center', padding: 24, maxWidth: 600, margin: '0 auto' }}
    >
      <p style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 14,
        color: TEXT_MUTED, // allow-style
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: 16,
        margin: '0 0 16px',
      }}>
        {status}
      </p>
      <pre
        aria-hidden="true"
        style={{
          fontFamily: FONT_GEIST_MONO,
          fontSize: 11,
          lineHeight: 1.0,
          color: ACCENT_PULSE, // allow-style
          whiteSpace: 'pre',
          overflow: 'hidden',
          opacity: 0.85,
          userSelect: 'none',
          margin: 0,
        }}
      >
        {FRAMES[frameIndex].join('\n')}
      </pre>
    </div>
  );
}
