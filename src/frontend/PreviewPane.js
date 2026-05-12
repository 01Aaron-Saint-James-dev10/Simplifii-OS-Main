import React, { useEffect, useMemo, useRef } from 'react';
import { useProject } from './ProjectContext';
import { OVERLAY_MEDIUM, COLOUR_WARN_GLASS_STRONG, ACCENT_GLASS_STRONG } from '../theme/tokens';

/**
 * PreviewPane
 *
 * View-only A4 render of the Logic Blocks. The Logic Blocks (the
 * cockpit) own the document state; this pane is a downstream
 * projection. Edits NEVER write back here per CLAUDE.md
 * "Single source of truth" rule.
 *
 * Visual contract:
 *   - Cream background (#FDFDFD) for scotopic comfort.
 *   - Left-aligned text only (no justification: dyslexia-safe).
 *   - 1.5 line spacing on body text.
 *   - A4 page width with print-style padding.
 *   - "Sovereign Verified" badge in the corner reads activeCourse
 *     extractionData.shadow flag: if shadow, badge says DRAFT;
 *     otherwise VERIFIED.
 *
 * Pillar sync:
 *   When the parent passes activePillarId, the pane scrolls that
 *   section into view. Lets the Scaffolder / sprint switcher steer
 *   what part of the doc is on screen without losing the rest.
 *
 * No new dependency: uses styled divs, not react-pdf or docx, per
 * the "@media print CSS" path Aaron's spec called out as the lighter
 * approach.
 */

const A4_WIDTH = 794; // 210 mm at 96 DPI
const PAGE_PADDING = 56;

export default function PreviewPane({ activePillarId, onClose }) {
  const { project, activeCourse } = useProject();
  const blocks = project?.blocks || [];
  const isDraft = !!activeCourse?.extractionData?.shadow;
  const courseName = activeCourse?.name || 'Untitled';

  const wordCount = useMemo(() => {
    return blocks.reduce((n, b) => n + ((b.content || '').trim().split(/\s+/).filter(Boolean).length), 0);
  }, [blocks]);

  const sectionRefs = useRef({});

  useEffect(() => {
    if (!activePillarId) return;
    const node = sectionRefs.current[activePillarId];
    if (node?.scrollIntoView) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activePillarId]);

  return (
    <div
      role="region"
      aria-label="Document preview"
      style={{
        height: '100%',
        background: '#1a1a1c',
        overflowY: 'auto',
        padding: '24px 16px',
        position: 'relative'
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            background: '#27272a',
            color: '#d4d4d8',
            border: 'none',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Close preview
        </button>
      )}

      <article
        style={{
          margin: '0 auto',
          width: A4_WIDTH,
          maxWidth: '100%',
          minHeight: 1123, // A4 height at 96 DPI
          background: '#FDFDFD',
          color: '#1f2937',
          padding: PAGE_PADDING,
          boxShadow: `0 12px 40px ${OVERLAY_MEDIUM}`,
          fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: 13.5,
          lineHeight: 1.5,
          textAlign: 'left',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: `1px solid ${isDraft ? '#f59e0b' : '#10b981'}`,
            color: isDraft ? '#92400e' : '#065f46',
            background: isDraft ? COLOUR_WARN_GLASS_STRONG : ACCENT_GLASS_STRONG
          }}
          title={isDraft ? 'Draft data; refining via Ollama in the background.' : 'Verified against the canonical reconciled briefs.'}
        >
          {isDraft ? 'Draft' : 'Sovereign Verified'}
        </div>

        <header style={{ marginBottom: 28, paddingBottom: 14, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>
            {courseName}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111827', lineHeight: 1.25 }}>
            Working draft
          </h1>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
            {wordCount.toLocaleString()} words  ·  {blocks.length} section{blocks.length === 1 ? '' : 's'}
          </div>
        </header>

        {blocks.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            Nothing to preview yet. Drop a brief or start typing in the cockpit; this pane reflects whatever is in your Logic Blocks.
          </div>
        )}

        {blocks.map((b) => {
          const content = (b.content || '').trim();
          return (
            <section
              key={b.id}
              ref={(el) => { if (el) sectionRefs.current[b.id] = el; }}
              data-pillar-id={b.id}
              style={{ marginBottom: 28, scrollMarginTop: 12 }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 8px 0', color: '#111827', letterSpacing: '0.01em' }}>
                {b.title || 'Untitled section'}
              </h2>
              {content ? (
                <div style={{ whiteSpace: 'pre-wrap', color: '#1f2937' }}>
                  {content}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12.5 }}>
                  Empty. Type into this section in the cockpit; the preview will catch up.
                </div>
              )}
            </section>
          );
        })}

        <footer style={{ marginTop: 36, paddingTop: 14, borderTop: '1px solid #e5e7eb', fontSize: 10, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>Generated from Simplifii Logic Blocks</span>
          <span>{new Date().toLocaleDateString('en-AU')}</span>
        </footer>
      </article>
    </div>
  );
}
