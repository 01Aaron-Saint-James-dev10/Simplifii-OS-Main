# Open Design Migration [SPEC]

## What this is

Remove Sovereign OS's dependency on Claude Design (or any Anthropic-hosted design system). Move to a fully owned, open, future-proof design system built on tokens.js + Tailwind + the Obsidian Aesthetic. No external lock-in.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15.

## Why this matters

Right now parts of the build reference Claude Design components or patterns. That creates:
- **Vendor lock-in:** if Anthropic changes pricing, terms, or sunsets Claude Design, Simplifii is exposed
- **B2B sales risk:** universities ask "what's your design dependency stack" and Claude Design is a question mark
- **Open-source positioning loss:** Simplifii positions as sovereign, privacy-first, owned-by-user. Depending on Anthropic UI dilutes that
- **Brand fragmentation:** Claude Design looks like Claude. Simplifii needs to look like Simplifii

The fix is not a rebuild. The fix is a controlled migration that keeps everything working while we move underneath.

## Current dependencies (audit needed)

Before migration, audit what currently uses Claude Design:
- [ ] Specific components from Claude Design library?
- [ ] CSS reset / base styles inherited?
- [ ] Icon set?
- [ ] Typography defaults?
- [ ] Form component styles?
- [ ] Modal patterns?

This audit is itself a small sprint (half day). Output: complete dependency list with replacement plan.

## Target stack (the owned system)

### Layer 1 — Design tokens
Already exists: `src/design/tokens.js`. Source of truth for all colours, spacing, typography, motion. Zero raw hex anywhere else.

### Layer 2 — Tailwind config
`tailwind.config.js` extends only Sovereign tokens. No Claude-specific utilities. Strict allow-list of utility classes.

### Layer 3 — Obsidian Aesthetic primitive library
Owned components in `src/frontend/components/primitives/`:
- `<Surface />` — base panel/card primitive
- `<Stack />` — vertical spacing
- `<Cluster />` — horizontal flex
- `<Cell />` — content area
- `<Pill />` — tier chips, status indicators
- `<Glyph />` — icon wrapper (uses Lucide React, fully owned)
- `<Field />` — form input wrapper
- `<Slab />` — text block primitive

Each primitive is ~30-50 lines. All owned. All token-driven. Compounds beautifully.

### Layer 4 — Compound components
Built on primitives:
- `<SovereignCell />`
- `<TierChip />`
- `<UdlBar />`
- `<PillarGallery />`
- (and all existing canvas components)

These exist already. Migration means swapping their internal dependencies from anything Claude-Design-flavoured to pure primitives + tokens.

### Layer 5 — Pattern library
Documented patterns in `/design/patterns/`:
- "How a modal looks in Sovereign"
- "How a form looks in Sovereign"
- "How a confirmation dialog looks in Sovereign"
- "How loading states look in Sovereign"

Each pattern shows the primitive composition. New developers (or future Aaron) can replicate without reinventing.

## Icon system

Move to **Lucide React** as the icon library.
- Fully owned (no Anthropic dependency)
- Open-source (ISC license, business-friendly)
- 1000+ icons covering every need
- Tree-shakeable
- Already commonly used in React ecosystem

Wrap in `<Glyph />` primitive so swapping later is one-file change.

## Typography

Owned font stack:
- Headings: **Inter** (open source, exceptional readability)
- Body: **Inter**
- Mono: **JetBrains Mono** (open source)
- Dyslexia-friendly option: **OpenDyslexic** (open source) — user toggle

All self-hosted (no Google Fonts dependency, GDPR-safe, offline-friendly, faster).

## Migration plan (phased, non-breaking)

### Phase 1 — Audit (½ day)
- Catalogue every Claude Design reference in code
- Identify direct dependencies vs aesthetic-only inheritances
- Produce dependency matrix

### Phase 2 — Primitive library build (2 days)
- Build all primitives (Surface, Stack, Cluster, Cell, Pill, Glyph, Field, Slab)
- Document each
- Test in isolation
- Storybook-style preview page

### Phase 3 — Icon migration (½ day)
- Swap any non-Lucide icons for Lucide equivalents
- Wrap in `<Glyph />`
- Verify all icons render

### Phase 4 — Component migration (3-5 days)
- Migrate one compound component at a time
- Test each before moving to next
- Visual regression check per component
- Order: smallest, lowest-risk components first; canvas-critical last

### Phase 5 — Audit complete (½ day)
- Verify zero Claude Design imports remain
- Verify all icons are Lucide
- Verify all fonts self-hosted
- Verify all colours from tokens
- Lint rules enforcing future compliance

### Phase 6 — Documentation (½ day)
- Pattern library written
- "How to build a new component" guide
- Visual design guidelines

Total migration cost: ~8-10 days, fully phased, no breaking changes mid-flight.

## Critical constraints

- **No design rewrites.** This is structural migration, not visual redesign. Obsidian Aesthetic stays exactly as-is.
- **No feature work during migration.** This is plumbing, not product. Block other sprints during phases 4-5.
- **Visual regression testing.** Each migrated component must look identical before/after.
- **Token discipline preserved.** Zero raw hex creeps in. ESLint rules already enforce; verify.
- **Accessibility unchanged.** WCAG AA still hits everywhere. Verify with axe-core.

## After migration: what's true

- No external design system dependency
- Brand 100% owned
- Open-source-aligned positioning credible
- Future character system (Bowser-OS etc) has clean foundation
- B2B sales questions about design dependencies = easy answer
- Future hires (designers, frontend devs) can onboard against a documented pattern library

## Why this happens before Mario Kart characters

Characters need a clean theming foundation. If we layer character system on top of Claude Design dependencies, every theme swap risks breaking inherited components. Migration first, then character system.

## What this sprint should ship

Audit phase (½ day): complete dependency matrix.
Then queue full migration as a multi-day sprint when ready.

## Dependencies

- Design tokens (exists)
- Tailwind config (exists)
- Existing Obsidian Aesthetic (exists)
- Build pipeline (exists)

No new infrastructure. Just discipline.

## Notes added

- 2026-05-15: Raised by Aaron — "How do we design without Claude Design — open design?"
- Pairs with Mario Kart characters: open design system is the foundation those characters skin
- Critical for B2B credibility (universities want owned stacks)
- Critical for long-term moat (vendor lock-in kills startups)
