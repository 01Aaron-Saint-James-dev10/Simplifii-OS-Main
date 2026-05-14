import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS,
  GLASS_BORDER,
  OVERLAY_BACKDROP,
  COLOUR_DANGER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const TABS = [
  { key: 'bug', label: 'Bug', heading: 'Something not working?', sub: "We read every message. You'll get a reply within 48 hours during beta." },
  { key: 'idea', label: 'Idea', heading: 'Got a suggestion?', sub: "We read every message. You'll get a reply within 48 hours during beta." },
  { key: 'general', label: 'General', heading: 'Tell us anything', sub: "We read every message. You'll get a reply within 48 hours during beta." },
];

const MAX_TITLE = 120;
const MAX_BODY = 2000;

export default function FeedbackModal({ onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bug');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const dialogRef = useRef(null);
  const autoCloseRef = useRef(null);

  const tab = TABS.find(t => t.key === activeTab) || TABS[0];

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Auto-close after success
  useEffect(() => {
    if (!done) return;
    autoCloseRef.current = setTimeout(onClose, 4000);
    return () => clearTimeout(autoCloseRef.current);
  }, [done, onClose]);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { error: insertErr } = await supabase.from('feedback').insert({
        user_id: user.id,
        type: activeTab,
        title: title.trim().slice(0, MAX_TITLE),
        body: body.trim().slice(0, MAX_BODY),
        url: window.location.pathname,
        user_agent: navigator.userAgent,
      });
      if (insertErr) throw insertErr;
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not send. Please try again.');
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: SURFACE_RAISED,
    border: `1px solid ${GLASS_BORDER}`, borderRadius: BORDER_RADIUS,
    color: TEXT_PRIMARY, fontFamily: FONT_BODY, fontSize: 14,
    outline: 'none', boxSizing: 'border-box', resize: 'vertical',
  };

  if (done) {
    return (
      <div style={s.backdrop} onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-label="Feedback sent" ref={dialogRef} tabIndex={-1}
          onClick={e => e.stopPropagation()}
          style={s.card}>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 8px', textAlign: 'center' }}>
            Thank you. We have got it.
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 20px', textAlign: 'center' }}>
            {"You'll get a reply within 48 hours."}
          </p>
          <button type="button" onClick={onClose}
            style={{ ...s.submitBtn, width: '100%' }}>
            Back to work
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Send feedback" ref={dialogRef} tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={s.card}>

        {/* Tabs */}
        <div role="tablist" style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${SURFACE_RAISED}`, marginBottom: 16 }}>
          {TABS.map(t => {
            const selected = t.key === activeTab;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1, padding: '10px 0', background: 'none', border: 'none',
                  borderBottom: selected ? `2px solid ${ACCENT_PULSE}` : '2px solid transparent',
                  fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', cursor: 'pointer', outline: 'none',
                  color: selected ? ACCENT_PULSE : TEXT_FAINT,
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = `inset 0 -2px 0 ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Heading */}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
          {tab.heading}
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: '0 0 16px' }}>
          {tab.sub}
        </p>

        {/* Title */}
        <label style={s.label}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, MAX_TITLE))}
          maxLength={MAX_TITLE}
          required
          placeholder="Brief summary"
          style={inputStyle}
        />
        <p style={s.counter}>{title.length}/{MAX_TITLE}</p>

        {/* Body */}
        <label style={s.label}>Description *</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value.slice(0, MAX_BODY))}
          maxLength={MAX_BODY}
          required
          placeholder="What happened? What did you expect?"
          rows={5}
          style={inputStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ ...s.counter, margin: 0 }} aria-live="polite">{body.length}/{MAX_BODY}</p>
          <p style={{ ...s.counter, margin: 0, color: TEXT_FAINT }}>
            {"We'll include: current page, browser info"}
          </p>
        </div>

        {error && <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_DANGER, margin: '0 0 8px' }}>{error}</p>}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || !body.trim() || saving}
          style={title.trim() && body.trim() && !saving ? s.submitBtn : s.submitBtnDisabled}
        >
          {saving ? 'Sending...' : 'Send feedback'}
        </button>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: OVERLAY_BACKDROP, padding: 16,
  },
  card: {
    width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
    background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 12, padding: '24px 24px 20px', outline: 'none',
  },
  label: {
    fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: TEXT_FAINT, display: 'block', marginBottom: 6, marginTop: 12,
  },
  counter: {
    fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT,
    margin: '4px 0 0', letterSpacing: '0.04em',
  },
  submitBtn: {
    width: '100%', padding: '12px 0', borderRadius: 8,
    fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
    background: ACCENT_PULSE, border: 'none', color: '#09090b',
    cursor: 'pointer',
  },
  submitBtnDisabled: {
    width: '100%', padding: '12px 0', borderRadius: 8,
    fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
    background: SURFACE_RAISED, border: 'none', color: TEXT_FAINT,
    cursor: 'not-allowed', opacity: 0.5,
  },
};
