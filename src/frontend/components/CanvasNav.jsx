import React from 'react';
import { useRouter } from '../../contexts/RouterContext';
import ExportMenu from './ExportMenu';
import {
  SURFACE_BASE,
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

export default function CanvasNav({ courseName, assessmentTitle, saveStatus, lastSavedAgo, tiptapDoc, htmlContent, courseId, onOpenSettings }) {
  const { navigateHome } = useRouter();

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
        background: SURFACE_BASE,
        borderBottom: `1px solid ${SURFACE_RAISED}`,
        backdropFilter: 'blur(8px)',
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
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_FAINT }}>
            {courseName || 'Course'}
          </span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>/</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
            {assessmentTitle || 'Assessment'}
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
            {saveStatus === 'saved' && lastSavedAgo ? `Saved ${lastSavedAgo}` : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>
        <ExportMenu
          tiptapDoc={tiptapDoc}
          htmlContent={htmlContent}
          courseCode={courseName}
          assessmentTitle={assessmentTitle}
          courseId={courseId}
        />
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
    </nav>
  );
}
