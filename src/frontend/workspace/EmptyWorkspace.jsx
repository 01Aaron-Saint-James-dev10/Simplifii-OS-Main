import React, { useState, useRef } from 'react';
import AddCourseModal from './AddCourseModal';
import AsciiLoader from '../components/AsciiLoader';
import UrlIngestModal from './UrlIngestModal';
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
  const [showUrlModal, setShowUrlModal] = useState(false);
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
          Your space is ready
        </h1>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: TEXT_MUTED, margin: '0 0 32px', lineHeight: 1.6 }}>
          {subhead}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, margin: '0 auto' }}>
          {/* Card 1: Upload */}
          <button type="button" onClick={() => { if (!ingesting) fileRef.current?.click(); }} disabled={ingesting}
            style={{ display: 'flex', gap: 14, padding: '16px 18px', textAlign: 'left', background: 'transparent', border: `1px solid ${ACCENT_BORDER}`, borderRadius: 8, cursor: ingesting ? 'wait' : 'pointer', minHeight: 44, alignItems: 'flex-start' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, display: 'block' }}>
                {ingesting ? 'Reading your files...' : 'I have a document'}
              </span>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                Upload a PDF, photo, or paste text from your assignment, rubric, or course outline
              </span>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".pdf" multiple onChange={handleFilePick} style={{ display: 'none' }} aria-hidden="true" />

          {/* Card 2: Manual */}
          <button type="button" onClick={() => setShowModal(true)}
            style={{ display: 'flex', gap: 14, padding: '16px 18px', textAlign: 'left', background: 'transparent', border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, cursor: 'pointer', minHeight: 44, alignItems: 'flex-start' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <div>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, display: 'block' }}>I will type it in</span>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                Tell me the subject name, what you need to do, and when it is due
              </span>
            </div>
          </button>

          {/* Card 3: Demo */}
          <button type="button" onClick={() => setShowUrlModal(true)}
            style={{ display: 'flex', gap: 14, padding: '16px 18px', textAlign: 'left', background: 'transparent', border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, cursor: 'pointer', minHeight: 44, alignItems: 'flex-start' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            <div>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, display: 'block' }}>Show me how it works</span>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                Load a sample assignment so you can explore the tool before adding your own work
              </span>
            </div>
          </button>

          {ingestStatus && <AsciiLoader status={ingestStatus} />}
        </div>
      </div>

      {showModal && (
        <AddCourseModal
          tier={tier}
          onClose={() => setShowModal(false)}
          onCourseAdded={handleCourseAdded}
        />
      )}

      {showUrlModal && (
        <UrlIngestModal
          onClose={() => setShowUrlModal(false)}
          onCourseReady={(courseId) => {
            setShowUrlModal(false);
            if (courseId) navigateToCanvas(courseId, null);
          }}
        />
      )}
    </div>
  );
}
