import React, { useState, useRef, useEffect } from 'react';
import { exportToDocx, exportToTxt, exportToMarkdown } from '../../services/DocxExportService';
import {
  SURFACE_CARD,
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
 * ExportMenu
 *
 * Dropdown menu in CanvasNav for exporting drafts.
 * Supports: DOCX, plain text, markdown.
 *
 * Props:
 *   tiptapDoc       - TipTap JSON doc (from CanvasEditor ref)
 *   htmlContent      - HTML string (fallback)
 *   courseCode        - string
 *   assessmentTitle  - string
 *   courseId          - string
 */

const FORMATS = [
  { id: 'docx', label: 'Export DOCX', description: 'Word document with formatting' },
  { id: 'txt', label: 'Export TXT', description: 'Plain text, no formatting' },
  { id: 'md', label: 'Export Markdown', description: 'Markdown with headings and lists' },
];

export default function ExportMenu({ tiptapDoc, htmlContent, courseCode, assessmentTitle, courseId }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const payload = { tiptapDoc, htmlContent, courseCode, assessmentTitle, courseId };
      if (format === 'docx') await exportToDocx(payload);
      else if (format === 'txt') exportToTxt(payload);
      else if (format === 'md') exportToMarkdown(payload);
    } catch (err) {
      if (typeof console !== 'undefined') console.error('[ExportMenu]', err);
    }
    setExporting(null);
    setOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Export draft"
        aria-expanded={open}
        style={{
          fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: TEXT_MUTED,
          background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '8px 10px', minHeight: 44, minWidth: 44,
          outline: 'none', borderRadius: BORDER_RADIUS,
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        Export
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: SURFACE_CARD,
            border: `1px solid ${SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS,
            padding: 4,
            minWidth: 200,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {FORMATS.map(f => (
            <button
              key={f.id}
              type="button"
              role="menuitem"
              onClick={() => handleExport(f.id)}
              disabled={exporting === f.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: '8px 10px',
                background: 'transparent',
                border: 'none',
                cursor: exporting === f.id ? 'wait' : 'pointer',
                textAlign: 'left',
                outline: 'none',
                borderRadius: BORDER_RADIUS,
                minHeight: 44,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = ACCENT_GLASS; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
                {exporting === f.id ? 'Exporting...' : f.label}
              </span>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
                {f.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
