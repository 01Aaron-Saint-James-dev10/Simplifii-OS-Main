import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN, COLOUR_WARN_GLASS, COLOUR_WARN_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
  SHADOW_CARD_HOVER,
} from '../../theme/tokens';

/**
 * ExamTimer
 *
 * Left-edge timer strip for HSC practice exams.
 *
 * Features:
 *   - Auto-calculates total exam duration from totalMarks + extraTimePercent
 *   - Reading time mode (first 5 minutes, no-writing phase)
 *   - Per-question time budget shown in green arc; amber when over
 *   - Whole-exam countdown in corner
 *   - Calm "time to move on" nudge -- never alarms
 *   - Extra time prompt surfaces once, persisted to parent via onSetExtraTime
 *
 * Props:
 *   examData          { totalMarks, questions: [{ number, marks }] }
 *   activeQuestion    number (currently selected question number)
 *   extraTimePercent  number (0 | 10 | 25 | custom) -- from settings
 *   onSetExtraTime    fn(percent) -- called once when student sets extra time
 *   onMoveOn          fn() -- called when timer nudges student to next question
 *   reducedMotion     boolean
 */

const READING_MINUTES = 5;
const MINS_PER_MARK = 1.8;
const MCQ_MINS_EACH = 1.2; // capped for MCQ questions

function calcExamMinutes(totalMarks, extraPct) {
  const base = totalMarks * MINS_PER_MARK + READING_MINUTES;
  return Math.round(base * (1 + (extraPct || 0) / 100));
}

function calcQuestionMinutes(question, extraPct) {
  if (!question) return 0;
  const isMcq = question.section && /multiple.choice|section.i\b/i.test(question.section);
  const base = isMcq ? MCQ_MINS_EACH : (question.marks || 2) * MINS_PER_MARK;
  return Math.max(1, Math.round(base * (1 + (extraPct || 0) / 100)));
}

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

function formatMm(totalSeconds) {
  const m = Math.ceil(Math.max(0, totalSeconds) / 60);
  return `${m}m`;
}

// Thin arc SVG: renders a circular progress arc in a small 48x48 box.
function Arc({ progress, colour, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, Math.max(0, progress));
  const cx = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={SURFACE_RAISED} strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={colour}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s linear' }}
      />
    </svg>
  );
}

export default function ExamTimer({
  examData,
  activeQuestion,
  extraTimePercent,
  onSetExtraTime,
  onMoveOn,
  onPhaseChange,
  reducedMotion,
}) {
  const totalMarks = examData?.totalMarks || 0;
  const questions = examData?.questions || [];

  // Whether to show the extra-time prompt (once only)
  const [showExtraPrompt, setShowExtraPrompt] = useState(extraTimePercent === null || extraTimePercent === undefined);
  const [collapsed, setCollapsed] = useState(false);

  // Timer state
  const [phase, setPhase] = useState('reading'); // 'reading' | 'exam' | 'done'
  const [running, setRunning] = useState(false);
  const [examSecsLeft, setExamSecsLeft] = useState(null);
  const [qSecsLeft, setQSecsLeft] = useState(null);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const nudgeDismissed = useRef(false);
  const intervalRef = useRef(null);
  const prevQuestion = useRef(activeQuestion);

  const extraPct = extraTimePercent ?? 0;
  const examTotalMins = calcExamMinutes(totalMarks, extraPct);
  const currentQ = questions.find(q => q.number === activeQuestion);
  const currentQMins = calcQuestionMinutes(currentQ, extraPct);

  // Initialise exam time when extra time is set or examData changes
  useEffect(() => {
    if (totalMarks > 0 && examSecsLeft === null) {
      setExamSecsLeft(examTotalMins * 60);
    }
  }, [totalMarks, examTotalMins, examSecsLeft]);

  // Reset per-question timer when question changes
  useEffect(() => {
    if (activeQuestion !== prevQuestion.current) {
      prevQuestion.current = activeQuestion;
      setQSecsLeft(currentQMins * 60);
      nudgeDismissed.current = false;
      setNudgeVisible(false);
    } else if (qSecsLeft === null && currentQMins > 0) {
      setQSecsLeft(currentQMins * 60);
    }
  }, [activeQuestion, currentQMins, qSecsLeft]);

  // Tick
  useEffect(() => {
    if (!running || phase === 'done') return;
    intervalRef.current = setInterval(() => {
      setExamSecsLeft(prev => {
        if (prev <= 1) { setPhase('done'); setRunning(false); return 0; }
        return prev - 1;
      });
      setQSecsLeft(prev => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0 && !nudgeDismissed.current) setNudgeVisible(true);
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  // Notify parent whenever phase changes
  useEffect(() => { onPhaseChange?.(phase); }, [phase]); // eslint-disable-line

  // Reading time: auto-advance after READING_MINUTES
  useEffect(() => {
    if (phase !== 'reading' || !running) return;
    const readingSecs = READING_MINUTES * 60;
    const tid = setTimeout(() => {
      setPhase('exam');
      setQSecsLeft(currentQMins * 60);
    }, readingSecs * 1000);
    return () => clearTimeout(tid);
  }, [phase, running, currentQMins]);

  const handleStart = useCallback(() => {
    setRunning(true);
    if (phase === 'reading') {
      setExamSecsLeft(examTotalMins * 60);
    }
  }, [phase, examTotalMins]);

  const handlePause = useCallback(() => setRunning(false), []);

  const handleExtraTime = useCallback((pct) => {
    onSetExtraTime?.(pct);
    setShowExtraPrompt(false);
  }, [onSetExtraTime]);

  const dismissNudge = useCallback(() => {
    nudgeDismissed.current = true;
    setNudgeVisible(false);
    onMoveOn?.();
  }, [onMoveOn]);

  if (!totalMarks) return null;

  // Progress ratios
  const examProgress = examSecsLeft !== null ? 1 - (examSecsLeft / (examTotalMins * 60)) : 0;
  const qProgress = qSecsLeft !== null ? 1 - (qSecsLeft / (currentQMins * 60)) : 0;
  const qOverTime = qSecsLeft !== null && qSecsLeft <= 0;
  const examNearEnd = examSecsLeft !== null && examSecsLeft < 600; // last 10 min

  const arcColour = phase === 'reading'
    ? ACCENT_PULSE
    : qOverTime ? COLOUR_WARN : ACCENT_PULSE;

  const examColour = examNearEnd ? COLOUR_WARN : ACCENT_PULSE;

  if (collapsed) {
    return (
      <div
        role="timer"
        aria-label="Exam timer (collapsed)"
        style={{
          position: 'fixed',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(false)}
      >
        <Arc progress={examProgress} colour={examColour} size={40} stroke={3} />
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>timer</span>
      </div>
    );
  }

  return (
    <div
      role="complementary"
      aria-label="Exam timer"
      style={{
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 120,
        width: 112,
        background: SURFACE_CARD,
        border: `1px solid ${SURFACE_RAISED}`,
        borderLeft: 'none',
        borderRadius: `0 ${BORDER_RADIUS}px ${BORDER_RADIUS}px 0`,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        boxShadow: SHADOW_CARD_HOVER,
      }}
    >
      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(true)}
        aria-label="Collapse timer"
        style={{
          alignSelf: 'flex-end',
          background: 'none',
          border: 'none',
          color: TEXT_FAINT,
          cursor: 'pointer',
          fontSize: 10,
          padding: 0,
          lineHeight: 1,
          fontFamily: FONT_SYSTEM,
        }}
      >
        x
      </button>

      {/* Extra time prompt -- surfaces once */}
      {showExtraPrompt && (
        <div style={{ width: '100%' }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: TEXT_MUTED, margin: '0 0 6px', textAlign: 'center', lineHeight: 1.4 }}>
            Do you get extra time?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'No extra time', value: 0 },
              { label: '+10%', value: 10 },
              { label: '+25%', value: 25 },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleExtraTime(opt.value)}
                style={{
                  fontFamily: FONT_SYSTEM,
                  fontSize: 10,
                  background: ACCENT_GLASS,
                  border: `1px solid ${ACCENT_BORDER}`,
                  color: TEXT_PRIMARY,
                  borderRadius: BORDER_RADIUS,
                  padding: '4px 6px',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowExtraPrompt(false)}
            style={{
              marginTop: 4,
              fontFamily: FONT_SYSTEM,
              fontSize: 9,
              background: 'none',
              border: 'none',
              color: TEXT_FAINT,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
            }}
          >
            skip
          </button>
        </div>
      )}

      {!showExtraPrompt && (
        <>
          {/* Phase label */}
          <span
            style={{
              fontFamily: FONT_SYSTEM,
              fontSize: 9,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: phase === 'reading' ? ACCENT_PULSE : phase === 'done' ? COLOUR_WARN : TEXT_FAINT,
            }}
          >
            {phase === 'reading' ? 'Reading' : phase === 'done' ? 'Time up' : 'Exam'}
          </span>

          {/* Total exam arc + countdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Arc progress={examProgress} colour={examColour} size={64} stroke={5} />
            <span
              aria-live="polite"
              style={{
                position: 'absolute',
                fontFamily: FONT_SYSTEM,
                fontSize: examSecsLeft !== null && examSecsLeft < 3600 ? 11 : 10,
                color: examNearEnd ? COLOUR_WARN : TEXT_PRIMARY,
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}
            >
              {examSecsLeft !== null ? formatMmSs(examSecsLeft) : `${examTotalMins}m`}
            </span>
          </div>
          <span style={{ fontFamily: FONT_BODY, fontSize: 9, color: TEXT_FAINT }}>total left</span>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, background: SURFACE_RAISED }} />

          {/* Per-question arc */}
          {currentQ && phase === 'exam' && (
            <>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Arc progress={qProgress} colour={arcColour} size={48} stroke={4} />
                <span
                  style={{
                    position: 'absolute',
                    fontFamily: FONT_SYSTEM,
                    fontSize: 10,
                    color: qOverTime ? COLOUR_WARN : TEXT_PRIMARY,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {qSecsLeft !== null ? formatMm(qSecsLeft) : `${currentQMins}m`}
                </span>
              </div>
              <span style={{ fontFamily: FONT_BODY, fontSize: 9, color: TEXT_FAINT, textAlign: 'center' }}>
                Q{activeQuestion} ({currentQ.marks || 1}mk)
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 9, color: TEXT_FAINT }}>
                budget {currentQMins}m
              </span>
            </>
          )}

          {/* Reading time instruction */}
          {phase === 'reading' && running && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 9, color: TEXT_MUTED, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              Reading time - annotate questions, no writing yet
            </p>
          )}

          {/* Nudge: time to move on */}
          {nudgeVisible && (
            <div
              role="status"
              aria-live="polite"
              style={{
                background: COLOUR_WARN_GLASS,
                border: `1px solid ${COLOUR_WARN_BORDER}`,
                borderRadius: BORDER_RADIUS,
                padding: '6px 8px',
                width: '100%',
              }}
            >
              <p style={{ fontFamily: FONT_BODY, fontSize: 9, color: COLOUR_WARN, margin: '0 0 4px', lineHeight: 1.4 }}>
                Time to move on
              </p>
              <button
                onClick={dismissNudge}
                style={{
                  fontFamily: FONT_SYSTEM,
                  fontSize: 9,
                  background: 'none',
                  border: `1px solid ${COLOUR_WARN_BORDER}`,
                  color: COLOUR_WARN,
                  borderRadius: BORDER_RADIUS,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Got it
              </button>
            </div>
          )}

          {/* Exam done */}
          {phase === 'done' && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 9, color: COLOUR_WARN, textAlign: 'center', lineHeight: 1.4, margin: 0 }}>
              Time is up. Review your answers.
            </p>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: 4, width: '100%' }}>
            {!running && phase !== 'done' ? (
              <button
                onClick={handleStart}
                aria-label="Start timer"
                style={{
                  flex: 1,
                  fontFamily: FONT_SYSTEM,
                  fontSize: 9,
                  background: ACCENT_GLASS,
                  border: `1px solid ${ACCENT_BORDER}`,
                  color: ACCENT_PULSE,
                  borderRadius: BORDER_RADIUS,
                  padding: '4px 0',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {phase === 'reading' ? 'Start reading' : 'Resume'}
              </button>
            ) : phase !== 'done' ? (
              <button
                onClick={handlePause}
                aria-label="Pause timer"
                style={{
                  flex: 1,
                  fontFamily: FONT_SYSTEM,
                  fontSize: 9,
                  background: 'none',
                  border: `1px solid ${SURFACE_RAISED}`,
                  color: TEXT_FAINT,
                  borderRadius: BORDER_RADIUS,
                  padding: '4px 0',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                Pause
              </button>
            ) : null}
          </div>

          {/* Extra time edit link */}
          {extraPct > 0 && (
            <button
              onClick={() => setShowExtraPrompt(true)}
              style={{
                fontFamily: FONT_SYSTEM,
                fontSize: 9,
                background: 'none',
                border: 'none',
                color: TEXT_FAINT,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              +{extraPct}% time
            </button>
          )}
        </>
      )}
    </div>
  );
}
