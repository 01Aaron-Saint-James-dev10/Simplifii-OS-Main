import React, { useState } from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS_FAINT, ACCENT_BORDER,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

/**
 * ProfilerStep (Stage 01 Step 4)
 *
 * Scenario-based personalisation profiler. 6 dimensions captured
 * via quick-pick cards (not Likert scales). Trauma-informed: no
 * deficit framing, no judgmental language, every option is valid.
 *
 * Dimensions:
 *   1. Processing style (visual/verbal/kinesthetic/mixed)
 *   2. Communication style (literal/contextual/mixed)
 *   3. Energy pattern (morning/afternoon/evening/variable)
 *   4. Working memory support (heavy scaffolding/light scaffolding/minimal)
 *   5. Initiation style (guided start/blank page/outline first)
 *   6. Emotional baseline (settled/overwhelmed/starting fresh/burned out)
 *
 * Props:
 *   onComplete(profile) - called with the selected profile dimensions
 *   onSkip()           - skip profiler entirely
 */

const DIMENSIONS = [
  {
    key: 'processingStyle',
    question: 'When you are learning something new, what helps most?',
    options: [
      { value: 'visual', label: 'Diagrams and colour', desc: 'I understand best when I can see it mapped out.' },
      { value: 'verbal', label: 'Reading and writing', desc: 'I process by reading carefully and taking notes.' },
      { value: 'kinesthetic', label: 'Doing and building', desc: 'I learn by trying things, even if I get it wrong first.' },
      { value: 'mixed', label: 'Depends on the day', desc: 'Different approaches work at different times.' },
    ],
  },
  {
    key: 'communicationStyle',
    question: 'How do you prefer instructions to be written?',
    options: [
      { value: 'literal', label: 'Plain and direct', desc: 'Tell me exactly what to do, step by step.' },
      { value: 'contextual', label: 'With context and reasoning', desc: 'Explain why so I can adapt.' },
      { value: 'mixed', label: 'Both, depending on the task', desc: 'Simple tasks: direct. Complex tasks: context.' },
    ],
  },
  {
    key: 'energyPattern',
    question: 'When do you usually do your best thinking?',
    options: [
      { value: 'morning', label: 'Morning', desc: 'I am sharpest before noon.' },
      { value: 'afternoon', label: 'Afternoon', desc: 'I hit my stride after lunch.' },
      { value: 'evening', label: 'Evening or night', desc: 'I focus best when things quiet down.' },
      { value: 'variable', label: 'It changes', desc: 'No consistent pattern. Depends on the week.' },
    ],
  },
  {
    key: 'scaffoldingNeed',
    question: 'How much structure do you want when starting an assessment?',
    options: [
      { value: 'heavy', label: 'Walk me through it', desc: 'Break it into small steps. Show me what goes where.' },
      { value: 'light', label: 'Just the outline', desc: 'Give me the sections and I will fill them in.' },
      { value: 'minimal', label: 'Blank page', desc: 'I will figure out the structure myself.' },
    ],
  },
  {
    key: 'initiationStyle',
    question: 'What helps you start writing?',
    options: [
      { value: 'guided', label: 'A prompt or question', desc: 'Ask me something to get my thinking going.' },
      { value: 'outline', label: 'A rough outline', desc: 'Show me the skeleton so I know where things go.' },
      { value: 'freewrite', label: 'Just let me type', desc: 'I will find my way in. Structure comes later.' },
    ],
  },
  {
    key: 'emotionalBaseline',
    question: 'How are you feeling about your study right now?',
    options: [
      { value: 'settled', label: 'On top of things', desc: 'I know what I need to do and I am making progress.' },
      { value: 'overwhelmed', label: 'Behind or overwhelmed', desc: 'There is a lot and I am not sure where to start.' },
      { value: 'starting', label: 'Starting fresh', desc: 'New course or new term. Still figuring things out.' },
      { value: 'burned_out', label: 'Running on empty', desc: 'I have been going too hard for too long.' },
    ],
  },
];

export default function ProfilerStep({ onComplete, onSkip }) {
  const [currentDim, setCurrentDim] = useState(0);
  const [answers, setAnswers] = useState({});

  const dim = DIMENSIONS[currentDim];
  const isLast = currentDim === DIMENSIONS.length - 1;
  const selected = answers[dim.key] || null;

  const handleSelect = (value) => {
    const next = { ...answers, [dim.key]: value };
    setAnswers(next);
    if (isLast) {
      onComplete(next);
    } else {
      setTimeout(() => setCurrentDim(currentDim + 1), 200);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px' }}>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 8px', textAlign: 'center' }}>
        {currentDim + 1} of {DIMENSIONS.length}
      </p>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)', textAlign: 'center', margin: '0 0 8px', color: TEXT_PRIMARY }}>
        {dim.question}
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, textAlign: 'center', margin: '0 0 24px' }}>
        There are no wrong answers. Pick what fits today.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dim.options.map(opt => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              aria-pressed={active}
              style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                padding: '14px 18px', textAlign: 'left',
                background: active ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
                border: `1px solid ${active ? ACCENT_PULSE : GLASS_BORDER}`,
                borderRadius: 10, cursor: 'pointer',
                boxShadow: active ? GLOW_EMERALD : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s', /* allow-style */
                minHeight: 44,
              }}
            >
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: active ? ACCENT_PULSE : TEXT_PRIMARY }}>
                {opt.label}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.4 }}>
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
        {currentDim > 0 && (
          <button type="button" onClick={() => setCurrentDim(currentDim - 1)}
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
