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
 * Centre: composite progress (words + thinking + scaffold)
 * Right: auto-saved badge
 *
 * Props:
 *   wordCount       - number
 *   targetWords     - number
 *   assessmentTitle - string
 */

function wordCountDisplay(count, target) {
  if (target <= 0) return { text: `${count} words`, colour: TEXT_MUTED, guidance: '' }; // allow-style
  const pct = Math.round((count / target) * 100);
  if (pct < 50) return { text: `${count} / ${target} words`, colour: TEXT_MUTED, guidance: '' }; // allow-style
  if (pct <= 90) return { text: `${count} / ${target} words`, colour: TEXT_PRIMARY, guidance: 'keep going' }; // allow-style
  if (pct <= 110) return { text: `${count} / ${target} words`, colour: ACCENT_PULSE, guidance: 'on target' }; // allow-style
  return { text: `${count} / ${target} words`, colour: COLOUR_WARN, guidance: `trim ${count - target} words` }; // allow-style
}

function compositeProgress(wordCount, targetWords, assessmentTitle) {
  const words = Math.min(50, Math.round((wordCount / Math.max(targetWords, 1)) * 100) * 0.5);
  let thinking = 0;
  let scaffold = 0;
  if (assessmentTitle) {
    const tier2Raw = localStorage.getItem(`simplifii:tier2-count-${assessmentTitle}`);
    thinking = tier2Raw ? Math.min(25, parseInt(tier2Raw, 10) * 12.5) : 0;
    scaffold = localStorage.getItem(`simplifii:scaffold-accepted-${assessmentTitle}`) === 'true' ? 25 : 0;
  }
  return Math.min(100, Math.round(words + thinking + scaffold));
}

export default function BottomStrip({ wordCount, targetWords, assessmentTitle }) {
  const { reducedMotion } = useSettings();
  const wc = wordCountDisplay(wordCount || 0, targetWords || 0);
  const progress = compositeProgress(wordCount || 0, targetWords || 0, assessmentTitle);

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

      {/* Centre: composite progress + word count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: progress >= 75 ? ACCENT_PULSE : progress >= 40 ? TEXT_PRIMARY : TEXT_MUTED }}>
          {progress}%{progress < 100 ? ': keep going' : ': ready to review'}
        </span>
        <span style={{ color: wc.colour }}>
          {wc.text}
          {(wordCount || 0) >= 50 && (
            <span style={{ color: TEXT_FAINT, marginLeft: 8, fontWeight: 400 }} title="Estimated read time at 238 words per minute">
              {Math.max(1, Math.ceil((wordCount || 0) / 238))} min read
            </span>
          )}
        </span>
      </div>

      {/* Right: auto-saved badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: TEXT_FAINT }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT_PULSE, display: 'inline-block' }} aria-hidden="true" />
        Auto-saved
      </div>
    </footer>
  );
}
