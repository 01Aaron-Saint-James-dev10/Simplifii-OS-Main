/**
 * ReflexivityLogPanel.jsx
 *
 * Full panel view of the reflexivity log for a research project.
 * Displays positionality, power dynamic, dual-role, lived experience,
 * reflexive memo, and tension entries by date.
 *
 * Props:
 *   onClose - callback
 */

import React, { useState } from 'react';
import { useResearchProject } from '../ResearchProjectContext';
import { getReflexivityTypeLabel } from '../../services/ResearchProjectService';
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
} from '../../theme/tokens';

const TYPES = [
  { value: 'positionality',    label: 'Positionality' },
  { value: 'power_dynamic',    label: 'Power dynamic' },
  { value: 'dual_role',        label: 'Dual role' },
  { value: 'lived_experience', label: 'Lived experience' },
  { value: 'reflexive_memo',   label: 'Reflexive memo' },
  { value: 'tension',          label: 'Tension' },
];

const TYPE_COLOURS = {
  positionality:    '#10b981',
  power_dynamic:    '#f43f5e',
  dual_role:        '#f59e0b',
  lived_experience: '#3b82f6',
  reflexive_memo:   '#8b5cf6',
  tension:          '#71717a',
};

export default function ReflexivityLogPanel({ onClose }) {
  const { reflexivityLog, addReflexivityEntry } = useResearchProject();
  const [type, setType] = useState('positionality');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addReflexivityEntry({ type, content: content.trim(), date });
      setContent('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reflexivity Log"
      style={{ position: 'fixed', inset: 0, background: OVERLAY_MEDIUM, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60, zIndex: 900 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 640, maxWidth: '94vw', maxHeight: '80vh', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
            Reflexivity Log ({reflexivityLog.length} entries)
          </p>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 11, padding: '2px 6px' }}>ESC</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reflexivityLog.length === 0 ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, margin: 0 }}>
              No reflexivity entries yet. Your positionality matters methodologically.
            </p>
          ) : (
            reflexivityLog.map(entry => (
              <div key={entry.entryId} style={{ padding: '10px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, borderLeft: `3px solid ${TYPE_COLOURS[entry.type] || ACCENT_PULSE}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TYPE_COLOURS[entry.type] || ACCENT_PULSE }}>
                    {getReflexivityTypeLabel(entry.type)}
                  </span>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>{entry.date}</span>
                </div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.6 }}>
                  {entry.content}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} style={{ borderTop: `1px solid ${SURFACE_RAISED}`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              aria-label="Entry type"
              style={{ background: SURFACE_RAISED, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_PRIMARY, padding: '4px 8px', cursor: 'pointer' }}
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              aria-label="Date"
              style={{ background: SURFACE_RAISED, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_PRIMARY, padding: '4px 8px' }}
            />
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Record your reflexive observation, positionality note, or tension..."
            aria-label="Entry content"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', background: SURFACE_RAISED, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={!content.trim() || saving}
            style={{ alignSelf: 'flex-end', padding: '6px 14px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: content.trim() ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Saving...' : 'Add Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
