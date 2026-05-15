import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveDraft, loadDraft } from '../../services/DraftService';
import RichTextEditor from './RichTextEditor';
import VoiceInputButton from './VoiceInputButton';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

const AUTOSAVE_MS = 2000;

/**
 * SectionEditor
 *
 * Manages per-section editing. Each section gets its own TipTap editor
 * with its own auto-save keyed by courseId + assessmentTitle + sectionId.
 * The activeSection prop controls which editor is visible.
 *
 * Exposes compileSections() to merge all section drafts into one document.
 *
 * Props:
 *   sections         - Array<{ type, label }>
 *   activeSection    - string
 *   courseId          - string
 *   assessmentTitle  - string
 *   targetWords      - number
 *   onWordCountChange - callback(totalWordCount)
 *   onSaveStatusChange - callback(status, ago)
 *   onTextChange      - callback(html of active section)
 *   onJsonDocChange   - callback(json)
 *   onCompileReady    - callback(compileFunction) so parent can call it
 *   citationFlags     - array
 */
export default function SectionEditor({
  sections, activeSection, courseId, assessmentTitle, targetWords,
  onWordCountChange, onSaveStatusChange, onTextChange, onJsonDocChange,
  onCompileReady, citationFlags,
}) {
  const [sectionDrafts, setSectionDrafts] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);

  // Load all section drafts on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const drafts = {};
      for (const sec of sections) {
        try {
          const key = `${courseId}_${assessmentTitle}_${sec.type}`;
          const draft = await loadDraft(courseId, key);
          if (draft) drafts[sec.type] = draft.content || '';
        } catch { /* no draft yet */ }
      }
      if (!cancelled) {
        setSectionDrafts(drafts);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, assessmentTitle, sections]);

  // Auto-save on change
  const handleSectionChange = useCallback((sectionType, html) => {
    setSectionDrafts(prev => ({ ...prev, [sectionType]: html }));
    if (sectionType === activeSection) {
      onTextChange?.(html);
      onSaveStatusChange?.('unsaved', '');
    }

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const key = `${courseId}_${assessmentTitle}_${sectionType}`;
      await saveDraft(courseId, key, html, null).catch(() => {});
      lastSavedRef.current = Date.now();
      onSaveStatusChange?.('saved', 'just now');
    }, AUTOSAVE_MS);
  }, [courseId, assessmentTitle, activeSection, onTextChange, onSaveStatusChange]);

  // Word count across all sections
  useEffect(() => {
    const total = Object.values(sectionDrafts).reduce((sum, html) => {
      const text = (html || '').replace(/<[^>]*>/g, ' ').trim();
      return sum + (text ? text.split(/\s+/).length : 0);
    }, 0);
    onWordCountChange?.(total);
  }, [sectionDrafts, onWordCountChange]);

  // Compile function: merge all sections into one HTML document
  const compile = useCallback(() => {
    return sections.map(sec => {
      const content = sectionDrafts[sec.type] || '';
      return `<h2>${sec.label}</h2>\n${content}`;
    }).join('\n\n');
  }, [sections, sectionDrafts]);

  // Expose compile to parent
  useEffect(() => {
    onCompileReady?.(compile);
  }, [compile, onCompileReady]);

  if (!loaded) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
      {/* Section label */}
      <div style={{ padding: '6px 16px', borderBottom: `1px solid ${SURFACE_RAISED}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>
          {sections.find(s => s.type === activeSection)?.label || 'Section'}
        </span>
        <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>
          {(() => {
            const html = sectionDrafts[activeSection] || '';
            const text = html.replace(/<[^>]*>/g, ' ').trim();
            return text ? text.split(/\s+/).length : 0;
          })()} words in this section
        </span>
      </div>

      {/* Editors: one per section, only active one visible */}
      <div style={{ flex: 1, overflow: 'auto', background: SURFACE_BASE }}>
        {sections.map(sec => (
          <div key={sec.type} style={{ display: sec.type === activeSection ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
            <RichTextEditor
              initialContent={sectionDrafts[sec.type] || ''}
              onTextChange={(html) => handleSectionChange(sec.type, html)}
              onWordCountChange={() => {}}
              onJsonChange={sec.type === activeSection ? onJsonDocChange : undefined}
              citationFlags={sec.type === activeSection ? citationFlags : []}
            />
          </div>
        ))}
      </div>

      {/* Slash command hints + voice input */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px', zIndex: 30 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ cmd: '/joke', label: 'Joke' }, { cmd: 'Cmd+Shift+V', label: 'Voice' }].map(h => (
            <span key={h.cmd} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: TEXT_FAINT, padding: '2px 6px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: 3 }}>
              {h.cmd} <span style={{ opacity: 0.6 }}>{h.label}</span>
            </span>
          ))}
        </div>
        <VoiceInputButton />
      </div>
    </div>
  );
}
