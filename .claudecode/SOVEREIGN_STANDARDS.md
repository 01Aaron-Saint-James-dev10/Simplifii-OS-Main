# Sovereign Engineering Bible
Version: 1.0.0
Status: Active Source of Truth

Every file written in this repo MUST comply with the laws below.
If a proposed change violates a law, reject it and surface the conflict.

---

## Visual Law

| Token | Value |
|---|---|
| Base surface | `#09090b` (Zinc 950) |
| Card surface | `#18181b` (Zinc 900) |
| Elevated surface | `#27272a` (Zinc 800) |
| Muted text | `#52525b` (Zinc 600) |
| Body text | `#e4e4e7` (Zinc 200) |
| Primary accent | `#10b981` (Emerald 500) |
| Accent hover | `#0f9d80` |
| Destructive | `#f43f5e` (Rose 500) |
| Warning | `#f59e0b` (Amber 400) |
| Info | `#60a5fa` (Blue 400) |
| Border | `1px solid #27272a` |
| Border active | `1px solid #10b981` |
| Border dashed | `1px dashed #27272a` |
| Border radius | `3px` (max 4px) |

Background is NEVER white or near-white. Text is NEVER pure `#ffffff`. Accent is ALWAYS emerald. Radius is NEVER more than 4px.

---

## Typography Law

| Role | Family | Size | Weight | Tracking |
|---|---|---|---|---|
| System metadata (labels, badges, status) | JetBrains Mono | 9px | 700 | 0.15em to 0.18em |
| UI body | Inter | 11-13px | 400-600 | normal |
| Headings | Inter | 16-22px | 700 | normal |
| Code | JetBrains Mono | 12px | 400 | normal |

Minimum font size is 11px. System labels are always UPPERCASE. No em-dashes anywhere. Australian English only.

---

## Animation Law (Framer Motion Spring Physics)

Prefer spring physics over duration-based easing. Springs feel like physical objects.

```js
// Reveal (page / panel entry)
const softReveal = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { type: 'spring', stiffness: 260, damping: 22 }
};

// List item stagger
const itemVariant = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 }
};
const containerVariant = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } }
};

// Slide in from side (drawer / panel)
const slideIn = {
  initial: { x: -12, opacity: 0 },
  animate: { x: 0,   opacity: 1 },
  exit:    { x: -12, opacity: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 26 }
};
```

Reduced-motion users: wrap all `motion.*` with `AnimatePresence` and always honour `prefers-reduced-motion` via `useReducedMotion()`.

---

## Architectural Law

Simplifii-OS is a Single-State Engine. State flows in one direction:

```
PDF Drop
  -> useIngestion (parse + extract)
  -> ProjectContext (courses, extractionData)
  -> EventBus (SOVEREIGN_DATA_READY)
  -> AuraHUD / SemesterSidebar / PillarGallery (react to event)
```

Cross-layer communication uses Custom Events via `src/core/Events.js`. Never use window.postMessage, direct prop drilling across more than two layers, or globals beyond EventBus.

Core modules (do not collapse):

| Module | Role |
|---|---|
| `src/core/SovereignRouter.js` | Tier resolution, theme hydration |
| `src/core/ExecutiveSpine.js` | Focus sessions, idle, Pareto routing |
| `src/core/HistoryOfThought.js` | Local encrypted activity log (Authenticity Report) |
| `src/core/LiteralMode.js` | Render-time vocab transformer |
| `src/core/EventBus.js` | CustomEvent bridge to HistoryOfThought + telemetry |
| `src/core/Events.js` | Event name constants (single source of truth) |
| `src/theme/tokens.js` | Design token constants (single source of truth) |

Adding a new core module requires amending CLAUDE.md and this file.

---

## Layout Law (Linear Method)

- Keyboard-first navigation. Every interactive element is reachable by Tab + Enter.
- Icon rail: 64px collapsed, 240px expanded. Transition: `cubic-bezier(0.16,1,0.3,1) 300ms`.
- Information density is a feature. Bento grids show multiple courses simultaneously. Never paginate a list that fits on screen.
- No cards inside cards. Max nesting depth for surface elevation: 2 (base -> card -> chip only).
- Sidebar never overlaps content. It pushes the main column.

---

## Neuro-Inclusive Law

- High information density, low visual noise. No decorative icons or illustrations.
- Bento Grids for multi-course views. Every course visible without scrolling where viewport allows.
- No "Child's Play" visuals (rounded-3xl, pastel fills, emoji in UI labels).
- Every AI-generated item carries a one-line rationale tied to a rubric criterion.
- LOD modes: Compass (minimal, one step) and Map (full overview). Never hide Compass behind clicks.
- No streaks, no shame, no toxic positivity. Calm, direct, ADHD-literal tone only.

---

## Extraction Law

PDFs must be parsed for the "Definition of Done" before anything else:
1. Assessment names
2. Weightings (percentage)
3. Due dates

Extraction prompt always prepends:
> "Focus: Extract only Assessment names, Weightings, and Due Dates. Ignore unit policies, contact details, and reading lists."

Confidence scores must accompany every extracted field. If confidence is low, surface it explicitly rather than silently accepting the guess.

---

## Data Sovereignty Law

- No learner identity, raw work, or individual patterns leave the device without explicit consent.
- Institutions see only anonymised, aggregated statistics.
- Every AI contribution is logged by HistoryOfThought and visible in the Authenticity Report.
- `referencingStyle` is per-course metadata set in CourseSettings. It is NOT set during onboarding.

---

## Reference Implementations (Model Against These)

| Standard | Source | What to adopt |
|---|---|---|
| Zinc/Obsidian visual system | Radix UI / shadcn/ui | Colour tokens, spacing scale, accessible focus rings |
| Spring-physics animation | Framer Motion recipes | `type: 'spring'` transitions, stagger patterns, `useReducedMotion` |
| Speed + keyboard-first architecture | Linear app method | Icon rail pattern, command palette routing, keyboard shortcuts |
| High-density bento layout | shadcn blocks | `auto-fill minmax` grids, chip components, stat cards |
