import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * SourcesPanel
 *
 * Right panel. Lists uploaded source PDFs for this course.
 * For v1: shows file names from course.extractionData.sourceFiles.
 *
 * Props:
 *   sourceFiles - string array (file names)
 */

export default function SourcesPanel({ sourceFiles }) {
  const files = sourceFiles && sourceFiles.length > 0 ? sourceFiles : [];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 12px' }}>
        Sources
      </h3>

      {files.length === 0 ? (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0, lineHeight: 1.5 }}>
          No source files uploaded for this course. Upload PDFs from the Home screen.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <li
              key={i}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: TEXT_PRIMARY,
                padding: '8px 10px',
                border: `1px solid ${SURFACE_RAISED}`,
                borderRadius: BORDER_RADIUS,
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginRight: 6 }}>PDF</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
