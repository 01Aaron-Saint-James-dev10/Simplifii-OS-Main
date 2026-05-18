import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import AsciiLoader from './AsciiLoader';
import { transformQuestion } from '../services/QuestionTransformer';
import { exportToAnswerBooklet } from '../../services/DocxExportService';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN, COLOUR_WARN_GLASS, COLOUR_WARN_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * QuestionCoach
 *
 * Three-tier canvas for exam questions with UDL 3.0 scaffolds.
 *
 * Tier 1: Question text + 5 UDL transforms (Plain, Steps, Example, Audio, Decode).
 *         If marking guidelines are available, shows marking criteria per question.
 * Tier 2: AURA Socratic + three thinking-mode prompts (Critical, Systems, Creative).
 * Tier 3: Strengths-based warm-up brain-dump + answer workspace persisted to localStorage.
 *
 * Props:
 *   questions          [{ number, text, marks, section }]
 *   activeQuestion     number
 *   onSelectQuestion   fn(number)
 *   documentId         string
 *   onAskTutor         fn(text)
 *   markingGuidelines  { [questionNumber]: { criteria, sampleAnswer, marks } } (optional)
 */

// UDL transforms: each maps to a formatType in QuestionTransformer.
const UDL_BUTTONS = [
  { id: 'plain',   label: 'Plain',   formatType: 'plain_english',  title: 'Year 8 reading level with all terms defined' },
  { id: 'steps',   label: 'Steps',   formatType: 'step_by_step',   title: 'Numbered micro-steps with time estimates' },
  { id: 'example', label: 'Example', formatType: 'worked_example', title: 'Parallel worked question from a different topic' },
  { id: 'audio',   label: 'Audio',   formatType: 'audio',          title: 'Conversational audio script with pause markers' },
  { id: 'decode',  label: 'Decode',  formatType: 'decode',         title: 'Command verb, mark breakdown, answer structure' },
];

// Thinking-mode prompts for AURA (Tier 2).
const THINKING_MODES = [
  {
    id: 'critical',
    label: 'Critical',
    title: 'Challenge assumptions, find evidence, consider counter-arguments',
    prompt: (q, m) =>
      `I want to think critically about this exam question.\n\nQuestion: ${q}${m ? ` (${m} marks)` : ''}\n\nHelp me: What assumptions does this question make? What evidence would I need to support a strong answer? What is the counter-argument or alternative perspective I should address?`,
  },
  {
    id: 'systems',
    label: 'Systems',
    title: 'Map inputs, outputs, processes and feedback loops',
    prompt: (q, m) =>
      `I want to think in systems about this exam question.\n\nQuestion: ${q}${m ? ` (${m} marks)` : ''}\n\nHelp me identify: the key inputs and outputs, the processes connecting them, any feedback loops, and how changing one part would affect the whole.`,
  },
  {
    id: 'creative',
    label: 'Creative',
    title: 'Find an unexpected angle or standout example',
    prompt: (q, m) =>
      `I want to find a creative angle for this exam question.\n\nQuestion: ${q}${m ? ` (${m} marks)` : ''}\n\nWhat is an unexpected or memorable example I could use? What perspective would stand out to a marker? How could I approach this in a way most students would not?`,
  },
];

function readingNoteKey(documentId, questionNumber) {
  return `simplifii_rdnote_${documentId}_q${questionNumber}`;
}
function loadReadingNote(documentId, questionNumber) {
  try { return localStorage.getItem(readingNoteKey(documentId, questionNumber)) || ''; } catch { return ''; }
}
function saveReadingNote(documentId, questionNumber, text) {
  try {
    if (text) localStorage.setItem(readingNoteKey(documentId, questionNumber), text);
    else localStorage.removeItem(readingNoteKey(documentId, questionNumber));
  } catch { /* ok */ }
}

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
      last.text = text; last.ts = Date.now();
    } else {
      attempts.push({ text, ts: Date.now() });
    }
    localStorage.setItem(key, JSON.stringify({ attempts }));
  } catch { /* ignore */ }
}

// Render structured UDL transform content based on format type.
function UdlContent({ formatType, content, onPlayAudio }) {
  if (!content) return null;
  const card = { padding: '10px 12px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS };
  const body = { fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.8, margin: 0 };
  const mono = { fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT };

  if (formatType === 'plain_english') {
    return <div style={card}><p style={body}>{content.plain_text || content.text || ''}</p></div>;
  }
  if (formatType === 'step_by_step' && content.steps?.length > 0) {
    return (
      <div style={card}>
        {content.steps.map(s => (
          <div key={s.number} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span style={{ ...mono, minWidth: 18, paddingTop: 2 }}>{s.number}.</span>
            <div>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE }}>{s.verb} </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY }}>{s.action}</span>
              {s.estimated_minutes > 0 && (
                <span style={{ ...mono, marginLeft: 6 }}> ~{s.estimated_minutes}min</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (formatType === 'worked_example') {
    return (
      <div style={card}>
        {content.similar_question && (
          <p style={{ ...body, fontStyle: 'italic', color: TEXT_MUTED, marginBottom: 8 }}>
            Practice: {content.similar_question}
          </p>
        )}
        <p style={{ ...body, whiteSpace: 'pre-wrap' }}>{content.worked_solution || content.text || ''}</p>
        {content.marker_logic && (
          <p style={{ ...mono, marginTop: 8, lineHeight: 1.5, color: ACCENT_PULSE }}>{content.marker_logic}</p>
        )}
      </div>
    );
  }
  if (formatType === 'audio') {
    const script = content.script || content.text || '';
    return (
      <div style={card}>
        <button
          type="button"
          onClick={() => onPlayAudio(script)}
          style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: ACCENT_PULSE, background: 'transparent',
            border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '6px 14px', cursor: 'pointer', marginBottom: 8, minHeight: 32 }}
        >
          {'\u25B6'} Play
        </button>
        <p style={{ ...body, color: TEXT_MUTED, whiteSpace: 'pre-wrap' }}>{script}</p>
      </div>
    );
  }
  if (formatType === 'decode') {
    return (
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: ACCENT_PULSE,
            background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '3px 10px', textTransform: 'uppercase' }}>
            {content.command_verb || 'Verb'}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY }}>{content.verb_meaning || ''}</span>
          {content.time_minutes > 0 && (
            <span style={{ ...mono, marginLeft: 'auto' }}>~{content.time_minutes} min</span>
          )}
        </div>
        {content.answer_structure?.length > 0 && (
          <div>
            <span style={{ ...mono, display: 'block', marginBottom: 5 }}>ANSWER STRUCTURE</span>
            {content.answer_structure.map((step, i) => (
              <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
                lineHeight: 1.6, paddingLeft: 4, marginBottom: 3 }}>
                {step}
              </div>
            ))}
          </div>
        )}
        {content.key_concepts?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {content.key_concepts.map((c, i) => (
              <span key={i} style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_MUTED,
                background: SURFACE_RAISED, borderRadius: BORDER_RADIUS, padding: '2px 8px' }}>
                {c}
              </span>
            ))}
          </div>
        )}
        {content.marker_tip && (
          <p style={{ ...mono, color: COLOUR_WARN, lineHeight: 1.5, margin: 0 }}>
            Marker tip: {content.marker_tip}
          </p>
        )}
      </div>
    );
  }
  return <div style={card}><p style={body}>{content.text || JSON.stringify(content)}</p></div>;
}

const MINS_PER_MARK = 1.8;
const MCQ_MINS_PER_Q = 1.2;

function sectionBudgetMins(sectionQuestions, extraPct) {
  const total = sectionQuestions.reduce((sum, q) => {
    const isMcq = q.section && /multiple.choice|section.i\b/i.test(q.section);
    return sum + (isMcq ? MCQ_MINS_PER_Q : (q.marks || 2) * MINS_PER_MARK);
  }, 0);
  return Math.round(total * (1 + (extraPct || 0) / 100));
}

export default function QuestionCoach({
  questions = [], activeQuestion, onSelectQuestion, documentId, onAskTutor, markingGuidelines = {},
  energyCostPerQuestion = 0, isReadingTime = false, extraTimePercent = 0,
}) {
  const question = questions.find(q => q.number === activeQuestion) || questions[0] || null;

  // UDL cache: { [questionNumber]: { [formatType]: content } }
  const [udlCache, setUdlCache] = useState({});
  const [udlLoading, setUdlLoading] = useState(null);
  const [udlError, setUdlError] = useState('');
  const [activeUdl, setActiveUdl] = useState(null);

  // Marking criteria collapsible
  const [showCriteria, setShowCriteria] = useState(false);

  // Answer state seeded from localStorage
  const [answer, setAnswer] = useState(() => question ? loadAnswer(documentId, question.number) : '');
  const [saved, setSaved] = useState(false);

  // Strengths-based warm-up brain-dump
  const [warmup, setWarmup] = useState('');
  const [showWarmup, setShowWarmup] = useState(false);

  // Reading time annotation - per-question sticky note
  const [readingNote, setReadingNote] = useState(() => question ? loadReadingNote(documentId, question.number) : '');

  // Answer completeness signal: checked against marking criteria when available.
  const [completeness, setCompleteness] = useState(null); // { covered: [], missing: [] }
  const [completenessLoading, setCompletenessLoading] = useState(false);
  const completenessTimerRef = useRef(null);

  // Worked example comparison panel
  const [showComparison, setShowComparison] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  // Answer booklet export form
  const [showBookletForm, setShowBookletForm] = useState(false);
  const [bookletExporting, setBookletExporting] = useState(false);
  const [bookletName, setBookletName] = useState('');
  const [bookletSchool, setBookletSchool] = useState('');
  const [bookletDate, setBookletDate] = useState(() => new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }));

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  // Group questions by section, preserving order.
  const sectionGroups = useMemo(() => {
    const groupMap = new Map();
    const order = [];
    for (const q of questions) {
      const sec = q.section || 'Questions';
      if (!groupMap.has(sec)) { groupMap.set(sec, []); order.push(sec); }
      groupMap.get(sec).push(q);
    }
    return order.map(sec => ({
      section: sec,
      questions: groupMap.get(sec),
      budgetMins: sectionBudgetMins(groupMap.get(sec), extraTimePercent),
    }));
  }, [questions, extraTimePercent]);

  // Track which questions have had energy deducted this session.
  const visitedRef = React.useRef(new Set());

  const prevQuestionRef = React.useRef(activeQuestion);
  if (prevQuestionRef.current !== activeQuestion) {
    prevQuestionRef.current = activeQuestion;
    setAnswer(question ? loadAnswer(documentId, question.number) : '');
    setActiveUdl(null);
    setUdlError('');
    setShowCriteria(false);
    setWarmup('');
    setCompleteness(null);
    setCompletenessLoading(false);
    if (completenessTimerRef.current) clearTimeout(completenessTimerRef.current);
    setReadingNote(question ? loadReadingNote(documentId, question.number) : '');
    setShowComparison(false);
    setCompareLoading(false);
    // Deduct energy the first time a question is opened this session.
    if (energyCostPerQuestion > 0 && question && !visitedRef.current.has(question.number)) {
      visitedRef.current.add(question.number);
      window.dispatchEvent(new CustomEvent('simplifii:energy-spend', { detail: { cost: energyCostPerQuestion } }));
    }
  }

  const handleUdlClick = useCallback(async (btn) => {
    if (!question) return;
    const cached = udlCache[question.number]?.[btn.formatType];
    if (cached) { setActiveUdl(btn.id); return; }
    setActiveUdl(btn.id);
    setUdlLoading(btn.id);
    setUdlError('');
    try {
      const content = await transformQuestion({
        questionText: question.text,
        questionNumber: question.number,
        formatType: btn.formatType,
        documentId,
      });
      setUdlCache(prev => ({
        ...prev,
        [question.number]: { ...prev[question.number], [btn.formatType]: content },
      }));
    } catch {
      setUdlError('Could not generate this view. Try again.');
    } finally {
      setUdlLoading(null);
    }
  }, [question, udlCache, documentId]);

  // Check answer against marking criteria and return covered/missing breakdown.
  const checkCompleteness = useCallback(async (answerText, criteriaData) => {
    if (!criteriaData?.criteria?.length || answerText.trim().split(/\s+/).length < 30) return;
    setCompletenessLoading(true);
    try {
      const criteriaList = criteriaData.criteria.join('\n');
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: `Student answer:\n${answerText}` }],
          assessmentTitle: `Question ${question?.number}`,
          tier: 'secondary',
          systemOverride: `You are a marking assistant checking a student's exam answer against marking criteria.

Criteria for this question:
${criteriaList}

Your task: identify which criteria the student has addressed (even partially) and which they have not covered at all.

Rules:
- Mark a criterion as covered if the answer clearly addresses it, even briefly.
- Keep each criterion label short (under 8 words).
- Do not invent criteria not in the list.
- Return ONLY valid JSON, no other text.

Return JSON: { "covered": ["short criterion label..."], "missing": ["short criterion label..."] }`,
        }),
      });
      const data = await response.json();
      if (!data.success) return;
      try {
        const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.covered) && Array.isArray(parsed.missing)) {
            setCompleteness(parsed);
          }
        }
      } catch { /* malformed JSON, ignore */ }
    } catch { /* network error, ignore */ }
    finally { setCompletenessLoading(false); }
  }, [question]);

  const handleAnswerChange = (e) => {
    const text = e.target.value;
    setAnswer(text);
    setSaved(false);
    if (question) saveAnswer(documentId, question.number, text);
    // Schedule completeness check 3s after typing stops (only when criteria exist).
    const criteriaData = markingGuidelines?.[question?.number];
    if (criteriaData?.criteria?.length) {
      if (completenessTimerRef.current) clearTimeout(completenessTimerRef.current);
      completenessTimerRef.current = setTimeout(() => checkCompleteness(text, criteriaData), 3000);
    }
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

  const handleCheckAnswer = () => {
    if (!question || !onAskTutor) return;
    const trimmed = answer.trim();
    const qCtx = `${question.text}${question.marks ? ` (${question.marks} marks)` : ''}`;
    if (!trimmed) {
      onAskTutor(`I have not started yet. Can you help me work out how to approach this question: ${qCtx}`);
    } else {
      onAskTutor(`Can you check my answer for this exam question?\n\nQuestion: ${qCtx}\n\nMy answer: ${trimmed}`);
    }
  };

  const handleThinkingMode = (mode) => {
    if (!question || !onAskTutor) return;
    onAskTutor(mode.prompt(question.text, question.marks));
  };

  const handleWarmupSpringboard = () => {
    if (!warmup.trim()) return;
    const seed = `What I already know:\n${warmup.trim()}\n\n---\n\n`;
    setAnswer(prev => prev ? seed + prev : seed);
    if (question) saveAnswer(documentId, question.number, seed + answer);
    setShowWarmup(false);
    setWarmup('');
  };

  const handleBookletExport = useCallback(async () => {
    setBookletExporting(true);
    try {
      await exportToAnswerBooklet({
        questions,
        documentId,
        examTitle: document.title || 'Practice Exam',
        studentName: bookletName,
        schoolName: bookletSchool,
        examDate: bookletDate,
      });
    } catch { /* download failed silently */ }
    finally {
      setBookletExporting(false);
      setShowBookletForm(false);
    }
  }, [questions, documentId, bookletName, bookletSchool, bookletDate]);

  const handleCompare = useCallback(async () => {
    if (!question) return;
    const cached = udlCache[question.number]?.['worked_example'];
    if (cached) { setShowComparison(v => !v); return; }
    setShowComparison(true);
    setCompareLoading(true);
    try {
      const content = await transformQuestion({
        questionText: question.text,
        questionNumber: question.number,
        formatType: 'worked_example',
        documentId,
      });
      setUdlCache(prev => ({
        ...prev,
        [question.number]: { ...prev[question.number], worked_example: content },
      }));
    } catch {
      setShowComparison(false);
    } finally {
      setCompareLoading(false);
    }
  }, [question, udlCache, documentId]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (completenessTimerRef.current) clearTimeout(completenessTimerRef.current); }, []);

  const handlePlayAudio = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/\[PAUSE\]/gi, '...').trim());
    utter.lang = 'en-AU';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  if (!question) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 10, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: 0 }}>
          Questions could not be parsed automatically from this exam paper.
        </p>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, margin: 0,
          lineHeight: 1.5, maxWidth: 360 }}>
          This can happen with scanned papers or unusual formatting. Ask AURA to help you work
          through the questions manually, or use the Brief panel to read the full paper text.
        </p>
        {onAskTutor && (
          <button type="button"
            onClick={() => onAskTutor('I have an exam paper but the questions could not be parsed automatically. Can you help me work through it?')}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: ACCENT_PULSE, background: 'transparent',
              border: `1px solid ${ACCENT_BORDER}`, borderRadius: 6, padding: '8px 16px',
              cursor: 'pointer', minHeight: 36, outline: 'none' }}
          >
            Ask AURA for help
          </button>
        )}
      </div>
    );
  }

  const activeUdlContent = activeUdl
    ? udlCache[question.number]?.[UDL_BUTTONS.find(b => b.id === activeUdl)?.formatType]
    : null;
  const criteria = markingGuidelines?.[question.number];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Grouped question nav: section chips + question pills */}
      <div role="tablist" aria-label="Question list"
        style={{ display: 'flex', gap: 4, padding: '8px 12px', overflowX: 'auto',
          borderBottom: `1px solid ${SURFACE_RAISED}`, flexShrink: 0, alignItems: 'center' }}>
        {sectionGroups.map((group, gi) => {
          const allAnswered = group.questions.every(q => !!loadAnswer(documentId, q.number));
          const sectionLabel = group.section.length > 28
            ? group.section.slice(0, 26) + '\u2026'
            : group.section;
          return (
            <React.Fragment key={group.section}>
              {/* Section separator chip */}
              {gi > 0 && (
                <span aria-hidden="true"
                  style={{ width: 1, height: 24, background: SURFACE_RAISED, flexShrink: 0 }} />
              )}
              <span
                title={group.section}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  fontFamily: FONT_SYSTEM, fontSize: 9, letterSpacing: '0.06em',
                  color: allAnswered ? ACCENT_PULSE : TEXT_FAINT,
                  background: allAnswered ? ACCENT_GLASS : 'transparent',
                  border: `1px solid ${allAnswered ? ACCENT_BORDER : SURFACE_RAISED}`,
                  borderRadius: BORDER_RADIUS, padding: '3px 7px',
                  userSelect: 'none',
                }}
              >
                {allAnswered && <span aria-label="Section complete">{'\u2713'}</span>}
                {sectionLabel}
                <span style={{ color: TEXT_FAINT, fontWeight: 400 }}>{group.budgetMins}m</span>
              </span>

              {/* Question pills for this section */}
              {group.questions.map(q => {
                const isActive = q.number === activeQuestion;
                const hasAnswer = !!loadAnswer(documentId, q.number);
                const hasNote = !!loadReadingNote(documentId, q.number);
                return (
                  <button key={q.number} type="button" role="tab" aria-selected={isActive}
                    onClick={() => onSelectQuestion(q.number)}
                    title={`Question ${q.number}${q.marks ? ` (${q.marks} marks)` : ''}${energyCostPerQuestion > 0 ? ` | Energy: 1/${Math.round(1/energyCostPerQuestion)} orb` : ''}`}
                    onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                    onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                    style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: isActive ? 700 : 400,
                      padding: '4px 10px', borderRadius: BORDER_RADIUS, flexShrink: 0, position: 'relative',
                      background: isActive ? ACCENT_GLASS : 'transparent',
                      border: isActive ? `1px solid ${ACCENT_BORDER}` : `1px solid ${SURFACE_RAISED}`,
                      color: isActive ? ACCENT_PULSE : hasAnswer ? TEXT_PRIMARY : TEXT_MUTED,
                      cursor: 'pointer' }}
                  >
                    Q{q.number}{q.marks > 0 ? ` (${q.marks}m)` : ''}{hasAnswer ? ' \u2713' : ''}{hasNote ? ' \uD83D\uDCCC' : ''}
                    {energyCostPerQuestion > 0 && (
                      <span style={{
                        position: 'absolute', top: -6, right: -4,
                        fontFamily: FONT_SYSTEM, fontSize: 8,
                        background: '#f97316', color: '#fff',
                        borderRadius: 8, padding: '1px 4px', lineHeight: 1.4,
                        border: '1px solid #27272a',
                      }}>
                        1/{Math.round(1 / energyCostPerQuestion)}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Tier 1: Question + UDL transforms */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: TEXT_FAINT }}>
              Tier 1: Question
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {criteria && (
                <button type="button" onClick={() => setShowCriteria(v => !v)}
                  style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: COLOUR_WARN,
                    background: COLOUR_WARN_GLASS, border: `1px solid ${COLOUR_WARN_BORDER}`,
                    borderRadius: BORDER_RADIUS, padding: '2px 7px', cursor: 'pointer' }}>
                  {showCriteria ? 'Hide criteria' : 'Marking criteria'}
                </button>
              )}
              {question.marks > 0 && (
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE,
                  background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: BORDER_RADIUS, padding: '2px 7px' }}>
                  {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                </span>
              )}
            </div>
          </div>

          {/* Marking criteria panel */}
          {showCriteria && criteria && (
            <div style={{ padding: '10px 12px', background: COLOUR_WARN_GLASS,
              border: `1px solid ${COLOUR_WARN_BORDER}`, borderRadius: BORDER_RADIUS, marginBottom: 10 }}>
              {criteria.criteria.length > 0 && (
                <ul style={{ margin: '0 0 6px', paddingLeft: 16 }}>
                  {criteria.criteria.map((c, i) => (
                    <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, marginBottom: 3 }}>{c}</li>
                  ))}
                </ul>
              )}
              {criteria.sampleAnswer && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED,
                  fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                  Sample: {criteria.sampleAnswer.slice(0, 300)}{criteria.sampleAnswer.length > 300 ? '...' : ''}
                </p>
              )}
            </div>
          )}

          {/* Reading time annotation */}
          {isReadingTime ? (
            <div style={{ marginBottom: 10 }}>
              <textarea
                aria-label={`Reading time note for question ${question.number}`}
                value={readingNote}
                onChange={e => {
                  setReadingNote(e.target.value);
                  saveReadingNote(documentId, question.number, e.target.value);
                }}
                placeholder="Quick note - e.g. 'Leave for last' or 'Check this formula' or '6 marks, plan carefully'"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
                  background: COLOUR_WARN_GLASS,
                  border: `1px dashed ${COLOUR_WARN_BORDER}`,
                  borderRadius: BORDER_RADIUS, padding: '7px 10px',
                  lineHeight: 1.5, resize: 'none', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = COLOUR_WARN; }}
                onBlur={e => { e.target.style.borderColor = COLOUR_WARN_BORDER; }}
              />
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                Reading time annotation - saved automatically
              </span>
            </div>
          ) : readingNote ? (
            <div style={{
              display: 'flex', gap: 6, alignItems: 'flex-start',
              padding: '6px 10px', marginBottom: 8,
              background: COLOUR_WARN_GLASS,
              border: `1px solid ${COLOUR_WARN_BORDER}`,
              borderRadius: BORDER_RADIUS,
            }}>
              <span aria-hidden="true" style={{ fontSize: 12, flexShrink: 0 }}>{'\uD83D\uDCCC'}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, lineHeight: 1.5 }}>
                {readingNote}
              </span>
            </div>
          ) : null}

          {(!activeUdl || !activeUdlContent) && !udlLoading && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY,
              lineHeight: 1.8, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
              {question.text}
            </p>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {UDL_BUTTONS.map(btn => (
              <button key={btn.id} type="button" title={btn.title} onClick={() => handleUdlClick(btn)}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: BORDER_RADIUS,
                  background: activeUdl === btn.id ? ACCENT_GLASS : 'transparent',
                  border: activeUdl === btn.id ? `1px solid ${ACCENT_BORDER}` : `1px solid ${SURFACE_RAISED}`,
                  color: activeUdl === btn.id ? ACCENT_PULSE : TEXT_MUTED,
                  cursor: 'pointer', minHeight: 32 }}
              >
                {btn.label}
              </button>
            ))}
            {activeUdl && (
              <button type="button" onClick={() => setActiveUdl(null)} title="Show original question"
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px' }}>
                {'\u00D7'} Original
              </button>
            )}
          </div>

          {udlLoading && <AsciiLoader status={`Generating ${UDL_BUTTONS.find(b => b.id === udlLoading)?.label}...`} />}
          {udlError && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{udlError}</p>}
          {!udlLoading && activeUdlContent && (
            <UdlContent
              formatType={UDL_BUTTONS.find(b => b.id === activeUdl)?.formatType}
              content={activeUdlContent}
              onPlayAudio={handlePlayAudio}
            />
          )}
        </div>

        {/* Tier 2: AURA + thinking modes */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginBottom: 8 }}>
            Tier 2: AURA
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <button type="button" onClick={handleAskAura}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
                border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
                padding: '8px 16px', cursor: 'pointer', minHeight: 36 }}>
              Ask AURA
            </button>
            <button type="button" onClick={handleCheckAnswer}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              title={answer.trim() ? 'Send your draft to AURA for feedback' : 'Get help starting this question'}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: answer.trim() ? ACCENT_PULSE : TEXT_MUTED,
                background: 'transparent',
                border: `1px solid ${answer.trim() ? ACCENT_BORDER : SURFACE_RAISED}`,
                borderRadius: BORDER_RADIUS, padding: '8px 16px', cursor: 'pointer', minHeight: 36 }}>
              {answer.trim() ? 'Check my answer' : 'Help me start'}
            </button>
          </div>
          {/* Thinking-mode prompts */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {THINKING_MODES.map(mode => (
              <button key={mode.id} type="button" title={mode.title}
                onClick={() => handleThinkingMode(mode)}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: TEXT_FAINT, background: 'transparent',
                  border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                  padding: '5px 10px', cursor: 'pointer', minHeight: 28 }}>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier 3: Warm-up + answer workspace */}
        <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: TEXT_FAINT }}>
              Tier 3: Your answer
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <button type="button" onClick={() => setShowWarmup(v => !v)} title="Brain dump what you already know"
                style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: 0 }}>
                {showWarmup ? 'Hide warm-up' : 'What I know'}
              </button>
              <button type="button" onClick={() => setShowBookletForm(v => !v)}
                title="Export all your answers as an HSC-style answer booklet PDF"
                style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: 0 }}>
                Export booklet
              </button>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
          </div>

          {/* Answer booklet export form */}
          {showBookletForm && (
            <div style={{ padding: '10px 12px', background: SURFACE_RAISED, borderRadius: BORDER_RADIUS,
              display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: TEXT_FAINT }}>
                Answer booklet export
              </span>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>
                Exports all your saved answers in an HSC-style booklet PDF with line-ruled space for any blank questions.
              </p>
              {[
                { label: 'Your name (optional)', value: bookletName, set: setBookletName, placeholder: 'e.g. Alex Chen' },
                { label: 'School (optional)',    value: bookletSchool, set: setBookletSchool, placeholder: 'e.g. Sydney Grammar School' },
                { label: 'Date',                 value: bookletDate,  set: setBookletDate,   placeholder: 'e.g. 20 May 2026' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>{f.label}</label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
                      background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
                      borderRadius: BORDER_RADIUS, padding: '5px 8px', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = ACCENT_PULSE; }}
                    onBlur={e => { e.target.style.borderColor = SURFACE_RAISED; }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={handleBookletExport} disabled={bookletExporting}
                  onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
                    border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
                    padding: '7px 14px', cursor: bookletExporting ? 'wait' : 'pointer', minHeight: 34 }}>
                  {bookletExporting ? 'Generating...' : 'Generate PDF'}
                </button>
                <button type="button" onClick={() => setShowBookletForm(false)}
                  style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT,
                    background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
                    borderRadius: BORDER_RADIUS, padding: '7px 14px', cursor: 'pointer', minHeight: 34 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Strengths-based warm-up */}
          {showWarmup && (
            <div style={{ padding: '10px 12px', background: SURFACE_RAISED, borderRadius: BORDER_RADIUS }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '0 0 6px',
                lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Brain dump: what do you already know about this topic?
              </p>
              <textarea
                aria-label="What you already know about this topic"
                value={warmup}
                onChange={e => setWarmup(e.target.value)}
                placeholder="Write anything you already know, even if it seems obvious..."
                style={{ width: '100%', minHeight: 70, fontFamily: FONT_BODY, fontSize: 12,
                  color: TEXT_PRIMARY, background: 'transparent',
                  border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                  padding: '8px 10px', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = ACCENT_PULSE; }}
                onBlur={e => { e.target.style.borderColor = SURFACE_RAISED; }}
              />
              <button type="button" onClick={handleWarmupSpringboard} disabled={!warmup.trim()}
                style={{ marginTop: 6, fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', color: ACCENT_PULSE,
                  background: 'transparent', border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: BORDER_RADIUS, padding: '5px 12px', cursor: warmup.trim() ? 'pointer' : 'default',
                  opacity: warmup.trim() ? 1 : 0.4 }}>
                Use as starting point
              </button>
            </div>
          )}

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
          {/* Answer completeness signal - shown when marking criteria available */}
          {criteria && (completenessLoading || completeness) && (
            <div
              aria-live="polite"
              aria-label="Criteria coverage"
              style={{ padding: '8px 10px', background: SURFACE_RAISED, borderRadius: BORDER_RADIUS }}
            >
              {completenessLoading && (
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, letterSpacing: '0.06em' }}>
                  Checking criteria...
                </span>
              )}
              {!completenessLoading && completeness && (() => {
                const total = completeness.covered.length + completeness.missing.length;
                const count = completeness.covered.length;
                return (
                  <>
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.06em', color: count === total ? ACCENT_PULSE : COLOUR_WARN,
                      display: 'block', marginBottom: 5 }}>
                      {count}/{total} criteria covered
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {completeness.covered.map((c, i) => (
                        <span key={`cov-${i}`} style={{ fontFamily: FONT_BODY, fontSize: 10,
                          color: ACCENT_PULSE, background: ACCENT_GLASS,
                          border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
                          padding: '2px 7px', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span aria-hidden="true">\u2713</span>{c}
                        </span>
                      ))}
                      {completeness.missing.map((c, i) => (
                        <span key={`mis-${i}`} style={{ fontFamily: FONT_BODY, fontSize: 10,
                          color: TEXT_FAINT, background: 'transparent',
                          border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                          padding: '2px 7px', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span aria-hidden="true">\u25CB</span>{c}
                        </span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            {answer.trim() && !isReadingTime ? (
              <button type="button" onClick={handleCompare}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                title="See a parallel worked example alongside your answer"
                style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: showComparison ? ACCENT_PULSE : TEXT_MUTED,
                  background: showComparison ? ACCENT_GLASS : 'transparent',
                  border: `1px solid ${showComparison ? ACCENT_BORDER : SURFACE_RAISED}`,
                  borderRadius: BORDER_RADIUS, padding: '6px 14px', cursor: 'pointer', minHeight: 32 }}>
                {compareLoading ? 'Loading...' : showComparison ? 'Hide example' : 'Compare with example'}
              </button>
            ) : <span />}
            <button type="button" onClick={handleSave}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: saved ? TEXT_FAINT : ACCENT_PULSE,
                background: 'transparent', border: `1px solid ${saved ? SURFACE_RAISED : ACCENT_BORDER}`,
                borderRadius: BORDER_RADIUS, padding: '6px 14px', cursor: 'pointer', minHeight: 32 }}>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Worked example comparison panel */}
        {showComparison && !compareLoading && (() => {
          const exampleContent = udlCache[question.number]?.['worked_example'];
          if (!exampleContent) return null;
          return (
            <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT }}>
                  Comparison
                </span>
                <button type="button" onClick={() => setShowComparison(false)}
                  style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT,
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {'\u00D7'} Close
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* Left: student answer */}
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE,
                    display: 'block', marginBottom: 6 }}>
                    Your answer
                  </span>
                  <div style={{ padding: '10px 12px', background: ACCENT_GLASS,
                    border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY,
                      lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {answer.trim()}
                    </p>
                  </div>
                  {wordCount > 0 && (
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginTop: 4, display: 'block' }}>
                      {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                  )}
                </div>
                {/* Right: worked example */}
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT,
                    display: 'block', marginBottom: 6 }}>
                    Worked example (parallel question)
                  </span>
                  <UdlContent
                    formatType="worked_example"
                    content={exampleContent}
                    onPlayAudio={handlePlayAudio}
                  />
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
