import React, { useState } from 'react';
import AddCourseModal from './AddCourseModal';
import {
  SURFACE_BASE,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
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
  const [showUpload, setShowUpload] = useState(false);
  const subhead = SUBHEADS[tier] || "Let's add your first course.";

  const handleCourseAdded = (course) => {
    setShowModal(false);
    setShowUpload(false);
    onCourseAdded(course);
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
          <button type="button" onClick={() => setShowModal(true)} style={{ padding: '14px 36px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer', boxShadow: GLOW_EMERALD, minHeight: 44 }}>
            Add your first course
          </button>
          <button type="button" onClick={() => { setShowUpload(true); setShowModal(true); }} style={{ padding: '10px 24px', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_MUTED, cursor: 'pointer', minHeight: 44 }}>
            I have a brief to upload
          </button>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, margin: '8px 0 0', letterSpacing: '0.04em' }}>
            Or explore the workspace first
          </p>
        </div>
      </div>

      {showModal && (
        <AddCourseModal
          tier={tier}
          onClose={() => { setShowModal(false); setShowUpload(false); }}
          onCourseAdded={handleCourseAdded}
        />
      )}
    </div>
  );
}
