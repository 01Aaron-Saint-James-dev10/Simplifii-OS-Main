import React, { useRef, useEffect } from 'react';
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
 * Spec: PRODUCT_SPEC.md Section 8 (top nav: Logo, Add subject, Settings)
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

  // Listen for trigger from Add Work modal
  useEffect(() => {
    const handler = () => { if (!ingesting) inputRef.current?.click(); };
    window.addEventListener('simplifii:trigger-add-work', handler);
    return () => window.removeEventListener('simplifii:trigger-add-work', handler);
  }, [ingesting]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    handleUploadedFiles(files);
    e.target.value = '';
  };

  // No visible button - only the hidden file input + event listener
  return (
    <>
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
