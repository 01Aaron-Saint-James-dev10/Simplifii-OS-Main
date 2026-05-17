import React, { useState } from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN, COLOUR_WARN_TINT,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * StructuredRubric
 *
 * Renders structured JSON from /api/decode-rubric as visual cards:
 * criteria with grade band colours, micro-task checklists, self-assessment.
 */

const BAND_COLOURS = {
  hd: '#10b981',
  d: '#06b6d4',
  c: '#3b82f6',
  p: '#8b5cf6',
  f: '#ef4444',
  n: '#6b7280',
  excellent: '#10b981',
  'very good': '#06b6d4',
  good: '#3b82f6',
  satisfactory: '#8b5cf6',
  'below standard': '#ef4444',
  unsatisfactory: '#ef4444',
};

function getBandColour(label) {
  const lower = (label || '').toLowerCase();
  for (const [key, colour] of Object.entries(BAND_COLOURS)) {
    if (lower.includes(key)) return colour;
  }
  // Position-based: first band = green, last = red
  return ACCENT_PULSE;
}

export default function StructuredRubric({ rubricData }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedCriterion, setExpandedCriterion] = useState(0); // First criterion expanded by default

  if (!rubricData || !rubricData.criteria) return null;

  const toggle = (key) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Normalising message */}
      {rubricData.normalisingMessage && (
        <div style={{ padding: '10px 12px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
          {rubricData.normalisingMessage}
        </div>
      )}

      {/* Scale detected badge */}
      {rubricData.scaleDetected && (
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: ACCENT_PULSE, letterSpacing: '0.06em', padding: '3px 8px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 10, alignSelf: 'flex-start' }}>
          Scale: {rubricData.scaleDetected}
        </span>
      )}

      {/* Overall strategy */}
      {rubricData.overallStrategy && (
        <div style={{ padding: '10px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>How to approach this rubric</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, margin: '6px 0 0', lineHeight: 1.6 }}>
            {rubricData.overallStrategy}
          </p>
        </div>
      )}

      {/* Criteria cards */}
      {rubricData.criteria.map((criterion, ci) => {
        const isExpanded = expandedCriterion === ci;
        return (
          <div key={ci} style={{ border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, overflow: 'hidden' }}>
            {/* Criterion header */}
            <button
              type="button"
              onClick={() => setExpandedCriterion(isExpanded ? null : ci)}
              style={{
                width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: isExpanded ? ACCENT_GLASS : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: TEXT_PRIMARY }}>{criterion.name}</span>
                {criterion.weighting && (
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, fontWeight: 700, padding: '1px 6px', background: ACCENT_GLASS, borderRadius: 8 }}>
                    {criterion.weighting}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Plain English: what this criterion is actually asking */}
                {criterion.plainEnglish && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                    {criterion.plainEnglish}
                  </p>
                )}

                {/* Grade bands */}
                {criterion.gradeBands?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {criterion.gradeBands.map((band, bi) => {
                      const colour = getBandColour(band.label);
                      return (
                        <div key={bi} style={{ padding: '6px 8px', borderLeft: `3px solid ${colour}`, background: `${colour}10`, borderRadius: 2 }}>
                          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: colour, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {band.label}
                          </span>
                          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, margin: '2px 0 0', lineHeight: 1.4 }}>
                            {band.description}
                          </p>
                          {band.evidence && (
                            <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: TEXT_MUTED, margin: '2px 0 0' }}>
                              Evidence: {band.evidence}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Micro-task checklist */}
                {criterion.microTaskChecklist?.length > 0 && (
                  <div>
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Actions</span>
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {criterion.microTaskChecklist.map((task, ti) => {
                        const key = `c${ci}_t${ti}`;
                        return (
                          <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!checkedItems[key]} onChange={() => toggle(key)} style={{ marginTop: 2, accentColor: ACCENT_PULSE }} />
                            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4, textDecoration: checkedItems[key] ? 'line-through' : 'none', opacity: checkedItems[key] ? 0.5 : 1 }}>{task}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Self-assessment checkbox */}
                {criterion.selfAssessmentQuestion && (() => {
                  const saKey = `sa_${ci}`;
                  return (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer', padding: '6px 8px', background: COLOUR_WARN_TINT, borderLeft: `2px solid ${COLOUR_WARN}`, borderRadius: 2 }}>
                      <input type="checkbox" checked={!!checkedItems[saKey]} onChange={() => toggle(saKey)} style={{ marginTop: 2, accentColor: COLOUR_WARN }} />
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4, textDecoration: checkedItems[saKey] ? 'line-through' : 'none', opacity: checkedItems[saKey] ? 0.5 : 1 }}>
                        {criterion.selfAssessmentQuestion}
                      </span>
                    </label>
                  );
                })()}

                {/* Top band secret */}
                {criterion.topBandSecret && (
                  <div style={{ padding: '6px 8px', borderLeft: `2px solid ${ACCENT_PULSE}`, borderRadius: 2 }}>
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, display: 'block', marginBottom: 2 }}>Top band secret</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{criterion.topBandSecret}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
