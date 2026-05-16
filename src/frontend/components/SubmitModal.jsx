import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  OVERLAY_BACKDROP,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * SubmitModal
 *
 * Pre-submission checklist + Authenticity Report visibility.
 * Shown when learner clicks "Submit" in canvas header.
 * Does not submit TO the LMS: marks work as submitted in Simplifii.
 */

const CHECKLIST = [
  'Have you answered all parts of the question?',
  'Is your word count within the required range?',
  'Have you included references if required?',
  'Have you read through your work once?',
  'Are you happy with this version?',
];

export default function SubmitModal({ courseId, assessmentTitle, wordCount, targetWords, authenticitySplit, onSubmitted, onClose }) {
  const { user } = useAuth();
  const [checks, setChecks] = useState(CHECKLIST.map(() => false));
  const [submitting, setSubmitting] = useState(false);

  const humanPct = authenticitySplit?.human_percent || 100;
  const aiPct = authenticitySplit?.ai_percent || 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Write to outcome_signals
      if (user?.id) {
        await supabase.from('outcome_signals').upsert({
          user_id: user.id,
          task_id: `${courseId}_${assessmentTitle}`,
          submission_completed: true,
          submission_timestamp: new Date().toISOString(),
        }, { onConflict: 'user_id,task_id' }).catch(() => {});
      }
      onSubmitted?.();
    } catch { /* non-blocking */ }
    setSubmitting(false);
  };

  const toggleCheck = (i) => setChecks(prev => prev.map((v, j) => j === i ? !v : v));

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 24 }}
      onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Pre-submission checklist"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 440, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 12, padding: '24px 20px' }}>

        <h2 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 16px' }}>
          Ready to submit?
        </h2>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {CHECKLIST.map((item, i) => (
            <label key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.4 }}>
              <input type="checkbox" checked={checks[i]} onChange={() => toggleCheck(i)} style={{ marginTop: 2, accentColor: ACCENT_PULSE }} />
              {item}
            </label>
          ))}
        </div>

        {/* Authenticity Report */}
        <div style={{ padding: '14px 16px', background: SURFACE_RAISED, borderRadius: BORDER_RADIUS + 2, marginBottom: 16 }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 8px' }}>
            Your Authenticity Report
          </p>
          <div style={{ display: 'flex', gap: 4, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${humanPct}%`, background: ACCENT_PULSE, borderRadius: 4 }} />
            <div style={{ width: `${aiPct}%`, background: '#f59e0b', borderRadius: 4 }} />
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
            You wrote {humanPct}% of this. AI contributed {aiPct}%.
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: 0, lineHeight: 1.4 }}>
            This is private to you unless your institution has Simplifii access.
          </p>
        </div>

        {/* Word count check */}
        {targetWords > 0 && (
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: Math.abs(wordCount - targetWords) / targetWords > 0.1 ? '#f59e0b' : TEXT_MUTED, margin: '0 0 16px' }}>
            Word count: {wordCount} / {targetWords} ({Math.round((wordCount / targetWords) * 100)}%)
          </p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8,
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
            background: ACCENT_PULSE, border: 'none', color: '#09090b',
            cursor: submitting ? 'wait' : 'pointer', minHeight: 44,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Marking as submitted...' : 'Confirm and mark as submitted'}
        </button>

        <button type="button" onClick={onClose}
          style={{ width: '100%', marginTop: 8, padding: '8px 0', background: 'none', border: 'none', fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, cursor: 'pointer' }}>
          Not yet
        </button>
      </div>
    </div>,
    document.body
  );
}
