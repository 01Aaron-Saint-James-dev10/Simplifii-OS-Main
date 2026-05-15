import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  TEXT_FAINT,
  ACCENT_PULSE,
  COLOUR_WARN,
  SURFACE_RAISED,
  FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

const TAGS = ['Wrong information', 'Too complex', 'Too simple', 'Missed the point', 'Other'];

/**
 * ResponseFeedback
 *
 * Thumbs up/down on any AI response. Optional reason tag on thumbs down.
 * Auto-captures tool_name and context.
 *
 * Props:
 *   toolName - string (e.g. 'tutor', 'brief_simplifier')
 *   context  - object (any extra context to log)
 */
export default function ResponseFeedback({ toolName, context }) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const submit = async (rating, tag) => {
    setSubmitted(true);
    setShowTags(false);
    if (user) {
      try {
        await supabase.from('ai_response_feedback').insert({
          user_id: user.id, tool_name: toolName, rating, reason_tag: tag || null, context: context || {},
        });
      } catch { /* non-blocking */ }
    }
  };

  if (submitted) {
    return <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Thanks for the feedback</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <button type="button" onClick={() => submit(5)} title="Helpful"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2, color: TEXT_FAINT, minWidth: 28, minHeight: 28 }}>
        {'\uD83D\uDC4D'}
      </button>
      <button type="button" onClick={() => setShowTags(true)} title="Not helpful"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2, color: TEXT_FAINT, minWidth: 28, minHeight: 28 }}>
        {'\uD83D\uDC4E'}
      </button>
      {showTags && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TAGS.map(t => (
            <button key={t} type="button" onClick={() => submit(1, t)}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 8, padding: '2px 6px', borderRadius: 3, background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, color: TEXT_FAINT, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
