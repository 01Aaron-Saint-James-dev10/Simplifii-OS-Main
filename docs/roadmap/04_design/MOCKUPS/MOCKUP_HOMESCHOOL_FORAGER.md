# Mockup: TIER_HOMESCHOOL — Forager [SPEC]

## Tier identity

- **Tier:** TIER_HOMESCHOOL
- **Character:** Forager
- **Audience:** Australian homeschool families, often neurodivergent
- **Archetype:** Warm, capable parent-of-many, never patronising to kids

## Palette overrides

- Primary: `--zinc-950` (Obsidian base) OR optional warm-mode `--stone-900` (#1C1917)
- Accent: `--forest-green` (#2D6A4F)
- Secondary: `--terracotta` (#E76F51)
- Cream highlight: `--cream` (#FAF3E7) for warmth
- Mascot SVG: fox or wombat figure, friendly Australian wildlife

## Layout architecture (different from research tiers)

Homeschool layout is family-centric. Top of page = family overview. Per-child sections below. Different data shape than RHD/Undergrad.

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [🦊 Forager]   The Saint-James Family   [🔍]   [⚙]                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   TODAY                                                            │
│   ─────────────────────────────────                                │
│                                                                    │
│   ┌────────────────────────────┬─────────────────────────────┐    │
│   │  MILO (8)                  │  EVA (11)                   │    │
│   │  Year 3 • Forager mode     │  Year 6 • Forager mode      │    │
│   │                            │                             │    │
│   │  Current Quest:            │  Current Quest:             │    │
│   │  🌿 The Fraction Forest    │  ⚡ Numbers & Patterns      │    │
│   │                            │                             │    │
│   │  Progress: ████░░░  3 of 7 │  Progress: ██████░  6 of 7  │    │
│   │                            │                             │    │
│   │  Suggested today:          │  Suggested today:           │    │
│   │  • Quest step 4 (30 min)   │  • Quest step 7 (45 min)    │    │
│   │  • Reading time (20 min)   │  • Science investigation    │    │
│   │  • Nature walk             │  • Free reading             │    │
│   │                            │                             │    │
│   │  [▶ Start with Milo]       │  [▶ Start with Eva]         │    │
│   └────────────────────────────┴─────────────────────────────┘    │
│                                                                    │
│   FAMILY CALENDAR                                                  │
│   ─────────────────────────────────                                │
│   Today: home day                                                  │
│   Tomorrow: Park play group 10am                                   │
│   Friday: NSW Registrar Q2 report due                              │
│                                                                    │
│   PORTFOLIO STATUS                                                 │
│   ─────────────────────────────────                                │
│   Milo: 47 quest captures this term                                │
│   Eva: 62 quest captures this term                                 │
│   Next NSW report: 76% built [Open]                                │
│                                                                    │
│   PARENT NOTES                                                     │
│   ─────────────────────────────────                                │
│   "Milo loved the volcano experiment yesterday. Eva read           │
│    Harry Potter for 90 minutes uninterrupted."                     │
│   [+ Add note]                                                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation structure

### Top tabs
- Home (family overview)
- [Child name] — one tab per child (each child has their own canvas)
- Curriculum (refactor any source)
- Portfolio (auto-built evidence)
- Reports (state-specific)
- Resources (community, support)

### Per-child view
Each child has their own canvas with:
- Current quest
- Subjects map
- Special interests profile
- Sensory settings
- Quest history
- Portfolio captures

### Parent dashboard
- Cross-child analytics
- Engagement patterns
- Stuck points (where each child needs help)
- Suggested explanations
- Resource library

## Key panels

### Curriculum Refactor (the killer feature)
- Big drop zone: "Drop any lesson here"
- Source types: Euka PDF, YouTube link, textbook photo, web article, hand-written notes
- AI extracts learning outcomes
- AI refactors with UDL 3.0 + special interests
- Output options: text lesson, podcast script, video quest, hands-on activity, debate

### Quest Mode
- Kids see "Quest 1: The Discovery"
- Parents see "Module 4: Fractions — ACMNA086"
- Same underlying content, different framing
- Toggle for older kids who don't want gamification

### Portfolio builder
- Auto-captures completed quest evidence (text, photos, video)
- Australian Curriculum descriptor mapping
- One-click report generation per state:
  - NSW: NESA portfolio + plan
  - VIC: VRQA work samples
  - QLD: HEU education plan
  - SA, WA, TAS, NT, ACT formats

### Co-learning mode
- Parent and child see lesson together
- Adult-level explainer for parent
- Age-appropriate for child
- "I don't know fractions either" support

## Welcome screen (first family signup)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│      [🦊 Forager mascot, warm green glow]               │
│                                                        │
│         Welcome, friend.                               │
│                                                        │
│       Tell us about your family.                       │
│       We'll build the rest with you.                   │
│                                                        │
│   How many kids?                                       │
│   [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5+ ]                        │
│                                                        │
│   What state are you in?                               │
│   [NSW] [VIC] [QLD] [SA] [WA] [TAS] [NT] [ACT]         │
│                                                        │
│   [Continue]                                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Followed by per-child setup:
- Name, age, year level
- Special interests (free text + suggestions)
- Sensory profile (calm visual / sound preferences / movement needs)
- Strengths and areas to grow
- Any diagnoses (optional, helps personalisation)

## Empty state copy

- "Welcome. Set up your first child to begin."
- "No quests started yet. Drop a curriculum source or pick a suggested quest."
- "Portfolio empty. As Milo completes quests, evidence builds here automatically."

## Loading messages (Forager specific)

- "Forager's gathering the lessons"
- "Curriculum incoming"
- "Warming up the quest"
- "Brewing the story"

## Confetti / celebration moments

- Quest step complete: warm petals or leaves fall briefly
- Quest complete: full celebration with Forager animation, optional warm bell sound, sticker added to sticker album (opt-in)
- Term complete: portfolio celebration, gentle pride moment for parent

## Voice and copy register

- Warm, practical, respects parents' expertise
- Speaks plainly to kids (no patronising)
- Australian phrases natural ("Good on ya" feels right; "Awesome job!" feels off)
- Recognises parent capability (no "Let me teach you how to homeschool")
- Recognises child curiosity (no "Time for boring fractions!")

## Tier-specific features visible

- Curriculum Refactor pipeline
- Quest Mode toggle
- Special interest integration prominent
- Multi-child management
- Family calendar
- State-specific reporting
- Portfolio auto-builder
- Sensory profile per child
- Co-learning mode

## Tier-specific features HIDDEN

- Methodology Log
- Reflexivity Log
- Phases & Strands
- Defence Mode
- Co-author flows
- Institutional dashboards
- Citation Engine in academic form (kids don't need APA 7)

## Quest Mode design

For kids:
- Big, vibrant quest cards
- "Quest 1: The Number Wizardry"
- Forest-themed background art (subtle, never overwhelming)
- Progress shown as path through forest
- Sticker rewards (opt-in)
- No streaks (anxiety-inducing)
- No time pressure (unless parent enables timed practice)

For parents (toggle in settings):
- Same quest, different labels
- "Year 3 Mathematics — Fractions" instead of "Quest 1"
- Australian Curriculum descriptor codes visible
- Time tracking visible
- Skip-to-section if kid masters fast

## Mobile considerations

Many homeschool parents teach on iPads:
- Tablet layout primary (Surface, iPad, Galaxy Tab)
- Phone layout for parent-on-the-go (check portfolio, capture nature walk photos)
- Touch-first interactions
- Apple Pencil / S Pen support for kids' handwriting capture

## NDIS-funded user variant

If family has NDIS funding:
- Subtle NDIS branding (logo discreet)
- Plan manager invoice integration
- Different terminology where appropriate ("Improved Learning supports" rather than "products")
- Quarterly support coordinator report option

## Theme-swap behaviour

If homeschool family theme-swaps to Bowser-OS:
- Palette shifts (darker, more emerald)
- LAYOUT UNCHANGED (still family/kids/quests)
- Quest Mode still optional toggle
- Some teenage kids might prefer the darker aesthetic

## Build cost

This mockup informs Sovereign Home build. Estimated 4-week sprint to launch with 1 subject coverage; full v1 is 16-week sprint.

Build sequence:
1. Family + child data model
2. Quest Mode UI
3. Special interest integration
4. Curriculum Refactor pipeline (single source type to start: PDF)
5. State reporting (NSW first)
6. Portfolio auto-builder

## Notes added

- 2026-05-15: Forager is warm, never twee. Australian aesthetic (fox/wombat) over generic friendly mascot.
- Quest Mode is core differentiator. Same content, different framing per kid preference.
- NDIS variant is the revenue unlock.
- Pairs with Aria Learning partnership for clinical-grade NDIS-aligned delivery.
