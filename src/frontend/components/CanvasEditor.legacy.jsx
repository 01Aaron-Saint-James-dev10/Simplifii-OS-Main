import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveDraft, loadDraft } from '../../services/DraftService';
import { appendEvent } from '../../core/HistoryOfThought';
import { useSettings } from '../SettingsContext';
import {
  SURFACE_BASE,
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_BODY,
} from '../../theme/tokens';

/**
 * CanvasEditor
 *
 * The writing surface. Textarea with autosave to IndexedDB every 2 seconds
 * (debounced). Each save logs a text_edit event to HistoryOfThought.
 *
 * Reads font/line-height preferences from SettingsContext:
 *   - isBionicActive: renders first 2-3 letters of each word bold
 *   - fontScale: 'normal' | 'large' | 'xl'
 *   - lineSpacing: 'normal' | 'relaxed' | 'loose'
 *
 * Props:
 *   courseId          - string
 *   assessmentTitle   - string
 *   targetWords       - number (from assessment brief)
 *   onWordCountChange - callback(count)
 *   onSaveStatusChange - callback('saved'|'saving'|'unsaved', lastSavedAgo)
 */

const AUTOSAVE_MS = 2000;

const LINE_HEIGHT_MAP = {
  normal: '1.8',   // default for dyslexia research
  relaxed: '2.0',
  loose: '2.4',
};

const FONT_SIZE_MAP = {
  normal: 16,
  large: 18,
  xl: 22,
};

export default function CanvasEditor({ courseId, assessmentTitle, targetWords, onWordCountChange, onSaveStatusChange, onTextChange }) {
  const { isBionicActive, fontScale, lineSpacing } = useSettings();
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const agoTimerRef = useRef(null);

  // Load draft on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const draft = await loadDraft(courseId, assessmentTitle);
        if (!cancelled && draft) {
          setContent(draft.content || '');
          onTextChange?.(draft.content || '');
          lastSavedRef.current = draft.lastSaved;
        }
      } catch { /* first load, no draft */ }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [courseId, assessmentTitle]);

  // Focus editor on load
  useEffect(() => {
    if (loaded && textareaRef.current) textareaRef.current.focus();
  }, [loaded]);

  // Word count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  useEffect(() => {
    onWordCountChange?.(wordCount);
  }, [wordCount, onWordCountChange]);

  // "Saved Xs ago" ticker
  useEffect(() => {
    const tick = () => {
      if (!lastSavedRef.current) return;
      const secs = Math.floor((Date.now() - lastSavedRef.current) / 1000);
      if (secs < 60) onSaveStatusChange?.('saved', `${secs}s ago`);
      else onSaveStatusChange?.('saved', `${Math.floor(secs / 60)}m ago`);
    };
    agoTimerRef.current = setInterval(tick, 1000);
    return () => clearInterval(agoTimerRef.current);
  }, [onSaveStatusChange]);

  // Autosave (debounced 2s)
  const doSave = useCallback(async (text) => {
    onSaveStatusChange?.('saving', '');
    try {
      await saveDraft(courseId, assessmentTitle, text);
      lastSavedRef.current = Date.now();
      onSaveStatusChange?.('saved', '0s ago');
      // Log to HistoryOfThought for authenticity moat
      try {
        await appendEvent({
          event_type: 'text_edit',
          payload: {
            courseId,
            assessmentTitle,
            wordCount: text.trim().split(/\s+/).filter(Boolean).length,
            timestamp: Date.now(),
          },
        });
      } catch { /* vault may be locked; non-fatal */ }
    } catch {
      onSaveStatusChange?.('unsaved', '');
    }
  }, [courseId, assessmentTitle, onSaveStatusChange]);

  const handleChange = (e) => {
    const text = e.target.value;
    setContent(text);
    onTextChange?.(text);
    onSaveStatusChange?.('unsaved', '');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(text), AUTOSAVE_MS);
  };

  // Final save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      // Fire synchronous save attempt
      const text = textareaRef.current?.value;
      if (text !== undefined && text !== null) {
        saveDraft(courseId, assessmentTitle, text).catch(() => {});
      }
    };
  }, [courseId, assessmentTitle]);

  const fontSize = FONT_SIZE_MAP[fontScale] || 16;
  const lineHeight = LINE_HEIGHT_MAP[lineSpacing] || '1.8';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="Start writing..."
        aria-label={`Draft editor for ${assessmentTitle || 'assessment'}`}
        style={{
          flex: 1,
          width: '100%',
          background: SURFACE_BASE,
          color: TEXT_PRIMARY,
          fontFamily: FONT_BODY,
          fontSize,
          lineHeight,
          padding: '32px 48px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          caretColor: TEXT_PRIMARY, // allow-style
          letterSpacing: '0.01em',
        }}
        spellCheck
      />
    </div>
  );
}
