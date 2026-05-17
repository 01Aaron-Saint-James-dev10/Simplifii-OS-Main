import React, { useState, useEffect } from 'react';
import { buildSessions, buildMilestones, computeSummary, computeAiRatio, generateProvenanceExport } from '../../services/ProvenanceService';
import { jsPDF } from 'jspdf';
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
  const [milestones, setMilestones] = useState([]);
  const [aiRatio, setAiRatio] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, m, r] = await Promise.all([
          buildSessions(courseId, assessmentTitle),
          buildMilestones(courseId, assessmentTitle),
          computeAiRatio(courseId, assessmentTitle),
        ]);
        if (!cancelled) {
          setSessions(s);
          setMilestones(m);
          setAiRatio(r);
          setSummary(computeSummary(s));
        }
      } catch { /* vault may be locked */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [courseId, assessmentTitle]);

  const handlePdfExport = async () => {
    try {
      const exportData = await generateProvenanceExport({
        courseId, courseName, courseCode: courseCode || courseName,
        term: term?.label || null, assessmentTitle,
      });

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const ML = 20;
      const MR = 190;
      const COL_W = 170;
      let y = 20;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(228, 228, 231);
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, 210, 297, 'F');
      doc.text('Authenticity Report', ML, y);
      y += 8;

      // Assessment info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(161, 161, 170);
      doc.text(`${courseCode || courseName || 'Course'} / ${assessmentTitle || 'Assessment'}`, ML, y);
      y += 6;

      const firstDate = sessions[0] ? new Date(sessions[0].start).toLocaleDateString('en-AU') : 'N/A';
      const lastDate = sessions.length > 0 ? new Date(sessions[sessions.length - 1].end).toLocaleDateString('en-AU') : 'N/A';
      doc.text(`Date range: ${firstDate} to ${lastDate}`, ML, y);
      y += 10;

      // AI assistance
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.25);
      doc.line(ML, y, MR, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(52, 211, 153);
      doc.text('AI ASSISTANCE', ML, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(228, 228, 231);
      const pct = aiRatio?.ratio || 0;
      doc.text(`AI assisted ${pct}% of writing process.`, ML, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text(`(${aiRatio?.aiAccepted || 0} scaffolds accepted, ${aiRatio?.textEdits || 0} manual edits)`, ML, y);
      y += 10;

      // Summary stats
      doc.setDrawColor(16, 185, 129);
      doc.line(ML, y, MR, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(52, 211, 153);
      doc.text('WRITING SUMMARY', ML, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(228, 228, 231);
      const sm = summary || {};
      doc.text(`Sessions: ${sm.totalSessions || 0}    Time on task: ${sm.totalMinutes || 0} minutes    Total edits: ${sm.totalEdits || 0}    Words: ${sm.totalWords || 0}`, ML, y);
      y += 10;

      // Phase progression from milestones
      const phaseMilestones = milestones.filter(m => m.displayType === 'phase_move');
      if (phaseMilestones.length > 0) {
        doc.setDrawColor(16, 185, 129);
        doc.line(ML, y, MR, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(52, 211, 153);
        doc.text('PHASE PROGRESSION', ML, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(228, 228, 231);
        for (const pm of phaseMilestones) {
          if (y > 270) { doc.addPage(); doc.setFillColor(9, 9, 11); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
          const ts = new Date(pm.timestamp).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          doc.text(`${ts}  ${pm.label}`, ML, y);
          y += 5;
        }
        y += 5;
      }

      // Key events (AI interactions)
      const aiEvents = milestones.filter(m => m.displayType === 'ai_accepted' || m.displayType === 'ai_query' || m.displayType === 'ai_generated');
      if (aiEvents.length > 0) {
        doc.setDrawColor(16, 185, 129);
        doc.line(ML, y, MR, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(52, 211, 153);
        doc.text('AI INTERACTIONS', ML, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(228, 228, 231);
        for (const ev of aiEvents.slice(0, 30)) {
          if (y > 270) { doc.addPage(); doc.setFillColor(9, 9, 11); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
          const ts = new Date(ev.timestamp).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          doc.text(`${ts}  ${ev.label}`, ML, y);
          y += 5;
        }
        if (aiEvents.length > 30) {
          doc.text(`... and ${aiEvents.length - 30} more interactions`, ML, y);
          y += 5;
        }
        y += 5;
      }

      // Footer statement
      if (y > 260) { doc.addPage(); doc.setFillColor(9, 9, 11); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
      doc.setDrawColor(39, 39, 42);
      doc.line(ML, y, MR, y);
      y += 8;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      const statement = doc.splitTextToSize(
        'This report was generated by Simplifii-OS and documents the student\'s authentic learning process. ' +
        'All data is derived from locally encrypted event logs. No raw content is included.',
        COL_W
      );
      doc.text(statement, ML, y);
      y += statement.length * 4 + 6;

      // Signature
      doc.setFontSize(7);
      doc.text(`SHA-256: ${exportData.signature || 'unavailable'}`, ML, y);

      // Page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(113, 113, 122);
        doc.text(`Page ${p} of ${totalPages}`, MR, 290, { align: 'right' });
      }

      // Download
      const safeTitle = (assessmentTitle || 'assessment').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
      const safeCode = (courseCode || courseName || 'course').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const date = new Date().toISOString().slice(0, 10);
      doc.save(`authenticity_${safeCode}_${safeTitle}_${date}.pdf`);
    } catch { /* non-fatal */ }
  };

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
          <button
            type="button"
            onClick={handlePdfExport}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
              border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
              padding: '10px 14px', cursor: 'pointer', minHeight: 44, outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            Download PDF report
          </button>
        </>
      )}
    </div>
  );
}
