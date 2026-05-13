import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  COLOUR_WARN,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * BriefSimplifierTool
 *
 * Renders inside ToolModal. Shows the decoded brief output:
 * weekly plan, rubric alignment, jargon glossary, hidden curriculum.
 *
 * Props:
 *   result - output from BriefSimplifierService.runBriefSimplifier
 */

export default function BriefSimplifierTool({ result }) {
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Weekly plan */}
      <Section title="Weekly plan">
        {result.weeklyTasks.map(w => (
          <div key={w.week} style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, marginBottom: 4 }}>
              Week {w.week}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {w.tasks.map((t, i) => (
                <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, lineHeight: 1.5, marginBottom: 2 }}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      {/* Jargon decoded */}
      <Section title="Jargon decoded">
        {result.jargonDecoded.map((j, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${SURFACE_RAISED}`, paddingBottom: 6, marginBottom: 6 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLOUR_WARN }}>{j.term}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{j.plainLanguage}</div>
          </div>
        ))}
      </Section>

      {/* Hidden curriculum */}
      <Section title="Hidden curriculum">
        {result.hiddenCurriculum.map((h, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{h.unstatedExpectation}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, marginTop: 2 }}>{h.evidence}</div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 8px' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}
