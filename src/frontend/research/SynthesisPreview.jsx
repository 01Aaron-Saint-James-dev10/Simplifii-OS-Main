/**
 * SynthesisPreview.jsx
 *
 * Loads all chapter drafts (via DraftService) in chapter order and renders
 * them as a single scrollable HTML document for story-flow checking.
 *
 * Uses projectId as courseId and chapterId as assessmentTitle (same key pair
 * used by navigateToChapter / DraftService).
 *
 * Props:
 *   onClose - callback
 */

import React, { useState, useEffect } from 'react';
import { useResearchProject } from '../ResearchProjectContext';
import { loadDraft } from '../../services/DraftService';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  SURFACE_BASE,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_BORDER,
  OVERLAY_MEDIUM,
} from '../../theme/tokens';

function extractTextFromTiptap(doc) {
  if (!doc || !doc.content) return '';
  const parts = [];
  const walk = (node) => {
    if (node.type === 'text' && node.text) parts.push(node.text);
    if (node.type === 'paragraph' && node !== doc) parts.push('\n');
    if (node.type === 'heading') parts.push('\n');
    if (node.content) node.content.forEach(walk);
  };
  walk(doc);
  return parts.join('');
}

export default function SynthesisPreview({ onClose }) {
  const { activeProject, chapters } = useResearchProject();
  const [loading, setLoading] = useState(true);
  const [chapterContents, setChapterContents] = useState([]);

  useEffect(() => {
    if (!activeProject || chapters.length === 0) {
      setLoading(false);
      return;
    }

    const sorted = [...chapters].sort((a, b) => {
      const na = a.number || 99;
      const nb = b.number || 99;
      return na - nb;
    });

    (async () => {
      setLoading(true);
      const results = await Promise.all(
        sorted.map(async (ch) => {
          const draft = await loadDraft(activeProject.projectId, ch.chapterId);
          const text = draft?.tiptapDoc
            ? extractTextFromTiptap(draft.tiptapDoc)
            : draft?.content || '';
          return { chapter: ch, text: text.trim(), wordCount: draft?.wordCount || 0 };
        })
      );
      setChapterContents(results);
      setLoading(false);
    })();
  }, [activeProject, chapters]);

  const totalWords = chapterContents.reduce((sum, c) => sum + c.wordCount, 0);
  const chaptersWithContent = chapterContents.filter(c => c.text.length > 0).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Synthesis Preview"
      style={{ position: 'fixed', inset: 0, background: OVERLAY_MEDIUM, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, zIndex: 900 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 760, maxWidth: '96vw', maxHeight: '88vh', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <div>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
              Synthesis Preview
            </p>
            {!loading && (
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '2px 0 0' }}>
                {chaptersWithContent} of {chapterContents.length} chapters have drafts {totalWords > 0 ? `(${totalWords.toLocaleString()} words total)` : ''}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 11, padding: '2px 6px' }}>ESC</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: SURFACE_BASE }}>
          {loading ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, textAlign: 'center', paddingTop: 40 }}>Loading chapter drafts...</p>
          ) : chapterContents.length === 0 ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, textAlign: 'center', paddingTop: 40 }}>No chapters found for this project.</p>
          ) : (
            <div style={{ maxWidth: 660, margin: '0 auto' }}>
              {activeProject && (
                <h1 style={{ fontFamily: FONT_BODY, fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4, lineHeight: 1.3 }}>
                  {activeProject.title}
                </h1>
              )}
              {activeProject?.supervisor && (
                <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, marginBottom: 32, letterSpacing: '0.04em' }}>
                  Supervisor: {activeProject.supervisor}
                </p>
              )}

              {chapterContents.map(({ chapter, text, wordCount }) => (
                <div key={chapter.chapterId} style={{ marginBottom: 40 }}>
                  <div style={{ borderBottom: `1px solid ${SURFACE_RAISED}`, marginBottom: 16, paddingBottom: 8 }}>
                    <h2 style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: ACCENT_PULSE, margin: 0 }}>
                      {chapter.number ? `Chapter ${chapter.number}: ` : ''}{chapter.title.replace(/^Chapter \d+:\s*/i, '')}
                    </h2>
                    <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '3px 0 0', letterSpacing: '0.06em' }}>
                      {wordCount > 0 ? `${wordCount.toLocaleString()} words` : 'No draft yet'}
                      {chapter.status && ` (${chapter.status.replace('_', ' ')})`}
                    </p>
                  </div>
                  {text ? (
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {text}
                    </div>
                  ) : (
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, fontStyle: 'italic' }}>
                      This chapter has not been drafted yet.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
