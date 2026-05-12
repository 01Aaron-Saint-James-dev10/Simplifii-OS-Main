import React from 'react';
import { Brain, ChevronLeft, ChevronRight, Layout, Target, Shield, Trash2, Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT, TEXT_LABEL,
  ACCENT_PULSE,
  BORDER_SHARP, BORDER_RADIUS,
  FONT_SYSTEM,
} from '../theme/tokens';

/**
 * SemesterSidebar
 *
 * Obsidian Icon Rail. 64px collapsed (icons only), 240px expanded.
 * All colour values sourced from src/theme/tokens.js.
 * All system labels: JetBrains Mono, 9px, uppercase, 0.18em tracking.
 * Timeline spine: 1px solid SURFACE_RAISED left border + dot markers.
 *
 * Props: same interface as the previous SemesterSidebar; leftSidebarClass
 * is accepted but not used (width is derived from isLeftCollapsed / isZenMode).
 */

// ============================================================
// CSS injected once: rail icon buttons, inputs, selects, btns
// ============================================================

let railCSSInjected = false;
function injectRailCSS() {
  if (railCSSInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
.smf-rail-icon {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: ${BORDER_RADIUS}px;
  background: none; border: none; cursor: pointer;
  transition: background 0.15s;
}
.smf-rail-icon:hover { background: rgba(255,255,255,0.05); }
.smf-sb-input {
  width: 100%; box-sizing: border-box;
  background: ${SURFACE_BASE}; border: 1px solid ${SURFACE_RAISED}; border-radius: ${BORDER_RADIUS}px;
  padding: 7px 10px;
  font-size: 11px; font-family: ${FONT_SYSTEM};
  color: ${TEXT_PRIMARY}; outline: none; transition: border 0.15s;
}
.smf-sb-input:focus { border-color: ${ACCENT_PULSE}; }
.smf-sb-select {
  width: 100%; box-sizing: border-box;
  background: ${SURFACE_BASE}; border: 1px solid ${SURFACE_RAISED}; border-radius: ${BORDER_RADIUS}px;
  padding: 7px 10px;
  font-size: 11px; font-family: ${FONT_SYSTEM};
  color: ${TEXT_PRIMARY}; outline: none; cursor: pointer;
  transition: border 0.15s; appearance: none;
}
.smf-sb-select:focus { border-color: ${ACCENT_PULSE}; }
.smf-sb-btn {
  font-family: ${FONT_SYSTEM};
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.15em; text-transform: uppercase;
  border-radius: ${BORDER_RADIUS}px; cursor: pointer;
  transition: border 0.15s, background 0.15s;
}
  `.trim();
  document.head.appendChild(el);
  railCSSInjected = true;
}

// Section label token
const SL = {
  display: 'block',
  fontSize: 9,
  fontFamily: FONT_SYSTEM,
  fontWeight: 700,
  color: TEXT_LABEL,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  marginBottom: 8,
};

// ============================================================
// Component
// ============================================================

export default function SemesterSidebar({
  isZenMode,
  // leftSidebarClass accepted for API compatibility but not used
  isLeftCollapsed, setIsLeftCollapsed,
  activeCourse,
  activeCourseId, setActiveCourseId,
  courses,
  courseEditMode, setCourseEditMode,
  courseEditValue, setCourseEditValue,
  courseEditInputRef,
  commitCourseEdit, cancelCourseEdit,
  isBooting,
  tasks, activeTask,
  setShowAddCourseModal,
  setPendingDeleteCourseId,
  simulateVoiceNote, generatePremiumPDF,
}) {
  injectRailCSS();

  const sidebarStyle = {
    width: isZenMode ? 0 : isLeftCollapsed ? 64 : 240,
    opacity: isZenMode ? 0 : 1,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: SURFACE_CARD,
    borderRight: BORDER_SHARP,
    transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 10,
    paddingTop: 44,
  };

  return (
    <aside data-focus-locked="true" style={sidebarStyle}>

      {/* Collapse toggle pill */}
      {!isZenMode && (
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          style={{
            position: 'absolute', right: -11, top: 60, zIndex: 50,
            width: 22, height: 22, borderRadius: '50%',
            background: SURFACE_RAISED, border: `1px solid ${TEXT_LABEL}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: TEXT_MUTED, padding: 0,
          }}
          aria-label={isLeftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isLeftCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* ---- Collapsed: Icon Rail ---- */}
      {isLeftCollapsed && !isZenMode && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', paddingTop: 16, gap: 6,
        }}>
          {/* OS logo mark */}
          <div style={{
            width: 24, height: 24, borderRadius: BORDER_RADIUS,
            background: ACCENT_PULSE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8, flexShrink: 0,
          }}>
            <Brain size={14} color="#000" />
          </div>

          <div style={{ width: 24, height: 1, background: SURFACE_RAISED, margin: '2px 0 6px' }} />

          <button className="smf-rail-icon" title="Courses">
            <Layout size={16} color={TEXT_FAINT} />
          </button>
          <button className="smf-rail-icon" title="Active Sprint">
            <Target size={16} color={TEXT_FAINT} />
          </button>
          <button
            className="smf-rail-icon"
            title="Add Course"
            onClick={() => setShowAddCourseModal(true)}
          >
            <Plus size={16} color={TEXT_FAINT} />
          </button>
        </div>
      )}

      {/* ---- Expanded: Full Rail ---- */}
      {!isLeftCollapsed && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '16px 14px',
          overflowY: 'auto',
          gap: 18,
        }}>

          {/* OS logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: BORDER_RADIUS, background: ACCENT_PULSE,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Brain size={12} color="#000" />
            </div>
            <span style={{
              fontFamily: FONT_SYSTEM,
              fontSize: 9, fontWeight: 700,
              color: TEXT_FAINT, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              Simplifii-OS
            </span>
          </div>

          {/* Pareto weight badge */}
          {activeCourse?.roadmap?.paretoSteps && (
            <div style={{
              background: `rgba(16,185,129,0.06)`,
              border: `1px solid rgba(16,185,129,0.2)`,
              borderRadius: BORDER_RADIUS, padding: '6px 10px', textAlign: 'center',
            }}>
              <span style={{ ...SL, color: ACCENT_PULSE, marginBottom: 0 }}>
                Weight: {activeCourse.roadmap.totalWeight || '25%'}
              </span>
            </div>
          )}

          {/* Course switcher */}
          <div>
            <span style={SL}>Active Course</span>
            <select
              value={activeCourseId}
              onChange={(e) => setActiveCourseId(e.target.value)}
              className="smf-sb-select"
            >
              {Object.entries(courses).map(([id, c]) => (
                <option key={id} value={id}>{c.name || '(unnamed)'}</option>
              ))}
            </select>

            {courseEditMode ? (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <input
                  ref={courseEditInputRef}
                  value={courseEditValue}
                  onChange={(e) => setCourseEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitCourseEdit(); }
                    if (e.key === 'Escape') { e.preventDefault(); cancelCourseEdit(); }
                  }}
                  placeholder={courseEditMode === 'add' ? 'New course name' : 'Course name'}
                  className="smf-sb-input"
                  style={{ flex: 1 }}
                />
                <button onClick={commitCourseEdit} className="smf-sb-btn"
                  style={{ background: ACCENT_PULSE, border: 'none', padding: '6px 10px' }}>
                  Save
                </button>
                <button onClick={cancelCourseEdit} className="smf-sb-btn"
                  style={{ background: 'none', color: TEXT_MUTED, border: BORDER_SHARP, padding: '6px 10px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="smf-sb-btn"
                  style={{
                    flex: 1, background: 'none', padding: '6px 0',
                    border: `1px solid rgba(16,185,129,0.3)`, color: ACCENT_PULSE,
                  }}
                  title="Drop a syllabus PDF; the OS names the course itself"
                >
                  + Add
                </button>
                <button
                  onClick={() => { setCourseEditValue(courses[activeCourseId]?.name || ''); setCourseEditMode('rename'); }}
                  className="smf-sb-btn"
                  style={{ background: 'none', color: TEXT_FAINT, border: BORDER_SHARP, padding: '6px 10px' }}
                  title="Rename active course"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDeleteCourseId(activeCourseId)}
                  disabled={Object.keys(courses).length <= 1}
                  className="smf-sb-btn"
                  style={{
                    background: 'none', color: TEXT_FAINT, border: BORDER_SHARP,
                    padding: '6px 10px',
                    opacity: Object.keys(courses).length <= 1 ? 0.35 : 1,
                    cursor: Object.keys(courses).length <= 1 ? 'not-allowed' : 'pointer',
                  }}
                  title={Object.keys(courses).length <= 1 ? 'Cannot delete the only course' : 'Delete active course'}
                  aria-label="Delete active course"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Semester Roadmap */}
          {!isBooting && (
            activeCourse?.roadmap?.currentTask ||
            activeCourse?.roadmap?.nextAssessment ||
            activeCourse?.roadmap?.finalMilestone
          ) && (
            <div>
              <span style={SL}>Semester Roadmap</span>

              {activeCourse.roadmap.paretoSteps ? (
                <div style={{
                  background: SURFACE_BASE,
                  border: `1px solid rgba(16,185,129,0.15)`,
                  borderRadius: BORDER_RADIUS, padding: '10px 12px',
                }}>
                  <span style={{ ...SL, color: ACCENT_PULSE, marginBottom: 10 }}>Pareto Steps</span>
                  <div style={{
                    borderLeft: `1px solid rgba(16,185,129,0.2)`,
                    marginLeft: 3,
                    display: 'flex', flexDirection: 'column', gap: 12,
                    paddingLeft: 14,
                  }}>
                    {activeCourse.roadmap.paretoSteps.map((s, i) => (
                      <div key={i} style={{ position: 'relative', opacity: i > 0 ? 0.5 : 1 }}>
                        <div style={{
                          position: 'absolute', left: -19, top: 4,
                          width: i === 0 ? 8 : 6, height: i === 0 ? 8 : 6,
                          borderRadius: '50%',
                          background: i === 0 ? ACCENT_PULSE : SURFACE_RAISED,
                          border: i === 0 ? 'none' : `1px solid ${TEXT_LABEL}`,
                          boxShadow: i === 0 ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
                        }} />
                        <span style={{ ...SL, color: i === 0 ? ACCENT_PULSE : TEXT_LABEL, marginBottom: 2 }}>
                          Step {s.rank} / {s.weight}
                        </span>
                        <p style={{
                          fontSize: 11, margin: 0,
                          color: i === 0 ? TEXT_PRIMARY : TEXT_MUTED,
                          lineHeight: 1.4,
                        }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  borderLeft: BORDER_SHARP,
                  marginLeft: 4, paddingLeft: 14,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  {activeCourse.roadmap.currentTask && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: -19, top: 4,
                        width: 8, height: 8, borderRadius: '50%',
                        background: ACCENT_PULSE,
                        boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                      }} />
                      <span style={{ ...SL, color: ACCENT_PULSE, marginBottom: 2 }}>Current</span>
                      <p style={{ fontSize: 11, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.4 }}>
                        {activeCourse.roadmap.currentTask}
                      </p>
                    </div>
                  )}
                  {activeCourse.roadmap.nextAssessment && (
                    <div style={{ position: 'relative', opacity: 0.5 }}>
                      <div style={{
                        position: 'absolute', left: -19, top: 4,
                        width: 6, height: 6, borderRadius: '50%',
                        background: SURFACE_RAISED, border: `1px solid ${TEXT_LABEL}`,
                      }} />
                      <span style={{ ...SL, marginBottom: 2 }}>Next</span>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0, lineHeight: 1.4 }}>
                        {activeCourse.roadmap.nextAssessment}
                      </p>
                    </div>
                  )}
                  {activeCourse.roadmap.finalMilestone && (
                    <div style={{ position: 'relative', opacity: 0.5 }}>
                      <div style={{
                        position: 'absolute', left: -19, top: 4,
                        width: 6, height: 6, borderRadius: '50%',
                        background: SURFACE_RAISED, border: `1px solid ${TEXT_LABEL}`,
                      }} />
                      <span style={{ ...SL, marginBottom: 2 }}>Final</span>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0, lineHeight: 1.4 }}>
                        {activeCourse.roadmap.finalMilestone}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Sprint: tasks */}
          {!(activeCourse?.roadmap?.paretoSteps) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <span style={SL}>Active Sprint</span>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isBooting || tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.35, padding: '20px 0' }}>
                    <Brain size={22} color={TEXT_LABEL} style={{ margin: '0 auto 6px' }} />
                    <span style={SL}>No Active Sprint</span>
                  </div>
                ) : tasks.length > 5 ? (
                  <div style={{
                    background: SURFACE_BASE, border: BORDER_SHARP,
                    borderRadius: BORDER_RADIUS, padding: '10px 12px',
                  }}>
                    <span style={{ ...SL, color: ACCENT_PULSE, marginBottom: 8 }}>Neural Summary</span>
                    <p style={{
                      fontSize: 10, color: TEXT_FAINT, margin: '0 0 8px',
                      fontFamily: FONT_SYSTEM,
                    }}>
                      {tasks.length} tasks. Top 5:
                    </p>
                    {tasks.slice(0, 5).map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        padding: '4px 0',
                        borderBottom: i < 4 ? `1px solid ${SURFACE_CARD}` : 'none',
                      }}>
                        <span style={{
                          fontSize: 9, color: TEXT_LABEL,
                          fontFamily: FONT_SYSTEM, minWidth: 14,
                        }}>{i + 1}.</span>
                        <p style={{
                          fontSize: 11, color: TEXT_PRIMARY, margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{t.task}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  tasks.map((t, i) => (
                    <TaskCard key={i} task={t} onStart={() => {}} isActive={activeTask?.task === t.task} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer: Zero-Disclosure + actions */}
          <div style={{
            marginTop: 'auto', paddingTop: 12,
            borderTop: BORDER_SHARP,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {/* Zero-Disclosure card */}
            <div style={{
              background: SURFACE_BASE, border: BORDER_SHARP,
              borderRadius: BORDER_RADIUS, padding: '8px 10px',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <Shield size={12} color={ACCENT_PULSE} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <span style={{ ...SL, color: ACCENT_PULSE, marginBottom: 2 }}>Zero-Disclosure</span>
                <p style={{
                  fontSize: 10, color: TEXT_FAINT, margin: 0, lineHeight: 1.6,
                  fontFamily: FONT_SYSTEM,
                }}>
                  Telemetry never shared with your institution.
                </p>
              </div>
            </div>

            {!isBooting && tasks.length > 0 && (
              <>
                <button onClick={simulateVoiceNote} className="smf-sb-btn"
                  style={{
                    background: ACCENT_PULSE, color: '#000',
                    border: 'none', padding: '8px', width: '100%', textAlign: 'center',
                  }}>
                  Simulate Voice
                </button>
                <button onClick={generatePremiumPDF} className="smf-sb-btn"
                  style={{
                    background: 'none', color: TEXT_MUTED,
                    border: BORDER_SHARP, padding: '8px', width: '100%', textAlign: 'center',
                  }}>
                  Export Proof
                </button>
              </>
            )}
          </div>

        </div>
      )}
    </aside>
  );
}
