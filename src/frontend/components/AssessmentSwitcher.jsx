import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * AssessmentSwitcher
 *
 * Left sidebar list of all assessments within a course.
 * Lets the learner switch between assessments without going back to HomeScreen.
 *
 * Props:
 *   assessments       - array of { title, weight, dueDate }
 *   activeTitle       - currently selected assessment title
 *   onSelect          - callback(assessmentTitle)
 */
export default function AssessmentSwitcher({ assessments, activeTitle, onSelect }) {
  if (!assessments || assessments.length <= 1) return null;

  return (
    <div style={{
      padding: '8px 0',
      borderBottom: `1px solid ${SURFACE_RAISED}`,
      marginBottom: 8,
    }}>
      <p style={{
        fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: TEXT_FAINT, padding: '0 12px', margin: '0 0 6px',
      }}>
        Assessments ({assessments.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {assessments.map((a, i) => {
          const isActive = a.title === activeTitle || (!activeTitle && i === 0);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(a.title)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: '8px 12px',
                background: isActive ? ACCENT_GLASS : 'transparent',
                border: 'none',
                borderLeft: isActive ? `2px solid ${ACCENT_PULSE}` : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
              }}
            >
              <span style={{
                fontFamily: FONT_BODY, fontSize: 11, fontWeight: isActive ? 600 : 400,
                color: isActive ? TEXT_PRIMARY : TEXT_MUTED,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {a.title || `Assessment ${i + 1}`}
              </span>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                {[a.weight, a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` : ''].filter(Boolean).join(' | ') || 'No details'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
