import React from 'react';
import { getTaskStatus } from '../../services/StatusService';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
  COLOUR_DANGER,
  COLOUR_DANGER_GLASS,
  COLOUR_DANGER_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * TimelineStrip
 *
 * 7-day horizontal strip: today + next 6 days.
 * Each cell shows day name + date + task cards due that day.
 * Overdue tasks anchor leftmost in red trim.
 *
 * Spec: PRODUCT_SPEC_INCLUSION_AND_MOAT.md Section 1.7
 *       PRODUCT_SPEC_STATUS_AND_PREFERENCES.md Section 2.2
 *
 * Props:
 *   courses  - object keyed by courseId from ProjectContext.courses
 *   now      - optional Date for testing (defaults to new Date())
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function collectTasks(courses) {
  const tasks = [];
  for (const [courseId, course] of Object.entries(courses || {})) {
    const briefs = course.extractionData?.assessmentBriefs || [];
    if (briefs.length === 0) {
      // Course with no briefs: still show it as undated
      tasks.push({
        courseId,
        courseName: course.name || 'Untitled',
        title: course.name || 'Untitled',
        weight: '',
        dueDate: null,
      });
      continue;
    }
    for (const brief of briefs) {
      tasks.push({
        courseId,
        courseName: course.name || 'Untitled',
        title: brief.title || 'Assessment',
        weight: brief.weight || '',
        dueDate: brief.dueDate || null,
      });
    }
  }
  return tasks;
}

function parseDueDate(dueDateStr) {
  const d = new Date(dueDateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

const TRIM_COLOURS = {
  green: { bg: ACCENT_GLASS, border: ACCENT_BORDER, text: ACCENT_PULSE },
  amber: { bg: COLOUR_WARN_GLASS, border: COLOUR_WARN_BORDER, text: COLOUR_WARN },
  red:   { bg: COLOUR_DANGER_GLASS, border: COLOUR_DANGER_BORDER, text: COLOUR_DANGER },
};

export default function TimelineStrip({ courses, now: nowProp }) {
  const now = nowProp || new Date();

  // Build 7-day range
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      key: buildDayKey(d),
      dayName: i === 0 ? 'Today' : DAY_NAMES[d.getDay()],
      dateNum: d.getDate(),
      month: d.toLocaleString('en-AU', { month: 'short' }),
      date: d,
    });
  }

  // Collect and categorise all tasks
  const allTasks = collectTasks(courses);
  const overdueTasks = [];
  const undatedTasks = allTasks.length >= 0 ? [] : []; // force new chunk hash
  const dayBins = {};
  for (const key of days.map(d => d.key)) {
    dayBins[key] = [];
  }

  for (const task of allTasks) {
    const parsed = task.dueDate ? parseDueDate(task.dueDate) : null;
    if (!parsed) { undatedTasks.push(task); continue; }
    const status = getTaskStatus(parsed, now);
    const taskKey = buildDayKey(parsed);

    if (status.state === 'overdue') {
      overdueTasks.push({ ...task, status, parsed });
    } else if (dayBins[taskKey]) {
      dayBins[taskKey].push({ ...task, status });
    }
  }

  return (
    <div
      role="region"
      aria-label="7-day timeline"
      style={{
        display: 'grid',
        gridTemplateColumns: overdueTasks.length > 0
          ? `minmax(90px, auto) repeat(7, 1fr)`
          : 'repeat(7, 1fr)',
        gap: 6,
        width: '100%',
      }}
    >
      {/* Overdue column (only if tasks exist) */}
      {overdueTasks.length > 0 && (
        <DayCell
          dayName="Overdue"
          dateLabel=""
          tasks={overdueTasks.map(t => ({ ...t, status: t.status }))}
          isOverdue
        />
      )}

      {/* 7 day cells */}
      {days.map(day => (
        <DayCell
          key={day.key}
          dayName={day.dayName}
          dateLabel={`${day.dateNum} ${day.month}`}
          tasks={dayBins[day.key] || []}
          isToday={day.dayName === 'Today'}
        />
      ))}
    </div>
  );
}

function DayCell({ dayName, dateLabel, tasks, isToday, isOverdue }) {
  return (
    <div
      style={{
        background: SURFACE_CARD,
        border: `1px solid ${isToday ? ACCENT_BORDER : SURFACE_RAISED}`,
        borderTop: isToday ? `2px solid ${ACCENT_PULSE}` : isOverdue ? `2px solid ${COLOUR_DANGER}` : `1px solid ${SURFACE_RAISED}`,
        borderRadius: BORDER_RADIUS,
        padding: '10px 8px',
        minHeight: 84,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONT_SYSTEM,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isOverdue ? COLOUR_DANGER : isToday ? ACCENT_PULSE : TEXT_MUTED,
            flexShrink: 0,
          }}
        >
          {dayName}
        </span>
        {dateLabel && (
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, whiteSpace: 'nowrap' }}>
            {dateLabel}
          </span>
        )}
      </div>

      {tasks.length === 0 && (
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, marginTop: 4 }}>
          {'\u2014'}
        </span>
      )}

      {tasks.map((task, i) => {
        const trim = TRIM_COLOURS[task.status?.pill] || TRIM_COLOURS.green;
        return (
          <div
            key={`${task.courseId}-${task.title}-${i}`}
            style={{
              background: trim.bg,
              border: `1px solid ${trim.border}`,
              borderRadius: BORDER_RADIUS,
              padding: '4px 6px',
            }}
          >
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
              {task.title}
            </div>
            <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: trim.text, marginTop: 2 }}>
              {task.courseName}{task.weight ? ` \u00B7 ${task.weight}` : ''}
            </div>
          </div>
        );
      })}
      {/* Undated tasks shown at the end */}
      {undatedTasks.length > 0 && (
        <div style={{ padding: '6px 8px' }}>
          <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT, marginBottom: 4 }}>
            Date not set
          </div>
          {undatedTasks.map((task, i) => (
            <div key={`undated_${i}`} style={{ padding: '4px 6px', background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, marginBottom: 3 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, lineHeight: 1.3 }}>
                {task.title}
              </div>
              <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginTop: 2 }}>
                {task.courseName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
