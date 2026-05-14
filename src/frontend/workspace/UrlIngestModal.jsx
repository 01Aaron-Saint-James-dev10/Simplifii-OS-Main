import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../ProjectContext';
import { useIngestion } from '../hooks/useIngestion';
import { extractDeepCourseData, mergeExtractionData } from '../../services/BriefService';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE,
  GLASS_BORDER,
  OVERLAY_BACKDROP,
  COLOUR_DANGER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
  GLOW_EMERALD,
} from '../../theme/tokens';

const URL_RE = /^https?:\/\/.+/;

/**
 * UrlIngestModal
 *
 * Accepts a public course outline URL, scrapes it via the server-side
 * Firecrawl proxy, and feeds the text into the existing extraction
 * pipeline. Persists via the same path as PDF ingestion.
 *
 * The actual Firecrawl call happens via a thin API route or MCP tool.
 * For the beta, we call the endpoint directly from the client via fetch.
 * The scrape result is plain text/markdown which extractDeepCourseData
 * can parse the same as PDF text.
 */
export default function UrlIngestModal({ onClose, onCourseReady }) {
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);

  const {
    profile,
    activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
  } = useProject();

  const { handleGroupedIngest, ingesting, ingestStatus } = useIngestion({
    profile,
    activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
    onCoursesReady: (courseId) => {
      if (courseId) onCourseReady(courseId);
    },
  });

  useEffect(() => {
    dialogRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!URL_RE.test(url.trim())) {
      setError('Please enter a valid URL starting with https://');
      return;
    }
    setFetching(true);
    setError('');
    try {
      // Scrape via Firecrawl proxy endpoint.
      // In beta, we use a simple fetch to the /api/scrape edge function.
      // Falls back to a direct CORS fetch for handbook.unsw.edu.au (public).
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Could not extract content from that page.');
      }
      const text = result.content;
      if (!text || text.length < 100) {
        throw new Error('The page did not contain enough text to extract a course outline.');
      }

      // Feed into the same extraction pipeline as PDF ingestion
      const deepData = extractDeepCourseData(text);
      const aggregated = mergeExtractionData(
        { unitCode: deepData.unitCode || 'URL', level: profile.level, theme: 'General', sourceFiles: [url.trim()] },
        { ...deepData, rawText: text }
      );
      aggregated.primaryRawText = text;
      await handleGroupedIngest(aggregated);
    } catch (err) {
      setError(err.message || "We couldn't extract a course outline from that page. Try a different URL, or upload a PDF instead.");
      setFetching(false);
    }
  };

  const busy = fetching || ingesting;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 16 }}
      onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Paste a course outline link"
        ref={dialogRef} tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12, padding: '28px 24px', outline: 'none' }}>

        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
          Paste a course outline link
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: '0 0 20px' }}>
          Public handbook pages work best. Pages behind a login (Moodle, Blackboard) will not work yet.
        </p>

        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://handbook.unsw.edu.au/undergraduate/courses/2026/..."
          style={{
            width: '100%', padding: '10px 12px', background: SURFACE_RAISED,
            border: `1px solid ${GLASS_BORDER}`, borderRadius: BORDER_RADIUS,
            color: TEXT_PRIMARY, fontFamily: FONT_BODY, fontSize: 14,
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        {ingestStatus && (
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: ACCENT_PULSE, margin: '8px 0 0', letterSpacing: '0.04em' }}>
            {ingestStatus}
          </p>
        )}

        {error && (
          <div role="alert" style={{ marginTop: 8 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_DANGER, margin: '0 0 4px' }}>{error}</p>
            <button type="button" onClick={() => { setError(''); setFetching(false); }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: ACCENT_PULSE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Try again
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={handleSubmit} disabled={busy || !url.trim()}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
              background: !busy && url.trim() ? ACCENT_PULSE : SURFACE_RAISED,
              border: 'none', color: !busy && url.trim() ? '#09090b' : TEXT_FAINT,
              cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
            }}>
            {busy ? 'Fetching outline...' : 'Fetch outline'}
          </button>
          <button type="button" onClick={onClose}
            style={{ padding: '12px 20px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_MUTED, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
