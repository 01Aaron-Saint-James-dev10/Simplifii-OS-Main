import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * GradeInput
 *
 * Small inline input for learners to enter their grade after submission.
 * Writes to outcome_signals table. Triggers Phase 7 transition.
 *
 * Props:
 *   courseId - string
 *   assessmentTitle - string
 *   onGradeSubmitted - callback(grade)
 */
export default function GradeInput({ courseId, assessmentTitle, onGradeSubmitted }) {
  const { user } = useAuth();
  const [grade, setGrade] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!grade.trim() || !user?.id) return;
    try {
      await supabase.from('outcome_signals').upsert({
        user_id: user.id,
        task_id: `${courseId}_${assessmentTitle}`,
        self_reported_grade: grade.trim(),
        grade_entered_timestamp: new Date().toISOString(),
        submission_completed: true,
        submission_timestamp: new Date().toISOString(),
      }, { onConflict: 'user_id,task_id' }).catch(() => {});
      setSaved(true);
      onGradeSubmitted?.(grade.trim());
    } catch { /* non-blocking */ }
  };

  if (saved) {
    return (
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE }}>
        Grade saved: {grade}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 6 }}>
      <input
        type="text"
        value={grade}
        onChange={e => setGrade(e.target.value)}
        placeholder="Enter grade"
        maxLength={20}
        style={{
          fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY,
          background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
          borderRadius: BORDER_RADIUS, padding: '4px 8px', width: 80,
          outline: 'none',
        }}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!grade.trim()}
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
          color: grade.trim() ? ACCENT_PULSE : TEXT_FAINT,
          background: grade.trim() ? ACCENT_GLASS : 'transparent',
          border: `1px solid ${grade.trim() ? ACCENT_BORDER : SURFACE_RAISED}`,
          borderRadius: BORDER_RADIUS, padding: '4px 8px', cursor: 'pointer',
        }}
      >
        Save
      </button>
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT }}>
        Optional
      </span>
    </div>
  );
}
