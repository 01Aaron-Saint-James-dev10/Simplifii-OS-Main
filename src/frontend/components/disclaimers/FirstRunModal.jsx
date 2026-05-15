import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_HOVER,
  OVERLAY_BACKDROP,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../../theme/tokens';

/**
 * FirstRunModal (Layer 1)
 *
 * Shown once after signup. Blocks the app until the user acknowledges
 * two checkboxes and clicks Continue. Updates profiles.acknowledged_disclaimers.
 */
export default function FirstRunModal({ onAcknowledged }) {
  const { user } = useAuth();
  const [checkResponsible, setCheckResponsible] = useState(false);
  const [checkTerms, setCheckTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  const canContinue = checkResponsible && checkTerms && !saving;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const [saveError, setSaveError] = useState('');

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    setSaveError('');
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ acknowledged_disclaimers: true })
        .eq('id', user.id);
      if (updateErr) throw updateErr;
      onAcknowledged();
    } catch {
      setSaveError('Could not save. Check your connection and try again.');
      setSaving(false);
    }
  };

  return createPortal(
    <div style={s.backdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Before you start"
        tabIndex={-1}
        style={s.card}
      >
        <h2 style={s.heading}>Before you start</h2>

        <div style={s.scrollArea}>
          <p style={s.intro}>
            Simplifii-OS is a thinking tool. It supports your work. It does not do it for you.
          </p>
          <p style={s.intro}>Before you continue, please understand five things:</p>

          <div style={s.point}>
            <h3 style={s.pointTitle}>1. You are responsible for your own work.</h3>
            <p style={s.pointBody}>
              Simplifii-OS helps you prepare, organise, draft, verify, and reflect. Every word you submit, every claim you make, every citation you use, is your responsibility. Read what you write. Check what you cite. Submit only what you genuinely understand and can defend.
            </p>
          </div>

          <div style={s.point}>
            <h3 style={s.pointTitle}>2. AI can be wrong.</h3>
            <p style={s.pointBody}>
              Simplifii-OS uses AI to suggest ideas, flag missing citations, surface connections in your sources, and translate rubric language. AI makes mistakes. AI sometimes invents things that look right but are not. Every suggestion is a starting point, not a fact. Verify everything important.
            </p>
          </div>

          <div style={s.point}>
            <h3 style={s.pointTitle}>3. AI does not understand your assignment the way your teacher does.</h3>
            <p style={s.pointBody}>
              Our tools translate rubrics, summarise briefs, and suggest interpretations. These are interpretations, not instructions. Your teacher, lecturer, supervisor, or marker is the only authority on what your assignment actually requires. When in doubt, ask them, not us.
            </p>
          </div>

          <div style={s.point}>
            <h3 style={s.pointTitle}>4. Your institution's academic integrity rules apply.</h3>
            <p style={s.pointBody}>
              Most schools and universities require you to disclose AI assistance. Some forbid certain uses entirely. You are responsible for knowing your institution's policy and following it. Using Simplifii-OS does not change those rules.
            </p>
          </div>

          <div style={s.point}>
            <h3 style={s.pointTitle}>5. Your grades are not guaranteed.</h3>
            <p style={s.pointBody}>
              Simplifii-OS cannot promise you a higher mark, a pass, or any specific outcome. Grades depend on your thinking, your effort, your teacher's judgment, and many factors outside our control. We aim to help you do your best work. We do not aim to predict, influence, or guarantee your results.
            </p>
          </div>
        </div>

        <div style={s.checkboxArea}>
          <label style={s.checkLabel}>
            <input
              type="checkbox"
              checked={checkResponsible}
              onChange={(e) => setCheckResponsible(e.target.checked)}
              style={s.checkbox}
            />
            <span>I understand and agree to use Simplifii-OS responsibly.</span>
          </label>
          <label style={s.checkLabel}>
            <input
              type="checkbox"
              checked={checkTerms}
              onChange={(e) => setCheckTerms(e.target.checked)}
              style={s.checkbox}
            />
            <span>
              I have read the{' '}
              <Link to="/terms" style={s.link} target="_blank" rel="noopener noreferrer">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" style={s.link} target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </span>
          </label>
        </div>

        {saveError && (
          <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 13, color: '#ef4444', textAlign: 'center', margin: '0 28px 8px' }}>
            {saveError}
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          style={canContinue ? s.button : s.buttonDisabled}
        >
          {saving ? 'Saving...' : saveError ? 'Try again' : 'Continue to Simplifii-OS'}
        </button>
      </div>
    </div>,
    document.body
  );
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: OVERLAY_BACKDROP,
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    background: SURFACE_CARD,
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS + 2,
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
  },
  heading: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 22,
    margin: 0,
    padding: '28px 28px 0',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 28px 8px',
  },
  intro: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 12px',
  },
  point: {
    marginBottom: 16,
  },
  pointTitle: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 14,
    margin: '0 0 4px',
  },
  pointBody: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    lineHeight: 1.65,
    margin: 0,
  },
  checkboxArea: {
    padding: '12px 28px',
    borderTop: `1px solid ${SURFACE_RAISED}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontFamily: FONT_BODY,
    fontSize: 13,
    lineHeight: 1.5,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 3,
    accentColor: ACCENT_PULSE,
    flexShrink: 0,
  },
  link: {
    textDecoration: 'underline',
  },
  button: {
    margin: '0 28px 24px',
    padding: '12px 0',
    background: ACCENT_PULSE,
    border: 'none',
    borderRadius: BORDER_RADIUS,
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    margin: '0 28px 24px',
    padding: '12px 0',
    background: SURFACE_RAISED,
    border: 'none',
    borderRadius: BORDER_RADIUS,
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'not-allowed',
    opacity: 0.5,
  },
};
