import React from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  GLASS_SURFACE, GLASS_BORDER, GLOW_EMERALD,
  SURFACE_RAISED,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const FONTS = [
  { value: 'inter', label: 'System default (Inter)' },
  { value: 'opendyslexic', label: 'OpenDyslexic' },
  { value: 'atkinson', label: 'Atkinson Hyperlegible' },
];

const BIONIC = [
  { value: 'off', label: 'Off' },
  { value: 'light', label: 'Light (20%)' },
  { value: 'medium', label: 'Medium (40%)' },
];

function RadioGroup({ legend, options, value, onChange }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '0 0 24px' }}>
      <legend style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_PRIMARY, marginBottom: 10, padding: 0 }}>{legend}</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(o => (
          <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', background: value === o.value ? GLASS_SURFACE : 'transparent', border: `1px solid ${value === o.value ? ACCENT_BORDER : 'transparent'}`, borderRadius: 6, minHeight: 44, transition: 'all 0.15s' }}>
            <input type="radio" name={legend} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: ACCENT_PULSE }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY }}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', padding: '12px 14px', background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 6, marginBottom: 12, minHeight: 44 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY }}>{label}</span>
      <span style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: checked ? ACCENT_PULSE : SURFACE_RAISED, transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </span>
    </label>
  );
}

export default function AccessibilityStep({ prefs, onPrefsChange, onSave, onSkip }) {
  const set = (key, val) => onPrefsChange({ ...prefs, [key]: val });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', textAlign: 'center', margin: '0 0 8px', color: TEXT_PRIMARY }}>
        A few quick settings
      </h2>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: TEXT_MUTED, textAlign: 'center', margin: '0 0 32px' }}>
        All of these can be changed anytime in Settings. Skip if you want to set them up later.
      </p>

      <RadioGroup legend="Reading font" options={FONTS} value={prefs.font} onChange={v => set('font', v)} />
      <RadioGroup legend="BionicText reading mode" options={BIONIC} value={prefs.bionic} onChange={v => set('bionic', v)} />
      <Toggle label="Reduced motion" checked={prefs.reducedMotion} onChange={v => set('reducedMotion', !prefs.reducedMotion)} />
      <Toggle label="High contrast" checked={prefs.highContrast} onChange={v => set('highContrast', !prefs.highContrast)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
        <button type="button" onClick={onSave} style={{ padding: '14px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, background: ACCENT_PULSE, border: 'none', color: '#09090b', cursor: 'pointer', boxShadow: GLOW_EMERALD }}>
          Save and continue
        </button>
        <button type="button" onClick={onSkip} style={{ padding: '12px 0', borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, background: 'transparent', border: `1px solid ${GLASS_BORDER}`, color: TEXT_MUTED, cursor: 'pointer' }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
