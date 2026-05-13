import React, { useState, useEffect } from 'react';
import { buildSessions, computeSummary, generateProvenanceExport } from '../../services/ProvenanceService';
import AuthenticityScore from './AuthenticityScore';
import EventTimeline from './EventTimeline';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * ProvenancePanel
 *
 * Canvas panel showing the Work Provenance Record.
 * All data from real HistoryOfThought events.
 *
 * Props:
 *   courseId         - string
 *   assessmentTitle  - string
 *   courseName       - string
 *   courseCode        - string
 *   term             - object | null
 */

export default function ProvenancePanel({ courseId, assessmentTitle, courseName, courseCode, term }) {
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await buildSessions(courseId, assessmentTitle);
        if (!cancelled) {
          setSessions(s);
          setSummary(computeSummary(s));
        }
      } catch { /* vault may be locked */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [courseId, assessmentTitle]);

  const handleExport = async () => {
    try {
      const data = await generateProvenanceExport({
        courseId,
        courseName,
        courseCode: courseCode || courseName,
        term: term?.label || null,
        assessmentTitle,
      });
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeTitle = (assessmentTitle || 'assessment').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
      const safeCode = (courseCode || courseName || 'course').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `provenance_${safeCode}_${safeTitle}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* non-fatal */ }
  };

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED }}>Loading provenance data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
        Work Provenance Record
      </h3>

      {sessions.length === 0 ? (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, margin: 0, lineHeight: 1.5 }}>
          Start writing to build your work record. Every edit session is captured locally so you can prove your thinking evolved over time.
        </p>
      ) : (
        <>
          <AuthenticityScore summary={summary} />
          <EventTimeline sessions={sessions} />

          <button
            type="button"
            onClick={handleExport}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
              border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
              padding: '10px 14px', cursor: 'pointer', minHeight: 44, outline: 'none',
              marginTop: 8,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            Export Work Record (JSON)
          </button>
        </>
      )}
    </div>
  );
}
