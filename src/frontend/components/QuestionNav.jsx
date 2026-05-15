import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * QuestionNav
 *
 * Left sidebar listing all questions from an exam paper.
 * Shows question number, marks, and status.
 *
 * Props:
 *   questions      - [{ number, text, marks, section }]
 *   activeQuestion - number
 *   onSelect       - callback(questionNumber)
 *   progress       - { [questionNumber]: { viewed_formats: [], time_spent } }
 */
export default function QuestionNav({ questions = [], activeQuestion, onSelect, progress = {} }) {
  if (!questions.length) return null;

  // Group by section
  const sections = {};
  for (const q of questions) {
    const sec = q.section || 'Questions';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(q);
  }

  return (
    <nav style={{ width: 160, padding: '8px 0', overflowY: 'auto', borderRight: `1px solid ${SURFACE_RAISED}` }}
      aria-label="Question list">

      {Object.entries(sections).map(([sectionName, sectionQs]) => (
        <div key={sectionName}>
          <div style={{
            fontFamily: FONT_SYSTEM, fontSize: 8, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: TEXT_FAINT, padding: '8px 12px 4px',
          }}>
            {sectionName}
          </div>

          {sectionQs.map(q => {
            const isActive = activeQuestion === q.number;
            const prog = progress[q.number];
            const hasViewed = prog?.viewed_formats?.length > 0;

            return (
              <button
                key={q.number}
                type="button"
                onClick={() => onSelect(q.number)}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '6px 12px', textAlign: 'left',
                  background: isActive ? ACCENT_GLASS : 'transparent',
                  border: 'none', borderLeft: isActive ? `2px solid ${ACCENT_PULSE}` : '2px solid transparent',
                  cursor: 'pointer', outline: 'none', minHeight: 32,
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING} inset`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? ACCENT_PULSE : hasViewed ? TEXT_PRIMARY : TEXT_MUTED,
                }}>
                  Q{q.number}
                </span>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                  {q.marks > 0 ? `${q.marks}m` : ''}
                  {hasViewed ? ' \u2713' : ''}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
