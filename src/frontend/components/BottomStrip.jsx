import React from 'react';
import TalkToSomeoneLink from './TalkToSomeoneLink';
import { useSettings } from '../SettingsContext';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  COLOUR_WARN,
  FONT_SYSTEM,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * BottomStrip
 *
 * Sticky bottom bar on canvas. Cannot collapse.
 * Left: Talk to someone
 * Centre: word count (tier-aware), body doubling with pulse
 * Right: authenticity %, local-only badge
 *
 * Props:
 *   wordCount    - number
 *   targetWords  - number
 */

// TODO: wire to real anonymous aggregate count from telemetry.
const HARDCODED_BODY_DOUBLE_COUNT = 47;

function wordCountDisplay(count, target) {
  if (target <= 0) return { text: `${count} words`, colour: TEXT_MUTED, guidance: '' }; // allow-style
  const pct = Math.round((count / target) * 100);
  if (pct < 50) return { text: `${count} / ${target} words`, colour: TEXT_MUTED, guidance: '' }; // allow-style
  if (pct <= 90) return { text: `${count} / ${target} words`, colour: TEXT_PRIMARY, guidance: 'keep going' }; // allow-style
  if (pct <= 110) return { text: `${count} / ${target} words`, colour: ACCENT_PULSE, guidance: 'on target' }; // allow-style
  return { text: `${count} / ${target} words`, colour: COLOUR_WARN, guidance: `trim ${count - target} words` }; // allow-style
}

export default function BottomStrip({ wordCount, targetWords }) {
  const { reducedMotion } = useSettings();
  const wc = wordCountDisplay(wordCount || 0, targetWords || 0);

  return (
    <footer
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 36,
        padding: '0 16px',
        background: SURFACE_CARD,
        borderTop: `1px solid ${SURFACE_RAISED}`,
        fontFamily: FONT_SYSTEM,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
      role="contentinfo"
      aria-label="Canvas status"
    >
      {/* Left: safety link */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TalkToSomeoneLink />
      </div>

      {/* Centre: word count + body doubling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: wc.colour }}>
          {wc.text}
          {wc.guidance && (
            <span style={{ color: wc.colour, marginLeft: 4, opacity: 0.8 }}>
              {wc.guidance}
            </span>
          )}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: TEXT_FAINT }}>
          {/* Body doubling pulse dot */}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: ACCENT_PULSE,
              display: 'inline-block',
              animation: reducedMotion ? 'none' : 'bodyDoublePulse 2s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <span>{HARDCODED_BODY_DOUBLE_COUNT} students writing now</span>
        </span>
      </div>

      {/* Right: authenticity + local badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: TEXT_FAINT }}>
        <span>87% human</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT_PULSE, display: 'inline-block' }} aria-hidden="true" />
          Local-only
        </span>
      </div>
    </footer>
  );
}
