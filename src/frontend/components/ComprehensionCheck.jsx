import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * ComprehensionCheck
 *
 * Appears after every tutor response when autism-first is enabled.
 * 3 buttons: "Got it" | "Sort of" | "Confused"
 * Logs to comprehension_log table.
 *
 * Props:
 *   messageIndex   - number (for tracking which response)
 *   onConfused     - callback() triggers re-explanation
 *   onSortOf       - callback() triggers follow-up options
 */

const BUTTONS = [
  { id: 'got_it', label: 'Got it', icon: '\u2713', colour: ACCENT_PULSE },
  { id: 'sort_of', label: 'Sort of', icon: '?', colour: COLOUR_WARN },
  { id: 'confused', label: 'Confused', icon: '\u2717', colour: '#ef4444' },
];

export default function ComprehensionCheck({ messageIndex, onConfused, onSortOf }) {
  const { user } = useAuth();
  const [selected, setSelected] = React.useState(null);

  const handleRate = async (rating) => {
    setSelected(rating);

    // Log to Supabase
    if (user) {
      supabase.from('comprehension_log').insert({
        user_id: user.id,
        tutor_response_id: `msg_${messageIndex}`,
        rating,
      }).catch(() => {});
    }

    if (rating === 'confused') onConfused?.();
    if (rating === 'sort_of') onSortOf?.();
  };

  if (selected === 'got_it') return null; // hide after positive rating

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      {BUTTONS.map(b => {
        const isSelected = selected === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => handleRate(b.id)}
            disabled={!!selected}
            aria-label={b.label}
            title={b.label}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600,
              color: isSelected ? b.colour : TEXT_FAINT,
              background: isSelected ? ACCENT_GLASS : 'transparent',
              border: `1px solid ${isSelected ? b.colour : 'transparent'}`,
              borderRadius: BORDER_RADIUS, padding: '2px 8px',
              cursor: selected ? 'default' : 'pointer', outline: 'none',
              opacity: selected && !isSelected ? 0.3 : 1,
              minHeight: 24,
            }}
            onFocus={e => { if (!selected) e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {b.icon} {b.label}
          </button>
        );
      })}
    </div>
  );
}
