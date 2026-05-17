import React, { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { appendEvent } from '../../core/HistoryOfThought';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * SocraticPanel: Tier 2 of the Three-Tier Canvas
 *
 * AI generates Socratic questions grounded in the task (XN1 node)
 * and current phase. The student answers in their own words.
 * Every answer is logged to HistoryOfThought as a tier_2_response
 * event, building the Authenticity Report evidence trail.
 *
 * Props:
 *   assessmentTitle - string
 *   courseId        - string
 *   currentPhase   - object | null ({ id, label, instruction })
 *   nodes          - array of extracted nodes
 */

const TIER_LABEL_STYLE = {
  fontFamily: FONT_SYSTEM,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: ACCENT_PULSE,
  padding: '6px 12px 4px',
  borderBottom: `1px solid ${SURFACE_RAISED}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export default function SocraticPanel({ assessmentTitle, courseId, currentPhase, nodes }) {
  const { isLiteralMode, accessibilityProfile } = useSettings();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const xn1 = nodes?.find(n => n.nodeType === 'XN1');

  const generateQuestions = useCallback(async () => {
    if (!assessmentTitle) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'Generate Socratic questions for this task.' }],
          assessmentTitle,
          tier: 'tertiary',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          systemOverride: `You are a Socratic tutor. Generate 2-3 questions that surface the student's thinking about this task. Do not give answers. Ask questions only. Ground questions in the task description and current phase. One question per line. No numbering. No bullet points. No preamble.

Task: ${xn1?.content || assessmentTitle}
${currentPhase ? `Current phase: ${currentPhase.label} (${currentPhase.instruction || ''})` : ''}

Australian English. No em-dashes. No markdown.`,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        const parsed = data.reply
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 10 && l.includes('?'));
        setQuestions(parsed.length > 0 ? parsed.slice(0, 3) : [data.reply]);
      } else {
        setError('Could not generate questions. Try again.');
      }
    } catch {
      setError('Could not connect. Try again.');
    } finally {
      setLoading(false);
    }
  }, [assessmentTitle, xn1, currentPhase, isLiteralMode, accessibilityProfile]);

  useEffect(() => {
    if (questions.length === 0 && assessmentTitle) {
      generateQuestions();
    }
  }, [xn1?.content, currentPhase?.id]);

  const handleSubmitAnswer = (index) => {
    const answer = (answers[index] || '').trim();
    if (!answer) return;
    const question = questions[index];
    appendEvent({
      event_type: 'tier_2_response',
      payload: {
        question,
        answer,
        phase: currentPhase?.label || null,
        assessmentTitle,
        courseId,
      },
    }).catch(() => {});
    setSubmitted(prev => ({ ...prev, [index]: true }));
  };

  return (
    <aside
      aria-label="Think First"
      style={{
        width: 240,
        minWidth: 240,
        maxWidth: 240,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${SURFACE_RAISED}`,
        background: SURFACE_CARD,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={TIER_LABEL_STYLE}>
        <span>Think First</span>
        <span style={{ fontWeight: 400, opacity: 0.6 }}>Your thinking matters</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED, lineHeight: 1.5 }}>
          Answer these questions in your own words before writing. Your thinking is logged for the Authenticity Report.
        </p>

        {loading && (
          <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>Generating questions...</p>
        )}

        {error && (
          <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>{error}</p>
        )}

        {questions.map((q, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{
              margin: 0,
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              lineHeight: 1.5,
            }}>
              {q}
            </p>

            {submitted[i] ? (
              <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: ACCENT_PULSE }}>
                Recorded. Your thinking is logged.
              </p>
            ) : (
              <>
                <textarea
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handleSubmitAnswer(i); } }}
                  placeholder="Type your thinking here..."
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: '8px 10px',
                    fontFamily: FONT_BODY,
                    fontSize: 11,
                    color: TEXT_PRIMARY,
                    background: SURFACE_RAISED,
                    border: `1px solid ${ACCENT_BORDER}`,
                    borderRadius: BORDER_RADIUS,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => handleSubmitAnswer(i)}
                  disabled={!(answers[i] || '').trim()}
                  style={{
                    minHeight: 44,
                    background: ACCENT_GLASS,
                    border: `1px solid ${ACCENT_BORDER}`,
                    borderRadius: BORDER_RADIUS,
                    color: (answers[i] || '').trim() ? ACCENT_PULSE : TEXT_FAINT,
                    cursor: (answers[i] || '').trim() ? 'pointer' : 'default',
                    fontFamily: FONT_SYSTEM,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    padding: '8px 12px',
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Record answer
                </button>
              </>
            )}
          </div>
        ))}

        {questions.length > 0 && !loading && (
          <button
            type="button"
            onClick={generateQuestions}
            style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 9, padding: '2px 0', marginTop: 4 }}
          >
            Generate new questions
          </button>
        )}
      </div>

      <div style={{ padding: '6px 10px', borderTop: `1px solid ${SURFACE_RAISED}`, fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, lineHeight: 1.5 }}>
        Tier 2: your answers prove original thinking in the Authenticity Report.
      </div>
    </aside>
  );
}
