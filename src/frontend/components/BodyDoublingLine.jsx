import React from 'react';
import {
  TEXT_FAINT,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * BodyDoublingLine
 *
 * Honest beta copy. Previously showed a hardcoded "47 students working
 * alongside you" which was fiction. Replaced with transparent beta messaging.
 */
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
      Beta. Local-only. Your work stays yours.
    </p>
  );
}
