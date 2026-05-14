/**
 * CitationInserter.jsx
 *
 * Modal for inserting a formatted in-text citation into the editor.
 * Typeahead search across the project corpus. Preview of the formatted
 * citation in the chosen style. Dispatches a window event to insert text
 * at the current editor cursor position.
 *
 * Props:
 *   isOpen        - boolean
 *   onClose       - callback
 *   initialSource - source record to pre-select (optional)
 *   citationStyle - initial style string from STYLES (optional)
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useProject } from '../ProjectContext';
import { searchSources } from '../../services/CitationService';
import { formatInText, STYLES } from '../../services/CitationStyleService';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  ACCENT_BORDER_STRONG,
  ACCENT_GLASS_STRONG,
  OVERLAY_MEDIUM,
  COLOUR_WARN,
} from '../../theme/tokens';

const STYLE_LABELS = {
  [STYLES.APA7]:      'APA 7',
  [STYLES.HARVARD]:   'Harvard',
  [STYLES.CHICAGO]:   'Chicago',
  [STYLES.VANCOUVER]: 'Vancouver',
};

const STORAGE_KEY = 'simplifii_citation_style';

export default function CitationInserter({ isOpen, onClose, initialSource, citationStyle }) {
  const { projectSources } = useProject();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [style, setStyle] = useState(
    citationStyle || localStorage.getItem(STORAGE_KEY) || STYLES.APA7
  );
  const [narrative, setNarrative] = useState(false);
  const inputRef = useRef(null);

  const sourcesList = useMemo(() => Object.values(projectSources || {}), [projectSources]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchSources(sourcesList, query);
  }, [sourcesList, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(initialSource || null);
      setNarrative(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialSource]);

  useEffect(() => {
    if (citationStyle) setStyle(citationStyle);
  }, [citationStyle]);

  const preview = useMemo(() => {
    if (!selected) return null;
    return formatInText(selected, style, { narrative });
  }, [selected, style, narrative]);

  const handleInsert = useCallback(() => {
    if (!preview) return;
    window.dispatchEvent(
      new CustomEvent('simplifii:insert-citation', { detail: { text: preview } })
    );
    onClose();
  }, [preview, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && selected) handleInsert();
  }, [onClose, selected, handleInsert]);

  function handleStyleChange(e) {
    const next = e.target.value;
    setStyle(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Insert citation"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAY_MEDIUM,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 480,
          maxWidth: '92vw',
          background: SURFACE_CARD,
          border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: BORDER_RADIUS * 2,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: '70vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
            Insert Citation
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inserter"
            style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 11, padding: '2px 6px' }}
          >
            ESC
          </button>
        </div>

        {/* Search */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search corpus by author, title, or year..."
          aria-label="Search corpus"
          style={{
            width: '100%',
            padding: '8px 10px',
            background: SURFACE_RAISED,
            border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS,
            fontFamily: FONT_BODY,
            fontSize: 13,
            color: TEXT_PRIMARY,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Results */}
        {results.length > 0 && (
          <ul
            role="listbox"
            aria-label="Corpus search results"
            style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', maxHeight: 160, display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {results.map(source => {
              const isSelected = selected?.sourceId === source.sourceId;
              const firstAuthor = (source.authors || [])[0] || 'Unknown';
              return (
                <li
                  key={source.sourceId}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelected(source)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(source); }}
                  tabIndex={0}
                  style={{
                    padding: '7px 10px',
                    border: `1px solid ${isSelected ? ACCENT_BORDER_STRONG : SURFACE_RAISED}`,
                    borderRadius: BORDER_RADIUS,
                    background: isSelected ? ACCENT_GLASS_STRONG : SURFACE_RAISED,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY }}>
                    {firstAuthor} ({source.year || 'n.d.'})
                    <span style={{ color: TEXT_MUTED, marginLeft: 6 }}>
                      {source.title || ''}
                    </span>
                  </span>
                  {!source.verified && (
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: COLOUR_WARN, flexShrink: 0 }}>
                      UNVERIFIED
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Style options + preview (shown once a source is selected) */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${SURFACE_RAISED}`, paddingTop: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label
                htmlFor="inserter-style"
                style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED }}
              >
                Style
              </label>
              <select
                id="inserter-style"
                value={style}
                onChange={handleStyleChange}
                aria-label="Citation style"
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
                {Object.entries(STYLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={narrative}
                  onChange={e => setNarrative(e.target.checked)}
                  aria-label="Narrative form"
                />
                Narrative
              </label>
            </div>

            <div style={{ padding: '8px 10px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 4px' }}>
                Preview
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: ACCENT_PULSE, margin: 0, fontWeight: 600 }}>
                {preview}
              </p>
            </div>

            {!selected.verified && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLOUR_WARN, margin: 0 }}>
                This source is not yet verified. Verify it in the Sources panel before submission.
              </p>
            )}
          </div>
        )}

        {/* Insert button */}
        <button
          type="button"
          onClick={handleInsert}
          disabled={!preview}
          aria-label="Insert citation into document"
          style={{
            padding: '8px 16px',
            background: preview ? ACCENT_GLASS_STRONG : SURFACE_RAISED,
            border: `1px solid ${preview ? ACCENT_BORDER_STRONG : SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS,
            fontFamily: FONT_SYSTEM,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: preview ? ACCENT_PULSE : TEXT_FAINT,
            cursor: preview ? 'pointer' : 'not-allowed',
            alignSelf: 'flex-end',
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}
