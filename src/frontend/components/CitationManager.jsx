/**
 * CitationManager.jsx
 *
 * Corpus management panel for the right rail "Sources" tab.
 * Lists all project sources, shows verification status (amber: unverified,
 * green: verified), and provides add, verify, delete, and insert actions.
 *
 * Props:
 *   courseId        - string
 *   onRequestInsert - callback(source) opens CitationInserter for this source
 */

import React, { useState, useMemo } from 'react';
import { useProject } from '../ProjectContext';
import { searchSources } from '../../services/CitationService';
import {
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
  COLOUR_WARN,
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
  COLOUR_WARN_BORDER_STRONG,
  COLOUR_DANGER,
  COLOUR_DANGER_BORDER,
} from '../../theme/tokens';

export default function CitationManager({ courseId, onRequestInsert }) {
  const { projectSources, addProjectSource, verifyProjectSource, removeProjectSource } = useProject();
  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [fields, setFields] = useState({ authors: '', year: '', title: '', doi: '' });
  const [adding, setAdding] = useState(false);

  const sourcesList = useMemo(() => Object.values(projectSources || {}), [projectSources]);

  const displayed = useMemo(() => {
    if (!query.trim()) return sourcesList;
    return searchSources(sourcesList, query);
  }, [sourcesList, query]);

  function setField(key, value) {
    setFields(f => ({ ...f, [key]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!fields.title.trim() && !fields.authors.trim()) return;
    setAdding(true);
    try {
      await addProjectSource(courseId, {
        authors: fields.authors
          ? fields.authors.split(',').map(a => a.trim()).filter(Boolean)
          : [],
        year:  fields.year ? Number(fields.year) : null,
        title: fields.title.trim(),
        doi:   fields.doi.trim() || null,
      });
      setFields({ authors: '', year: '', title: '', doi: '' });
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: 10, overflow: 'hidden', boxSizing: 'border-box' }}>
      <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
        Source Corpus
      </h3>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search sources..."
        aria-label="Search corpus sources"
        style={{
          width: '100%',
          padding: '6px 8px',
          background: SURFACE_RAISED,
          border: `1px solid ${SURFACE_RAISED}`,
          borderRadius: BORDER_RADIUS,
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: TEXT_PRIMARY,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {displayed.length === 0 ? (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0, lineHeight: 1.5 }}>
            {query.trim()
              ? 'No sources match that query.'
              : 'No sources in this corpus yet. Add one below.'}
          </p>
        ) : (
          displayed.map(source => (
            <SourceCard
              key={source.sourceId}
              source={source}
              onVerify={() => verifyProjectSource(source.sourceId)}
              onDelete={() => removeProjectSource(source.sourceId)}
              onInsert={onRequestInsert ? () => onRequestInsert(source) : null}
            />
          ))
        )}
      </div>

      {showAddForm ? (
        <form
          onSubmit={handleAdd}
          style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${SURFACE_RAISED}`, paddingTop: 10 }}
        >
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
            Add Source
          </p>
          <input
            type="text"
            placeholder="Authors, comma separated"
            value={fields.authors}
            onChange={e => setField('authors', e.target.value)}
            style={inputSt}
            aria-label="Authors"
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              placeholder="Year"
              value={fields.year}
              onChange={e => setField('year', e.target.value)}
              style={{ ...inputSt, width: 70 }}
              aria-label="Year"
              min={1900}
              max={2099}
            />
            <input
              type="text"
              placeholder="DOI (optional)"
              value={fields.doi}
              onChange={e => setField('doi', e.target.value)}
              style={{ ...inputSt, flex: 1 }}
              aria-label="DOI"
            />
          </div>
          <input
            type="text"
            placeholder="Title"
            value={fields.title}
            onChange={e => setField('title', e.target.value)}
            style={inputSt}
            aria-label="Title"
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={adding} style={btnPrimarySt}>
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={btnSecondarySt}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowAddForm(true)} style={btnPrimarySt}>
          + Add Source
        </button>
      )}
    </div>
  );
}

// ─── SourceCard ───────────────────────────────────────────────────────────────

function SourceCard({ source, onVerify, onDelete, onInsert }) {
  const verified = source.verified === true;
  const firstAuthor = (source.authors || [])[0] || 'Unknown';
  const label = `${firstAuthor} (${source.year || 'n.d.'})`;

  return (
    <div
      style={{
        padding: '8px 10px',
        border: `1px solid ${verified ? ACCENT_BORDER : COLOUR_WARN_BORDER}`,
        borderRadius: BORDER_RADIUS,
        background: verified ? ACCENT_GLASS : COLOUR_WARN_GLASS,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: verified ? ACCENT_PULSE : COLOUR_WARN, margin: 0, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {source.title || 'No title'}
          </p>
        </div>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: verified ? ACCENT_PULSE : COLOUR_WARN, flexShrink: 0 }}>
          {verified ? 'VERIFIED' : 'UNVERIFIED'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {!verified && (
          <button
            type="button"
            onClick={onVerify}
            aria-label={`Verify source: ${label}`}
            style={{ ...btnSmSt, border: `1px solid ${COLOUR_WARN_BORDER_STRONG}`, color: COLOUR_WARN }}
          >
            Verify
          </button>
        )}
        {onInsert && (
          <button
            type="button"
            onClick={onInsert}
            aria-label={`Insert citation for: ${label}`}
            style={{ ...btnSmSt, border: `1px solid ${ACCENT_BORDER_STRONG}`, color: ACCENT_PULSE }}
          >
            Insert
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete source: ${label}`}
          style={{ ...btnSmSt, border: `1px solid ${COLOUR_DANGER_BORDER}`, color: COLOUR_DANGER }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Shared inline styles ─────────────────────────────────────────────────────

const inputSt = {
  padding: '5px 8px',
  background: SURFACE_RAISED,
  border: `1px solid ${SURFACE_RAISED}`,
  borderRadius: BORDER_RADIUS,
  fontFamily: FONT_BODY,
  fontSize: 12,
  color: TEXT_PRIMARY,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnPrimarySt = {
  padding: '6px 12px',
  background: ACCENT_GLASS_STRONG,
  border: `1px solid ${ACCENT_BORDER_STRONG}`,
  borderRadius: BORDER_RADIUS,
  fontFamily: FONT_SYSTEM,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: ACCENT_PULSE,
  cursor: 'pointer',
  textTransform: 'uppercase',
};

const btnSecondarySt = {
  padding: '6px 12px',
  background: 'transparent',
  border: `1px solid ${SURFACE_RAISED}`,
  borderRadius: BORDER_RADIUS,
  fontFamily: FONT_SYSTEM,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: TEXT_MUTED,
  cursor: 'pointer',
  textTransform: 'uppercase',
};

const btnSmSt = {
  padding: '3px 8px',
  background: 'transparent',
  borderRadius: BORDER_RADIUS,
  fontFamily: FONT_SYSTEM,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  textTransform: 'uppercase',
};
