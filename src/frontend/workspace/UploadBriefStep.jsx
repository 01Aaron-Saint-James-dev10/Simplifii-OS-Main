import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AsciiLoader from '../components/AsciiLoader';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS_FAINT,
  GLASS_SURFACE, GLASS_BORDER,
  COLOUR_DANGER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = '.pdf,.docx,.txt';

export default function UploadBriefStep({ courseId, assessmentId, onUploaded, onSkip }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (f) => {
    setError('');
    if (f.size > MAX_SIZE) {
      setError('File must be under 10 MB.');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  const handleInput = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const path = `${user.id}/${courseId}/${assessmentId}/${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('briefs')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const url = `briefs/${path}`;
      onUploaded(url);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: TEXT_MUTED, margin: '0 0 16px' }}>
        Want to add an assessment brief now? You can always do this later.
      </p>

      {!file && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop a file here or click to browse"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
            border: `2px dashed ${dragOver ? ACCENT_PULSE : GLASS_BORDER}`,
            borderRadius: 10, background: dragOver ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
            transition: `border-${'color'} 0.2s, background 0.2s`,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEXT_FAINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }} aria-hidden="true">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: 0 }}>
            Drop your brief here, or click to browse
          </p>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, margin: '8px 0 0', letterSpacing: '0.04em' }}>
            PDF, DOCX, or TXT (max 10 MB)
          </p>
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={handleInput} style={{ display: 'none' }} aria-hidden="true" />
        </div>
      )}

      {file && (
        <div style={{ padding: '16px 18px', background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, margin: '0 0 2px', wordBreak: 'break-all' }}>{file.name}</p>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, margin: 0 }}>{formatSize(file.size)}</p>
          </div>
          <button type="button" onClick={() => setFile(null)} aria-label="Remove file" style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontSize: 16, padding: 4, minHeight: 44, minWidth: 44 }}>
            {'\u2717'}
          </button>
        </div>
      )}

      {error && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_DANGER, margin: '12px 0 0' }} role="alert">{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {file && !uploading && (
          <button type="button" onClick={upload} style={{ flex: 1, padding: '12px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer' }}>
            Upload and continue
          </button>
        )}
        {uploading && (
          <div style={{ flex: 1 }}><AsciiLoader status="Uploading your brief..." /></div>
        )}
        <button type="button" onClick={onSkip} style={{ flex: file ? 0 : 1, padding: '12px 24px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_MUTED, cursor: 'pointer' }}>
          {file ? 'Skip' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
