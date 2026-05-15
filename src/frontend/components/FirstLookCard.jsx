import React, { useState, useEffect } from 'react';
import useLearnerContext from '../hooks/useLearnerContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * FirstLookCard
 *
 * Auto-generated document summary that appears once per document
 * on the canvas. Shows the student what the system understood from
 * their upload, what matters most, and where to start.
 *
 * Disappears after dismiss. Never shows again for same document.
 *
 * Props:
 *   courseId         - string
 *   assessmentTitle  - string
 *   briefText        - string (assessment content)
 *   documentType     - string ('exam_paper' | 'brief' | etc)
 *   isExamPaper      - boolean
 *   examData         - { sections, questions, totalMarks }
 *   rubricDetected   - boolean
 *   targetWords      - number
 */
export default function FirstLookCard({
  courseId, assessmentTitle, briefText, documentType,
  isExamPaper, examData, rubricDetected, targetWords,
}) {
  const { learnerContext } = useLearnerContext();
  const [dismissed, setDismissed] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dismissKey = `simplifii_firstlook_${courseId}_${assessmentTitle}`;

  // Check if already dismissed for this document
  useEffect(() => {
    try { if (sessionStorage.getItem(dismissKey)) setDismissed(true); } catch {}
  }, [dismissKey]);

  // Generate summary on first render if we have content
  useEffect(() => {
    if (dismissed || summary || loading) return;
    if (!briefText || briefText.length < 50) return;

    // Build local summary for exam papers (no API call needed)
    if (isExamPaper && (!examData?.questions?.length)) {
      setSummary({ whatIs: 'Exam paper detected but questions are still being extracted. Use the tools in the right panel while we process it.' });
      return;
    }
    if (isExamPaper && examData?.questions?.length > 0) {
      const sections = {};
      for (const q of examData.questions) {
        const sec = q.section || 'Questions';
        if (!sections[sec]) sections[sec] = { count: 0, marks: 0 };
        sections[sec].count += 1;
        sections[sec].marks += q.marks || 0;
      }
      const sectionLines = Object.entries(sections).map(([name, data]) =>
        `${name}: ${data.count} questions, ${data.marks} marks`
      );
      const highestMarksSection = Object.entries(sections)
        .sort((a, b) => b[1].marks - a[1].marks)[0];

      setSummary({
        whatIs: `This is ${documentType === 'exam_paper' ? 'an exam paper' : 'a document'} with ${examData.questions.length} questions across ${Object.keys(sections).length} sections. Total: ${examData.totalMarks || '?'} marks.`,
        sections: sectionLines,
        focus: highestMarksSection ? `${highestMarksSection[0]} has the most marks (${highestMarksSection[1].marks}). That is where to focus your practice.` : '',
        firstStep: examData.questions.length > 20
          ? 'Start with Section I (multiple choice) to warm up, then move to the extended response questions.'
          : 'Start from Question 1 and work through. Use "Get a hint" if you get stuck.',
      });
      return;
    }

    // For non-exam documents, use AI to generate summary
    setLoading(true);
    fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: 'Summarise this document in exactly 3 bullet points: (1) What type of assessment this is and what it asks. (2) The single most important thing to get right. (3) A concrete first step to start working on it.' }],
        assessmentTitle,
        briefText: briefText.slice(0, 2000),
        tier: 'tertiary',
        learnerContext: learnerContext || undefined,
        systemOverride: 'You are generating a "First Look" summary. Be specific to THIS document. Max 3 bullet points, max 20 words each. No greetings. No questions. Just the 3 points. Australian English.',
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.reply) {
          const lines = data.reply.split('\n').filter(l => l.trim());
          setSummary({
            whatIs: lines[0]?.replace(/^[\d\.\-\*\s]+/, '') || '',
            focus: lines[1]?.replace(/^[\d\.\-\*\s]+/, '') || '',
            firstStep: lines[2]?.replace(/^[\d\.\-\*\s]+/, '') || '',
          });
        }
      })
      .catch(() => { setError('Could not analyse your document. Use the tools in the right panel to get started.'); })
      .finally(() => setLoading(false));
  }, [dismissed, summary, loading, briefText, isExamPaper, examData, assessmentTitle, learnerContext, documentType]);

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(dismissKey, 'true'); } catch {}
  };

  if (dismissed || (!summary && !loading && !error)) return null;

  return (
    <div style={{
      margin: '12px 16px', padding: '14px 16px',
      background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
      borderRadius: BORDER_RADIUS + 2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>
          {loading ? 'Analysing your document (about 5 seconds)...' : 'First look'}
        </span>
        <button type="button" onClick={handleDismiss} aria-label="Dismiss"
          style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontSize: 12, padding: 4, minWidth: 28, minHeight: 28 }}>
          {'\u2715'}
        </button>
      </div>

      {error && !summary && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>{error}</p>
      )}
      {summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {summary.whatIs && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
              {summary.whatIs}
            </p>
          )}
          {summary.sections && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {summary.sections.map((s, i) => (
                <span key={i} style={{ fontFamily: FONT_SYSTEM, fontSize: 9, padding: '3px 8px', background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, color: TEXT_MUTED }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          {summary.focus && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: ACCENT_PULSE, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
              {summary.focus}
            </p>
          )}
          {summary.firstStep && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
              First step: {summary.firstStep}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
