/**
 * tokens.js
 *
 * Single source of truth for design tokens in Simplifii-OS.
 * Import these constants into any component that needs colour, typography,
 * spacing, or animation values. Never hard-code these values inline.
 *
 * Compliant with SOVEREIGN_STANDARDS.md Visual Law.
 */

// ============================================================
// Surface (background) tokens
// ============================================================

export const SURFACE_BASE   = '#09090b'; // Zinc 950: root backgrounds
export const SURFACE_CARD   = '#18181b'; // Zinc 900: cards, sidebars
export const SURFACE_RAISED = '#27272a'; // Zinc 800: chips, elevated elements

// ============================================================
// Text tokens
// ============================================================

export const TEXT_PRIMARY  = '#e4e4e7'; // Zinc 200
export const TEXT_MUTED    = '#71717a'; // Zinc 500
export const TEXT_FAINT    = '#52525b'; // Zinc 600
export const TEXT_LABEL    = '#3f3f46'; // Zinc 700: system metadata labels

// ============================================================
// Accent tokens
// ============================================================

export const ACCENT_PULSE  = '#10b981'; // Emerald 500: primary accent
export const ACCENT_HOVER  = '#0f9d80'; // Emerald 600: hover state
export const ACCENT_GLASS  = 'rgba(16,185,129,0.08)'; // Active card fill

// ============================================================
// Semantic colour tokens
// ============================================================

export const COLOUR_WARN    = '#f59e0b'; // Amber 400
export const COLOUR_DANGER  = '#f43f5e'; // Rose 500
export const COLOUR_INFO    = '#60a5fa'; // Blue 400

// ============================================================
// Border tokens
// ============================================================

export const BORDER_SHARP   = `1px solid ${SURFACE_RAISED}`;
export const BORDER_ACTIVE  = `1px solid ${ACCENT_PULSE}`;
export const BORDER_DASHED  = `1px dashed ${SURFACE_RAISED}`;
export const BORDER_RADIUS  = 3; // px: max 4px per Sovereign Standards

// ============================================================
// Typography tokens
// ============================================================

export const FONT_SYSTEM = "'JetBrains Mono', monospace"; // Labels, badges, status
export const FONT_BODY   = "'Inter', sans-serif";          // Body, headings

export const TYPE_LABEL = {
  fontFamily: FONT_SYSTEM,
  fontSize:   9,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: TEXT_LABEL,
};

// ============================================================
// Animation tokens (Framer Motion spring presets)
// ============================================================

export const SPRING_REVEAL = {
  type: 'spring', stiffness: 260, damping: 22,
};

export const SPRING_SLIDE = {
  type: 'spring', stiffness: 300, damping: 26,
};

export const EASE_PANEL = [0.16, 1, 0.3, 1]; // cubic-bezier for CSS transitions

export const SOFT_REVEAL_VARIANTS = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1,    y: 0  },
  transition: SPRING_REVEAL,
};

export const STAGGER_CONTAINER = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const STAGGER_ITEM = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};
