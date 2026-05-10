import React from 'react';

/**
 * AvatarVault
 *
 * Five archetype SVG primitives (Mango, Cipher, Atlas, Vera, Loom)
 * resolving the 20 Sovereign avatar IDs per the Manifest. Variations
 * within each category come from per-ID accent shifts, not from
 * five separate illustrations: same skeleton, different stance. The
 * avatar-persona-engine skill in .claude/skills/ documents the
 * mapping; this file is the runtime.
 *
 * Hard rules:
 *   - Sovereign palette only (Jet Black, Emerald, Cream).
 *   - Bold lines, geometric symmetry. No gradients, no photo
 *     textures. Single accent per archetype.
 *   - Every primitive accepts {size, ariaLabel, gritLevel} so the
 *     Grit dial can pulse the avatar in Deep Focus Mode.
 *   - Idle animation is CSS keyframes; no React animation libs.
 */

const PALETTE = {
  ink: '#0A0A0A',
  emerald: '#50C878',
  cream: '#FDFDFD'
};

const wrapStyle = (size, gritLevel) => {
  const isSocratic = gritLevel === 'socratic';
  return {
    display: 'inline-flex',
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: PALETTE.ink,
    border: `1px solid ${isSocratic ? PALETTE.emerald : '#1f1f22'}`,
    boxShadow: isSocratic ? `0 0 14px rgba(80, 200, 120, 0.45)` : 'none',
    transition: 'all 240ms ease'
  };
};

const Mango = ({ size = 48, ariaLabel = 'Mango: Primary stream guide', gritLevel, accentHue = 0 }) => (
  <span role="img" aria-label={ariaLabel} style={wrapStyle(size, gritLevel)}>
    <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72} fill="none">
      <ellipse cx="32" cy="34" rx="22" ry="20" fill={PALETTE.emerald} style={{ filter: `hue-rotate(${accentHue}deg)` }} />
      <circle cx="24" cy="30" r="3" fill={PALETTE.ink} />
      <circle cx="40" cy="30" r="3" fill={PALETTE.ink} />
      <path d="M22 42 Q32 48 42 42" stroke={PALETTE.ink} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  </span>
);

const Cipher = ({ size = 48, ariaLabel = 'Cipher: Secondary stream builder', gritLevel, completion = 0.6 }) => {
  const edgeOpacity = 0.4 + Math.min(0.6, completion);
  return (
    <span role="img" aria-label={ariaLabel} style={wrapStyle(size, gritLevel)}>
      <svg viewBox="0 0 64 64" width={size * 0.7} height={size * 0.7} fill="none" stroke={PALETTE.emerald} strokeWidth="1.8" strokeLinejoin="round">
        <path d="M16 22 L32 14 L48 22 L48 42 L32 50 L16 42 Z" opacity={edgeOpacity} />
        <path d="M16 22 L32 30 L48 22" opacity={edgeOpacity} />
        <path d="M32 30 L32 50" opacity={edgeOpacity} />
      </svg>
    </span>
  );
};

const Atlas = ({ size = 48, ariaLabel = 'Atlas: Tertiary stream strategist', gritLevel }) => (
  <span role="img" aria-label={ariaLabel} style={wrapStyle(size, gritLevel)}>
    <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72} fill="none">
      <path d="M22 50 Q22 36 32 30 Q42 36 42 50 Z" fill={PALETTE.cream} stroke={PALETTE.emerald} strokeWidth="1.6" />
      <circle cx="32" cy="22" r="9" fill={PALETTE.cream} stroke={PALETTE.emerald} strokeWidth="1.6" />
      <path d="M28 22 L36 22" stroke={PALETTE.emerald} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <path d="M32 32 L32 46" stroke={PALETTE.emerald} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  </span>
);

const Vera = ({ size = 48, ariaLabel = 'Vera: Specialist auditor', gritLevel }) => (
  <span role="img" aria-label={ariaLabel} style={wrapStyle(size, gritLevel)}>
    <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72} fill="none" stroke={PALETTE.emerald} strokeWidth="1.8">
      <circle cx="28" cy="28" r="14" />
      <line x1="38" y1="38" x2="50" y2="50" strokeLinecap="round" />
      <circle cx="28" cy="28" r="5" fill={PALETTE.emerald} fillOpacity="0.25" />
    </svg>
  </span>
);

const Loom = ({ size = 48, ariaLabel = 'Loom: Creative flow weaver', gritLevel }) => (
  <span role="img" aria-label={ariaLabel} style={wrapStyle(size, gritLevel)}>
    <svg viewBox="0 0 64 64" width={size * 0.78} height={size * 0.78} fill="none" stroke={PALETTE.emerald} strokeWidth="1.6" strokeLinecap="round">
      <path d="M14 44 Q24 18 32 32 Q40 46 50 20" />
      <path d="M14 50 Q24 24 32 38 Q40 52 50 26" opacity="0.5" />
    </svg>
  </span>
);

const ARCHETYPES = {
  mango:  { component: Mango,  range: [1, 5],   label: 'Primary stream guide' },
  cipher: { component: Cipher, range: [6, 10],  label: 'Secondary stream builder' },
  atlas:  { component: Atlas,  range: [11, 15], label: 'Tertiary stream strategist' },
  vera:   { component: Vera,   range: [16, 18], label: 'Specialist auditor' },
  loom:   { component: Loom,   range: [19, 20], label: 'Creative flow weaver' }
};

const archetypeForId = (id) => {
  const n = Number(id);
  if (!Number.isFinite(n)) return 'atlas';
  for (const [key, v] of Object.entries(ARCHETYPES)) {
    if (n >= v.range[0] && n <= v.range[1]) return key;
  }
  return 'atlas';
};

const archetypeForStream = (streamId) => {
  switch (streamId) {
    case 'primary':    return 'mango';
    case 'secondary':  return 'cipher';
    case 'tertiary':   return 'atlas';
    case 'tafe':       return 'vera';
    case 'homeschool': return 'loom';
    default:           return 'atlas';
  }
};

export const getAvatarById = (id, opts = {}) => {
  const key = archetypeForId(id);
  const Component = ARCHETYPES[key].component;
  const ariaLabel = opts.ariaLabel || `Avatar ${id}: ${ARCHETYPES[key].label}`;
  return (props) => <Component ariaLabel={ariaLabel} gritLevel={opts.gritLevel} {...props} />;
};

export const getAvatarByStream = (streamId, opts = {}) => {
  const key = archetypeForStream(streamId);
  const Component = ARCHETYPES[key].component;
  const ariaLabel = opts.ariaLabel || `Avatar: ${ARCHETYPES[key].label}`;
  return (props) => <Component ariaLabel={ariaLabel} gritLevel={opts.gritLevel} {...props} />;
};

export { Mango, Cipher, Atlas, Vera, Loom, PALETTE };
export default { Mango, Cipher, Atlas, Vera, Loom, getAvatarById, getAvatarByStream };
