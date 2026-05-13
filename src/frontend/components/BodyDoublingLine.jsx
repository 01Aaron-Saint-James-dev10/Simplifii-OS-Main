import React from 'react';
import {
  TEXT_FAINT,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * BodyDoublingLine
 *
 * "47 students working alongside you" soft text.
 * Spec: PRODUCT_SPEC_INCLUSION_AND_MOAT.md Section 1.7
 *
 * No pulsing dot on Home (that lives on canvas).
 * For v1 the count is hardcoded.
 *
 * Props: none
 */

// TODO: wire to real anonymous aggregate count from telemetry.
const HARDCODED_COUNT = 47;

export default function BodyDoublingLine() {
  return (
    <p
      style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        color: TEXT_FAINT,
        textAlign: 'center',
        margin: 0,
        padding: '4px 0',
      }}
      aria-live="polite"
    >
      {HARDCODED_COUNT} students working alongside you
    </p>
  );
}
