import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSettings } from '../SettingsContext';
import { transformQuestion, FORMAT_TYPES } from '../services/QuestionTransformer';
import { getFormatPriority } from '../../services/AccessibilityProfileService';
import { announceAction } from '../services/PredictabilityService';
import AsciiLoader from './AsciiLoader';
import ComprehensionCheck from './ComprehensionCheck';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * MultimodalCanvas
 *
 * Renders a single question in 6 cognitive formats.
 * User switches between formats via tab bar.
 * Each format is generated on first click, then cached.
 *
 * Props:
 *   question       - { number, text, marks, section }
 *   documentId     - string (for caching)
 *   onAskTutor     - callback(questionText, formatType) for inline tutor
 */
export default function MultimodalCanvas({ question, documentId, onAskTutor }) {
  const { activeTier, accessibilityProfile, autismFirstEnabled } = useSettings();
  const priority = getFormatPriority(accessibilityProfile);
  const [activeFormat, setActiveFormat] = useState(priority[0] || 'original');
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  // Answer workspace state (per question, persisted to localStorage)
  const [answers, setAnswers] = useState(() => {
    // Restore any previously saved answers for this document
    const restored = {};
    try {
      for (let i = 1; i <= 40; i++) {
        const key = `simplifii_answer_${documentId}_q${i}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const lastAttempt = parsed.attempts?.[parsed.attempts.length - 1];
          if (lastAttempt?.text) restored[i] = lastAttempt.text;
        }
      }
    } catch { /* ignore corrupt localStorage */ }
    return restored;
  });
  const userAnswer = answers[question.number] || '';
  const setUserAnswer = (text) => setAnswers(prev => ({ ...prev, [question.number]: text }));
  const [hintLoading, setHintLoading] = useState(false);
  const [hint, setHint] = useState({});
  const [saved, setSaved] = useState({});

  const generate = useCallback(async (formatType) => {
    if (formatType === 'original' || content[formatType]) {
      setActiveFormat(formatType);
      return;
    }

    setActiveFormat(formatType);
    setLoading(formatType);
    setError('');

    try {
      const proceed = await announceAction({
        type: 'ai_response',
        description: `Transform into ${FORMAT_TYPES.find(f => f.id === formatType)?.label || formatType}`,
        estimatedMs: 8000,
      });
      if (proceed === 'cancel') { setLoading(null); return; }

      const result = await transformQuestion({
        questionText: question.text,
        questionNumber: question.number,
        formatType,
        documentId,
        tier: activeTier,
        accessibilityProfile,
      });

      setContent(prev => ({ ...prev, [formatType]: result }));
    } catch (err) {
      setError(err.message || 'Could not generate. Try again.');
    } finally {
      setLoading(null);
    }
  }, [question, documentId, activeTier, accessibilityProfile, content]);

  // Auto-generate preferred format on first render (profile-aware).
  // generateRef keeps the effect deps-free while still calling the latest generate.
  const generateRef = React.useRef(generate);
  generateRef.current = generate;
  const autoGenRef = React.useRef(false);
  React.useEffect(() => {
    if (autoGenRef.current) return;
    autoGenRef.current = true;
    const preferred = priority[0];
    if (preferred && preferred !== 'original') {
      generateRef.current(preferred);
    }
  }, []); // safe: guarded by autoGenRef; generateRef is mutable, not reactive

  const renderContent = () => {
    if (loading) return <AsciiLoader status={`Generating ${FORMAT_TYPES.find(f => f.id === loading)?.label}...`} />;
    if (error) return <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{error}</p>;

    if (activeFormat === 'original') {
      return (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.8 }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{question.text}</p>
          {question.marks > 0 && (
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, marginTop: 8 }}>
              {question.marks} marks
            </p>
          )}
        </div>
      );
    }

    const data = content[activeFormat];
    if (!data) return null;

    // Plain English
    if (activeFormat === 'plain_english') {
      return (
        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
            {data.plain_text || data.text || JSON.stringify(data)}
          </p>
          {data.words_simplified?.length > 0 && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${SURFACE_RAISED}`, paddingTop: 8 }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Words simplified</p>
              {data.words_simplified.map((w, i) => (
                <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>
                  <strong>{w.original}</strong> {'\u2192'} {w.simple}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Visual (text description for now; SVG renderer in future)
    if (activeFormat === 'visual') {
      return (
        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {data.diagram_description || data.text || JSON.stringify(data)}
          </p>
          {data.key_concepts?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {data.key_concepts.map((c, i) => (
                <span key={i} style={{ fontFamily: FONT_SYSTEM, fontSize: 10, padding: '3px 8px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, color: ACCENT_PULSE }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Audio
    if (activeFormat === 'audio') {
      const script = data.script || data.text || '';
      return (
        <div>
          <button type="button" onClick={() => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(script.replace(/\[pause\]/g, '...').replace(/\[emphasise\]/g, ''));
            utter.lang = 'en-AU';
            utter.rate = 0.9;
            window.speechSynthesis.speak(utter);
          }} style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '8px 16px', cursor: 'pointer', minHeight: 36, marginBottom: 10,
          }}>
            {'\u25B6'} Play audio
          </button>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {script}
          </p>
        </div>
      );
    }

    // Steps
    if (activeFormat === 'step_by_step') {
      const steps = data.steps || [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.length > 0 ? steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: ACCENT_PULSE, minWidth: 20 }}>{s.number || i + 1}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0 }}>
                  <strong>{s.verb}</strong> {s.action}
                </p>
                <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '2px 0 0' }}>
                  {s.estimated_minutes && `${s.estimated_minutes} min`}
                  {s.cognitive_load && ` · ${s.cognitive_load}`}
                </p>
              </div>
            </div>
          )) : (
            <pre style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, whiteSpace: 'pre-wrap' }}>
              {data.text || JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // Worked Example
    if (activeFormat === 'worked_example') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.similar_question && (
            <div style={{ padding: '10px 12px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Practice question</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.6 }}>{data.similar_question}</p>
            </div>
          )}
          <details>
            <summary style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED, cursor: 'pointer' }}>Show worked solution</summary>
            <pre style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: '8px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {data.worked_solution || data.text || JSON.stringify(data, null, 2)}
            </pre>
          </details>
          {data.common_mistakes?.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: COLOUR_WARN, margin: '0 0 4px', textTransform: 'uppercase' }}>Common mistakes</p>
              {data.common_mistakes.map((m, i) => (
                <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 2px' }}>{'\u26A0'} {m}</p>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Fallback
    return <pre style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${SURFACE_RAISED}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {question.section && (
            <div style={{ fontFamily: FONT_SYSTEM, fontSize: 8, fontWeight: 600, color: TEXT_FAINT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              {question.section}
            </div>
          )}
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Question {question.number}
          </span>
          {question.marks > 0 && (
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, marginLeft: 8 }}>
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </span>
          )}
        </div>
      </div>

      {/* Format tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '6px 14px', borderBottom: `1px solid ${SURFACE_RAISED}`, overflowX: 'auto' }}>
        {FORMAT_TYPES.map(f => {
          const isActive = activeFormat === f.id;
          const hasContent = f.id === 'original' || !!content[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => generate(f.id)}
              disabled={loading === f.id}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
                letterSpacing: '0.04em',
                color: isActive ? ACCENT_PULSE : hasContent ? TEXT_PRIMARY : TEXT_FAINT,
                background: isActive ? ACCENT_GLASS : 'transparent',
                border: `1px solid ${isActive ? ACCENT_BORDER : 'transparent'}`,
                borderRadius: BORDER_RADIUS, padding: '4px 8px',
                cursor: loading ? 'wait' : 'pointer', outline: 'none',
                whiteSpace: 'nowrap', minHeight: 28,
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {f.icon} {f.label} {hasContent && f.id !== 'original' ? '\u2713' : ''}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, padding: '14px 14px 20px', overflowY: 'auto' }}>
        {renderContent()}
      </div>

      {/* Answer workspace */}
      <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${SURFACE_RAISED}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 6px' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ACCENT_PULSE }}>
            Your answer
          </span>
          {saved[question.number] && (
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Saved</span>
          )}
        </div>
        <textarea
          placeholder={`Try answering Q${question.number} here...`}
          value={userAnswer}
          onChange={(e) => { setUserAnswer(e.target.value); setSaved(prev => ({ ...prev, [question.number]: false })); }}
          style={{
            width: '100%', minHeight: 160, padding: '10px 12px',
            fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.7,
            color: TEXT_PRIMARY, background: 'transparent',
            border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
            resize: 'vertical', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; }}
          onBlur={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}
        />

        {/* Hint display */}
        {hint[question.number] && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hint</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{hint[question.number]}</p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button"
            disabled={hintLoading}
            onClick={async () => {
              setHintLoading(true);
              try {
                const res = await fetch('/api/tutor', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messages: [{ role: 'user', text: `Give me a hint for this question (do NOT give the answer): ${question.text}` }],
                    assessmentTitle: `Question ${question.number}`,
                    tier: activeTier || 'tertiary',
                    systemOverride: 'You are a Socratic tutor. Give ONE helpful hint that guides the student toward the answer without revealing it. Keep it under 3 sentences. Australian English.',
                  }),
                });
                const data = await res.json();
                if (data.success) setHint(prev => ({ ...prev, [question.number]: data.reply }));
              } catch { /* network error */ }
              setHintLoading(false);
            }}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
              color: TEXT_MUTED, background: 'transparent',
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
              padding: '4px 10px', cursor: hintLoading ? 'wait' : 'pointer', minHeight: 28,
            }}>
            {hintLoading ? 'Thinking...' : 'Get a hint'}
          </button>
          <button type="button"
            disabled={!userAnswer.trim()}
            onClick={() => {
              if (onAskTutor) onAskTutor(
                `My answer to Q${question.number}: "${userAnswer}"\n\nThe question was: ${question.text}\n\nHow did I go? What could I improve?`,
                activeFormat
              );
            }}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
              color: userAnswer.trim() ? ACCENT_PULSE : TEXT_FAINT,
              background: userAnswer.trim() ? ACCENT_GLASS : 'transparent',
              border: `1px solid ${userAnswer.trim() ? ACCENT_BORDER : SURFACE_RAISED}`,
              borderRadius: BORDER_RADIUS,
              padding: '4px 10px', cursor: userAnswer.trim() ? 'pointer' : 'default', minHeight: 28,
            }}>
            Check my answer
          </button>
          <button type="button"
            disabled={!userAnswer.trim()}
            onClick={() => {
              // Save to localStorage keyed by documentId + question number
              const key = `simplifii_answer_${documentId}_q${question.number}`;
              const existing = JSON.parse(localStorage.getItem(key) || '{"attempts":[]}');
              existing.attempts.push({ text: userAnswer, timestamp: Date.now(), format: activeFormat });
              localStorage.setItem(key, JSON.stringify(existing));
              setSaved(prev => ({ ...prev, [question.number]: true }));
            }}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
              color: userAnswer.trim() ? TEXT_MUTED : TEXT_FAINT,
              background: 'transparent',
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
              padding: '4px 10px', cursor: userAnswer.trim() ? 'pointer' : 'default', minHeight: 28,
            }}>
            Save attempt
          </button>
          {onAskTutor && (
            <button type="button"
              onClick={() => onAskTutor(question.text, activeFormat)}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
                color: TEXT_MUTED, background: 'transparent',
                border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                padding: '4px 10px', cursor: 'pointer', minHeight: 28,
              }}>
              Ask tutor about this question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
