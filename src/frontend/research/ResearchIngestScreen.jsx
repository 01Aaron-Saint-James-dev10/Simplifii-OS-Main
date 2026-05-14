/**
 * ResearchIngestScreen.jsx
 *
 * File upload and parsing screen for research data sources.
 * Supports:
 *   - CSV / XLSX: National Audit data (papaparse)
 *   - DOCX: Interview Transcripts (mammoth)
 *   - VTT: Interview Transcripts (plain text, timestamp-stripped)
 *
 * After parsing, runs a Methodological Integrity Audit:
 *   - N-size extraction
 *   - Sample group labels
 *   - Research gap phrase detection
 *
 * Props:
 *   onClose    - callback
 *   strandId   - string, target strand (optional)
 *   projectId  - string
 */

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  ACCENT_BORDER_STRONG,
  ACCENT_GLASS_STRONG,
  OVERLAY_MEDIUM,
  COLOUR_WARN,
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
  COLOUR_DANGER,
  COLOUR_DANGER_GLASS,
  COLOUR_DANGER_BORDER,
} from '../../theme/tokens';

// ─── Methodological Integrity Audit ──────────────────────────────────────────

const GAP_PHRASES = [
  /limited research/gi, /gap in the literature/gi, /no studies have/gi,
  /little is known/gi, /under-researched/gi, /underexplored/gi,
  /future research/gi, /warrants further/gi, /calls for further/gi,
  /needs further investigation/gi, /remains unclear/gi,
];

function runIntegrityAudit(text) {
  const nMatches = [];
  const nRe = /\bn\s*[=:]\s*(\d+)/gi;
  let m;
  while ((m = nRe.exec(text)) !== null) {
    nMatches.push({ raw: m[0], value: parseInt(m[1], 10) });
  }

  const sampleGroupRe = /\b(participants?|respondents?|interviewees?|institutions?|universities|schools|educators?|students?)\b/gi;
  const groupMatches = [];
  const seen = new Set();
  while ((m = sampleGroupRe.exec(text)) !== null) {
    const w = m[1].toLowerCase();
    if (!seen.has(w)) { seen.add(w); groupMatches.push(m[1]); }
  }

  const gaps = [];
  for (const re of GAP_PHRASES) {
    re.lastIndex = 0;
    const gm = re.exec(text);
    if (gm) gaps.push(gm[0]);
  }

  const nValues = nMatches.map(n => n.value);
  const nMin = nValues.length > 0 ? Math.min(...nValues) : null;
  const nMax = nValues.length > 0 ? Math.max(...nValues) : null;
  const smallSampleWarning = nMin !== null && nMin < 10;

  return {
    nSizes: nMatches,
    nMin,
    nMax,
    sampleGroups: groupMatches.slice(0, 10),
    researchGaps: gaps,
    smallSampleWarning,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    charCount: text.length,
  };
}

// ─── VTT timestamp stripper ───────────────────────────────────────────────────

function parseVTT(raw) {
  const lines = raw.split('\n');
  const textLines = lines.filter(l => {
    const t = l.trim();
    if (!t || t === 'WEBVTT' || /^\d+$/.test(t)) return false;
    if (/^\d{2}:\d{2}/.test(t)) return false;
    return true;
  });
  return textLines.join('\n');
}

// ─── XLSX detection (magic bytes) ────────────────────────────────────────────

function isXLSXBuffer(arrayBuffer) {
  const arr = new Uint8Array(arrayBuffer.slice(0, 4));
  return arr[0] === 0x50 && arr[1] === 0x4B && arr[2] === 0x03 && arr[3] === 0x04;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResearchIngestScreen({ onClose, projectId }) {
  const fileRef   = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [parsing,  setParsing]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  async function processFile(file) {
    setError(null);
    setResult(null);
    setParsing(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let text = '';
      let rows = null;
      let fileType = '';

      if (ext === 'vtt') {
        fileType = 'vtt';
        const raw = await file.text();
        text = parseVTT(raw);

      } else if (ext === 'docx') {
        fileType = 'docx';
        const buf = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: buf });
        text = res.value || '';

      } else if (ext === 'csv') {
        fileType = 'csv';
        const raw = await file.text();
        const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
        rows = parsed.data;
        text = rows.map(r => Object.values(r).join(' ')).join('\n');

      } else if (ext === 'xlsx') {
        fileType = 'xlsx';
        const buf = await file.arrayBuffer();
        if (!isXLSXBuffer(buf)) throw new Error('File does not appear to be a valid XLSX file.');
        const raw = await file.text().catch(() => '');
        const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
        rows = parsed.data;
        text = rows.map(r => Object.values(r).join(' ')).join('\n');

      } else {
        throw new Error(`Unsupported file type: .${ext}. Please use CSV, XLSX, DOCX, or VTT.`);
      }

      const audit = runIntegrityAudit(text);
      setResult({ fileType, fileName: file.name, text, rows, audit });
    } catch (err) {
      setError(err.message || 'An error occurred while parsing the file.');
    } finally {
      setParsing(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ingest Research Data"
      style={{ position: 'fixed', inset: 0, background: OVERLAY_MEDIUM, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 50, zIndex: 900 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 680, maxWidth: '95vw', maxHeight: '86vh', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>
            Ingest Research Data
          </p>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 11, padding: '2px 6px' }}>ESC</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload a CSV, XLSX, DOCX or VTT file"
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            style={{ border: `2px dashed ${dragging ? ACCENT_PULSE : ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, background: dragging ? ACCENT_GLASS : 'transparent', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.docx,.vtt" style={{ display: 'none' }} onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: '0 0 6px' }}>
              {parsing ? 'Parsing file...' : 'Drop a file here or click to browse'}
            </p>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0, letterSpacing: '0.06em' }}>
              CSV / XLSX for National Audit data (papaparse) | DOCX for Interview Transcripts (mammoth) | VTT for recordings
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: COLOUR_DANGER_GLASS, border: `1px solid ${COLOUR_DANGER_BORDER}`, borderRadius: BORDER_RADIUS }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_DANGER, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <>
              {/* Audit summary */}
              <div style={{ padding: '14px 16px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS * 2 }}>
                <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 10px' }}>
                  Methodological Integrity Audit
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <AuditStat label="Words" value={result.audit.wordCount.toLocaleString()} />
                  <AuditStat label="File type" value={result.fileType.toUpperCase()} />
                  {result.rows && <AuditStat label="Rows" value={result.rows.length.toLocaleString()} />}
                  {result.audit.nSizes.length > 0 && (
                    <AuditStat
                      label="N-sizes detected"
                      value={result.audit.nMin === result.audit.nMax
                        ? `n = ${result.audit.nMin}`
                        : `n = ${result.audit.nMin} - ${result.audit.nMax}`}
                      warn={result.audit.smallSampleWarning}
                    />
                  )}
                </div>
                {result.audit.sampleGroups.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '0 0 4px', letterSpacing: '0.06em' }}>SAMPLE GROUPS DETECTED</p>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0 }}>
                      {result.audit.sampleGroups.join(', ')}
                    </p>
                  </div>
                )}
                {result.audit.researchGaps.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: '0 0 4px', letterSpacing: '0.06em' }}>RESEARCH GAPS FLAGGED</p>
                    {result.audit.researchGaps.map((g, i) => (
                      <span key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLOUR_WARN, background: COLOUR_WARN_GLASS, border: `1px solid ${COLOUR_WARN_BORDER}`, borderRadius: BORDER_RADIUS, padding: '2px 7px', marginRight: 4, display: 'inline-block', marginBottom: 3 }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {result.audit.smallSampleWarning && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: COLOUR_WARN_GLASS, border: `1px solid ${COLOUR_WARN_BORDER}`, borderRadius: BORDER_RADIUS }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>
                      Small sample detected (n &lt; 10). Document your sampling rationale in the Methodology Log before proceeding.
                    </p>
                  </div>
                )}
              </div>

              {/* Text preview */}
              <div>
                <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 6px' }}>
                  Content Preview
                </p>
                <pre style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, background: SURFACE_RAISED, borderRadius: BORDER_RADIUS, padding: '10px 14px', overflowX: 'hidden', overflowY: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>
                  {result.text.slice(0, 2000)}{result.text.length > 2000 ? '\n\n[truncated...]' : ''}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditStat({ label, value, warn }) {
  return (
    <div>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 2px' }}>
        {label}
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: warn ? COLOUR_WARN : TEXT_PRIMARY, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}
