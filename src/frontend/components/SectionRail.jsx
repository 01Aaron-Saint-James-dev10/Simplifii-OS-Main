import React, { useState, useMemo } from 'react';
import { generateSubtasks } from '../../services/ScaffolderToolService';
import { appendEvent } from '../../core/HistoryOfThought';
import {
  SURFACE_CARD,
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
 * SectionRail
 *
 * Left vertical rail. Lists assessment sections with expandable sub-tasks.
 * Sub-tasks generated heuristically via ScaffolderToolService.
 * Check/uncheck logs subtask_complete / subtask_uncomplete to HistoryOfThought.
 *
 * Props:
 *   sections       - Array<{ type, label }> (from brief or heuristic)
 *   activeSection  - string (section type currently focused)
 *   onSelectSection - callback(sectionType)
 *   courseId        - string
 *   assessmentTitle - string
 *   brief           - assessment brief object
 */

const DEFAULT_SECTIONS = [
  { type: 'introduction', label: 'Introduction' },
  { type: 'body', label: 'Main Body' },
  { type: 'conclusion', label: 'Conclusion' },
  { type: 'references', label: 'References' },
];

const SCIENCE_SECTIONS = [
  { type: 'introduction', label: 'Introduction' },
  { type: 'methods', label: 'Methods' },
  { type: 'results', label: 'Results' },
  { type: 'discussion', label: 'Discussion' },
  { type: 'references', label: 'References' },
];

function detectSections(brief) {
  if (!brief) return DEFAULT_SECTIONS;
  const title = (brief.title || '').toLowerCase();
  if (/lab\s*report|experiment|practical|methods/i.test(title)) return SCIENCE_SECTIONS;
  return DEFAULT_SECTIONS;
}

export default function SectionRail({ sections: sectionsProp, activeSection, onSelectSection, courseId, assessmentTitle, brief }) {
  const sections = sectionsProp && sectionsProp.length > 0 ? sectionsProp : detectSections(brief);
  const [expanded, setExpanded] = useState(null);
  const [subtaskState, setSubtaskState] = useState({});

  const subtasksMap = useMemo(() => {
    const map = {};
    for (const s of sections) {
      map[s.type] = generateSubtasks(s.type, brief);
    }
    return map;
  }, [sections, brief]);

  const toggleExpand = (type) => {
    setExpanded(prev => prev === type ? null : type);
  };

  const toggleSubtask = async (sectionType, subtaskId) => {
    const key = `${sectionType}::${subtaskId}`;
    const wasDone = subtaskState[key] === 'done';
    const newStatus = wasDone ? 'todo' : 'done';
    setSubtaskState(prev => ({ ...prev, [key]: newStatus }));

    try {
      await appendEvent({
        event_type: wasDone ? 'subtask_uncomplete' : 'subtask_complete',
        payload: { courseId, assessmentTitle, subtaskId, sectionType, timestamp: Date.now() },
      });
    } catch { /* vault may be locked */ }
  };

  const getSectionProgress = (type) => {
    const tasks = subtasksMap[type] || [];
    if (tasks.length === 0) return null;
    const done = tasks.filter(t => subtaskState[`${type}::${t.id}`] === 'done').length;
    return Math.round((done / tasks.length) * 100);
  };

  return (
    <aside
      style={{
        width: expanded ? 260 : 56,
        minWidth: expanded ? 260 : 56,
        background: SURFACE_CARD,
        borderRight: `1px solid ${SURFACE_RAISED}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 150ms ease, min-width 150ms ease',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      role="navigation"
      aria-label="Assessment sections"
    >
      {sections.map((s, i) => {
        const isActive = activeSection === s.type;
        const isExpanded = expanded === s.type;
        const progress = getSectionProgress(s.type);
        const subtasks = subtasksMap[s.type] || [];

        return (
          <div key={s.type}>
            <button
              type="button"
              onClick={() => { onSelectSection?.(s.type); toggleExpand(s.type); }}
              aria-label={`${s.label}${progress !== null ? `, ${progress}% done` : ''}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: expanded ? '10px 12px' : '10px 0',
                justifyContent: expanded ? 'flex-start' : 'center',
                background: isActive ? ACCENT_GLASS : 'transparent',
                borderLeft: isActive ? `2px solid ${ACCENT_PULSE}` : '2px solid transparent',
                border: 'none',
                borderBottom: `1px solid ${SURFACE_RAISED}`,
                cursor: 'pointer',
                minHeight: 44,
                outline: 'none',
                borderRadius: 0,
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{
                fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700,
                color: isActive ? ACCENT_PULSE : TEXT_MUTED,
                width: 20, textAlign: 'center', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              {expanded && (
                <div style={{ minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: isActive ? TEXT_PRIMARY : TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.label}
                  </div>
                  {progress !== null && (
                    <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginTop: 1 }}>
                      {progress}% done
                    </div>
                  )}
                </div>
              )}
            </button>

            {/* Sub-tasks (expanded only) */}
            {isExpanded && subtasks.length > 0 && (
              <div style={{ padding: '4px 8px 8px 32px' }}>
                {subtasks.map(task => {
                  const key = `${s.type}::${task.id}`;
                  const isDone = subtaskState[key] === 'done';
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleSubtask(s.type, task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        width: '100%',
                        padding: '5px 0',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        minHeight: 32,
                      }}
                      aria-label={`${isDone ? 'Undo' : 'Complete'}: ${task.label}`}
                      onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <span style={{
                        width: 14, height: 14, borderRadius: 2, flexShrink: 0, marginTop: 1,
                        border: isDone ? `1px solid ${ACCENT_PULSE}` : `1px solid ${SURFACE_RAISED}`,
                        background: isDone ? ACCENT_PULSE : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isDone && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <path d="M1.5 4L3 5.5L6.5 2" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span style={{
                        fontFamily: FONT_BODY, fontSize: 11, lineHeight: 1.3,
                        color: isDone ? TEXT_FAINT : TEXT_MUTED,
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>
                        {task.label}
                        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginLeft: 4 }}>
                          {task.estimatedMinutes}m
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
