import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { runCheckAgainstRubric } from '../../services/CheckAgainstRubricService';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  COLOUR_DANGER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * CheckPanel
 *
 * Right panel. Pre-submission feedback loop (the moat).
 * Shows rubric checklist, "Compare against rubric" button,
 * word count progress bar with tier-aware guidance.
 *
 * Props:
 *   draftText       - string
 *   wordCount       - number
 *   targetWords     - number
 *   rubricCriteria  - string array
 *   courseId         - string
 *   assessmentTitle - string
 */

function wordStatus(count, target) {
  if (target <= 0) return { pct: 0, status: 'none', label: `${count} words`, colour: TEXT_MUTED }; // allow-style
  const pct = Math.round((count / target) * 100);
  if (pct < 50) return { pct, status: 'under', label: `${count} / ${target} words`, colour: TEXT_MUTED }; // allow-style
  if (pct <= 90) return { pct, status: 'building', label: `${count} / ${target} words`, colour: TEXT_PRIMARY }; // allow-style
  if (pct <= 110) return { pct, status: 'on-target', label: `${count} / ${target} words`, colour: ACCENT_PULSE }; // allow-style
  return { pct, status: 'over', label: `${count} / ${target} words`, colour: COLOUR_WARN }; // allow-style
}

export default function CheckPanel({ draftText, wordCount, targetWords, rubricCriteria, courseId, assessmentTitle }) {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  // Load cached result on mount
  useEffect(() => {
    if (!user || !courseId) return;
    supabase.from('assessment_representations')
      .select('content')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .eq('type', 'rubric_check')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          try { setResult(JSON.parse(data.content)); } catch { /* ignore */ }
        }
      });
  }, [user, courseId]);

  const ws = wordStatus(wordCount, targetWords);

  const handleCheck = async () => {
    setRunning(true);
    try {
      const r = await runCheckAgainstRubric({
        draftText, rubricCriteria, targetWords, courseId, assessmentTitle,
      });
      setResult(r);
      // Persist to Supabase
      if (user && courseId && r) {
        supabase.from('assessment_representations').upsert({
          assessment_id: assessmentTitle || 'default',
          course_id: courseId,
          user_id: user.id,
          type: 'rubric_check',
          content: JSON.stringify(r),
        }, { onConflict: 'assessment_id,course_id,user_id,type' }).catch(() => {});
      }
    } catch { /* non-fatal */ }
    setRunning(false);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
        Pre-submission check
      </h3>

      {/* Word count bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600, color: ws.colour }}>{ws.label}</span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
            {ws.status === 'under' ? 'Keep writing' : ws.status === 'building' ? 'Keep going' : ws.status === 'on-target' ? 'On target' : ws.status === 'over' ? `Trim ${wordCount - targetWords} words` : ''}
          </span>
        </div>
        <div style={{ height: 4, background: SURFACE_RAISED, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(ws.pct, 120)}%`,
            background: ws.colour,
            borderRadius: 2,
            transition: 'width 300ms ease',
          }} />
        </div>
        <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginTop: 2 }}>
          Target: {targetWords} words (acceptable range: {Math.round(targetWords * 0.9)} to {Math.round(targetWords * 1.1)})
        </div>
      </div>

      {/* Compare button */}
      <button
        type="button"
        onClick={handleCheck}
        disabled={running || !draftText}
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
          border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
          padding: '10px 14px', cursor: running ? 'wait' : 'pointer',
          minHeight: 44, outline: 'none', opacity: running ? 0.6 : 1,
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {running ? 'Checking...' : 'Compare against rubric'}
      </button>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE }}>
            Coverage: {result.overallScore}%
          </div>
          {result.criteriaResults.map((cr, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${SURFACE_RAISED}`, paddingBottom: 6 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>
                {cr.criterion}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: cr.found.startsWith('No') ? COLOUR_DANGER : TEXT_MUTED, lineHeight: 1.4 }}>
                {cr.suggestion}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
