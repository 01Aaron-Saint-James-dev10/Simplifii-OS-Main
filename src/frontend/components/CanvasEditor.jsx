import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveDraft, loadDraft } from '../../services/DraftService';
import { appendEvent } from '../../core/HistoryOfThought';
import RichTextEditor from './RichTextEditor';
import VoiceInputButton from './VoiceInputButton';
import {
  SURFACE_BASE,
} from '../../theme/tokens';

/**
 * CanvasEditor
 *
 * Wraps RichTextEditor with autosave (2s debounced) to IndexedDB
 * and HistoryOfThought text_edit event logging. Same external API
 * as CanvasEditor.legacy.jsx.
 *
 * Props:
 *   courseId          - string
 *   assessmentTitle   - string
 *   targetWords       - number
 *   onWordCountChange - callback(count)
 *   onSaveStatusChange - callback('saved'|'saving'|'unsaved', lastSavedAgo)
 *   onTextChange       - callback(html string)
 */

const AUTOSAVE_MS = 2000;

export default function CanvasEditor({ courseId, assessmentTitle, targetWords, onWordCountChange, onSaveStatusChange, onTextChange, onJsonDocChange, citationFlags }) {
  const [initialContent, setInitialContent] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const agoTimerRef = useRef(null);
  const latestJsonRef = useRef(null);
  const latestHtmlRef = useRef('');

  // Load draft on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const draft = await loadDraft(courseId, assessmentTitle);
        if (!cancelled && draft) {
          setInitialContent(draft.tiptapDoc || draft.content || '');
          onTextChange?.(draft.content || '');
          lastSavedRef.current = draft.lastSaved;
        }
      } catch { /* first load, no draft */ }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [courseId, assessmentTitle]);

  // "Saved Xs ago" ticker (copied verbatim from legacy)
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

  // Autosave (debounced 2s, copied verbatim from legacy)
  const doSave = useCallback(async (html, jsonDoc) => {
    onSaveStatusChange?.('saving', '');
    try {
      await saveDraft(courseId, assessmentTitle, html, jsonDoc);
      lastSavedRef.current = Date.now();
      onSaveStatusChange?.('saved', '0s ago');
      try {
        await appendEvent({
          event_type: 'text_edit',
          payload: {
            courseId,
            assessmentTitle,
            wordCount: html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
            timestamp: Date.now(),
          },
        });
      } catch { /* vault may be locked; non-fatal */ }
    } catch {
      onSaveStatusChange?.('unsaved', '');
    }
  }, [courseId, assessmentTitle, onSaveStatusChange]);

  const handleTextChange = useCallback((html) => {
    latestHtmlRef.current = html;
    onTextChange?.(html);
    onSaveStatusChange?.('unsaved', '');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(latestHtmlRef.current, latestJsonRef.current), AUTOSAVE_MS);
  }, [onTextChange, onSaveStatusChange, doSave]);

  const handleJsonChange = useCallback((json) => {
    latestJsonRef.current = json;
    onJsonDocChange?.(json);
  }, [onJsonDocChange]);

  // Final save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      if (latestHtmlRef.current) {
        saveDraft(courseId, assessmentTitle, latestHtmlRef.current, latestJsonRef.current).catch(() => {});
      }
    };
  }, [courseId, assessmentTitle]);

  if (!loaded) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: SURFACE_BASE, overflow: 'auto', position: 'relative' }}>
      <RichTextEditor
        initialContent={initialContent}
        onTextChange={handleTextChange}
        onWordCountChange={onWordCountChange}
        onJsonChange={handleJsonChange}
        citationFlags={citationFlags}
      />
      <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 30 }}>
        <VoiceInputButton />
      </div>
    </div>
  );
}
