import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SYSTEM,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * PreviewPanel
 *
 * Right panel. Renders the draft as formatted output.
 * For v1: styled read-only text container (no markdown parsing).
 *
 * Props:
 *   draftText  - string (current editor content)
 *   wordCount  - number
 */

export default function PreviewPanel({ draftText, wordCount }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: `1px solid ${SURFACE_RAISED}`, paddingBottom: 8, marginBottom: 12 }}>
        <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
          Preview
        </h3>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_MUTED }}>
          {wordCount} words
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          fontFamily: FONT_BODY,
          fontSize: 13,
          lineHeight: 1.7,
          color: TEXT_PRIMARY,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        aria-label="Draft preview"
      >
        {draftText || 'Start writing to see a preview.'}
      </div>
    </div>
  );
}
