import React, { useRef } from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_INFO,
  COLOUR_WARN,
  COLOUR_DANGER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
  OVERLAY_MEDIUM,
  SHADOW_CARD,
  WHITE_TINT_FAINT,
  WHITE_TINT,
} from '../../theme/tokens';

/**
 * DocLibrary
 *
 * Slide-out drawer showing all documents uploaded to the active course.
 * Provides a mid-session "Add a document" entry point.
 *
 * Props:
 *   isOpen          - boolean, controls drawer visibility
 *   onClose         - function
 *   documents       - extractionData.documents[], typed doc objects
 *   sourceFiles     - string[], fallback filename list
 *   onAddFiles      - (FileList) => void, called when user picks files
 *   onViewDocument  - (doc) => void, called when View button clicked
 *   ingesting       - boolean, true while mid-session ingest is running
 *   ingestStatus    - string, status message during ingest
 */

const TYPE_LABELS = {
  brief:          'Brief',
  rubric:         'Rubric',
  course_outline: 'Outline',
  exam_paper:     'Exam',
  reading:        'Reading',
  unknown:        'Other',
};

const TYPE_COLOURS = {
  brief:          ACCENT_PULSE,
  rubric:         COLOUR_INFO,
  course_outline: COLOUR_WARN,
  exam_paper:     COLOUR_DANGER,
  reading:        TEXT_MUTED,
  unknown:        TEXT_FAINT,
};

export default function DocLibrary({
  isOpen,
  onClose,
  documents = [],
  sourceFiles = [],
  onAddFiles,
  onViewDocument,
  ingesting = false,
  ingestStatus = '',
}) {
  const fileInputRef = useRef(null);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles?.(e.target.files);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  // Prefer rich documents[] from extractionData; fall back to sourceFiles name list
  const docList = documents.length > 0
    ? documents
    : sourceFiles.map(name => ({ filename: name, type: 'unknown', nodes: [] }));

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: OVERLAY_MEDIUM,
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Document library"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
          background: SURFACE_CARD,
          borderLeft: `1px solid ${SURFACE_RAISED}`,
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `-8px 0 32px ${SHADOW_CARD}`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          minHeight: 48,
          borderBottom: `1px solid ${SURFACE_RAISED}`,
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: FONT_SYSTEM,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: TEXT_FAINT,
          }}>
            Documents
          </span>
          <button
            type="button"
            aria-label="Close document library"
            onClick={onClose}
            style={{
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: TEXT_MUTED,
              fontFamily: FONT_SYSTEM,
              fontSize: 12,
              borderRadius: BORDER_RADIUS,
              outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.outline = `2px solid ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          >
            ✕
          </button>
        </div>

        {/* Count row */}
        <div style={{
          padding: '8px 16px 4px',
          fontFamily: FONT_SYSTEM,
          fontSize: 9,
          color: TEXT_FAINT,
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}>
          {docList.length} document{docList.length !== 1 ? 's' : ''}
        </div>

        {/* Document list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {docList.length === 0 ? (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: TEXT_FAINT,
              fontFamily: FONT_BODY,
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              No documents uploaded yet.
              <br />
              Use the button below to add your first.
            </div>
          ) : (
            docList.map((doc, i) => (
              <DocCard
                key={doc.filename || i}
                doc={doc}
                onView={onViewDocument}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          borderTop: `1px solid ${SURFACE_RAISED}`,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {ingestStatus ? (
            <p style={{
              margin: 0,
              fontFamily: FONT_SYSTEM,
              fontSize: 9,
              color: ACCENT_PULSE,
              letterSpacing: '0.08em',
            }}>
              {ingestStatus}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAddClick}
            disabled={ingesting}
            aria-label="Add a document to this course"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 44,
              background: ingesting ? SURFACE_RAISED : ACCENT_GLASS,
              border: `1px solid ${ACCENT_BORDER}`,
              borderRadius: BORDER_RADIUS,
              color: ingesting ? TEXT_MUTED : ACCENT_PULSE,
              fontFamily: FONT_SYSTEM,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: ingesting ? 'not-allowed' : 'pointer',
              width: '100%',
              outline: 'none',
              transition: 'background 120ms ease',
            }}
            onFocus={e => { if (!ingesting) e.currentTarget.style.outline = `2px solid ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          >
            {ingesting ? 'Adding...' : '+ Add a document'}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />

          <p style={{
            margin: 0,
            fontFamily: FONT_SYSTEM,
            fontSize: 9,
            color: TEXT_FAINT,
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            PDF or Word, merges into this course without restarting
          </p>
        </div>
      </aside>
    </>
  );
}

function DocCard({ doc, onView }) {
  const typeLabel = TYPE_LABELS[doc.type] || 'Other';
  const typeColour = TYPE_COLOURS[doc.type] || TEXT_FAINT;
  const nodeCount = doc.nodes?.length || 0;
  const hasNodes = nodeCount > 0;

  return (
    <div style={{
      background: SURFACE_RAISED,
      border: `1px solid ${WHITE_TINT}`,
      borderRadius: BORDER_RADIUS,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* Filename */}
      <div style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        color: TEXT_PRIMARY,
        wordBreak: 'break-word',
        lineHeight: 1.4,
      }}>
        {doc.filename}
      </div>

      {/* Type badge + extraction status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: FONT_SYSTEM,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: typeColour,
          background: WHITE_TINT_FAINT,
          border: `1px solid ${WHITE_TINT}`,
          borderRadius: 2,
          padding: '2px 5px',
        }}>
          {typeLabel}
        </span>

        <span style={{
          fontFamily: FONT_SYSTEM,
          fontSize: 8,
          letterSpacing: '0.08em',
          color: hasNodes ? ACCENT_PULSE : TEXT_FAINT,
        }}>
          {hasNodes ? `${nodeCount} node${nodeCount !== 1 ? 's' : ''} extracted` : 'extraction pending'}
        </span>
      </div>

      {/* View button: only shown when parent provides handler */}
      {onView && (
        <button
          type="button"
          aria-label={`View original: ${doc.filename}`}
          onClick={() => onView(doc)}
          style={{
            alignSelf: 'flex-start',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            background: 'transparent',
            border: `1px solid ${SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS,
            color: TEXT_MUTED,
            fontFamily: FONT_SYSTEM,
            fontSize: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 100ms ease', /* allow-style */
          }}
          onFocus={e => { e.currentTarget.style.outline = `2px solid ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = TEXT_MUTED; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}
        >
          View
        </button>
      )}
    </div>
  );
}
