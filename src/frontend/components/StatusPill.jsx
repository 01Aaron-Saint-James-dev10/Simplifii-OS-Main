import React from 'react';
import {
  ACCENT_PULSE,
  COLOUR_WARN,
  COLOUR_DANGER,
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
  COLOUR_DANGER_GLASS,
  COLOUR_DANGER_BORDER,
  ACCENT_GLASS,
  ACCENT_BORDER,
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SYSTEM,
} from '../../theme/tokens';

/**
 * StatusPill
 *
 * Renders a single status indicator: pill background + shape glyph + text label.
 * Spec: docs/PRODUCT_SPEC_STATUS_AND_PREFERENCES.md Section 1.1, 1.3, 1.5
 *
 * WCAG 1.4.1: information conveyed three ways (colour + shape + text).
 * aria-label carries the full description for screen readers.
 *
 * Props:
 *   status  - object returned by getTaskStatus() from StatusService.js
 */

const PILL_STYLES = {
  green: {
    background: ACCENT_GLASS,
    border: ACCENT_BORDER,
    colour: ACCENT_PULSE,
    textColour: ACCENT_PULSE,
  },
  amber: {
    background: COLOUR_WARN_GLASS,
    border: COLOUR_WARN_BORDER,
    colour: COLOUR_WARN,
    textColour: COLOUR_WARN,
  },
  red: {
    background: COLOUR_DANGER_GLASS,
    border: COLOUR_DANGER_BORDER,
    colour: COLOUR_DANGER,
    textColour: COLOUR_DANGER,
  },
};

const URGENCY_TEXT_STYLES = {
  plenty:      { colour: TEXT_MUTED, fontWeight: 400 },
  comfortable: { colour: TEXT_MUTED, fontWeight: 400 },
  'this-week': { colour: COLOUR_WARN, fontWeight: 400 },
  soon:        { colour: COLOUR_WARN, fontWeight: 500 },
  urgent:      { colour: COLOUR_WARN, fontWeight: 500 },
  critical:    { colour: COLOUR_DANGER, fontWeight: 500 },
};

function GlyphDot({ colour }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="4" fill={colour} />
    </svg>
  );
}

function GlyphRing({ colour }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="3.5" fill="none" stroke={colour} strokeWidth="1.5" />
    </svg>
  );
}

function GlyphTriangle({ colour }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 1 L9 9 L1 9 Z" fill="none" stroke={colour} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

const GLYPH_MAP = {
  dot: GlyphDot,
  ring: GlyphRing,
  triangle: GlyphTriangle,
};

export default function StatusPill({ status }) {
  if (!status) return null;

  const pillStyle = PILL_STYLES[status.pill] || PILL_STYLES.green;
  const Glyph = GLYPH_MAP[status.glyph] || GlyphDot;
  const urgencyStyle = URGENCY_TEXT_STYLES[status.urgency] || URGENCY_TEXT_STYLES.comfortable;

  const ariaDescription = status.state === 'overdue'
    ? `Status: ${status.label}, ${status.countdownText}`
    : `Status: ${status.label}, due ${status.countdownText}`;

  return (
    <span
      role="status"
      aria-label={ariaDescription}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 3,
        background: pillStyle.background,
        border: `1px solid ${pillStyle.border}`,
        fontFamily: FONT_SYSTEM,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <Glyph colour={pillStyle.colour} />
      <span style={{ color: pillStyle.textColour }}>{status.label}</span>
      <span
        style={{
          color: urgencyStyle.colour,
          fontWeight: urgencyStyle.fontWeight,
          fontSize: 10,
          textTransform: 'none',
          letterSpacing: '0.02em',
        }}
      >
        {status.countdownText}
      </span>
    </span>
  );
}
