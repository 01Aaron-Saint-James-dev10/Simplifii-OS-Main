import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../SettingsContext';
import BreathBubble from './BreathBubble';
import { getProfileCards } from '../../services/AccessibilityProfileService';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
  OVERLAY_BACKDROP,
} from '../../theme/tokens';

/**
 * CanvasSettingsOverlay
 *
 * In-canvas settings panel. Surfaces accessibility toggles that
 * exist in SettingsContext and wires them to visually apply.
 *
 * Props:
 *   onClose - callback
 */

function Toggle({ label, description, value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
        cursor: 'pointer', outline: 'none', minHeight: 44, textAlign: 'left',
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{label}</div>
        {description && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>{description}</div>}
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 10, padding: 2,
        background: value ? ACCENT_PULSE : SURFACE_RAISED,
        transition: 'background 150ms ease',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transform: value ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 150ms ease',
        }} />
      </div>
    </button>
  );
}

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
              color: value === opt.value ? ACCENT_PULSE : TEXT_MUTED, // allow-style
              background: value === opt.value ? ACCENT_GLASS : 'transparent',
              border: `1px solid ${value === opt.value ? ACCENT_BORDER : SURFACE_RAISED}`,
              borderRadius: BORDER_RADIUS, padding: '6px 12px', cursor: 'pointer',
              outline: 'none', minHeight: 36,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CanvasSettingsOverlay({ onClose }) {
  const {
    isBionicActive, setIsBionicActive,
    fontScale, setFontScale,
    lineSpacing, setLineSpacing,
    reducedMotion, setReducedMotion,
    isZenMode, setIsZenMode,
    theme, setTheme,
    autismFirstEnabled, setAutismFirstEnabled,
    sensoryLevel, setSensoryLevel,
    predictabilityAnnouncements, setPredictabilityAnnouncements,
    isLiteralMode, setIsLiteralMode,
    specialInterests, setSpecialInterests,
    ambientPreference, setAmbientPreference,
    accessibilityProfile, setAccessibilityProfile,
  } = useSettings();

  // Font family stored in localStorage directly (not in SettingsContext to avoid
  // touching the context file per sprint rules). Reads on mount, writes on change.
  const [fontFamily, setFontFamilyState] = React.useState(() =>
    localStorage.getItem('simplifii_editor_font') || 'inter'
  );
  const setFontFamily = (v) => {
    setFontFamilyState(v);
    localStorage.setItem('simplifii_editor_font', v);
    // Dispatch event so RichTextEditor CSS picks it up
    window.dispatchEvent(new CustomEvent('simplifii:font-change', { detail: { font: v } }));
  };

  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', background: OVERLAY_BACKDROP }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Canvas settings"
        tabIndex={-1}
        style={{
          width: 340, maxWidth: '90vw', height: '100vh', overflowY: 'auto',
          background: SURFACE_CARD, borderLeft: `1px solid ${SURFACE_RAISED}`,
          padding: '20px 20px 40px', outline: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
            Settings
          </h2>
          <button
            type="button" onClick={onClose} aria-label="Close settings"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, minHeight: 44, minWidth: 44, outline: 'none', borderRadius: BORDER_RADIUS }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M11 3L3 11M3 3L11 11" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <SectionLabel>Reading</SectionLabel>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.4 }}>How your text looks on screen</p>
        <Toggle label="Bionic Reading" description="Bold the first 40% of each word for faster scanning" value={isBionicActive} onChange={setIsBionicActive} />

        <RadioGroup
          label="Editor font"
          options={[
            { value: 'inter', label: 'Inter' },
            { value: 'opendyslexic', label: 'OpenDyslexic' },
            { value: 'atkinson', label: 'Atkinson' },
          ]}
          value={fontFamily}
          onChange={setFontFamily}
        />

        <RadioGroup
          label="Font size"
          options={[
            { value: 'normal', label: 'Default (16)' },
            { value: 'large', label: 'Large (18)' },
            { value: 'xl', label: 'Extra large (22)' },
          ]}
          value={fontScale}
          onChange={setFontScale}
        />

        <RadioGroup
          label="Line spacing"
          options={[
            { value: 'normal', label: 'Default (1.8)' },
            { value: 'relaxed', label: 'Relaxed (2.0)' },
            { value: 'loose', label: 'Loose (2.4)' },
          ]}
          value={lineSpacing}
          onChange={setLineSpacing}
        />

        <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, margin: '12px 0' }} />
        <SectionLabel>Display</SectionLabel>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.4 }}>Colours, motion, and visual comfort</p>
        <RadioGroup
          label="Theme"
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'highContrast', label: 'High Contrast' },
          ]}
          value={theme}
          onChange={setTheme}
        />
        <Toggle label="Reduced motion" description="Disable all animations and transitions" value={reducedMotion} onChange={setReducedMotion} />
        <Toggle label="Visual effects (FX)" description="Matrix rain animation in header and footer strips" value={localStorage.getItem('simplifii_matrix_rain') !== 'false'} onChange={(v) => { localStorage.setItem('simplifii_matrix_rain', String(v)); window.location.reload(); }} />

        <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, margin: '12px 0' }} />
        <SectionLabel>Focus</SectionLabel>
        <Toggle label="Distraction-free mode" description="Hide rails and bottom strip. Press Escape to exit." value={isZenMode} onChange={setIsZenMode} />

        <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, margin: '12px 0' }} />
        <SectionLabel>Accessibility profile</SectionLabel>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.4 }}>Tell us how your brain works so AURA can adapt its language and support style</p>
        <RadioGroup
          label="How does your brain work?"
          options={getProfileCards().map(p => ({ value: p.id, label: p.name }))}
          value={accessibilityProfile}
          onChange={setAccessibilityProfile}
        />

        <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, margin: '12px 0' }} />
        <SectionLabel>Autism-first features</SectionLabel>
        <Toggle label="Autism-first mode" description="Enables predictability, sensory dial, literal mode, and decision support" value={autismFirstEnabled} onChange={setAutismFirstEnabled} />
        {autismFirstEnabled && (
          <>
            <Toggle label="Predictability announcements" description="Announces every AI action before it happens" value={predictabilityAnnouncements} onChange={setPredictabilityAnnouncements} />
            <Toggle label="Literal mode" description="Removes metaphors, idioms, and ambiguous language from AI" value={isLiteralMode} onChange={setIsLiteralMode} />
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>My special interests</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: '0 0 6px' }}>
                The tutor will use these to explain concepts. Up to 5.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(specialInterests.length > 0 ? specialInterests : ['']).map((interest, i) => (
                  <div key={i} style={{ display: 'flex', gap: 4 }}>
                    <input
                      type="text"
                      value={interest}
                      maxLength={50}
                      placeholder={`Interest ${i + 1}`}
                      onChange={e => {
                        const updated = [...specialInterests];
                        updated[i] = e.target.value;
                        setSpecialInterests(updated.filter((v, idx) => v.trim() || idx === updated.length - 1));
                      }}
                      style={{
                        flex: 1, fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
                        background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
                        borderRadius: BORDER_RADIUS, padding: '6px 8px', outline: 'none',
                      }}
                    />
                  </div>
                ))}
                {specialInterests.length < 5 && specialInterests.every(i => i.trim()) && (
                  <button type="button" onClick={() => setSpecialInterests([...specialInterests, ''])}
                    style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, background: 'none', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, padding: '4px 8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                    + Add another
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '8px 0' }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>Sensory level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Minimal</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={sensoryLevel}
                  onChange={e => setSensoryLevel(Number(e.target.value))}
                  aria-label={`Sensory level: ${sensoryLevel}`}
                  style={{ flex: 1, accentColor: ACCENT_PULSE }}
                />
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Full</span>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: ACCENT_PULSE, minWidth: 20, textAlign: 'center' }}>{sensoryLevel}</span>
              </div>
            </div>
            <RadioGroup
              label="Ambient sound"
              options={[
                { value: 'none', label: 'None' },
                { value: 'brown_noise', label: 'Brown noise' },
                { value: 'pink_noise', label: 'Pink noise' },
                { value: 'rain', label: 'Rain' },
                { value: 'ocean', label: 'Ocean' },
              ]}
              value={ambientPreference}
              onChange={setAmbientPreference}
            />
          </>
        )}

        <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, margin: '12px 0' }} />
        <SectionLabel>Wellbeing</SectionLabel>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.4 }}>Tools to help you manage stress and focus</p>
        <BreathBubble />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_FAINT, marginTop: 8, marginBottom: 4 }}>
      {children}
    </div>
  );
}
