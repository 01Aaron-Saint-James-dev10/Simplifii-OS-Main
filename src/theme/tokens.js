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

export const SURFACE_BASE       = '#09090b'; // Zinc 950: root backgrounds
export const SURFACE_CARD       = '#18181b'; // Zinc 900: cards, sidebars
export const SURFACE_RAISED     = '#27272a'; // Zinc 800: chips, elevated elements
export const SURFACE_CARD_GLASS = 'rgba(24,24,27,0.7)';  // Translucent card
export const SURFACE_CARD_SOLID = 'rgba(24,24,27,0.95)'; // Near-opaque card

// Black overlay / shadow ramp
export const SHADOW_FAINT    = 'rgba(0,0,0,0.06)';  // Subtle border/divider
export const SHADOW_LIGHT    = 'rgba(0,0,0,0.1)';   // Light shadow
export const SHADOW_MEDIUM   = 'rgba(0,0,0,0.25)';  // Medium shadow
export const SHADOW_CARD     = 'rgba(0,0,0,0.3)';   // Card drop shadow, floating panels
export const OVERLAY_RULER   = 'rgba(0,0,0,0.15)';  // Reading ruler mask bands
export const OVERLAY_MEDIUM  = 'rgba(0,0,0,0.5)';   // Modal backdrop, overlay
export const OVERLAY_HEAVY   = 'rgba(0,0,0,0.8)';   // Dense overlay
export const OVERLAY_GAME    = 'rgba(9,9,11,0.85)';  // Game over screen backdrop
export const OVERLAY_BACKDROP = 'rgba(7,8,13,0.94)'; // Full-screen backdrop

// White tint ramp
export const WHITE_TINT_FAINT = 'rgba(255,255,255,0.04)'; // Subtle hover fill
export const WHITE_TINT       = 'rgba(255,255,255,0.1)';  // Border, light fill
export const WHITE_FILL       = 'rgba(255,255,255,0.9)';  // Near-opaque fill

// ============================================================
// Text tokens
// ============================================================

export const TEXT_PRIMARY  = '#e4e4e7'; // Zinc 200
export const TEXT_MUTED    = '#71717a'; // Zinc 500
export const TEXT_FAINT    = '#52525b'; // Zinc 600
export const TEXT_LABEL    = '#3f3f46'; // Zinc 700: system metadata labels

// WCAG 2.1 Level AA keyboard/eye-tracker focus indicator. Solid near-white
// ring with >16:1 contrast on any dark surface. Appears on :focus-visible only.
export const FOCUS_RING    = '#f4f4f5'; // Zinc 100
export const TEXT_LINK     = '#a1a1aa'; // Zinc 400: interactive text on dark surfaces (~7:1 on zinc-950)

// ============================================================
// Accent tokens
// ============================================================

export const ACCENT_PULSE  = '#10b981'; // Emerald 500: primary accent
export const ACCENT_HOVER  = '#0f9d80'; // Emerald 600: hover state
export const ACCENT_GLOW   = '#34d399'; // Emerald 300: gradient end, glow highlights

// Cyan accent (landing page gradient endpoint)
export const ACCENT_CYAN       = '#22d3ee'; // Cyan 400: gradient end

// Gradient presets
export const GRADIENT_EMERALD_CYAN = `linear-gradient(135deg, ${ACCENT_PULSE}, ${ACCENT_CYAN})`;

// Emerald alpha ramp (opacity tiers)
export const ACCENT_GLASS_FAINT   = 'rgba(16,185,129,0.03)'; // Faintest tint
export const ACCENT_GLASS_SUBTLE  = 'rgba(16,185,129,0.06)'; // Subtle fill
export const ACCENT_GLASS         = 'rgba(16,185,129,0.08)'; // Active card fill
export const ACCENT_GLASS_STRONG  = 'rgba(16,185,129,0.12)'; // Stronger fill, border tint
export const ACCENT_BORDER_FAINT  = 'rgba(16,185,129,0.15)'; // Shadow, subtle glow
export const ACCENT_BORDER        = 'rgba(16,185,129,0.2)';  // Border, divider
export const ACCENT_BORDER_STRONG = 'rgba(16,185,129,0.25)'; // Hover border
export const ACCENT_FOCUS         = 'rgba(16,185,129,0.3)';  // Focus ring, outer glow
export const ACCENT_FOCUS_STRONG  = 'rgba(16,185,129,0.35)'; // Strong focus ring
export const ACCENT_GLOW_40       = 'rgba(16,185,129,0.4)';  // Mid glow
export const ACCENT_GLOW_50       = 'rgba(16,185,129,0.5)';  // Shadow, glow
export const ACCENT_GLOW_60       = 'rgba(16,185,129,0.6)';  // Strong shadow
export const ACCENT_GLOW_80       = 'rgba(16,185,129,0.8)';  // Intense glow

// Emerald 300 alpha (glow drop shadows)
export const GLOW_DROP_50 = 'rgba(52,211,153,0.5)'; // Drop shadow
export const GLOW_DROP_80 = 'rgba(52,211,153,0.8)'; // Strong drop shadow

// ============================================================
// Semantic colour tokens
// ============================================================

// Amber/warn family
export const COLOUR_WARN               = '#f59e0b'; // Amber 400
export const COLOUR_WARN_TINT          = 'rgba(245,158,11,0.06)';  // Faintest amber fill
export const COLOUR_WARN_GLASS         = 'rgba(245,158,11,0.08)';  // Amber active fill
export const COLOUR_WARN_GLASS_STRONG  = 'rgba(245,158,11,0.12)';  // Stronger amber fill
export const COLOUR_WARN_BORDER        = 'rgba(245,158,11,0.2)';   // Amber subtle border
export const COLOUR_WARN_BORDER_STRONG = 'rgba(245,158,11,0.25)';  // Amber button border
export const COLOUR_WARN_BORDER_HEAVY  = 'rgba(245,158,11,0.4)';   // Heavy amber border
export const COLOUR_WARN_GLOW          = 'rgba(245,158,11,0.5)';   // Amber shadow/glow
export const COLOUR_WARN_GLOW_STRONG   = 'rgba(245,158,11,0.8)';   // Intense amber glow

// Orange status
export const COLOUR_ORANGE_TINT   = 'rgba(249,115,22,0.06)'; // Orange status fill
export const COLOUR_ORANGE_BORDER = 'rgba(249,115,22,0.12)'; // Orange status border

// Red/error family
export const COLOUR_DANGER        = '#f43f5e'; // Rose 500
export const COLOUR_DANGER_GLASS  = 'rgba(239,68,68,0.06)';  // Error fill
export const COLOUR_DANGER_TINT   = 'rgba(244,63,94,0.06)';  // Rose faintest fill
export const COLOUR_DANGER_BORDER = 'rgba(239,68,68,0.2)';   // Error border
export const COLOUR_DANGER_BORDER_ALT = 'rgba(244,63,94,0.2)'; // Rose border
export const COLOUR_DANGER_GLOW   = 'rgba(244,63,94,0.5)';   // Rose glow, game accent
export const COLOUR_DANGER_SOLID  = 'rgba(244,63,94,1)';     // Full opacity danger

// Red/coral (vault-specific)
export const VAULT_ERROR_GLASS  = 'rgba(255,124,124,0.08)'; // Vault error fill
export const VAULT_ERROR_BORDER = 'rgba(255,124,124,0.25)'; // Vault error border

// Blue/info family
export const COLOUR_INFO       = '#60a5fa'; // Blue 400
export const COLOUR_INFO_GLASS  = 'rgba(59,130,246,0.1)';  // Info fill
export const COLOUR_INFO_BORDER = 'rgba(59,130,246,0.15)'; // Info border/shadow
export const COLOUR_INFO_DIM    = 'rgba(59,130,246,0.25)'; // Blue avatar dim
export const COLOUR_INFO_GLOW   = 'rgba(59,130,246,0.3)';  // Info glow

// Indigo/purple
export const COLOUR_INDIGO_BORDER      = 'rgba(79,70,229,0.15)';  // Indigo border
export const COLOUR_PURPLE_GLOW        = 'rgba(168,85,247,0.3)';  // Purple glow
export const COLOUR_PURPLE_GLOW_STRONG = 'rgba(168,85,247,0.5)';  // Strong purple glow

// Amber focus/glow
export const COLOUR_WARN_FOCUS = 'rgba(245,158,11,0.3)'; // Amber focus ring, avatar dim

// AI label accent (warm gold pill for AI-suggested content)
export const ACCENT_AMBER      = '#E8A020'; // Warm gold for AI labels
export const ACCENT_AMBER_GLASS = 'rgba(232,160,32,0.1)'; // Amber pill background
export const ACCENT_AMBER_BORDER = 'rgba(232,160,32,0.25)'; // Amber pill border

// Yellow
export const COLOUR_YELLOW_GLOW = 'rgba(251,191,36,0.8)'; // Yellow drop shadow

// Vault green (HistoryVaultUnlock animation)
export const VAULT_GREEN_BORDER        = 'rgba(80,200,120,0.25)'; // Vault border stages
export const VAULT_GREEN_BORDER_STRONG = 'rgba(80,200,120,0.4)';  // Vault active border
export const VAULT_GREEN_GLOW          = 'rgba(80,200,120,0.45)'; // Vault shadow

// Glass and glow tokens (landing page surfaces)
export const GLASS_SURFACE     = 'rgba(255,255,255,0.02)';  // Glass card fill
export const GLASS_BORDER      = 'rgba(255,255,255,0.08)';  // Glass card border
export const GLASS_BORDER_HOVER = 'rgba(255,255,255,0.14)'; // Glass card hover border
export const GLOW_EMERALD      = `0 0 60px ${ACCENT_GLOW_50}, 0 0 120px ${ACCENT_BORDER_FAINT}`; // CTA glow
export const GLOW_EMERALD_SM   = `0 0 20px ${ACCENT_GLOW_50}`; // Subtle card glow
export const ACCENT_RADIAL_FAINT = ACCENT_GLASS_FAINT;      // Radial gradient fill
export const ACCENT_SHADOW_FAINT = `0 0 60px ${ACCENT_GLASS_SUBTLE}`; // Faint box shadow

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

export const FONT_SYSTEM  = "'JetBrains Mono', monospace"; // Labels, badges, status
export const FONT_BODY    = "'Inter', sans-serif";          // Body, headings
export const FONT_DISPLAY = "'Geist', -apple-system, BlinkMacSystemFont, sans-serif"; // Landing headlines
export const FONT_GEIST_MONO = "'Geist Mono', ui-monospace, monospace"; // Landing mono

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
