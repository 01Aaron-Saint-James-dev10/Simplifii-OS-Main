import React, { useState } from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
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

  if (!scaffold || !scaffold.suggestedStructure) return null;

  const toggle = (key) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Normalising message */}
      {scaffold.normalisingMessage && (
        <div style={{ padding: '10px 12px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
          {scaffold.normalisingMessage}
        </div>
      )}

      {/* Time estimate */}
      {scaffold.timeEstimate && (
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Time estimate</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {Object.entries(scaffold.timeEstimate).map(([k, v]) => (
              <span key={k} style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED, padding: '3px 8px', background: ACCENT_GLASS, borderRadius: 10 }}>
                {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: {v}
              </span>
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

            {section.keyQuestion && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 4px', fontStyle: 'italic' }}>
                Key question: {section.keyQuestion}
              </p>
            )}

            {section.starterSentence && (
              <div style={{ padding: '6px 8px', background: 'rgba(16,185,129,0.06)', borderLeft: `2px solid ${ACCENT_PULSE}`, borderRadius: 2, margin: '6px 0' }}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, display: 'block', marginBottom: 2 }}>Starter sentence</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{section.starterSentence}</span>
              </div>
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
        <div style={{ padding: '8px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b' }}>Hidden expectations</span>
          <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
            {scaffold.hiddenExpectations.map((exp, i) => (
              <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.5, marginBottom: 2 }}>{exp}</li>
            ))}
          </ul>
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
    </div>
  );
}
