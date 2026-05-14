/**
 * SupervisorFeedbackPanel.jsx
 *
 * Full panel view of supervisor feedback for a research project.
 * Displays feedback items with status cycling and an add form.
 * Status cycle: unaddressed -> in_progress -> addressed -> declined -> discussed -> unaddressed
 *
 * Props:
 *   onClose - callback
 */

import React, { useState } from 'react';
import { useResearchProject } from '../ResearchProjectContext';
import { getFeedbackStatusLabel } from '../../services/ResearchProjectService';
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
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
} from '../../theme/tokens';

const STATUS_COLOURS = {
  unaddressed: '#f43f5e',
  in_progress:  '#f59e0b',
  addressed:    '#10b981',
  declined:     '#71717a',
  discussed:    '#3b82f6',
};

const SOURCES = [
  { value: 'written',  label: 'Written' },
  { value: 'verbal',   label: 'Verbal' },
  { value: 'email',    label: 'Email' },
  { value: 'meeting',  label: 'Meeting' },
];

export default function SupervisorFeedbackPanel({ onClose }) {
  const { supervisorFeedback, addSupervisorFeedback, cycleFeedbackStatus } = useResearchProject();
  const [content, setContent]     = useState('');
  const [source, setSource]       = useState('written');
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving]       = useState(false);
  const [cycling, setCycling]     = useState(null);

  const unaddressedCount = supervisorFeedback.filter(f => f.status === 'unaddressed').length;

  async function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addSupervisorFeedback({ content: content.trim(), source, date });
      setContent('');
    } finally {
      setSaving(false);
    }
  }

  async function handleCycle(feedback) {
    if (cycling === feedback.feedbackId) return;
    setCycling(feedback.feedbackId);
    try {
      await cycleFeedbackStatus(feedback);
    } finally {
      setCycling(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Supervisor Feedback"
      style={{ position: 'fixed', inset: 0, background: OVERLAY_MEDIUM, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60, zIndex: 900 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 640, maxWidth: '94vw', maxHeight: '80vh', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
              Supervisor Feedback ({supervisorFeedback.length} items)
            </p>
            {unaddressedCount > 0 && (
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLOUR_WARN, background: COLOUR_WARN_GLASS, border: `1px solid ${COLOUR_WARN_BORDER}`, borderRadius: BORDER_RADIUS, padding: '2px 6px' }}>
                {unaddressedCount} unaddressed
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 11, padding: '2px 6px' }}>ESC</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {supervisorFeedback.length === 0 ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, margin: 0 }}>
              No feedback logged yet. Paste your supervisor's written comments below.
            </p>
          ) : (
            supervisorFeedback.map(item => {
              const statusCol = STATUS_COLOURS[item.status] || ACCENT_PULSE;
              const isCycling = cycling === item.feedbackId;
              return (
                <div key={item.feedbackId} style={{ padding: '10px 12px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, borderLeft: `3px solid ${statusCol}` }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCycle(item)}
                      disabled={isCycling}
                      aria-label={`Status: ${getFeedbackStatusLabel(item.status)}. Click to advance.`}
                      style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusCol, background: 'transparent', border: `1px solid ${statusCol}`, borderRadius: BORDER_RADIUS, padding: '2px 6px', cursor: 'pointer', opacity: isCycling ? 0.5 : 1 }}
                    >
                      {isCycling ? '...' : getFeedbackStatusLabel(item.status)}
                    </button>
                    <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>{item.date}</span>
                    {item.source && (
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, textTransform: 'capitalize' }}>{item.source}</span>
                    )}
                  </div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.6 }}>
                    {item.content}
                  </p>
                  {item.chapterContext && (
                    <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '4px 0 0' }}>
                      Re: {item.chapterContext}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleAdd} style={{ borderTop: `1px solid ${SURFACE_RAISED}`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              aria-label="Feedback source"
              style={{ background: SURFACE_RAISED, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_PRIMARY, padding: '4px 8px', cursor: 'pointer' }}
            >
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
            placeholder="Paste or type supervisor feedback verbatim..."
            aria-label="Feedback content"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', background: SURFACE_RAISED, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={!content.trim() || saving}
            style={{ alignSelf: 'flex-end', padding: '6px 14px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: content.trim() ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Saving...' : 'Log Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
