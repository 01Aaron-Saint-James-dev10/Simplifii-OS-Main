import React from 'react';
import SessionBlock from './SessionBlock';
import {
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * EventTimeline
 *
 * Renders a vertical list of writing sessions from ProvenanceService.
 *
 * Props:
 *   sessions - array from ProvenanceService.buildSessions
 */

export default function EventTimeline({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0, lineHeight: 1.5 }}>
        No writing sessions recorded yet. Start writing to build your timeline.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 4 }}>
        Writing sessions ({sessions.length})
      </div>
      {sessions.map(s => (
        <SessionBlock key={s.id} session={s} />
      ))}
    </div>
  );
}
