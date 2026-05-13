# Mockups Overview — Design Specs Per Tier [SPEC]

## What this is

Detailed visual mockup specifications for each tier's home dashboard, navigation, and key screens. These specs build on the existing `design/` folder in the repo and adapt it across all 7 tiers using the Open Design system (no Claude Design dependency).

## Status

[SPEC] — extends existing design work. Builds in parallel with build sprints.

## How design and build interact

Aaron's instruction: design happens in this folder, builds happen via sprint priority queue. When a tier's build sprint begins, Claude Code references the matching mockup spec to know what to build.

This means:
- Designs ready BEFORE builds (no waiting on UI decisions mid-sprint)
- Visual consistency across tiers (all reference same design system)
- Toggle approach lets users theme-swap without code branches
- New tier added = one new mockup file + matching tier folder, nothing else regresses

## The toggle architecture

Two independent axes:

### Axis 1: Tier (sets the LAYOUT)
- Determined at signup / Settings
- Routes to tier-specific home dashboard
- Determines which features visible
- Determines container shape (Project / Course / Phase / Family / Cohort)
- NOT togglable mid-session (would break data integrity)

### Axis 2: Character/Theme (sets the SKIN)
- Default character matches tier (Bowser-OS for RHD, Sparq for Secondary, etc)
- User can theme-swap any time via Settings → Appearance
- Affects: palette, mascot, copy register, motion feel
- Pure CSS variables + copy lookup — never touches layout

This means:
- A homeschool family ALWAYS sees the family layout (kids, quests, portfolio)
- A homeschool family CAN theme it as Bowser-OS if they want a darker feel
- An RHD researcher ALWAYS sees phases/strands/chapters
- An RHD researcher CAN theme as Forager if they want warmer aesthetic

Layout = tier (data-shape law).
Skin = character (preference choice).

## Shared design system (the Obsidian Aesthetic)

Everything below applies to every tier mockup unless explicitly overridden.

### Base palette
- Background: `--zinc-950` (#09090B)
- Surface: `--zinc-900` (#18181B)
- Surface elevated: `--zinc-800` (#27272A)
- Border: `--zinc-700` (#3F3F46)
- Text primary: `--zinc-100` (#F4F4F5)
- Text secondary: `--zinc-400` (#A1A1AA)
- Text muted: `--zinc-500` (#71717A)
- Emerald accent (default): `--emerald-500` (#10B981)
- Warning amber: `--amber-500` (#F59E0B)
- Error rose: `--rose-500` (#F43F5E)
- Highlight (Bowser-OS specific): `--acid-yellow` (#E8FF00)

### Typography
- Font family: Inter (self-hosted, no Google Fonts)
- Mono: JetBrains Mono
- Dyslexia-friendly toggle: OpenDyslexic
- Sizes: 12 / 14 / 16 (body) / 18 / 20 / 24 / 32 / 40

### Spacing
- Base unit: 4px
- Standard spacing: 8 / 12 / 16 / 24 / 32 / 48 / 64
- Container max-width: 1280px desktop, fluid mobile

### Motion
- Standard duration: 300ms
- Snappier (Sparq): 200ms
- Heavier (Bowser-OS, Atlas): 400ms with anticipation
- Easing: cubic-bezier(0.4, 0, 0.2, 1) (Tailwind ease-in-out default)
- Reduced motion respected: instant transitions, no animations

### Iconography
- Lucide React (open source, ISC license)
- Wrapped in `<Glyph />` primitive for future-proofing
- 16px / 20px / 24px sizes
- Stroke width 1.5 default, 2 for emphasis

### Layout grid
- 12-column desktop
- 4-column tablet
- 1-column mobile
- Generous gutters (24px desktop, 16px mobile)

## Mockup files in this folder

This MOCKUPS folder contains one file per tier:

- `MOCKUP_SECONDARY_SPARQ.md` — Year 11-12 students, electric blue palette
- `MOCKUP_UNDERGRAD_COMPASS.md` — Bachelor's students, teal palette
- `MOCKUP_HONOURS_MASTERS_ATLAS.md` — Honours/Masters, olive palette
- `MOCKUP_RHD_BOWSER_OS.md` — PhD/MRes (Aaron's tier), emerald + acid yellow
- `MOCKUP_ACADEMIC_SAGE.md` — Postdocs/faculty, bronze palette
- `MOCKUP_HOMESCHOOL_FORAGER.md` — Homeschool families, forest green
- `MOCKUP_INSTITUTIONAL_HUB.md` — University B2B, cyan palette

Each file specifies:
- Home dashboard layout
- Navigation structure
- Key feature panels
- Empty states
- Loading states
- Welcome screen
- Tier-specific UI patterns

## Toggle UX (Settings → Appearance)

```
┌─────────────────────────────────────┐
│  APPEARANCE                         │
│                                     │
│  Theme:                             │
│  [Auto by tier ▼]                   │
│   - Auto by tier (default)          │
│   - Sparq (Secondary)               │
│   - Compass (Undergrad)             │
│   - Atlas (Honours/Masters)         │
│   - Bowser-OS (RHD)                 │
│   - Sage (Academic)                 │
│   - Forager (Homeschool)            │
│   - Hub (Institutional)             │
│                                     │
│  Preview ↓                          │
│  [Live preview of selected theme]   │
│                                     │
│  Mode:                              │
│  ◉ Dark (Obsidian, default)         │
│  ○ High contrast                    │
│  ○ Sepia                            │
│                                     │
│  Font:                              │
│  ◉ Inter (default)                  │
│  ○ OpenDyslexic                     │
│                                     │
│  Motion:                            │
│  ◉ Standard                         │
│  ○ Reduced                          │
│                                     │
│  Size:                              │
│  [─────●─────] (16px default)       │
│                                     │
└─────────────────────────────────────┘
```

## What designs DO NOT change

Even with full theme-swap:
- Layout dictated by tier (never overridden)
- Accessibility minimums (WCAG AA always)
- Australian English (always)
- No em-dashes (always)
- Privacy guarantees (never affected by visual changes)
- Receipt + Authenticity features (visible across all themes)
- Citation Engine behaviour (unchanged)

## Build sequencing

Mockups built in this order (matches priority queue):

### Sprint design-1 (after Tier Architecture ships)
- MOCKUP_RHD_BOWSER_OS.md — Aaron's tier first (dogfood priority)

### Sprint design-2 (after Sovereign Study queued)
- MOCKUP_SECONDARY_SPARQ.md
- MOCKUP_UNDERGRAD_COMPASS.md

### Sprint design-3 (parallel with Sovereign Home build)
- MOCKUP_HOMESCHOOL_FORAGER.md

### Sprint design-4 (when B2B begins)
- MOCKUP_INSTITUTIONAL_HUB.md

### Later
- MOCKUP_HONOURS_MASTERS_ATLAS.md
- MOCKUP_ACADEMIC_SAGE.md

## Reference to existing design folder

Aaron's repo already has a `design/` folder with tokens.js and base aesthetic. Each mockup spec references that as source of truth and adds tier-specific overrides only.

When build sprint executes: developer reads mockup spec + checks `design/tokens.js` + builds tier-specific components in `src/frontend/tiers/[tier-name]/`.

## Notes added

- 2026-05-15: Created from Aaron's direct request: design mockups per tier in roadmap, toggle approach, same aesthetic foundation.
- The toggle answers the "different UX or same with switch" question: BOTH, layered.
- Layout = tier law, Skin = preference toggle.
- Builds reference these mockups so visual decisions don't happen mid-sprint.
