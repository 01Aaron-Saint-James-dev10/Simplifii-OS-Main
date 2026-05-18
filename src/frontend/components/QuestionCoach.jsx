import React, { useState, useCallback, useRef } from 'react';
import AsciiLoader from './AsciiLoader';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * QuestionCoach
 *
 * Three-tier canvas for exam questions.
 * Tier 1: Question text + four UDL transform buttons (Plain, Steps, Example, Audio).
 * Tier 2: AURA Socratic prompt anchored to the selected question.
 * Tier 3: Answer workspace, persisted to localStorage per question.
 *
 * Absorbs QuestionNav pill strip: renders horizontally across the top.
 *
 * Props:
 *   questions        [{ number, text, marks, section }]
 *   activeQuestion   number
 *   onSelectQuestion fn(number)
 *   documentId       string
 *   onAskTutor       fn(text)
 */

const UDL_BUTTONS = [
  { id: 'plain',   label: 'Plain',   key: 'plainLanguage',   title: 'Year 8 reading level with all terms defined' },
  { id: 'steps',   label: 'Steps',   key: 'visualBreakdown', title: 'Numbered steps with mark allocation' },
  { id: 'example', label: 'Example', key: 'workedExample',   title: 'Parallel question from a different topic' },
  { id: 'audio',   label: 'Audio',   key: 'audioReady',      title: 'Short sentences with [PAUSE] markers' },
];

function answerKey(documentId, questionNumber) {
  return `simplifii_answer_${documentId}_q${questionNumber}`;
}

function loadAnswer(documentId, questionNumber) {
  try {
    const raw = localStorage.getItem(answerKey(documentId, questionNumber));
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed.attempts?.[parsed.attempts.length - 1]?.text || '';
  } catch { return ''; }
}

function saveAnswer(documentId, questionNumber, text) {
  try {
    const key = answerKey(documentId, questionNumber);
    const existing = JSON.parse(localStorage.getItem(key) || '{"attempts":[]}');
    const attempts = existing.attempts || [];
    const last = attempts[attempts.length - 1];
    if (last && Date.now() - last.ts < 30000) {
      last.text = text;
      last.ts = Date.now();
    } else {
      attempts.push({ text, ts: Date.now() });
    }
    localStorage.setItem(key, JSON.stringify({ attempts }));
  } catch { /* ignore */ }
}

export default function QuestionCoach({ questions = [], activeQuestion, onSelectQuestion, documentId, onAskTutor }) {
  const question = questions.find(q => q.number === activeQuestion) || questions[0] || null;

  // UDL cache: { [questionNumber]: { plainLanguage, visualBreakdown, workedExample, audioReady } }
  const [udlCache, setUdlCache] = useState({});
  const [udlLoading, setUdlLoading] = useState(null);
  const [udlError, setUdlError] = useState('');
  const [activeUdl, setActiveUdl] = useState(null);

  // Answer state seeded from localStorage
  const [answer, setAnswer] = useState(() => question ? loadAnswer(documentId, question.number) : '');
  const [saved, setSaved] = useState(false);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  // When active question changes, restore answer from localStorage
  const prevQuestionRef = React.useRef(activeQuestion);
  if (prevQuestionRef.current !== activeQuestion) {
    prevQuestionRef.current = activeQuestion;
    setAnswer(question ? loadAnswer(documentId, question.number) : '');
    setActiveUdl(null);
    setUdlError('');
  }

  const handleUdlClick = useCallback(async (btn) => {
    if (!question) return;

    const cached = udlCache[question.number];
    if (cached?.[btn.key]) {
      setActiveUdl(btn.id);
      return;
    }

    setActiveUdl(btn.id);
    setUdlLoading(btn.id);
    setUdlError('');

    try {
      const res = await fetch('/api/transform-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          marks: question.marks,
          questionType: question.section || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUdlError(data.error || 'Could not transform question. Try again.');
        return;
      }
      setUdlCache(prev => ({
        ...prev,
        [question.number]: { ...prev[question.number], ...data },
      }));
    } catch {
      setUdlError('Could not reach the server. Try again.');
    } finally {
      setUdlLoading(null);
    }
  }, [question, udlCache]);

  const handleAnswerChange = (e) => {
    const text = e.target.value;
    setAnswer(text);
    setSaved(false);
    if (question) saveAnswer(documentId, question.number, text);
  };

  const handleSave = () => {
    if (question) saveAnswer(documentId, question.number, answer);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAskAura = () => {
    if (!question || !onAskTutor) return;
    onAskTutor(`I need help with this question: ${question.text}${question.marks ? ` (${question.marks} marks)` : ''}`);
  };

  const handlePlayAudio = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      text.replace(/\[PAUSE\]/gi, '...').trim()
    );
    utter.lang = 'en-AU';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  if (!question) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: TEXT_FAINT, fontFamily: FONT_SYSTEM, fontSize: 12 }}>
        Parsing exam questions...
      </div>
    );
  }

  const cachedResult = udlCache[question.number];
  const activeBtn = UDL_BUTTONS.find(b => b.id === activeUdl);
  const udlContent = activeBtn && cachedResult?.[activeBtn.key];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Pill strip */}
      <div
        role="tablist"
        aria-label="Question list"
        style={{ display: 'flex', gap: 4, padding: '8px 12px', overflowX: 'auto',
          borderBottom: `1px solid ${SURFACE_RAISED}`, flexShrink: 0 }}
      >
        {questions.map(q => {
          const isActive = q.number === activeQuestion;
          const hasAnswer = !!loadAnswer(documentId, q.number);
          return (
            <button
              key={q.number}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectQuestion(q.number)}
              title={`Question ${q.number}${q.marks ? ` (${q.marks} marks)` : ''}`}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: isActive ? 700 : 400,
                padding: '4px 10px', borderRadius: BORDER_RADIUS, flexShrink: 0,
                background: isActive ? ACCENT_GLASS : 'transparent',
                border: isActive ? `1px solid ${ACCENT_BORDER}` : `1px solid ${SURFACE_RAISED}`,
                color: isActive ? ACCENT_PULSE : hasAnswer ? TEXT_PRIMARY : TEXT_MUTED,
                cursor: 'pointer',
              }}
            >
              Q{q.number}{q.marks > 0 ? ` (${q.marks}m)` : ''}{hasAnswer ? ' \u2713' : ''}
            </button>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Tier 1: Question + UDL buttons */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: TEXT_FAINT }}>
              Tier 1: Question
            </span>
            {question.marks > 0 && (
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE,
                background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: BORDER_RADIUS, padding: '2px 7px' }}>
                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
              </span>
            )}
          </div>

          {/* Question text (always visible) */}
          {(!activeUdl || !udlContent) && !udlLoading && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY,
              lineHeight: 1.8, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
              {question.text}
            </p>
          )}

          {/* UDL buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {UDL_BUTTONS.map(btn => (
              <button
                key={btn.id}
                type="button"
                title={btn.title}
                onClick={() => handleUdlClick(btn)}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                style={{
                  fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: BORDER_RADIUS,
                  background: activeUdl === btn.id ? ACCENT_GLASS : 'transparent',
                  border: activeUdl === btn.id ? `1px solid ${ACCENT_BORDER}` : `1px solid ${SURFACE_RAISED}`,
                  color: activeUdl === btn.id ? ACCENT_PULSE : TEXT_MUTED,
                  cursor: 'pointer', minHeight: 32,
                }}
              >
                {btn.label}
              </button>
            ))}
            {activeUdl && (
              <button
                type="button"
                onClick={() => setActiveUdl(null)}
                title="Show original question"
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px' }}
              >
                {'\u00D7'} Original
              </button>
            )}
          </div>

          {/* UDL result */}
          {udlLoading && <AsciiLoader status={`Generating ${UDL_BUTTONS.find(b => b.id === udlLoading)?.label}...`} />}
          {udlError && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{udlError}</p>
          )}
          {!udlLoading && udlContent && (
            <div style={{ padding: '10px 12px', background: ACCENT_GLASS,
              border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
              {activeUdl === 'audio' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(udlContent)}
                    style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: ACCENT_PULSE, background: 'transparent',
                      border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
                      padding: '6px 14px', cursor: 'pointer', marginBottom: 8, minHeight: 32 }}
                  >
                    {'\u25B6'} Play
                  </button>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED,
                    lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {udlContent}
                  </p>
                </>
              ) : (
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY,
                  lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {udlContent}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tier 2: AURA Socratic */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT,
            display: 'block', marginBottom: 8 }}>
            Tier 2: AURA
          </span>
          <button
            type="button"
            onClick={handleAskAura}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: ACCENT_PULSE, background: ACCENT_GLASS,
              border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
              padding: '8px 16px', cursor: 'pointer', minHeight: 36 }}
          >
            Ask AURA about this question
          </button>
        </div>

        {/* Tier 3: Answer workspace */}
        <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT }}>
              Tier 3: Your answer
            </span>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <textarea
            aria-label={`Answer for question ${question.number}`}
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Write your answer here..."
            style={{ flex: 1, minHeight: 140, fontFamily: FONT_BODY, fontSize: 13,
              color: TEXT_PRIMARY, background: 'transparent',
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
              padding: '10px 12px', lineHeight: 1.7, resize: 'vertical',
              outline: 'none', width: '100%', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = ACCENT_PULSE; }}
            onBlur={e => { e.target.style.borderColor = SURFACE_RAISED; }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={handleSave}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: saved ? TEXT_FAINT : ACCENT_PULSE,
                background: 'transparent',
                border: `1px solid ${saved ? SURFACE_RAISED : ACCENT_BORDER}`,
                borderRadius: BORDER_RADIUS, padding: '6px 14px',
                cursor: 'pointer', minHeight: 32 }}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
