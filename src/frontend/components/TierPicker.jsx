import React, { useState } from 'react';
import {
  TIER_SECONDARY,
  TIER_UNDERGRAD,
  TIER_HONOURS_MASTERS_COURSEWORK,
  TIER_RESEARCH_HIGHER_DEGREE,
  TIER_ACADEMIC_PROFESSIONAL,
  resolveFromOnboardingAnswer,
} from '../../services/TierService';
import {
  OVERLAY_BACKDROP,
  ACCENT_PULSE,
  ACCENT_GLASS,
} from '../../theme/tokens';

/**
 * TierPicker
 *
 * Onboarding screen that maps a learner's plain-language situation to a
 * canonical tier. Fully keyboard-navigable. No mouse required. WCAG 2.2 AA.
 *
 * Props:
 *   onSelect(tier)   called with a tier constant when the learner confirms.
 *                    Returns null for homeschool and institutional routes
 *                    so the parent can redirect those flows separately.
 *   onSkip()         optional, called if the learner dismisses without selecting.
 */

const OPTIONS = [
  {
    answer:      "I'm in Year 11/12",
    tier:        TIER_SECONDARY,
    label:       "Year 11 or 12",
    description: "HSC, IB, A-Levels, or equivalent",
  },
  {
    answer:      "I'm at uni doing a Bachelor's",
    tier:        TIER_UNDERGRAD,
    label:       "University (Bachelor's)",
    description: "Essays, lab reports, assignments, final projects",
  },
  {
    answer:      "I'm doing Honours or coursework Masters",
    tier:        TIER_HONOURS_MASTERS_COURSEWORK,
    label:       "Honours or coursework Masters",
    description: "Thesis, capstone, or dissertation up to 30,000 words",
  },
  {
    answer:      "I'm doing research (MRes/PhD)",
    tier:        TIER_RESEARCH_HIGHER_DEGREE,
    label:       "Research degree (MRes or PhD)",
    description: "Full research thesis, multiple phases and chapters",
  },
  {
    answer:      "I'm an academic",
    tier:        TIER_ACADEMIC_PROFESSIONAL,
    label:       "Academic or researcher",
    description: "Journal articles, grants, book chapters, policy work",
  },
  {
    answer:      "I'm not sure",
    tier:        TIER_UNDERGRAD,
    label:       "Not sure yet",
    description: "We will default to university level. You can change this later.",
  },
  {
    answer:      "I'm a parent homeschooling",
    tier:        null,
    label:       "Parent homeschooling",
    description: "Separate Sovereign Home product",
    redirectNote: 'homeschool',
  },
  {
    answer:      "I'm a teacher/professor",
    tier:        null,
    label:       "Teacher or institution",
    description: "Institutional dashboard (separate product)",
    redirectNote: 'institutional',
  },
];

export default function TierPicker({ onSelect, onSkip }) {
  const [selected, setSelected] = useState(null);

  function handleConfirm() {
    if (selected === null) return;
    const tier = resolveFromOnboardingAnswer(selected.answer);
    onSelect(tier, selected.redirectNote || null);
  }

  function handleKeyDown(e, option) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelected(option);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-picker-heading"
      style={styles.overlay}
    >
      <div style={styles.card}>
        <h1 id="tier-picker-heading" style={styles.heading}>
          Where are you up to?
        </h1>
        <p style={styles.subheading}>
          We will set up the right tools and layout for your stage. You can change this later in settings.
        </p>

        <ul role="listbox" aria-label="Select your study level" style={styles.list}>
          {OPTIONS.map((option) => {
            const isSelected = selected?.answer === option.answer;
            return (
              <li
                key={option.answer}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                style={{
                  ...styles.option,
                  ...(isSelected ? styles.optionSelected : {}),
                }}
                onClick={() => setSelected(option)}
                onKeyDown={(e) => handleKeyDown(e, option)}
              >
                <span style={styles.optionLabel}>{option.label}</span>
                <span style={styles.optionDescription}>{option.description}</span>
              </li>
            );
          })}
        </ul>

        <div style={styles.actions}>
          <button
            type="button"
            style={{
              ...styles.confirmButton,
              ...(selected === null ? styles.confirmButtonDisabled : {}),
            }}
            disabled={selected === null}
            onClick={handleConfirm}
            aria-disabled={selected === null}
          >
            Continue
          </button>
          {onSkip && (
            <button
              type="button"
              style={styles.skipButton}
              onClick={onSkip}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline styles (no external CSS dependency) ───────────────────────────────
// Tokens match the existing zinc-950 dark theme from the project.

const styles = {
  overlay: {
    position:        'fixed',
    inset:           0,
    backgroundColor: OVERLAY_BACKDROP,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1000,
    padding:         '1rem',
  },
  card: {
    backgroundColor: '#18181b',
    border:          '1px solid #27272a',
    borderRadius:    '0.75rem',
    padding:         '2rem',
    maxWidth:        '36rem',
    width:           '100%',
    color:           '#f4f4f5',
  },
  heading: {
    fontSize:     '1.5rem',
    fontWeight:   700,
    marginBottom: '0.5rem',
    color:        '#f4f4f5',
  },
  subheading: {
    fontSize:     '0.9rem',
    color:        '#a1a1aa',
    marginBottom: '1.5rem',
    lineHeight:   1.5,
  },
  list: {
    listStyle:    'none',
    padding:      0,
    margin:       0,
    display:      'flex',
    flexDirection:'column',
    gap:          '0.5rem',
  },
  option: {
    display:       'flex',
    flexDirection: 'column',
    padding:       '0.75rem 1rem',
    borderRadius:  '0.5rem',
    border:        '1px solid #27272a',
    cursor:        'pointer',
    outline:       'none',
    transition:    'border-color 150ms, background-color 150ms', // allow-style: CSS property names
  },
  optionSelected: {
    borderColor:     ACCENT_PULSE,
    backgroundColor: ACCENT_GLASS,
  },
  optionLabel: {
    fontWeight: 600,
    fontSize:   '0.95rem',
    color:      '#f4f4f5',
  },
  optionDescription: {
    fontSize:  '0.8rem',
    color:     '#a1a1aa',
    marginTop: '0.2rem',
  },
  actions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.5rem',
    marginTop:     '1.5rem',
  },
  confirmButton: {
    backgroundColor: ACCENT_PULSE,
    color:           '#000',
    border:          'none',
    borderRadius:    '0.5rem',
    padding:         '0.75rem 1.5rem',
    fontSize:        '1rem',
    fontWeight:      600,
    cursor:          'pointer',
    width:           '100%',
  },
  confirmButtonDisabled: {
    backgroundColor: '#27272a',
    color:           '#52525b',
    cursor:          'not-allowed',
  },
  skipButton: {
    backgroundColor: 'transparent',
    color:           '#71717a',
    border:          'none',
    padding:         '0.5rem',
    fontSize:        '0.85rem',
    cursor:          'pointer',
    textAlign:       'center',
    width:           '100%',
  },
};
