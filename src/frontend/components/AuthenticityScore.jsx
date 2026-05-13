import React from 'react';
import {
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  FONT_SYSTEM,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * AuthenticityScore
 *
 * Displays the work provenance summary as visual indicators.
 * All data from real HistoryOfThought events, no backend AI.
 *
 * Props:
 *   summary - { totalSessions, totalWords, totalMinutes, totalEdits, editRatio }
 */

export default function AuthenticityScore({ summary }) {
  const s = summary || {};
  const hasHistory = (s.totalSessions || 0) >= 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Work history signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: hasHistory ? ACCENT_PULSE : TEXT_FAINT,
          display: 'inline-block',
        }} aria-hidden="true" />
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: hasHistory ? TEXT_PRIMARY : TEXT_MUTED }}>
          {hasHistory ? 'Work history detected' : 'Keep writing to build your record'}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <StatBox label="Sessions" value={String(s.totalSessions || 0)} />
        <StatBox label="Time on task" value={`${s.totalMinutes || 0}m`} />
        <StatBox label="Total edits" value={String(s.totalEdits || 0)} />
        <StatBox label="Edit ratio" value={s.editRatio?.toFixed(2) || '0.00'} sub="(normal: 0.3 to 3.0)" />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginTop: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>{sub}</div>}
    </div>
  );
}
