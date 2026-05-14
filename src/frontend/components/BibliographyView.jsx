/**
 * BibliographyView.jsx
 *
 * Live bibliography rendered below the canvas editor.
 * Shows all verified project sources formatted in the chosen citation style.
 * The style switcher persists to localStorage and reformats the list instantly.
 *
 * Renders nothing when there are no verified sources.
 */

import React, { useState, useMemo } from 'react';
import { useProject } from '../ProjectContext';
import { formatBibliography, STYLES } from '../../services/CitationStyleService';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const STYLE_OPTIONS = [
  { value: STYLES.APA7,      label: 'APA 7' },
  { value: STYLES.HARVARD,   label: 'Harvard' },
  { value: STYLES.CHICAGO,   label: 'Chicago' },
  { value: STYLES.VANCOUVER, label: 'Vancouver' },
];

const STORAGE_KEY = 'simplifii_citation_style';

export default function BibliographyView() {
  const { projectSources } = useProject();
  const [style, setStyle] = useState(
    () => localStorage.getItem(STORAGE_KEY) || STYLES.APA7
  );

  const verifiedSources = useMemo(
    () => Object.values(projectSources || {}).filter(s => s.verified),
    [projectSources]
  );

  const entries = useMemo(
    () => formatBibliography(verifiedSources, style),
    [verifiedSources, style]
  );

  function handleStyleChange(e) {
    const next = e.target.value;
    setStyle(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  if (verifiedSources.length === 0) return null;

  return (
    <div
      style={{
        borderTop: `1px solid ${SURFACE_RAISED}`,
        padding: '16px 24px 24px',
        background: SURFACE_CARD,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h4 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
          References
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="bib-style-select"
            style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT }}
          >
            Style
          </label>
          <select
            id="bib-style-select"
            value={style}
            onChange={handleStyleChange}
            aria-label="Bibliography citation style"
            style={{
              background: SURFACE_RAISED,
              border: `1px solid ${SURFACE_RAISED}`,
              borderRadius: BORDER_RADIUS,
              fontFamily: FONT_SYSTEM,
              fontSize: 10,
              color: TEXT_PRIMARY,
              padding: '3px 6px',
              cursor: 'pointer',
            }}
          >
            {STYLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map((entry, i) => (
          <li
            key={i}
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              color: TEXT_PRIMARY,
              lineHeight: 1.7,
              paddingLeft: 20,
              textIndent: '-20px',
            }}
          >
            {entry}
          </li>
        ))}
      </ol>
    </div>
  );
}
