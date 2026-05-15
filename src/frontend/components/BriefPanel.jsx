import React, { useState } from 'react';
import { appendEvent } from '../../core/HistoryOfThought';
import { runBriefSimplifier } from '../../services/BriefSimplifierService';
import ToolModal from './ToolModal';
import AudioOverviewPlayer from './AudioOverviewPlayer';
import BriefSimplifierTool from './BriefSimplifierTool';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * BriefPanel
 *
 * Right panel. Shows assessment brief details and rubric criteria
 * as a self-assessment checklist.
 *
 * Props:
 *   brief           - assessment brief object
 *   rubricCriteria  - string array
 *   rubricBands     - string array
 *   rubricDetected  - boolean
 *   courseId         - string
 *   assessmentTitle - string
 */

export default function BriefPanel({ brief, rubricCriteria, rubricBands, rubricDetected, courseId, assessmentTitle }) {
  const [selfAssessment, setSelfAssessment] = useState({});
  const [showSimplifier, setShowSimplifier] = useState(false);
  const [simplifierResult, setSimplifierResult] = useState(null);

  const bands = rubricBands && rubricBands.length > 0
    ? rubricBands.filter(b => b.toLowerCase() !== 'fail' && b.toLowerCase() !== 'not completed')
    : ['Excellent', 'Good', 'Satisfactory'];

  const handleSelfAssess = async (criterionIndex, band) => {
    setSelfAssessment(prev => ({ ...prev, [criterionIndex]: band }));
    try {
      await appendEvent({
        event_type: 'rubric_check',
        payload: { courseId, assessmentTitle, criterionIndex, selectedBand: band, timestamp: Date.now() },
      });
    } catch { /* vault may be locked */ }
  };

  const handleDecodebrief = async () => {
    const result = await runBriefSimplifier({ assessmentBrief: brief, courseContext: { courseId } });
    setSimplifierResult(result);
    setShowSimplifier(true);
  };

  return (
    <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Brief details */}
      <div>
        <h3 style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 10px' }}>
          {brief?.title || 'Assessment Brief'}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {brief?.weight && <DetailChip label="Weight" value={brief.weight} />}
          {brief?.wordCountGoal && <DetailChip label="Target" value={`${brief.wordCountGoal} words`} />}
          {brief?.dueDate && <DetailChip label="Due" value={new Date(brief.dueDate).toLocaleDateString('en-AU')} />}
        </div>
      </div>

      {/* Decode brief CTA */}
      <button
        type="button"
        onClick={handleDecodebrief}
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
          border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
          padding: '10px 14px', cursor: 'pointer', minHeight: 44, outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        Decode this brief
      </button>

      {/* Audio overview */}
      <AudioOverviewPlayer briefText={brief?.body || brief?.title || ''} assessmentTitle={assessmentTitle} />

      {/* Rubric self-assessment */}
      <div>
        <h4 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 8px' }}>
          Rubric self-check
        </h4>

        {rubricCriteria && rubricCriteria.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rubricCriteria.map((c, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${SURFACE_RAISED}`, paddingBottom: 8 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, marginBottom: 6, lineHeight: 1.4 }}>
                  {c}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {bands.map(band => {
                    const selected = selfAssessment[i] === band;
                    return (
                      <button
                        key={band}
                        type="button"
                        onClick={() => handleSelfAssess(i, band)}
                        aria-label={`Self-assess "${c}" as ${band}`}
                        style={{
                          fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          color: selected ? ACCENT_PULSE : TEXT_FAINT, // allow-style
                          background: selected ? ACCENT_GLASS : 'transparent',
                          border: `1px solid ${selected ? ACCENT_BORDER : SURFACE_RAISED}`,
                          borderRadius: BORDER_RADIUS, padding: '4px 8px',
                          cursor: 'pointer', outline: 'none', minHeight: 28,
                        }}
                        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {band}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : rubricDetected ? (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0, lineHeight: 1.5 }}>
            Rubric detected but criteria not parsed. We are working on it.
          </p>
        ) : (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>
            No rubric data extracted for this assessment.
          </p>
        )}
      </div>

      {/* Brief Simplifier modal */}
      {showSimplifier && simplifierResult && (
        <ToolModal
          title="Brief Simplifier"
          statusBadge="alpha"
          description="Your assessment brief decoded into a weekly plan, jargon glossary, and hidden expectations."
          onClose={() => setShowSimplifier(false)}
        >
          <BriefSimplifierTool result={simplifierResult} />
        </ToolModal>
      )}
    </div>
  );
}

function DetailChip({ label, value }) {
  return (
    <div style={{
      fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: TEXT_FAINT, // allow-style
      background: ACCENT_GLASS, border: `1px solid ${SURFACE_RAISED}`,
      borderRadius: BORDER_RADIUS, padding: '4px 8px',
    }}>
      <span style={{ color: TEXT_MUTED }}>{label}: </span> {/* allow-style */}
      <span style={{ color: TEXT_PRIMARY }}>{value}</span> {/* allow-style */}
    </div>
  );
}
