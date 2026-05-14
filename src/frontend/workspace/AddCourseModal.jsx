import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import UploadBriefStep from './UploadBriefStep';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  OVERLAY_BACKDROP, COLOUR_DANGER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4', 'Semester 1', 'Semester 2', 'Year-long', 'Not applicable'];

export default function AddCourseModal({ onClose, onCourseAdded, tier }) {
  const { user } = useAuth();
  const [step, setStep] = useState('details'); // 'details' | 'assessment' | 'done'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [term, setTerm] = useState('');
  const [assessTitle, setAssessTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [assessId, setAssessId] = useState(null);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Course name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const id = uuidv4();
      const { error: insertErr } = await supabase.from('courses').insert({
        id, user_id: user.id, name: name.trim(), code: code.trim() || null,
        tier: tier || null, term: term || null,
      });
      if (insertErr) throw insertErr;
      setCourseId(id);
      setStep('assessment');
    } catch (err) {
      setError(err.message || 'Could not create course.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessTitle.trim()) { finishWithCourse(); return; }
    setSaving(true);
    try {
      const id = uuidv4();
      const { error: insertErr } = await supabase.from('assessments').insert({
        id, course_id: courseId, title: assessTitle.trim(),
        due_date: dueDate || null, status: 'draft',
      });
      if (insertErr) throw insertErr;
      setAssessId(id);
      setStep('upload');
    } catch (err) {
      setError(err.message || 'Could not create assessment.');
    } finally {
      setSaving(false);
    }
  };

  const finishWithCourse = () => {
    onCourseAdded({ id: courseId, name: name.trim(), code: code.trim(), term });
  };

  const handleBriefUploaded = async (url) => {
    if (assessId) {
      await supabase.from('assessments').update({ brief_file_url: url }).eq('id', assessId);
    }
    finishWithCourse();
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: SURFACE_RAISED,
    border: `1px solid ${GLASS_BORDER}`, borderRadius: BORDER_RADIUS,
    color: TEXT_PRIMARY, fontFamily: FONT_BODY, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 16 }}
      onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Add a course"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12, padding: '32px 28px' }}>

        {step === 'details' && (
          <form onSubmit={handleCreateCourse}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: TEXT_PRIMARY, margin: '0 0 4px' }}>Add a course</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 24px' }}>Just a name is enough to get started.</p>

            {error && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_DANGER, margin: '0 0 12px' }} role="alert">{error}</p>}

            <label style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginBottom: 6 }}>
              Course name *
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required autoFocus placeholder="e.g. Anatomy 3121" style={inputStyle} />

            <label style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginTop: 16, marginBottom: 6 }}>
              Course code (optional)
            </label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ANAT3121" style={inputStyle} />

            <label style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginTop: 16, marginBottom: 6 }}>
              Term / semester (optional)
            </label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select...</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: saving ? 'wait' : 'pointer', boxShadow: GLOW_EMERALD }}>
                {saving ? 'Creating...' : 'Create course'}
              </button>
              <button type="button" onClick={onClose} style={{ padding: '12px 20px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_MUTED, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {step === 'assessment' && (
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: TEXT_PRIMARY, margin: '0 0 4px' }}>Add an assessment</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 24px' }}>Optional. You can always add assessments later.</p>

            <label style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginBottom: 6 }}>
              Assessment title
            </label>
            <input type="text" value={assessTitle} onChange={(e) => setAssessTitle(e.target.value)} placeholder="e.g. Literature Review" style={inputStyle} />

            <label style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, display: 'block', marginTop: 16, marginBottom: 6 }}>
              Due date (optional)
            </label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />

            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button type="button" onClick={handleCreateAssessment} disabled={saving} style={{ flex: 1, padding: '12px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer' }}>
                {assessTitle.trim() ? (saving ? 'Adding...' : 'Add assessment') : 'Skip, open course'}
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: TEXT_PRIMARY, margin: '0 0 4px' }}>Upload the brief</h2>
            <UploadBriefStep courseId={courseId} assessmentId={assessId} onUploaded={handleBriefUploaded} onSkip={finishWithCourse} />
          </div>
        )}
      </div>
    </div>
  );
}
