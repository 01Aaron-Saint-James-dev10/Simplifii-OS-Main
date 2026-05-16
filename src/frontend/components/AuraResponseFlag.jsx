import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logResponseFlag } from '../../services/AccuracyLogger';
import { TEXT_FAINT, FONT_SYSTEM, SURFACE_RAISED, BORDER_RADIUS } from '../../theme/tokens';

/**
 * AuraResponseFlag
 *
 * Inline flag widget on AURA messages. Appears as a tiny icon,
 * expands to radio options on click. No modal, no popup.
 * Logs to aura_response_flags table.
 */

const CATEGORIES = [
  { id: 'inaccurate', label: 'Wrong info' },
  { id: 'unhelpful', label: 'Not helpful' },
  { id: 'too_long', label: 'Too long' },
  { id: 'confusing', label: 'Confusing' },
];

export default function AuraResponseFlag({ messageIndex, courseId }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return <span style={{ fontSize: 9, color: TEXT_FAINT, fontFamily: FONT_SYSTEM }}>Flagged</span>;

  const handleFlag = (category) => {
    logResponseFlag({
      userId: user?.id,
      callId: `msg_${messageIndex}`,
      sessionId: courseId || 'global',
      flagCategory: category,
    });
    setSubmitted(true);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Flag this response"
        title="Flag as wrong"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, color: TEXT_FAINT, opacity: 0.3, padding: '2px 4px',
          lineHeight: 1, fontFamily: FONT_SYSTEM,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.3'; }}
      >
        &#9873;
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
      {CATEGORIES.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => handleFlag(c.id)}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT,
            background: 'none', border: `1px solid ${SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS, padding: '2px 6px', cursor: 'pointer',
          }}
        >
          {c.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
      >
        &times;
      </button>
    </div>
  );
}
