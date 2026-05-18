import React, { useState } from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_GLASS_SUBTLE, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * StructuredScaffold
 *
 * Renders the structured JSON from /api/simplify-brief as visual cards:
 * sections with word counts, starter sentences, checkboxes, time estimates.
 */
export default function StructuredScaffold({ scaffold }) {
  const [checkedItems, setCheckedItems] = useState({});

  const [weekOpen, setWeekOpen] = useState({});
  const toggleWeek = (w) => setWeekOpen(prev => ({ ...prev, [w]: !prev[w] }));

  if (!scaffold || (!scaffold.suggestedStructure && !scaffold.weeklyPlan)) return null;

  const toggle = (key) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Normalising message */}
      {scaffold.normalisingMessage && (
        <div style={{ padding: '10px 12px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
          {scaffold.normalisingMessage}
        </div>
      )}

      {/* Overall guidance */}
      {scaffold.overallGuidance && (
        <div style={{ padding: '10px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>What this assessment is really asking</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, margin: '6px 0 0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {scaffold.overallGuidance}
          </p>
        </div>
      )}

      {/* Time estimate */}
      {scaffold.timeEstimate && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Time estimate</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '6px 0 0', lineHeight: 1.5 }}>
            {Object.entries(scaffold.timeEstimate).map(([k, v]) =>
              `${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: ${v}`
            ).join(' | ')}
          </p>
        </div>
      )}

      {/* Weekly plan */}
      {scaffold.weeklyPlan?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Week-by-week plan</span>
          {scaffold.weeklyPlan.map((week) => {
            const isOpen = weekOpen[week.week] !== false; // default open
            return (
              <div key={week.week} style={{ border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
                <button
                  type="button"
                  onClick={() => toggleWeek(week.week)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: TEXT_PRIMARY }}>
                    Week {week.week}: {week.title}
                  </span>
                  <span style={{ fontSize: 10, color: TEXT_FAINT }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['beginning', 'throughout', 'end'].map((phase) => {
                      const tasks = week.tasks?.[phase];
                      if (!tasks?.length) return null;
                      return (
                        <div key={phase}>
                          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT_FAINT }}>
                            {phase === 'beginning' ? 'Start of week' : phase === 'throughout' ? 'Throughout' : 'End of week'}
                          </span>
                          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {tasks.map((t, ti) => {
                              const taskKey = `w${week.week}_${phase}_${ti}`;
                              return (
                                <div key={ti}>
                                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={!!checkedItems[taskKey]} onChange={() => toggle(taskKey)} style={{ marginTop: 2, accentColor: ACCENT_PULSE }} />
                                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{t.task}</span>
                                  </label>
                                  {t.subtasks?.length > 0 && (
                                    <div style={{ marginLeft: 24, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      {t.subtasks.map((st, si) => {
                                        const stKey = `${taskKey}_s${si}`;
                                        return (
                                          <label key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!checkedItems[stKey]} onChange={() => toggle(stKey)} style={{ marginTop: 2, accentColor: ACCENT_PULSE }} />
                                            <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: TEXT_MUTED, lineHeight: 1.4 }}>{st}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Glossary */}
      {scaffold.glossary?.length > 0 && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Key terms</span>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scaffold.glossary.map((g, i) => (
              <div key={i}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY }}>{g.term}: </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED }}>{g.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Before you start */}
      {scaffold.beforeYouStart?.length > 0 && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Before you start</span>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scaffold.beforeYouStart.map((step, i) => {
              const key = `bys_${i}`;
              return (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer' }}>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: ACCENT_PULSE, minWidth: 16 }}>{i + 1}.</span>
                  <input type="checkbox" checked={!!checkedItems[key]} onChange={() => toggle(key)} style={{ marginTop: 2, accentColor: ACCENT_PULSE }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{step}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Section cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scaffold.suggestedStructure.map((section, i) => (
          <div key={i} style={{ padding: '10px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: TEXT_PRIMARY }}>{section.sectionName}</span>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, fontWeight: 700, padding: '2px 6px', background: ACCENT_GLASS, borderRadius: 8 }}>
                {section.wordCount} words
              </span>
            </div>

            {section.purpose && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 4px' }}>
                {section.purpose}
              </p>
            )}

            {section.keyQuestion && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 4px', fontStyle: 'italic' }}>
                Key question: {section.keyQuestion}
              </p>
            )}

            {section.starterSentence && (
              <div style={{ padding: '6px 8px', background: ACCENT_GLASS_SUBTLE, borderLeft: `2px solid ${ACCENT_PULSE}`, borderRadius: 2, margin: '6px 0' }}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, display: 'block', marginBottom: 2 }}>Starter sentence</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{section.starterSentence}</span>
              </div>
            )}

            {section.tipForThisSection && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: ACCENT_PULSE, margin: '4px 0 0' }}>
                Tip: {section.tipForThisSection}
              </p>
            )}

            {section.bloomsPrompt && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: TEXT_FAINT, margin: '4px 0 0' }}>
                Think deeper: {section.bloomsPrompt}
              </p>
            )}

            {section.commonMistakes && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#f59e0b', margin: '4px 0 0' }}>
                Avoid: {section.commonMistakes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Hidden expectations */}
      {scaffold.hiddenExpectations?.length > 0 && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, borderLeft: '3px solid #f59e0b' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b' }}>Hidden expectations</span>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scaffold.hiddenExpectations.map((exp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ color: '#f59e0b', fontSize: 12, lineHeight: 1.4 }}>{'\u26A0'}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{exp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rubric alignment */}
      {scaffold.rubricAlignment?.length > 0 && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Rubric alignment</span>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scaffold.rubricAlignment.map((ra, i) => (
              <div key={i}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600, color: TEXT_PRIMARY }}>{ra.criterion}</span>
                {ra.whatSeparatesHDFromP && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: TEXT_MUTED, margin: '2px 0 0' }}>
                    HD vs P: {ra.whatSeparatesHDFromP}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Success tips */}
      {scaffold.successTips?.length > 0 && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, borderLeft: `3px solid ${ACCENT_PULSE}` }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>What separates the top band</span>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scaffold.successTips.map((tip, i) => (
              <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
                {tip}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Higher-order scaffolding */}
      {scaffold.higherOrderScaffolding?.length > 0 && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED }}>Push your thinking further</span>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scaffold.higherOrderScaffolding.map((q, i) => (
              <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                {q}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Workforce readiness */}
      {scaffold.workforceReadiness && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED }}>Why this matters beyond the grade</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '6px 0 0', lineHeight: 1.5 }}>
            {scaffold.workforceReadiness}
          </p>
        </div>
      )}
    </div>
  );
}
