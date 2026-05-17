import React from 'react';
import StructuredScaffold from './StructuredScaffold';
import {
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SYSTEM,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * BriefSimplifierTool
 *
 * Renders inside ToolModal. Shows the Assessment Scaffolder output:
 * structured card UI via StructuredScaffold when scaffold JSON is present,
 * plain text plan as fallback.
 *
 * Props:
 *   result - output from BriefSimplifierService.runBriefSimplifier
 *            { scaffold: object|null, rawPlan: string }
 */

export default function BriefSimplifierTool({ result }) {
  if (!result) return null;

  // Structured scaffold from API (preferred path)
  if (result.scaffold && result.scaffold.suggestedStructure) {
    return <StructuredScaffold scaffold={result.scaffold} />;
  }

  // Fallback: raw plan text as readable paragraphs
  if (result.rawPlan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED }}>
          Assessment scaffold
        </span>
        {result.rawPlan.split('\n').filter(l => l.trim()).map((para, i) => (
          <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.6 }}>
            {para}
          </p>
        ))}
      </div>
    );
  }

  // Legacy mock path (weeklyTasks from mock fallback)
  if (result.weeklyTasks) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {result.weeklyTasks.map(w => (
          <div key={w.week}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: TEXT_MUTED }}>Week {w.week}</span>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
              {w.tasks.map((t, i) => (
                <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
