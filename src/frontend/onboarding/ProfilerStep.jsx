import React, { useState } from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS_FAINT,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

/**
 * ProfilerStep (Stage 01 Step 4: Neurocognitive Profiler)
 *
 * Psychology and neuroscience-backed scenario prompts that infer
 * cognitive traits relevant to academic scaffolding. Each scenario
 * maps to a real axis the OS uses to configure:
 *   - Pareto routing (what surfaces first)
 *   - LOD defaults (compass vs sprint vs map)
 *   - Nudge frequency and tone
 *   - Scaffolding density (heavy/light/none)
 *   - Initiation support (blank page vs guided start)
 *
 * Grounded in:
 *   - Baddeley's Working Memory Model (phonological loop capacity)
 *   - Miyake's Unity/Diversity of Executive Functions (shifting, updating, inhibition)
 *   - Cognitive Load Theory (Sweller): intrinsic vs extraneous load tolerance
 *   - Self-Determination Theory (Ryan/Deci): autonomy, competence, relatedness
 *   - Gross's Process Model of Emotion Regulation
 *
 * Trauma-informed: no deficit framing, no clinical labels, every
 * option is valid, "not sure" always available. Scenario language
 * mirrors real academic situations the learner will recognise.
 *
 * Props:
 *   onComplete(profile) - called with inferred profile dimensions
 *   onSkip()            - skip profiler entirely (defaults applied)
 */

// Each scenario presents a concrete academic situation. The options
// are not "right or wrong"; they map to scaffolding parameters.
// The `maps` field documents what each answer configures.
const SCENARIOS = [
  {
    key: 'workingMemory',
    situation: "You are reading a dense paragraph for an assignment. Your phone buzzes with a message. After checking it, you...",
    maps: 'Working memory capacity (Baddeley). Determines: chunk size in scaffolds, number of visible steps.',
    options: [
      { value: 'reread', label: 'Start the paragraph again from the top', desc: 'The thread is gone. Easier to restart.', scaffoldHint: 'Smaller chunks, frequent checkpoints' },
      { value: 'reread_sentence', label: 'Re-read the last sentence or two', desc: 'I can usually pick up from roughly where I was.', scaffoldHint: 'Medium chunks, moderate checkpoints' },
      { value: 'continue', label: 'Keep reading from where I stopped', desc: 'I held the thread. The interruption was brief.', scaffoldHint: 'Larger chunks, fewer checkpoints' },
      { value: 'unsure', label: 'Depends on the day', desc: 'Sometimes I lose it, sometimes I do not.', scaffoldHint: 'Adaptive (start medium, adjust)' },
    ],
  },
  {
    key: 'cognitiveLoad',
    situation: "You open your course page and see 6 tasks due in the next 3 weeks. Your first instinct is to...",
    maps: 'Cognitive load tolerance (Sweller). Determines: how many items visible at once, Pareto filtering aggression.',
    options: [
      { value: 'freeze', label: 'Feel stuck. Not sure where to start.', desc: 'The list itself is the problem before any task is.', scaffoldHint: 'Show 1 task at a time (Pareto aggressive)' },
      { value: 'rank', label: 'Rank them by due date or weight, then start the first one', desc: 'I need order before I can act.', scaffoldHint: 'Show ranked list, highlight top 2' },
      { value: 'pick', label: 'Pick the easiest or most interesting one and begin', desc: 'Momentum matters more than order.', scaffoldHint: 'Show all, no forced order' },
      { value: 'unsure', label: 'Depends on the day', desc: 'Some days I power through, some days I stall.', scaffoldHint: 'Adaptive (start with top 3)' },
    ],
  },
  {
    key: 'taskInitiation',
    situation: "You need to write the introduction to an assignment. You have the brief open. The cursor is blinking. You...",
    maps: 'Executive function: initiation (Miyake). Determines: pre-write scaffolding, blank page vs prompted start.',
    options: [
      { value: 'stare', label: 'Stare at it for a while before anything comes', desc: 'The first sentence is the hardest part of any piece of work.', scaffoldHint: 'Auto-generate Tier 1 pre-write draft' },
      { value: 'notes', label: 'Write rough notes or dot points first, then shape them', desc: 'I need to think on paper before it becomes real writing.', scaffoldHint: 'Show outline scaffold, convert to prose later' },
      { value: 'dive', label: 'Start typing. Edit later.', desc: 'Getting words down is more important than getting them right.', scaffoldHint: 'Blank page, minimal scaffolding' },
      { value: 'unsure', label: 'Depends on the assessment', desc: 'Some tasks flow. Others I avoid for days.', scaffoldHint: 'Offer pre-write, do not force it' },
    ],
  },
  {
    key: 'attentionRegulation',
    situation: "During a 2-hour study block, the most accurate description of your focus is...",
    maps: 'Sustained attention and self-regulation. Determines: focus timer defaults, break nudge frequency.',
    options: [
      { value: 'hyperfocus_crash', label: 'Deep focus for a stretch, then sudden crash', desc: 'I lose track of time, then hit a wall hard.', scaffoldHint: 'Timed breaks at 45 min, gentle wall warning' },
      { value: 'pomodoro', label: 'Cycles of focus and rest, roughly 25-40 min each', desc: 'I work in natural bursts with short breaks.', scaffoldHint: 'Pomodoro timer, 25 min default' },
      { value: 'drift', label: 'Drift off, come back, drift off again', desc: 'My attention wanders and returns on its own schedule.', scaffoldHint: 'Shorter focus blocks (15 min), frequent re-anchoring' },
      { value: 'steady', label: 'Fairly steady the whole time', desc: 'I can maintain focus for the full block most days.', scaffoldHint: 'Minimal interruptions, long focus blocks' },
    ],
  },
  {
    key: 'emotionUnderPressure',
    situation: "A major assessment is due in 3 days. You have not started. Honestly, you...",
    maps: 'Emotion regulation under academic pressure (Gross). Determines: nudge tone, deadline proximity behaviour.',
    options: [
      { value: 'panic_start', label: 'Panic, but use the panic to start', desc: 'Adrenaline is part of my process. I hate it but it works.', scaffoldHint: 'Urgent-but-calm tone, Pareto steps surfaced' },
      { value: 'shutdown', label: 'Shut down. Avoid. Open it the night before.', desc: 'The closer it gets, the harder it is to face.', scaffoldHint: 'Gentle re-entry, tiny first step, no shame language' },
      { value: 'plan', label: 'Make a plan, break it into days, then follow it', desc: 'Structure calms me down. Once I have a plan I can execute.', scaffoldHint: 'Auto-generate daily plan, show progress' },
      { value: 'unsure', label: 'Depends on the subject and stakes', desc: 'High-stakes assessments hit different.', scaffoldHint: 'Adaptive (detect urgency, offer plan)' },
    ],
  },
  {
    key: 'feedbackProcessing',
    situation: "You get an assignment back with detailed marker comments. Your first move is...",
    maps: 'Feedback processing and metacognition. Determines: how rubric check results are presented.',
    options: [
      { value: 'avoid', label: 'Close it. Look at the mark. Open it later (maybe).', desc: 'Feedback feels personal before it feels useful.', scaffoldHint: 'Buffer feedback behind opt-in, lead with mark' },
      { value: 'skim', label: 'Skim for the overall vibe, then read specifics', desc: 'I need the big picture before I can absorb details.', scaffoldHint: 'Summary first, expandable details' },
      { value: 'deep_read', label: 'Read every comment carefully, take notes', desc: 'I want to know exactly what to improve.', scaffoldHint: 'Full detail view, action items extracted' },
      { value: 'unsure', label: 'Depends on how I feel about the subject', desc: 'Some courses I care about. Others I just need to pass.', scaffoldHint: 'Adaptive (summarise by default, expand on demand)' },
    ],
  },
];

export default function ProfilerStep({ onComplete, onSkip }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const scenario = SCENARIOS[currentIdx];
  const isLast = currentIdx === SCENARIOS.length - 1;
  const selected = answers[scenario.key] || null;

  const handleSelect = (value) => {
    const next = { ...answers, [scenario.key]: value };
    setAnswers(next);
    if (isLast) {
      onComplete(next);
    } else {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 250);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px' }}>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 12px', textAlign: 'center' }}>
        {currentIdx + 1} of {SCENARIOS.length}
      </p>

      <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, color: TEXT_MUTED, textAlign: 'center', margin: '0 0 6px', lineHeight: 1.6 }}>
        {scenario.situation}
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, textAlign: 'center', margin: '0 0 20px' }}>
        No wrong answers. Pick what is most true for you right now.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scenario.options.map(opt => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              aria-pressed={active}
              style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                padding: '12px 16px', textAlign: 'left',
                background: active ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
                border: `1px solid ${active ? ACCENT_PULSE : GLASS_BORDER}`,
                borderRadius: 10, cursor: 'pointer',
                boxShadow: active ? GLOW_EMERALD : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s', /* allow-style */
                minHeight: 44,
              }}
            >
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: active ? ACCENT_PULSE : TEXT_PRIMARY }}>
                {opt.label}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.4 }}>
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20 }}>
        {currentIdx > 0 && (
          <button type="button" onClick={() => setCurrentIdx(currentIdx - 1)}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 44 }}>
            Back
          </button>
        )}
        <button type="button" onClick={onSkip}
          style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 44 }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
