import React, { useRef } from 'react';
import { useProject } from '../ProjectContext';
import { useIngestion } from '../hooks/useIngestion';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  GLASS_BORDER,
  FONT_DISPLAY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * NoBriefPrompt
 *
 * Shown inside CanvasScreen when the active course has no assessment briefs
 * (manual creation without PDF upload). Prompts the user to upload a brief
 * so the canvas has content to work with.
 */
export default function NoBriefPrompt({ courseId }) {
  const fileRef = useRef(null);
  const {
    profile, activeCourseId, courses,
    addCourseWithData, upgradeCourseExtraction, setInstitutionalData,
  } = useProject();

  const { handleUploadedFiles, ingesting, ingestStatus } = useIngestion({
    profile,
    activeCourseId: courseId || activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
    onCoursesReady: () => {},
  });

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleUploadedFiles(files);
    e.target.value = '';
  };


  return (
    <div style={{
      padding: '24px 20px', marginBottom: 16,
      background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`,
      borderRadius: BORDER_RADIUS + 4, textAlign: 'center',
    }}>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
        Add a brief to get started
      </p>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, margin: '0 0 16px', letterSpacing: '0.04em' }}>
        Upload your assignment brief or syllabus PDF so we can extract assessments, rubric criteria, and due dates.
      </p>
      <button
        type="button"
        onClick={() => { if (!ingesting) fileRef.current?.click(); }}
        disabled={ingesting}
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: ACCENT_PULSE, background: 'transparent',
          border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
          padding: '10px 20px', cursor: ingesting ? 'wait' : 'pointer',
          minHeight: 44, outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {ingesting ? 'Reading...' : 'Upload a PDF'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      {ingestStatus && (
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, margin: '8px 0 0' }}>
          {ingestStatus}
        </p>
      )}
    </div>
  );
}
