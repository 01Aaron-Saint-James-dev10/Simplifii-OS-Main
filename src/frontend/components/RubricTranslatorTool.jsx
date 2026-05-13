import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  FONT_SYSTEM,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * RubricTranslatorTool
 *
 * Renders inside ToolModal. Shows rubric criteria translated into
 * plain language with "what the marker wants".
 *
 * Props:
 *   result - output from RubricTranslatorService.runRubricTranslator
 */

export default function RubricTranslatorTool({ result }) {
  if (!result || !result.plainCriteria) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {result.plainCriteria.map((c, i) => (
        <div key={i} style={{ borderBottom: `1px solid ${SURFACE_RAISED}`, paddingBottom: 10 }}>
          <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT_FAINT, marginBottom: 4 }}>
            Original
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>
            {c.original}
          </div>
          <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ACCENT_PULSE, marginBottom: 2 }}>
            Plain language
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, marginBottom: 6, lineHeight: 1.4 }}>
            {c.simplified}
          </div>
          <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT_FAINT, marginBottom: 2 }}>
            What the marker wants
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, lineHeight: 1.4 }}>
            {c.whatMarkerWants}
          </div>
        </div>
      ))}
    </div>
  );
}
