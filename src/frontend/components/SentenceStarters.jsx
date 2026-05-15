import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import {
  TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * SentenceStarters
 *
 * Context-aware writing prompts that appear when cursor is at
 * the start of a new line. Click to insert.
 *
 * Props:
 *   documentType   - 'brief' | 'exam_paper' | 'rubric'
 *   sectionType    - 'introduction' | 'body_1' | 'conclusion' etc
 *   onInsert       - callback(text) inserts the starter into editor
 *   visible        - boolean
 */

const STARTERS = {
  introduction: [
    'This essay examines',
    'The central argument of this paper is',
    'In order to understand',
    'This report analyses',
  ],
  body: [
    'Furthermore,',
    'However,',
    'This suggests that',
    'Evidence for this includes',
    'In contrast,',
    'Building on this,',
    'A key consideration is',
  ],
  conclusion: [
    'In conclusion,',
    'The evidence presented demonstrates',
    'This analysis has shown',
    'Therefore,',
  ],
  exam_answer: [
    'The key point is',
    'This occurs because',
    'Evidence for this includes',
    'One example of this is',
    'The significance of this is',
    'This can be explained by',
  ],
  secondary: [
    'One reason for this is',
    'This shows that',
    'For example,',
    'This is important because',
    'Another point is',
  ],
};

const getStarters = (sectionType, documentType, tier) => {
  if (documentType === 'exam_paper') return STARTERS.exam_answer;
  if (tier === 'secondary' || tier === 'primary') return STARTERS.secondary;
  if (sectionType?.includes('intro')) return STARTERS.introduction;
  if (sectionType?.includes('conclu')) return STARTERS.conclusion;
  return STARTERS.body;
};

export default function SentenceStarters({ documentType, sectionType, onInsert, visible }) {
  const { activeTier } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  const starters = getStarters(sectionType, documentType, activeTier);

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 0',
      borderBottom: `1px solid ${ACCENT_BORDER}`,
    }}>
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'center', marginRight: 4 }}>
        Start with:
      </span>
      {starters.map((s, i) => (
        <button key={i} type="button" onClick={() => onInsert?.(s + ' ')}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, color: ACCENT_PULSE,
            background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS, padding: '3px 8px',
            cursor: 'pointer', outline: 'none', minHeight: 24,
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {s}
        </button>
      ))}
      <button type="button" onClick={() => setDismissed(true)}
        style={{ fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
        dismiss
      </button>
    </div>
  );
}
