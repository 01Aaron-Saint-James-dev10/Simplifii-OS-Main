import React, { useState, useRef } from 'react';
import AddCourseModal from './AddCourseModal';
import AsciiLoader from '../components/AsciiLoader';
// UrlIngestModal disabled until Firecrawl API key is configured
// import UrlIngestModal from './UrlIngestModal';
import { useProject } from '../ProjectContext';
import { useIngestion } from '../hooks/useIngestion';
import { useRouter } from '../../contexts/RouterContext';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM,
} from '../../theme/tokens';

const SUBHEADS = {
  primary: "Let's add your first project. Take your time.",
  secondary: "Let's set up your first subject. One thing at a time.",
  tertiary: "Let's add your first course. Quick setup, then you're in.",
  postgrad: "Let's set up your first phase. Methodology first, or chapter first, your call.",
  homeschool: "Let's set up your first learning area. Flexible, your way.",
  educator: "Let's set up your first class or research project.",
  tafe: "Let's add your first unit of competency.",
};

export default function EmptyWorkspace({ tier, onCourseAdded }) {
  const [showModal, setShowModal] = useState(false);
  // const [showUrlModal, setShowUrlModal] = useState(false);
  const fileRef = useRef(null);
  const subhead = SUBHEADS[tier] || "Let's add your first course.";
  const { navigateToCanvas } = useRouter();

  const {
    profile,
    activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
  } = useProject();

  const { handleUploadedFiles, ingesting, ingestStatus } = useIngestion({
    profile,
    activeCourseId,
    courses,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
    onCoursesReady: (courseId) => {
      if (courseId) navigateToCanvas(courseId, null);
    },
  });

  const handleCourseAdded = (course) => {
    setShowModal(false);
    const localId = onCourseAdded(course);
    // Auto-navigate to canvas after manual creation
    if (localId) navigateToCanvas(localId, null);
  };

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    handleUploadedFiles(files);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20, opacity: 0.6 }} aria-hidden="true">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>

        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: TEXT_PRIMARY, margin: '0 0 8px' }}>
          Your workspace is ready
        </h1>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: TEXT_MUTED, margin: '0 0 32px', lineHeight: 1.6 }}>
          {subhead}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {/* Primary CTA: PDF upload */}
          <button
            type="button"
            onClick={() => { if (!ingesting) fileRef.current?.click(); }}
            disabled={ingesting}
            style={{ padding: '14px 36px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: ingesting ? 'wait' : 'pointer', boxShadow: GLOW_EMERALD, minHeight: 44, opacity: ingesting ? 0.7 : 1 }}
          >
            {ingesting ? 'Reading your files...' : 'Upload an assignment brief or syllabus'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFilePick}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          {/* Branded loader during ingestion */}
          {ingestStatus && <AsciiLoader status={ingestStatus} />}

          {/* Secondary CTA: URL ingestion (coming soon) */}
          <button
            type="button"
            disabled
            title="Coming soon"
            aria-label="Paste a course outline link (coming soon)"
            style={{ padding: '10px 24px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_FAINT, cursor: 'not-allowed', minHeight: 44, opacity: 0.5 }}
          >
            Paste a course outline link (coming soon)
          </button>

          {/* Tertiary: manual fallback */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ padding: 0, background: 'none', border: 'none', fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, cursor: 'pointer', letterSpacing: '0.04em', textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            {"Don't have a PDF? Set up manually"}
          </button>
        </div>
      </div>

      {showModal && (
        <AddCourseModal
          tier={tier}
          onClose={() => setShowModal(false)}
          onCourseAdded={handleCourseAdded}
        />
      )}

      {/* UrlIngestModal disabled until Firecrawl API key is configured */}
    </div>
  );
}
