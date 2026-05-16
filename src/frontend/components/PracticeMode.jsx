import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../SettingsContext';
import useLearnerContext from '../hooks/useLearnerContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * PracticeMode
 *
 * Standalone practice question interface. Can operate:
 * 1. From uploaded brief (generates questions from rubric)
 * 2. From the past papers database (seeded questions)
 * 3. From a subject the learner types in
 *
 * AURA guides through each question using Socratic method.
 * UDL 3.0 transformations available per question.
 */

const SUBJECTS_HSC = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Modern History', 'Ancient History', 'Geography', 'Economics', 'Legal Studies', 'PDHPE', 'Business Studies'];

export default function PracticeMode({ briefText, rubricCriteria, assessmentTitle, courseId, onClose }) {
  const { user } = useAuth();
  const { activeTier, isLiteralMode, accessibilityProfile } = useSettings();
  const { learnerContext } = useLearnerContext();
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [source, setSource] = useState('');

  const generateQuestions = useCallback(async (opts = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefText: opts.briefText || briefText || '',
          rubricCriteria: opts.rubricCriteria || rubricCriteria || [],
          assessmentTitle: opts.assessmentTitle || assessmentTitle || '',
          subject: opts.subject || subject || '',
          tier: activeTier || 'tertiary',
          questionCount: 5,
          format: 'mixed',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          learnerContext: learnerContext || undefined,
          user_id: user?.id || null,
        }),
      });
      const data = await response.json();
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setSource(data.source);
        setActiveIndex(0);
      } else {
        setError(data.error || 'Could not generate questions. Try again.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, [briefText, rubricCriteria, assessmentTitle, subject, activeTier, isLiteralMode, accessibilityProfile, learnerContext, user]);

  const activeQuestion = questions[activeIndex] || null;

  // No questions yet: show entry options
  if (questions.length === 0) {
    return (
      <div style={{ padding: 20, maxWidth: 500 }}>
        <h2 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 8px' }}>
          Practice Mode
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: '0 0 20px', lineHeight: 1.5 }}>
          Get practice questions matched to your assessment. AURA will guide you through each one.
        </p>

        {/* Option 1: From uploaded brief */}
        {briefText && briefText.length > 50 && (
          <button type="button" onClick={() => generateQuestions()} disabled={loading}
            style={{ width: '100%', padding: '12px 16px', marginBottom: 8, textAlign: 'left', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS + 4, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, minHeight: 44 }}>
            Generate from my uploaded brief
            <span style={{ display: 'block', fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, marginTop: 2 }}>
              Questions matched to your rubric criteria
            </span>
          </button>
        )}

        {/* Option 2: By subject */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginBottom: 4 }}>
            Or choose a subject
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUBJECTS_HSC.map(s => (
              <button key={s} type="button" onClick={() => { setSubject(s); generateQuestions({ subject: s }); }}
                disabled={loading}
                style={{
                  padding: '6px 10px', fontFamily: FONT_SYSTEM, fontSize: 10,
                  color: TEXT_MUTED, background: 'transparent',
                  border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                  cursor: 'pointer', minHeight: 28,
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, marginTop: 12 }}>Generating questions...</p>}
        {error && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, marginTop: 12 }}>{error}</p>}
      </div>
    );
  }

  // Questions loaded: show one at a time
  return (
    <div style={{ padding: 20, maxWidth: 560 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>
            Practice Mode
          </span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginLeft: 8 }}>
            {source === 'database' ? 'Past paper' : 'AI-generated'} | Q{activeIndex + 1} of {questions.length}
          </span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer' }}>
            Exit
          </button>
        )}
      </div>

      {/* Active question */}
      {activeQuestion && (
        <div style={{ background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS + 4, padding: '16px 18px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: TEXT_FAINT }}>
              {activeQuestion.marks > 0 ? `${activeQuestion.marks} mark${activeQuestion.marks === 1 ? '' : 's'}` : ''}
              {activeQuestion.difficulty ? ` | ${activeQuestion.difficulty}` : ''}
            </span>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE }}>
              {activeQuestion.criterion}
            </span>
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, margin: 0 }}>
            {activeQuestion.text}
          </p>
          {activeQuestion.hint && (
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, margin: '10px 0 0', borderTop: `1px solid ${SURFACE_RAISED}`, paddingTop: 8 }}>
              Hint: {activeQuestion.hint}
            </p>
          )}
          {activeQuestion.source && (
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '4px 0 0' }}>
              Source: {activeQuestion.source}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setActiveIndex(i => Math.max(0, i - 1))} disabled={activeIndex === 0}
          style={{ flex: 1, padding: '8px', fontFamily: FONT_SYSTEM, fontSize: 10, color: activeIndex > 0 ? TEXT_MUTED : TEXT_FAINT, background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, cursor: 'pointer', minHeight: 36 }}>
          Previous
        </button>
        <button type="button" onClick={() => setActiveIndex(i => Math.min(questions.length - 1, i + 1))} disabled={activeIndex >= questions.length - 1}
          style={{ flex: 1, padding: '8px', fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE, background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, cursor: 'pointer', minHeight: 36 }}>
          Next Question
        </button>
      </div>

      {/* Ask AURA about this question */}
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, marginTop: 12, textAlign: 'center' }}>
        Click the AURA orb to ask for help with this question.
      </p>
    </div>
  );
}
