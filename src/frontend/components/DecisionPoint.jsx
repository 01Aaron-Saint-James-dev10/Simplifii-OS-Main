import React from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * DecisionPoint
 *
 * Never overwhelm with open choices. Maximum 2 options with cognitive load labels.
 * Optional "Surprise me" button.
 *
 * Props:
 *   question       - string (the decision prompt)
 *   options        - array of { label, estimatedTime, cognitiveLoad: 'easy'|'medium'|'hard' }
 *   surpriseMe     - boolean (show surprise me button)
 *   onSelect       - callback(optionIndex | 'surprise')
 */

const LOAD_COLOURS = {
  easy: ACCENT_PULSE,
  medium: TEXT_MUTED,
  hard: COLOUR_WARN,
};

const LOAD_LABELS = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

export default function DecisionPoint({ question, options = [], surpriseMe = false, onSelect }) {
  const safeOptions = options.slice(0, 2);

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {question && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
          {question}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {safeOptions.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect?.(i)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', padding: '10px 12px', textAlign: 'left',
              background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
              borderRadius: BORDER_RADIUS, cursor: 'pointer', outline: 'none', minHeight: 44,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; }}
            onBlur={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
                Option {i + 1}: {opt.label}
              </div>
              <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginTop: 2 }}>
                {opt.estimatedTime && <span>{opt.estimatedTime}</span>}
                {opt.estimatedTime && opt.cognitiveLoad && <span> · </span>}
                {opt.cognitiveLoad && (
                  <span style={{ color: LOAD_COLOURS[opt.cognitiveLoad] || TEXT_FAINT }}>
                    {LOAD_LABELS[opt.cognitiveLoad]}
                  </span>
                )}
              </div>
            </div>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 14, color: ACCENT_PULSE, flexShrink: 0 }}>
              {'\u203A'}
            </span>
          </button>
        ))}

        {surpriseMe && (
          <button
            type="button"
            onClick={() => onSelect?.('surprise')}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600,
              color: TEXT_FAINT, background: 'none',
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
              padding: '6px 12px', cursor: 'pointer', outline: 'none',
              alignSelf: 'center', minHeight: 28,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            Surprise me
          </button>
        )}
      </div>
    </div>
  );
}
