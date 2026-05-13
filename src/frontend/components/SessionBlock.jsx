import React, { useState } from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * SessionBlock
 *
 * Expandable block showing one writing session's details.
 *
 * Props:
 *   session - object from ProvenanceService.buildSessions
 */

export default function SessionBlock({ session }) {
  const [expanded, setExpanded] = useState(false);
  const s = session;

  return (
    <div style={{ border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Session ${s.index}: ${s.durationMinutes} minutes, ${s.wordsNet >= 0 ? '+' : ''}${s.wordsNet} words`}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer', outline: 'none', minHeight: 44,
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE }}>
            #{s.index}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY }}>
            {new Date(s.start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>
            {s.durationMinutes}m
          </span>
        </div>
        <span style={{
          fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600,
          color: s.wordsNet >= 0 ? ACCENT_PULSE : TEXT_MUTED, // allow-style
        }}>
          {s.wordsNet >= 0 ? '+' : ''}{s.wordsNet} words
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Stat label="Start" value={new Date(s.start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} />
          <Stat label="End" value={new Date(s.end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} />
          <Stat label="Edits" value={String(s.editCount)} />
          <Stat label="Words start" value={String(s.wordsStart)} />
          <Stat label="Words end" value={String(s.wordsEnd)} />
          <Stat label="Avg pause" value={`${Math.round(s.averagePauseMs / 1000)}s`} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT }}>{label}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, marginTop: 1 }}>{value}</div>
    </div>
  );
}
