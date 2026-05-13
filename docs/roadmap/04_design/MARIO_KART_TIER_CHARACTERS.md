# Tier Characters — Mario Kart Differentiation [SPEC]

## What this is

Every tier of Sovereign OS has its own character, colour palette, and personality. Like Mario Kart roster — same game underneath, totally different feel depending on who you pick. Bowser-OS for one tier, Toad-OS for another.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15.

## Why this matters

A Year 12 student should NOT feel like they're using the same product as a senior academic. A homeschool parent should NOT feel like they're using the same product as a PhD candidate.

The infrastructure underneath is identical (5 Sovereign Layers, Receipt, Ingestion). The character on top makes each tier feel custom-built. Cheap engineering, huge brand differentiation.

## The character roster

### TIER_SECONDARY → "Sparq" (the apprentice)
- **Vibe:** Curious, scrappy, high-energy
- **Palette:** Electric blue + emerald + warm orange accents
- **Voice:** Encouraging, casual, no jargon, occasionally playful
- **Mascot art direction:** Lightning bolt motif, energetic
- **Loading messages:** "Sparq's warming up", "Let's go!"
- **Onboarding tone:** "You've got this. We'll build it together."

### TIER_UNDERGRAD → "Compass" (the navigator)
- **Vibe:** Steady, capable, smart-but-not-show-off
- **Palette:** Deep navy + teal + soft amber
- **Voice:** Direct, supportive, treats user as adult, occasionally witty
- **Mascot art direction:** Compass rose, geometric, clean
- **Loading messages:** "Compass is plotting your course", "On the way"
- **Onboarding tone:** "Let's figure out what you're working on."

### TIER_HONOURS_MASTERS → "Atlas" (the framework-bearer)
- **Vibe:** Methodical, dependable, slightly serious
- **Palette:** Charcoal + olive + parchment
- **Voice:** Considered, methodological, supportive on bigger lifts
- **Mascot art direction:** Atlas figure carrying structured weight, classical
- **Loading messages:** "Atlas is assembling your scaffold", "Structure coming"
- **Onboarding tone:** "This is a substantial piece of work. Let's give it the structure it needs."

### TIER_RESEARCH_HIGHER_DEGREE → "Bowser-OS" (the heavyweight)
- **Vibe:** Heavyweight intellectual, reflexive, methodologically dangerous
- **Palette:** Obsidian zinc + emerald + acid yellow accents
- **Voice:** Direct, theoretically sharp, allows critique, doesn't soften unnecessarily
- **Mascot art direction:** Heavy, armoured, but learned — think Bowser-meets-Spivak
- **Loading messages:** "Bowser's loading the corpus", "Theoretical weight incoming"
- **Onboarding tone:** "Ready to make your contribution to the field."

### TIER_ACADEMIC_PROFESSIONAL → "Sage" (the elder)
- **Vibe:** Senior, multi-project, doesn't need scaffolding, needs efficiency
- **Palette:** Burgundy + bronze + ink
- **Voice:** Peer-to-peer, terse, expects expertise, no fluff
- **Mascot art direction:** Owl or scholar archetype, gravitas
- **Loading messages:** "Sage is loading your workspace", "Publications queued"
- **Onboarding tone:** "Welcome. Let's set up your workspace."

### TIER_HOMESCHOOL → "Forager" (the family guide)
- **Vibe:** Warm, capable parent-of-many, never patronising to kids
- **Palette:** Forest green + warm terracotta + cream
- **Voice:** Warm, practical, respects parents' expertise, speaks plainly to kids
- **Mascot art direction:** Fox or wombat figure, friendly, capable, Australian
- **Loading messages:** "Forager's gathering the lessons", "Curriculum incoming"
- **Onboarding tone:** "Tell us about your family. We'll build the rest with you."

### TIER_SCHOOLS_B2B → "Hub" (the system)
- **Vibe:** Calm, institutional, dashboard-driven, professional
- **Palette:** Slate + cyan + white
- **Voice:** Administrative, factual, ready to be skimmed
- **Mascot art direction:** Geometric network node, abstract
- **Loading messages:** "Hub is aggregating cohort data", "Analytics ready"
- **Onboarding tone:** "Welcome. Let's connect your cohort."

## What changes per character

### Always changes
- Primary accent colour (token: `--character-accent`)
- Secondary palette
- Loading message copy
- Default voice / register in AI suggestions
- Mascot icon in top-left of canvas
- Welcome screen art
- Email signature on system emails
- Onboarding flow tone
- Confetti / celebration colours

### Sometimes changes
- Font weight emphasis (Bowser-OS heavier, Sparq lighter)
- Animation feel (Sparq snappier, Sage minimal)
- Notification cadence (Sage rarely, Sparq more frequent)
- Default Vibe Meter sweet spot
- Default panel layout

### Never changes (this is critical)
- The 5 Sovereign Layers themselves
- Citation Integrity Engine behaviour
- Receipt generation
- IndexedDB schemas
- Core data model
- Privacy guarantees
- Accessibility minimums (WCAG AA always)
- Australian English (always)
- No em-dashes (always)

## Architectural rule: characters are skins, not products

The character system is a `CharacterService` that:
- Reads active tier from TierService
- Loads matching character config object
- Injects CSS variables (`--character-primary`, `--character-accent`, etc) at root
- Swaps mascot SVG
- Swaps copy strings via i18n-style lookup table

NEVER hard-code character logic into business logic. Components read from CSS variables and copy lookup, never from `if (tier === 'RHD') { ... }`.

This means:
- Adding a new character = config object + SVG + copy file
- No code changes to features
- No risk of breaking other tiers' builds
- Compounds beautifully over time

## Tokens layer

Each character defines token overrides in its config:

```js
// /design/characters/bowser_os.js
export const BOWSER_OS = {
  id: 'bowser_os',
  tier: 'TIER_RESEARCH_HIGHER_DEGREE',
  name: 'Bowser-OS',
  archetype: 'heavyweight',
  
  palette: {
    primary: 'var(--zinc-950)',
    accent: 'var(--emerald-500)',
    highlight: '#E8FF00', // acid yellow
    mute: 'var(--zinc-700)',
  },
  
  copy: {
    welcome: 'Welcome back. Ready to weigh the field?',
    loading: ['Bowser is loading the corpus', 'Theoretical weight incoming', 'Methodological armour engaged'],
    emptyState: 'No projects yet. Let\'s build something defensible.',
  },
  
  voice: {
    register: 'peer-academic',
    softening: 'minimal',
    encouragement: 'sparing',
    critique: 'allowed',
  },
  
  defaults: {
    vibeSweetSpot: { min: 75, max: 95 },
    layerVisibility: 'all',
    notificationFrequency: 'low',
  },
  
  mascotSvg: '/assets/characters/bowser_os.svg',
};
```

Aaron's character is Bowser-OS by default (he's RHD tier). He could theme-swap if he wanted to see what Sage feels like.

## Theme-swap UI

Settings → Appearance → "Try another character":
- Preview each character's vibe
- One-click swap
- Returns to tier default any time
- Aaron might keep Bowser-OS but a senior academic dogfooding might prefer Sage

This unlocks: "what does the product look like for my kid?" curiosity. Users explore other tiers without losing their own.

## Why this is brilliantly cheap engineering

The hard work is the infrastructure underneath. The 5 Sovereign Layers, Receipt, Citation Engine. That's 80% of the build cost.

The character system adds:
- 5-7 SVG mascots (one designer-day each)
- 5-7 copy files (1-2 hours each)
- 5-7 palette tokens (10 minutes each)
- 1 CharacterService (1 day)

Total: 2-3 weeks of work to make Simplifii feel like 7 different products. Each character pulls in totally different audiences with totally different demands. Same engine, different car.

This is the Mario Kart insight: the karts are identical mechanically. The characters are the whole game's personality.

## Risk: identity drift

Critical safeguard: characters cannot override Aaron's brand fundamentals.
- Always Australian English
- Never em-dashes
- Always WCAG AA
- Always privacy-first
- Always Voice DNA respected

A character is a brand layer, not a values override.

## What this sprint should ship

Minimum viable (1-week sprint):
1. CharacterService.js
2. 3 characters defined (Bowser-OS, Compass, Sparq) — covers Aaron's tier + 2 others
3. CSS variable injection
4. Mascot swap in canvas header
5. Copy lookup table
6. Settings → theme-swap UI

Full v1 (3-week sprint):
7. All 7 characters
8. Animation differences per character
9. Email signature theming
10. Welcome screen art per character
11. Mobile app character support

## Dependencies

- Tier architecture (must exist first)
- Design tokens system (already exists)
- Settings UI

## Notes added

- 2026-05-15: Raised by Aaron with the Mario Kart framing — "Bowser-OS character per tier".
- This is the brand differentiator that makes B2B sales easier (each market segment feels custom-built).
- Critical that characters are skins not branches in the code, or maintenance becomes hell.
- Bowser-OS as the RHD/Aaron character is canon now.
