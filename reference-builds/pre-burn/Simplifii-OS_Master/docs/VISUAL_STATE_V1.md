# Visual State V1 — Simplifii-OS Design Tokens
Version: 1.0.0
Status: Authoritative Reference — Do Not Revert

This document is the single source of truth for the 2026 Obsidian aesthetic.
Any AI session that touches UI must read this before changing colours, typography, or motion.

---

## Palette — Zinc-950 Obsidian

| Token | Hex | Usage |
|---|---|---|
| `zinc-950` | `#09090b` | Page background |
| `zinc-900` | `#18181b` | Card surfaces, tile backgrounds, input fills |
| `zinc-800` | `#27272a` | Borders (primary), dividers |
| `zinc-700` | `#3f3f46` | Subtle labels, footer text |
| `zinc-600` | `#52525b` | Secondary labels, placeholder text |
| `zinc-500` | `#71717a` | Inactive button text |
| `zinc-400` | `#a1a1aa` | Primary label text |
| `zinc-200` | `#e4e4e7` | Body text, foreground |

## Palette — Emerald Accent

| Token | Hex | Usage |
|---|---|---|
| `emerald-500` | `#10b981` | Primary accent: cursor glow, focus rings, CTA text |
| `emerald-600` | `#0f9d80` | Hover state for emerald buttons |
| `emerald-glow-weak` | `rgba(16,185,129,0.04)` | Radial gradient whisper on page background |
| `emerald-glow-ring` | `rgba(16,185,129,0.4)` | Hover box-shadow ring (AuraHUD import button) |
| `emerald-glow-soft` | `rgba(16,185,129,0.22)` | Hover glow spread (AuraHUD import button) |
| `emerald-glow-cursor` | `rgba(16,185,129,0.65)` | Cursor blink text-shadow near |
| `emerald-glow-cursor-far` | `rgba(16,185,129,0.2)` | Cursor blink text-shadow far |

## Palette — Semantic

| Token | Hex | Usage |
|---|---|---|
| `red-500` | `#ef4444` | Error icon |
| `red-400` | `#f87171` | Error text |
| `red-bg` | `rgba(239,68,68,0.08)` | Error surface fill |
| `red-border` | `rgba(239,68,68,0.2)` | Error surface border |
| `white-ring` | `rgba(255,255,255,0.04)` | Glass card inset ring |
| `black-shadow` | `rgba(0,0,0,0.6)` | Glass card drop shadow |

---

## Typography

### Font Stack

| Role | Family | Import |
|---|---|---|
| System labels, mono code, UI chrome | `'JetBrains Mono', monospace` | Google Fonts — weights 400/500/700 |
| Body, prose, learner writing | `'Inter', sans-serif` | Google Fonts — weights 400/500/600 |

### Font Size Scale (minimum enforced)

| Context | Size | Note |
|---|---|---|
| Footer / status micro-labels | 9px | Mono only |
| System structural labels (UI chrome) | 10px | Minimum for chrome |
| Body text minimum | 11px | Never go below in readable content |
| Secondary body | 12px | |
| Primary body | 13px | |
| Heading (step labels) | 14–15px | |
| Accent / cursors | 2.4rem | `.smf-cursor` |

### Letter Spacing

| Usage | Value |
|---|---|
| Micro mono labels (footer) | `0.18em` |
| Section headers | `0.15em` |
| Body mono text | `0.04em` |
| Brand / tier label | `0.38em` |

---

## Glass Morphism — Card Token

Applied to the LandingPage gate card and NeuroProfiler container:

```css
background: rgba(24, 24, 27, 0.65);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid #27272a;
border-radius: 4px;
box-shadow:
  0 0 0 1px rgba(255,255,255,0.04) inset,
  0 24px 48px rgba(0,0,0,0.6);
padding: 40px 36px;
```

### Tile / Option Card Token (NeuroProfiler)

```css
background: #18181b;
border: 1px solid #27272a;
border-radius: 3px;
```

Selected tile adds:
```css
border-color: #10b981;
background: rgba(16,185,129,0.06);
```

### Sovereign Guarantee Block

```css
border: 1px solid #27272a;
background: rgba(255,255,255,0.02);
border-radius: 3px;
padding: 16px;
```

---

## Page Background

```css
background:
  radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.04) 0%, transparent 60%),
  #09090b;
```

---

## Framer Motion — Easing Tokens

| Token | Value | Usage |
|---|---|---|
| `expoEase` | `[0.16, 1, 0.3, 1]` | Card reveal, premium settle |
| `easeOut` | `'easeOut'` | Column stagger, step transitions |
| Standard duration | `0.6s` | Card mount |
| Stagger duration | `0.45s` | Column cards |
| Stagger delay | `100ms per column` | SmViewer three-column |
| Step transition | `280ms easeOut` | NeuroProfiler step slides |

### LandingPage Card Reveal

```js
initial={{ opacity: 0, scale: 0.98, y: 10 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
```

### SmViewer Column Stagger

```js
const COLUMN_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' },
  }),
};
// Usage: custom={0}, custom={1}, custom={2} on each motion.div column
```

### NeuroProfiler Step Transition

```js
initial={{ opacity: 0, x: 16 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -16 }}
transition={{ duration: 0.28, ease: 'easeOut' }}
```

---

## Component-Level Tokens

### LandingPage (`src/frontend/LandingPage.js`)

- Base: `#09090b` + radial emerald whisper
- Card: glass morphism token above
- Cursor: `.smf-cursor` — 2.4rem, `#10b981`, step-end blink 0.9s, glow shadows
- Brand label: `#a1a1aa`, `0.38em` letter spacing, uppercase, JetBrains Mono
- Subline: `#52525b`, `0.2em` letter spacing
- Google button: `theme="filled_black"`, `shape="rectangular"`
- Footer: zinc-700 / zinc-800 split, `[ SYSTEM // LOCAL_VAULT_ENCRYPTED ]`
- Focus Mode toggle: `.smf-glass-btn` — zinc-900 bg, zinc-800 border, hover emerald

### NeuroProfiler (`src/frontend/NeuroProfiler.js`)

- Container: glass morphism token (no border-radius override)
- All tiles: zinc-900 fill, zinc-800 border, radius 3px
- Step indicator: animated width segments — 20px completed, 6px pending, zinc-800 track
- Sticky footer: `position: sticky; bottom: 0`, zinc-900 bg at 95% opacity, 8px blur, zinc-900 border-top
- Complete / Next buttons: emerald-500 bg, radius 3px, JetBrains Mono 10px uppercase
- Back button: zinc-800 border, zinc-600 text

### SmViewer (`src/frontend/SmViewer.js`)

- Three-column layout: Tier 1 / Tier 2 / Tier 3
- Column headers: zinc-600, 10px mono uppercase
- PDMR rail stage badges: 10px minimum, stage-specific colour tokens (see below)
- PromptCard: zinc-900 fill, zinc-800 border, radius 3px
- UDL badge: emerald accent or zinc depending on compliance

#### PDMR Stage Colours

| Stage | Background | Border | Text |
|---|---|---|---|
| `plan` | `rgba(59,130,246,0.1)` | `rgba(59,130,246,0.3)` | `#93c5fd` |
| `do` | `rgba(16,185,129,0.1)` | `rgba(16,185,129,0.3)` | `#6ee7b7` |
| `belonging` | `rgba(168,85,247,0.1)` | `rgba(168,85,247,0.3)` | `#c4b5fd` |
| `joy` | `rgba(245,158,11,0.1)` | `rgba(245,158,11,0.3)` | `#fcd34d` |
| `monitor` | `rgba(239,68,68,0.1)` | `rgba(239,68,68,0.3)` | `#fca5a5` |
| `reflect` | `rgba(20,184,166,0.1)` | `rgba(20,184,166,0.3)` | `#99f6e4` |

### AuraHUD (`src/frontend/AuraHUD.js`)

- Import button hover: emerald glow ring + 0f9d80 background
- CSS tokens:
  ```css
  .aura-import-btn { transition: box-shadow 0.2s ease, background 0.2s ease; }
  .aura-import-btn:hover:not(:disabled) {
    box-shadow: 0 0 0 1px rgba(16,185,129,0.4), 0 0 16px rgba(16,185,129,0.22);
    background: #0f9d80 !important;
  }
  ```

---

## CSS Class Tokens (Injected via INJECTED_CSS)

| Class | Purpose |
|---|---|
| `.smf-cursor` | Blinking `_` cursor — emerald, 2.4rem, glow |
| `.smf-mono` | JetBrains Mono label text |
| `.smf-glass-btn` | Ghost button — zinc-900 bg, zinc-800 border, hover emerald |
| `.aura-import-btn` | AuraHUD import button — emerald hover glow |

---

## Border Radius Convention

| Context | Radius |
|---|---|
| Primary cards (glass gate) | 4px |
| Tiles, chips, buttons, badges | 3px |
| Focus rings | 2px (via box-shadow) |

---

## Transition Strings (Australian English Safe)

The `check-style.js` pre-commit hook flags `color` as US spelling.
Use these exact strings to avoid false positives:

| Avoid | Use Instead |
|---|---|
| `'border-color 0.15s, color 0.15s'` | `'border 0.15s'` |
| `'border-color 0.15s, background 0.15s'` | `'border 0.15s, background 0.15s'` |
| `transition: 'color 0.2s'` | `transition: '0.2s'` or use inline style object |

---

## What Never Changes

- Background is NEVER white, off-white, or light grey
- Text on dark surfaces is NEVER pure white (`#ffffff`) — use `#e4e4e7` maximum
- Accent colour is ALWAYS emerald (`#10b981`) — never blue, purple, or orange as primary
- Font for system chrome is ALWAYS JetBrains Mono
- Card surfaces are ALWAYS zinc-900 (`#18181b`) or glass on zinc-950
- Borders are ALWAYS `1px solid #27272a` (zinc-800) at rest
- Border radius is NEVER more than 4px on any surface
- No rounded-full pills on structural UI elements
- No gradients inside cards or tiles (page background gradient only)
- No box shadows on tiles — borders only
