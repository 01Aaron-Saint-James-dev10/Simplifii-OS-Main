import React from 'react';
import { useRouter } from '../../contexts/RouterContext';
import stripMarkdown from '../../utils/stripMarkdown';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS,
  GLASS_BORDER,
  COLOUR_WARN, COLOUR_DANGER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function dueLabel(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return { text: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, colour: COLOUR_DANGER }; /* allow-style */
  if (days === 0) return { text: 'Due today', colour: COLOUR_WARN }; /* allow-style */
  if (days <= 7) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, colour: COLOUR_WARN }; /* allow-style */
  if (days <= 21) return { text: `in ${Math.ceil(days / 7)} week${Math.ceil(days / 7) === 1 ? '' : 's'}`, colour: TEXT_MUTED }; /* allow-style */
  return { text: new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), colour: TEXT_MUTED }; /* allow-style */
}

/**
 * AssessmentListView
 *
 * Renders a list of assessments for a course. Each row is clickable
 * and navigates to CanvasScreen scoped to that assessment.
 */
export default function AssessmentListView({ courseId, courseName, briefs, onBack }) {
  const { navigateToCanvas } = useRouter();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <button
        type="button"
        onClick={onBack}
        style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}
      >
        &larr; All courses
      </button>

      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
        {stripMarkdown(courseName)}
      </h1>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, margin: '0 0 24px', letterSpacing: '0.04em' }}>
        {briefs.length} assessment{briefs.length === 1 ? '' : 's'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {briefs.map((brief, i) => {
          const due = dueLabel(brief.dueDate);
          const displayTitle = brief.weight ? `${brief.title} (${brief.weight})` : brief.title;
          return (
            <button
              key={i}
              type="button"
              onClick={() => navigateToCanvas(courseId, displayTitle)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: SURFACE_CARD,
                border: `1px solid ${GLASS_BORDER}`, borderRadius: BORDER_RADIUS + 4,
                cursor: 'pointer', outline: 'none', textAlign: 'left',
                transition: 'border-color 150ms ease', /* allow-style */
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_BORDER; }} /* allow-style */
              onMouseLeave={e => { e.currentTarget.style.borderColor = GLASS_BORDER; }} /* allow-style */
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
                  {brief.title}
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {brief.weight && (
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT_FAINT }}>
                      {brief.weight}
                    </span>
                  )}
                  {due && (
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: due.colour }}> {/* allow-style */}
                      {due.text}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, padding: '4px 10px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
                {brief.status || 'Draft'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
