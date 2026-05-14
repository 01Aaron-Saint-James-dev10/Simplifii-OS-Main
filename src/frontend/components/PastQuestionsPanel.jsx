import React, { useState, useEffect } from 'react';
import AsciiLoader from './AsciiLoader';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * PastQuestionsPanel
 *
 * Right panel tab for Y10-12 users. Calls /api/scaffold-suggest
 * with the current assessment brief and shows matching HSC past
 * questions with marker feedback excerpts.
 *
 * Props:
 *   assessmentTitle - string
 *   briefText       - string (the assessment brief content)
 *   courseId         - string
 */
export default function PastQuestionsPanel({ assessmentTitle, briefText, courseId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!briefText || briefText.length < 20) return;
    setLoading(true);
    setError('');
    fetch('/api/scaffold-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentBriefText: briefText }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResults(data);
        } else {
          setError(data.error || 'Could not load past questions.');
        }
      })
      .catch(() => setError('Network error loading past questions.'))
      .finally(() => setLoading(false));
  }, [briefText]);

  const handleUsePractice = (q) => {
    const text = `\n\nPractice prompt (HSC ${q.year}):\n${q.questionText}\n${q.marks ? `(${q.marks} marks)` : ''}\n`;
    window.dispatchEvent(new CustomEvent('simplifii:voice-transcript', { detail: { text } }));
  };

  return (
    <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 4px' }}>
          HSC Past Questions
        </h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: 0 }}>
          Similar questions from past HSC exams with marker feedback.
        </p>
      </div>

      {loading && <AsciiLoader status="Finding relevant past questions..." />}

      {error && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{error}</p>
      )}

      {results && results.suggestedPastQuestions?.length === 0 && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>
          No matching past questions found. Try uploading a more detailed brief.
        </p>
      )}

      {results && results.suggestedPastQuestions?.length > 0 && (
        <>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0 }}>
            Confidence: {results.confidence} | {results.suggestedPastQuestions.length} matches
          </p>
          {results.suggestedPastQuestions.slice(0, 3).map((q, i) => (
            <div key={q.id || i} style={{
              padding: '10px 12px', borderBottom: `1px solid ${SURFACE_RAISED}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 2px' }}>
                    {q.questionText}
                  </p>
                  <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0 }}>
                    HSC {q.year} | {q.board} {q.subject}{q.marks ? ` | ${q.marks} marks` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setExpanded(expanded === i ? null : i)}
                  aria-label={expanded === i ? 'Collapse' : 'View marker feedback'}
                  style={{
                    fontFamily: FONT_SYSTEM, fontSize: 8, fontWeight: 700, padding: '3px 6px',
                    borderRadius: 4, background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
                    color: TEXT_FAINT, cursor: 'pointer', flexShrink: 0,
                  }}>
                  {expanded === i ? 'Less' : 'More'}
                </button>
              </div>

              {expanded === i && q.markerFeedback && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: ACCENT_GLASS, borderRadius: BORDER_RADIUS, border: `1px solid ${ACCENT_BORDER}` }}>
                  <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: ACCENT_PULSE, margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Marker feedback
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {q.markerFeedback}
                  </p>
                </div>
              )}

              <button type="button" onClick={() => handleUsePractice(q)}
                style={{
                  marginTop: 6, fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
                  color: ACCENT_PULSE, background: 'transparent', border: 'none',
                  cursor: 'pointer', padding: 0, textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                Use as practice prompt
              </button>
            </div>
          ))}
        </>
      )}

      {!briefText && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>
          Upload an assessment brief to see matching past questions.
        </p>
      )}
    </div>
  );
}
