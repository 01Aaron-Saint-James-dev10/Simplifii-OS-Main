# Visual Identity Per Mode [SPEC]

## What this is

Each tier / character has a distinct visual identity within the Obsidian Aesthetic family. Not a brand fork — a brand variation. Like how Apple's iWork apps each have their own colour but share Apple's design language.

## Status

[BACKLOG] — sketched in MARIO_KART_TIER_CHARACTERS.md, this is the visual implementation detail.

## Constants across all modes

- Zinc-950 base background (Obsidian)
- Same typography stack (Inter / JetBrains Mono)
- Same spacing system
- Same motion language (easings, durations)
- Same accessibility minimums (WCAG AA contrast always)
- Australian English copy always
- No em-dashes ever
- Same icon system (Lucide via `<Glyph />`)

## Variables per mode

### Accent colour (the primary character)
- Sparq (Secondary): electric blue `#2E7CF6` + emerald
- Compass (Undergrad): teal `#14B8A6` + amber
- Atlas (Honours/Masters): olive `#84A98C` + parchment
- Bowser-OS (RHD): emerald `#10B981` + acid yellow `#E8FF00`
- Sage (Academic): bronze `#C8923F` + burgundy
- Forager (Homeschool): forest green `#2D6A4F` + terracotta `#E76F51`
- Hub (Institutional): cyan `#06B6D4` + slate

### Welcome screen art
Each mode gets a distinct welcome illustration:
- Sparq: lightning bolt, energetic angles, sparks
- Compass: navigation rose, geometric, blueprint-feel
- Atlas: classical figure, structured weight
- Bowser-OS: heavy armoured silhouette, learned but dangerous
- Sage: owl or scholar figure, gravitas
- Forager: friendly animal (fox/wombat), Australian flora
- Hub: network node, abstract, institutional clean

All in Obsidian Aesthetic palette extended with the mode's accent.

### Loading state aesthetic
- Sparq: snappy, electric, kinetic
- Compass: smooth, navigational, charting
- Atlas: structured, building, scaffolding rising
- Bowser-OS: weighty, accumulating, methodical
- Sage: minimal, contemplative
- Forager: organic, gathering
- Hub: data-flowing, networked

### Empty state copy
- Sparq: "Let's go. Drop a brief or paste your assessment."
- Compass: "Ready to navigate. What are we working on?"
- Atlas: "This is substantial. Let's build the scaffold."
- Bowser-OS: "Awaiting corpus. Drop your sources."
- Sage: "Workspace ready. Upload a manuscript."
- Forager: "Tell us about your family. We'll build from there."
- Hub: "Connect your cohort to begin."

### Confetti / celebration moments
- Sparq: bright bursts, sparkle particles
- Compass: subtle sweep, directional
- Atlas: building blocks settling
- Bowser-OS: deliberate emerald pulse, no fanfare
- Sage: subtle bronze glow
- Forager: warm petals or leaves
- Hub: data nodes lighting up

### Sounds (opt-in only, off by default)
Each mode has its own short ambient signature for milestones (200ms maximum):
- Sparq: bright chord
- Compass: tone-arrow swish
- Atlas: deep settle
- Bowser-OS: low hum
- Sage: parchment-rustle
- Forager: warm bell
- Hub: data-pulse

## Component variance

Most components look identical across modes. A few have mode-specific styling:

### TierChip
- Always rendered in mode's accent
- Sage variant has bronze metallic finish (CSS gradient)
- Bowser-OS variant has slight armoured texture (CSS noise pattern)

### Pomodoro timer
- Sparq: bold countdown, electric pulse on completion
- Bowser-OS: heavy block timer, serious aesthetic
- Forager: hourglass metaphor, warm tones
- Sage: minimal text-only timer

### Mascot in canvas header
- Each mode's mascot SVG, 32px, top-left
- Click → mode info panel + theme swap option

## Animation language

All modes share base motion (easings, durations) but accents differ:

- **Sparq:** snappier (200ms instead of 300ms), more bounce
- **Compass:** smooth glides, navigational metaphors
- **Atlas:** building-up animations, structured reveals
- **Bowser-OS:** deliberate, heavier, more anticipation in motion
- **Sage:** minimal, almost still, refined
- **Forager:** organic, breathing, natural feel
- **Hub:** crisp, professional, dashboard-fast

Each mode's motion tokens override base in `characterMotion.js`.

## Typography emphasis variance

Heading weights shift per mode:
- Sparq: lighter (500-600) for energetic feel
- Compass: regular (500)
- Atlas: bolder (600-700) for weight
- Bowser-OS: bold (700) for gravitas
- Sage: regular (500) with refined letter-spacing
- Forager: regular (500) with friendly tracking
- Hub: medium (600) for institutional clean

All within the same Inter font family — no font swaps, just weight variations.

## Iconography variance

Same Lucide icon set across all modes. But some modes use slightly different icon choices:
- Sparq might use Zap icon where Compass uses Compass icon
- Bowser-OS might use Layers where Sparq uses BookOpen

These are mode-specific defaults in copy/config files. User can override.

## Notification design

- Sparq: pill notifications, bright, fast (2s)
- Compass: standard pill, professional
- Atlas: slightly larger, deliberate
- Bowser-OS: bottom-anchor, weighty
- Sage: top-right corner, minimal
- Forager: warm-rounded, family-friendly
- Hub: dashboard-style, info-dense

All accessible (screen reader announces, dismissible).

## Email template variance

System emails (welcome, password reset, receipt ready) themed per mode:
- Header banner uses mode palette
- Mascot in footer
- Voice / copy matches mode register
- Signature: "From [Mode], your Sovereign companion"

## Pattern library documentation

Once visual identity per mode is locked, document in `/design/identity/`:
- Each mode has its own page
- Palette swatches
- Typography examples
- Component examples
- Welcome screen mockup
- Empty state copy
- Motion examples

Living style guide. Future designers and devs can reference.

## What this sprint should ship

Tied to MARIO_KART_TIER_CHARACTERS.md sprint. When characters land, visual identity per mode lands at the same time.

Minimum viable (within character sprint):
1. 3 modes with full visual identity (Bowser-OS, Compass, Sparq)
2. Palette overrides via CSS vars
3. Mascot SVGs
4. Welcome screen variants
5. Empty state copy

Full v1:
6. All 7 modes
7. Motion variance
8. Email templates
9. Sound signatures (opt-in)
10. Pattern library docs

## Dependencies

- MARIO_KART_TIER_CHARACTERS.md (character system)
- OPEN_DESIGN_MIGRATION.md (clean foundation)
- Design tokens (exists)

## Notes added

- 2026-05-15: Aaron asked for distinct visual identity per mode (Sovereign Study vs Research vs Home vs Academic vs Schools).
- The Obsidian Aesthetic is the family. Modes are variations within it.
- Critical: visual variance never breaks accessibility minimums.
- Critical: variance is configurable not hard-coded — character SVGs can be swapped, palettes can be tuned, without code changes.
