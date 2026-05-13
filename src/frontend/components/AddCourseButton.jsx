import React, { useRef } from 'react';
import { useProject } from '../ProjectContext';
import { useIngestion } from '../../frontend/hooks/useIngestion';
import {
  TEXT_PRIMARY,
  TEXT_MUTED,
  ACCENT_PULSE,
  ACCENT_BORDER,
  FONT_SYSTEM,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * AddCourseButton
 *
 * Top nav button that opens a file picker for syllabus PDFs.
 * Delegates to the existing useIngestion hook for the full
 * PDF-to-course pipeline.
 *
 * Spec: PRODUCT_SPEC.md Section 8 (top nav: Logo, Add course, Settings)
 */

export default function AddCourseButton() {
  const {
    profile,
    activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    institutionalData,
    setInstitutionalData,
  } = useProject();

  const { handleUploadedFiles, ingesting } = useIngestion({
    profile,
    activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
    onCoursesReady: () => {
      // HomeScreen re-renders automatically via ProjectContext
    },
  });

  const inputRef = useRef(null);

  const handleClick = () => {
    if (!ingesting) inputRef.current?.click();
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    handleUploadedFiles(files);
    e.target.value = '';
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={ingesting}
        aria-label={ingesting ? 'Uploading course' : 'Add course'}
        style={{
          fontFamily: FONT_SYSTEM,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: ingesting ? TEXT_MUTED : ACCENT_PULSE,
          background: 'transparent',
          border: `1px solid ${ingesting ? TEXT_MUTED : ACCENT_BORDER}`,
          borderRadius: BORDER_RADIUS,
          padding: '6px 14px',
          cursor: ingesting ? 'wait' : 'pointer',
          minHeight: 44,
          minWidth: 44,
          outline: 'none',
          transition: 'all 150ms ease',
          opacity: ingesting ? 0.6 : 1,
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {ingesting ? 'Uploading...' : '+ Add course'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </>
  );
}
