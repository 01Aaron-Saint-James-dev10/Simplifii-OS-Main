import React from 'react';
import {
  ACCENT_AMBER, ACCENT_AMBER_GLASS, ACCENT_AMBER_BORDER,
  FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../../theme/tokens';

/**
 * AiSuggestionLabel (Layer 3b)
 *
 * Reusable inline label for AI-generated content blocks.
 * Shows a subtle amber pill with context-appropriate text.
 *
 * Props:
 *   blockType - 'draft' | 'summary' | 'suggestion' | 'citation' | 'rubric'
 *
 * Not wired into existing features yet (future sprint).
 */

const LABELS = {
  draft:      'AI-suggested draft. Read carefully. Edit in your own voice.',
  summary:    'AI-generated summary. Verify key details against your sources.',
  suggestion: 'AI-suggested. Read carefully. Edit in your own voice. Verify any claims.',
  citation:   'AI-matched citation. Check it exists and says what you think it says.',
  rubric:     'AI interpretation. Your teacher is the authority. When uncertain, ask them.',
};

export default function AiSuggestionLabel({ blockType = 'suggestion' }) {
  const text = LABELS[blockType] || LABELS.suggestion;

  return (
    <span style={s.pill} aria-label={text}>
      {text}
    </span>
  );
}

const s = {
  pill: {
    display: 'inline-block',
    padding: '3px 8px',
    background: ACCENT_AMBER_GLASS,
    border: `1px solid ${ACCENT_AMBER_BORDER}`,
    borderRadius: BORDER_RADIUS,
    fontFamily: FONT_SYSTEM,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
};
