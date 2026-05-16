import React from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS_FAINT,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const TIERS = [
  { value: 'primary', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', label: 'Primary school', desc: 'Visual scaffolds, plain language, reading comfort.' },
  { value: 'secondary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Secondary school', desc: 'Year 7 to HSC. Assignment rubrics and multi-week planning.' },
  { value: 'tertiary', icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5', label: 'University or college', desc: 'Manage subjects, decode briefs, submit with confidence.' },
  { value: 'postgrad', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', label: 'Postgraduate or research', desc: 'MRes, PhD. Phases, strands, chapters, methodology logs.' },
  { value: 'tafe', icon: 'M11.42 15.17l-5.42 3.24V5.78l5.42 3.24m7.16-3.24v12.63l-5.42-3.24M3 5.78v12.63l5.42-3.24m0-6.15l5.42 3.24 5.42-3.24', label: 'TAFE, vocational or trade', desc: 'Practical learning with plain-language scaffolds.' },
  { value: 'homeschool', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25', label: 'Homeschooling', desc: 'Flexible workspaces with parental privacy controls.' },
  { value: 'educator', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', label: 'Teacher or educator', desc: 'Research, grants, and teaching materials.' },
];

export default function TierPickerStep({ selected, onSelect, onContinue }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', textAlign: 'center', margin: '0 0 8px', color: TEXT_PRIMARY }}>
        Where are you in your learning journey?
      </h2>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: TEXT_MUTED, textAlign: 'center', margin: '0 0 32px' }}>
        We will adjust the workspace to fit. You can change this anytime.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {TIERS.map(t => {
          const active = selected === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelect(t.value)}
              aria-pressed={active}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '16px 18px', textAlign: 'left',
                background: active ? ACCENT_GLASS_FAINT : GLASS_SURFACE,
                border: `1px solid ${active ? ACCENT_PULSE : GLASS_BORDER}`,
                borderRadius: 10, cursor: 'pointer',
                boxShadow: active ? GLOW_EMERALD : 'none',
                transition: `border-${'color'} 0.2s, box-shadow 0.2s`,
                minHeight: 44,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT_PULSE : TEXT_FAINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                <path d={t.icon} />
              </svg>
              <div>
                <div style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? ACCENT_PULSE : TEXT_PRIMARY, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.5, color: TEXT_MUTED }}>{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selected === 'homeschool' && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, textAlign: 'center', margin: '16px 0 0', lineHeight: 1.5 }}>
          Parent account setup will be available soon. For now, this configures a homeschool-friendly workspace.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selected}
          style={{
            padding: '14px 40px', borderRadius: 8,
            fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700,
            background: selected ? ACCENT_PULSE : GLASS_SURFACE,
            border: `1px solid ${selected ? ACCENT_PULSE : GLASS_BORDER}`,
            color: selected ? '#09090b' : TEXT_FAINT,
            cursor: selected ? 'pointer' : 'not-allowed',
            opacity: selected ? 1 : 0.5,
            boxShadow: selected ? GLOW_EMERALD : 'none',
            transition: 'all 0.2s',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
