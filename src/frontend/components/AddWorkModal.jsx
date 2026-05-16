import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  OVERLAY_BACKDROP,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const WORK_TYPES = [
  { id: 'homework', label: 'Homework or classwork', sub: 'A task set by a teacher or lecturer', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 'assignment', label: 'Assignment or essay', sub: 'A written piece to research and submit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'exam', label: 'Exam preparation', sub: 'HSC, VCE, ATAR, TAFE or university exams', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'research', label: 'Research or thesis', sub: 'Literature review, research project or postgraduate paper', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { id: 'course', label: 'Subject or term setup', sub: 'Upload your syllabus or unit guide so I can map your whole term', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'other', label: 'Something else', sub: 'Tell me what you are working on', icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z' },
];

export default function AddWorkModal({ onUpload, onManual, onDemo, onClose }) {
  const [step, setStep] = useState('type'); // 'type' | 'how'
  const [workType, setWorkType] = useState(null);

  const handleTypeSelect = (id) => {
    setWorkType(id);
    sessionStorage.setItem('simplifii_work_type', id);
    setStep('how');
  };

  const cardStyle = {
    display: 'flex', gap: 12, padding: '14px 16px', textAlign: 'left',
    background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
    borderRadius: BORDER_RADIUS + 4, cursor: 'pointer', minHeight: 44,
    alignItems: 'flex-start', outline: 'none', width: '100%',
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OVERLAY_BACKDROP, padding: 24, overflowY: 'auto' }}
      onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add work"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 440, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 12, padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {step === 'how' && (
            <button type="button" onClick={() => setStep('type')} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 11 }}>
              &larr; Back
            </button>
          )}
          <h2 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, flex: 1, textAlign: step === 'how' ? 'center' : 'left' }}>
            {step === 'type' ? 'What are you working on?' : 'How would you like to add it?'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontSize: 18, padding: 4 }}>
            &times;
          </button>
        </div>

        {/* Step 1: Work type selection */}
        {step === 'type' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {WORK_TYPES.map(w => (
              <button key={w.id} type="button" onClick={() => handleTypeSelect(w.id)} style={cardStyle}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; e.currentTarget.style.background = ACCENT_GLASS; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; e.currentTarget.style.background = 'transparent'; }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d={w.icon} />
                </svg>
                <div>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, display: 'block' }}>{w.label}</span>
                  <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, display: 'block', marginTop: 2, lineHeight: 1.4 }}>{w.sub}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: How to add it */}
        {step === 'how' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" onClick={() => { onClose(); onUpload(); }} style={cardStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; e.currentTarget.style.background = ACCENT_GLASS; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; e.currentTarget.style.background = 'transparent'; }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <div>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, display: 'block' }}>I have a document</span>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, display: 'block', marginTop: 2 }}>Upload a PDF, photo, or paste text</span>
              </div>
            </button>

            <button type="button" onClick={() => { onClose(); onManual(); }} style={cardStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; e.currentTarget.style.background = ACCENT_GLASS; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; e.currentTarget.style.background = 'transparent'; }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <div>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, display: 'block' }}>I will type it in</span>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, display: 'block', marginTop: 2 }}>Tell me what you need to do and when it is due</span>
              </div>
            </button>

            <button type="button" onClick={() => { onClose(); onDemo(); }} style={cardStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; e.currentTarget.style.background = ACCENT_GLASS; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; e.currentTarget.style.background = 'transparent'; }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              <div>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, display: 'block' }}>Show me how it works</span>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, display: 'block', marginTop: 2 }}>Load a sample assignment to explore first</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
