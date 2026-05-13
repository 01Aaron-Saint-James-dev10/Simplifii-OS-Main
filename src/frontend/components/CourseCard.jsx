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
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * CourseCard
 *
 * Course tile for the Home grid. Shows course code, name, term, assessment
 * count, rubric extraction status, next due task with countdown, status pill,
 * and Open CTA.
 *
 * Spec: PRODUCT_SPEC.md Section 8, PRODUCT_SPEC_TIER_UPDATE.md Section 8.1-8.3
 *
 * Two density variants: 'standard' and 'compact'. Reads density from props
 * (HomeScreen passes it from SettingsContext.display.cardDensity).
 *
 * Props:
 *   course       - course object from ProjectContext.courses[id]
 *   courseId      - string
 *   density      - 'standard' | 'compact'
 *   onOpen       - callback(courseId) when CTA is clicked
 *   now          - optional Date for testing
 */

function findNextDue(course, now) {
  const briefs = course.extractionData?.assessmentBriefs || [];
  let best = null;
  let bestDays = Infinity;

  for (const brief of briefs) {
    if (!brief.dueDate) continue;
    const due = new Date(brief.dueDate);
    if (isNaN(due.getTime())) continue;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToDue = Math.floor((due - now) / msPerDay);
    if (daysToDue < bestDays) {
      bestDays = daysToDue;
      best = { title: brief.title || 'Assessment', weight: brief.weight || '', dueDate: brief.dueDate };
    }
  }
  return best;
}

export default function CourseCard({ course, courseId, density = 'standard', onOpen, now: nowProp }) {
  const now = nowProp || new Date();
  const isCompact = density === 'compact';

  const name = course.name || 'Untitled Course';
  const briefs = course.extractionData?.assessmentBriefs || [];
  const assessmentCount = briefs.length;
  const rubricExtracted = course.extractionData?.rubricDetected || (course.extractionData?.rubricCriteria?.length || 0) > 0;
  const referencingStyle = course.referencingStyle || course.extractionData?.referencingStyle || null;
  const nextDue = findNextDue(course, now);
  const status = nextDue ? getTaskStatus(nextDue.dueDate, now) : null;

  return (
    <div
      style={{
        background: SURFACE_CARD,
        border: `1px solid ${SURFACE_RAISED}`,
        borderRadius: BORDER_RADIUS,
        padding: isCompact ? '12px 14px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: isCompact ? 8 : 12,
        transitionProperty: 'border-color', transitionDuration: '150ms', // allow-style
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_BORDER; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}
    >
      {/* Header: name + pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            fontFamily: FONT_BODY,
            fontSize: isCompact ? 14 : 15,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {name}
          </h3>
        </div>
        {status && <StatusPill status={status} />}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isCompact ? 10 : 14 }}>
        <MetaItem label="Assessments" value={assessmentCount > 0 ? String(assessmentCount) : 'None extracted'} />
        <MetaItem label="Rubric" value={rubricExtracted ? 'Yes' : 'No'} />
        {referencingStyle && <MetaItem label="Referencing" value={referencingStyle} />}
      </div>

      {/* Next due */}
      {nextDue && !isCompact && (
        <div style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: TEXT_MUTED,
          lineHeight: 1.4,
        }}>
          Next: <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{nextDue.title}</span>
          {nextDue.weight ? ` (${nextDue.weight})` : ''}
          {' \u00B7 '}
          <span style={{ color: status?.pill === 'red' ? '#f43f5e' : status?.pill === 'amber' ? '#f59e0b' : TEXT_MUTED }}>
            {status?.countdownText}
          </span>
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={() => onOpen?.(courseId)}
        aria-label={`Open ${name}`}
        style={{
          fontFamily: FONT_SYSTEM,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: ACCENT_PULSE,
          background: 'transparent',
          border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: BORDER_RADIUS,
          padding: isCompact ? '8px 12px' : '10px 16px',
          cursor: 'pointer',
          minHeight: 44,
          minWidth: 44,
          transition: 'all 150ms ease',
          outline: 'none',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = ACCENT_PULSE;
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = ACCENT_PULSE;
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        Open
      </button>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_FAINT }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, marginTop: 1 }}>
        {value}
      </div>
    </div>
  );
}
