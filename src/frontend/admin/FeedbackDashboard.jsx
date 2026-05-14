import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  COLOUR_WARN, COLOUR_DANGER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const AARON_ID = '0bc6fbc1-f151-4580-a0c4-6b0241d52b43';
const STATUSES = ['new', 'triaged', 'in-progress', 'resolved', 'spam'];
const STATUS_COLOURS = {
  'new': ACCENT_PULSE,
  'triaged': COLOUR_WARN,
  'in-progress': TEXT_MUTED,
  'resolved': TEXT_FAINT,
  'spam': COLOUR_DANGER,
};

/**
 * FeedbackDashboard
 *
 * Aaron-only admin view for triaging beta feedback.
 * Reads from feedback table (Aaron has SELECT ALL policy).
 */
export default function FeedbackDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const isAaron = user?.id === AARON_ID;

  useEffect(() => {
    if (!isAaron) return;
    supabase.from('feedback').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [isAaron]);

  const updateStatus = async (id, status) => {
    await supabase.from('feedback').update({ status }).eq('id', id);
    setItems(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const deleteFeedback = async (id) => {
    await supabase.from('feedback').delete().eq('id', id);
    setItems(prev => prev.filter(f => f.id !== id));
  };

  if (!isAaron) {
    return (
      <div style={{ minHeight: '100vh', background: SURFACE_BASE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: FONT_BODY, color: TEXT_MUTED }}>Access denied.</p>
      </div>
    );
  }

  const filtered = filter === 'all' ? items : items.filter(f => f.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: SURFACE_BASE, padding: '24px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
          Feedback Triage
        </h1>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, margin: '0 0 16px' }}>
          {items.length} total, {items.filter(f => f.status === 'new').length} new
        </p>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} type="button" onClick={() => setFilter(s)}
              style={{
                fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', padding: '6px 12px', borderRadius: 16,
                background: filter === s ? ACCENT_PULSE : 'transparent',
                border: `1px solid ${filter === s ? ACCENT_PULSE : SURFACE_RAISED}`,
                color: filter === s ? SURFACE_BASE : TEXT_MUTED, /* allow-style */
                cursor: 'pointer', minHeight: 28,
              }}>
              {s}
            </button>
          ))}
        </div>

        {loading && <p style={{ fontFamily: FONT_BODY, color: TEXT_MUTED }}>Loading...</p>}

        {/* Feedback list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(f => (
            <div key={f.id} style={{
              padding: '14px 16px', background: SURFACE_CARD,
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS + 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: STATUS_COLOURS[f.status] || TEXT_FAINT, marginRight: 8 }}>
                    {f.status || 'new'}
                  </span>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                    {f.type} | {new Date(f.created_at).toLocaleString('en-AU')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {STATUSES.filter(s => s !== f.status).map(s => (
                    <button key={s} type="button" onClick={() => updateStatus(f.id, s)}
                      style={{ fontFamily: FONT_SYSTEM, fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, color: TEXT_FAINT, cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
                {f.title}
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.5 }}>
                {f.body}
              </p>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                {f.url} | {(f.user_agent || '').slice(0, 60)}
              </p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_FAINT, textAlign: 'center', marginTop: 32 }}>
            No feedback matching this filter.
          </p>
        )}
      </div>
    </div>
  );
}
