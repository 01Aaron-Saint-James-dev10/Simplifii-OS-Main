import React, { useRef } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useProject } from '../ProjectContext';
import { useIngestion } from '../hooks/useIngestion';
import ExportMenu from './ExportMenu';
import stripMarkdown from '../../utils/stripMarkdown';
import {
  SURFACE_BASE, SURFACE_CARD_SOLID,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * CanvasNav
 *
 * Top strip for the writing canvas.
 * Shows: back arrow, course code / assessment title breadcrumb,
 * save status indicator, settings cog placeholder.
 *
 * Props:
 *   courseName        - string
 *   assessmentTitle   - string
 *   saveStatus        - 'saved' | 'saving' | 'unsaved'
 *   lastSavedAgo      - string (e.g. "2s ago")
 */

export default function CanvasNav({ courseName, assessmentTitle, saveStatus, lastSavedAgo, tiptapDoc, htmlContent, courseId, onOpenSettings, onCourseName, onAddDocs, onSubmit, onHelp }) {
  const { navigateHome } = useRouter();
  const { profile, activeCourseId, courses, addCourseWithData, upgradeCourseExtraction, setInstitutionalData } = useProject();
  const { handleUploadedFiles } = useIngestion({
    profile, activeCourseId: courseId || activeCourseId, courses,
    addCourseWithData, upgradeCourseExtraction, setInstitutionalData, onCoursesReady: () => {},
  });
  const fileInputRef = useRef(null);

  // Internal file picker for Add docs (fallback when onAddDocs prop not passed)
  const handleAddDocsClick = () => {
    if (onAddDocs) { onAddDocs(); return; }
    fileInputRef.current?.click();
  };
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleUploadedFiles(files);
    e.target.value = '';
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        padding: '0 20px',
        background: SURFACE_CARD_SOLID, // allow-style
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${SURFACE_RAISED}`,
      }}
      role="navigation"
      aria-label="Canvas navigation"
    >
      {/* Left: back + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={navigateHome}
          aria-label="Back to Home"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            minHeight: 44,
            minWidth: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            borderRadius: BORDER_RADIUS,
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            role={onCourseName ? 'button' : undefined}
            tabIndex={onCourseName ? 0 : undefined}
            onClick={onCourseName}
            onKeyDown={onCourseName ? (e) => { if (e.key === 'Enter') onCourseName(); } : undefined}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT, cursor: onCourseName ? 'pointer' : 'default', textDecoration: onCourseName ? 'underline' : 'none', textUnderlineOffset: 3 }}>
            {stripMarkdown(courseName) || 'Course'}
          </span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>/</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
            {stripMarkdown(assessmentTitle) || 'Assessment'}
          </span>
        </div>
      </div>

      {/* Right: save status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: saveStatus === 'saved' ? ACCENT_PULSE : saveStatus === 'saving' ? '#f59e0b' : TEXT_FAINT,
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: TEXT_FAINT }}>
            {saveStatus === 'saved' ? `Auto-saved ${lastSavedAgo || ''}` : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddDocsClick}
          aria-label="Add documents to this course"
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: TEXT_MUTED, background: 'transparent',
            border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
            padding: '4px 10px', cursor: 'pointer', minHeight: 28,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          Add docs
        </button>
        <ExportMenu
          tiptapDoc={tiptapDoc}
          htmlContent={htmlContent}
          courseCode={courseName}
          assessmentTitle={assessmentTitle}
          courseId={courseId}
        />
        <button
          type="button"
          onClick={onSubmit}
          aria-label="Mark this assessment as submitted and view your Authenticity Report"
          title="Mark as submitted"
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: TEXT_MUTED, background: 'transparent',
            border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
            padding: '4px 10px', cursor: 'pointer', minHeight: 28,
          }}
        >
          Submit
        </button>
        <button
          type="button"
          onClick={onHelp}
          aria-label="Show a guide to using this canvas"
          title="How to use this canvas"
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 12, fontWeight: 700,
            color: TEXT_FAINT, background: 'transparent',
            border: `1px solid ${SURFACE_RAISED}`, borderRadius: '50%',
            width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ?
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 8, minHeight: 44, minWidth: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: 'none', borderRadius: BORDER_RADIUS,
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke={TEXT_MUTED} strokeWidth="1.2" />
            <path d="M13.5 8a5.5 5.5 0 01-.4 2l1.2 1.2-1.5 1.5L11.6 11.5a5.5 5.5 0 01-2 .4v1.6H7.4v-1.6a5.5 5.5 0 01-2-.4L4.2 12.7l-1.5-1.5L3.9 10a5.5 5.5 0 01-.4-2H2V5.8h1.5a5.5 5.5 0 01.4-2L2.7 2.6l1.5-1.5L5.4 2.3a5.5 5.5 0 012-.4V.4h2.2v1.5a5.5 5.5 0 012 .4l1.2-1.2 1.5 1.5-1.2 1.2a5.5 5.5 0 01.4 2H15V8h-1.5z" stroke={TEXT_MUTED} strokeWidth="1.2" />
          </svg>
        </button>
      </div>
      {/* Hidden file input for Add docs (used when onAddDocs prop not provided) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </nav>
  );
}
