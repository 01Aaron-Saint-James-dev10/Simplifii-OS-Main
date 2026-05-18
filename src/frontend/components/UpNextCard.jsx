import React from 'react';
import { getTaskStatus } from '../../services/StatusService';
import StatusPill from './StatusPill';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_HOVER,
  ACCENT_BORDER,
  ACCENT_BORDER_FAINT,
  ACCENT_FOCUS,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
  SHADOW_CARD_DEFAULT,
  SHADOW_UPNEXT,
} from '../../theme/tokens';

/**
 * UpNextCard
 *
 * Hero card showing the single most urgent task across all courses.
 * Spec: PRODUCT_SPEC.md Section 8 (priority panel),
 *       PRODUCT_SPEC_STATUS_AND_PREFERENCES.md Section 2.2
 *
 * Props:
 *   courses       - object keyed by courseId from ProjectContext.courses
 *   onOpenCanvas  - callback(courseId, assessmentTitle) when CTA is clicked
 *   now           - optional Date for testing
 */

function findMostUrgentTask(courses, now) {
  let best = null;
  let bestDays = Infinity;

  for (const [courseId, course] of Object.entries(courses || {})) {
    const briefs = course.extractionData?.assessmentBriefs || [];
    for (const brief of briefs) {
      if (!brief.dueDate) continue;
      const due = new Date(brief.dueDate);
      if (isNaN(due.getTime())) continue;
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysToDue = Math.floor((due - now) / msPerDay);
      if (daysToDue < bestDays) {
        bestDays = daysToDue;
        best = {
          courseId,
          courseName: course.name || 'Untitled',
          title: brief.title || 'Assessment',
          weight: brief.weight || '',
          wordCountGoal: brief.wordCountGoal || null,
          dueDate: brief.dueDate,
          format: brief.format || null,
          language: brief.language || null,
          rubricExtracted: !!(course.extractionData?.rubricDetected || course.extractionData?.rubricCriteria?.length > 0),
        };
      }
    }
  }
  return best;
}

export default function UpNextCard({ courses, onOpenCanvas, now: nowProp }) {
  const now = nowProp || new Date();
  const task = findMostUrgentTask(courses, now);

  if (!task) {
    return (
      <div
        style={{
          background: SURFACE_CARD,
          border: `1px solid ${SURFACE_RAISED}`,
          borderRadius: 16,
          padding: '28px',
          textAlign: 'center',
          boxShadow: SHADOW_CARD_DEFAULT,
        }}
      >
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: 0 }}>
          No tasks with due dates yet. Upload a course to get started.
        </p>
      </div>
    );
  }

  const status = getTaskStatus(task.dueDate, now);

  return (
    <div
      style={{
        background: SURFACE_CARD,
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: 16,
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: SHADOW_UPNEXT,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span
            style={{
              fontFamily: FONT_SYSTEM,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: ACCENT_PULSE,
            }}
          >
            Most urgent
          </span>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 12, color: TEXT_FAINT, margin: '4px 0 0', letterSpacing: '0.02em' }}>
            {task.courseName}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      {/* Task title */}
      <h2 style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
        {task.title}
      </h2>

      {/* Detail row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {task.weight && (
          <DetailField label="Weight" value={task.weight} />
        )}
        {task.wordCountGoal && (
          <DetailField label="Target" value={`${task.wordCountGoal.toLocaleString()} words`} />
        )}
        {task.format && (
          <DetailField label="Format" value={task.format} />
        )}
        {task.language && (
          <DetailField label="Language" value={task.language} />
        )}
        <DetailField
          label="Rubric"
          value={task.rubricExtracted ? 'Extracted' : 'Not yet'}
        />
        <DetailField label="Due" value={status.countdownText} />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onOpenCanvas?.(task.courseId, task.title)}
        aria-label={`Open canvas for ${task.title}`}
        style={{
          fontFamily: FONT_SYSTEM,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#000',
          background: ACCENT_PULSE,
          border: 'none',
          borderRadius: 8,
          padding: '14px 24px',
          cursor: 'pointer',
          minHeight: 44,
          alignSelf: 'flex-start',
          transition: 'background 150ms ease, transform 100ms ease', // allow-style
          outline: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = ACCENT_HOVER; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = ACCENT_PULSE; e.currentTarget.style.transform = 'none'; }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        Open canvas
      </button>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, marginTop: 3 }}>
        {value}
      </div>
    </div>
  );
}
