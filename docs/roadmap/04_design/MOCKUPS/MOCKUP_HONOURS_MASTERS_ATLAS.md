# Mockup: TIER_HONOURS_MASTERS — Atlas [SPEC]

## Tier identity

- **Tier:** TIER_HONOURS_MASTERS_COURSEWORK
- **Character:** Atlas
- **Audience:** Honours thesis, coursework Masters dissertation, professional doctorate students
- **Archetype:** Methodical scaffolder, dependable, slightly serious

## Palette overrides

- Primary: `--zinc-950` (Obsidian)
- Accent: `--olive-500` (#84A98C)
- Secondary: `--parchment` (#F5EFE6) for warmth in card highlights
- Mascot SVG: classical Atlas figure carrying structured weight

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [⛰ Atlas]   Aaron Saint-James   [🔍]   [⚙]                          │
├─────────────┬──────────────────────────────────────────────────────┤
│             │                                                      │
│  THESIS     │   ACTIVE THESIS                                      │
│             │   ─────────────────────────────────                  │
│  Ch 1 ✓     │   "Inclusive Curriculum Design at NSW Universities"  │
│  Ch 2 ✓     │   Honours • Year 1 • 6 of 12 months                  │
│  Ch 3 ●     │                                                      │
│  Ch 4       │   Word count: 18,247 / 30,000                        │
│  Ch 5       │   ████████████░░░░░░░░  61%                          │
│             │                                                      │
│  COURSEWORK │   Supervisor: Prof Terry Cumming                     │
│  3 modules  │   Last meeting: 5 days ago                           │
│  active     │   Next meeting: Monday                               │
│             │                                                      │
│  CORPUS     │   ┌──────────────┬──────────────┐                    │
│  34 sources │   │ Methodology  │ Supervisor   │                    │
│             │   │ Log          │ Feedback     │                    │
│  RECEIPT    │   │              │              │                    │
│  82% auth.  │   │ 23 entries   │ 5 items      │                    │
│             │   └──────────────┴──────────────┘                    │
│             │                                                      │
│             │   RECENT SESSIONS                                    │
│             │   Yesterday    2h 47m   Ch 3 — added 612 words      │
│             │   2 days ago   1h 30m   Ch 3 — refined argument     │
│             │   3 days ago   3h 12m   Ch 2 — supervisor revisions │
│             │                                                      │
│             │   [▶ Continue Chapter 3]                             │
│             │                                                      │
│             │   COURSEWORK STATUS                                  │
│             │   ─────────────────────────────────                  │
│             │   EDUC4001 Research Methods    Term ends Friday      │
│             │   EDUC4002 Pedagogy            Quiz due Monday       │
│             │   EDUC4003 Special Topics      No active assessment  │
│             │                                                      │
└─────────────┴──────────────────────────────────────────────────────┘
```

## Navigation structure

### Left rail
- Thesis chapters (linear, like a book TOC)
- Coursework modules (3-4 typical)
- Corpus (cross-thesis sources)
- Receipt

### Different from RHD
- No phases or strands (single research project, single year)
- Methodology Log visible (Honours is methodological)
- Reflexivity Log optional (depends on thesis type)
- Supervisor integration full
- Coursework AND thesis both visible (Honours students juggle both)

## Key panels

### Thesis canvas
- TipTap editor with chapter navigation
- 5 Sovereign Layers active
- Vibe Meter sweet spot 65-85 (academic register expected)
- Methodology Log accessible right rail
- Supervisor feedback panel

### Coursework canvas
- Course-specific assessment view
- Inherits Undergrad-style features
- Linked to thesis (e.g., research methods course generates content used in thesis)

### Cross-thesis corpus
- Single corpus for the entire thesis
- Verification flow active
- Citation Engine all styles

## Welcome screen

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│        [⛰ Atlas figure, olive glow]                     │
│                                                        │
│              Welcome to your thesis year.              │
│                                                        │
│        This is substantial. Let's give it the          │
│        structure it needs.                             │
│                                                        │
│   [Set up your thesis]   [Add your coursework]         │
│                                                        │
│         "Brick by brick. Section by section."          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Empty state copy

- "Chapter empty. Begin with an outline, or use Layer 1 Logic Frame to scaffold."
- "Methodology Log empty. Capture your first decision."
- "Corpus empty. Drop your first sources or import from Zotero / EndNote."

## Loading messages (Atlas specific)

- "Atlas is assembling your scaffold"
- "Structure coming"
- "Building the section"
- "Scaffold rising"

## Confetti / celebration moments

- Section complete: building blocks settling animation, olive accent
- Chapter complete: full ceremony, mascot lifts weight, optional deep tone
- Thesis complete: ceremonial sequence with Receipt generation

## Voice and copy register

- Considered, methodological
- Supportive on bigger lifts
- Treats thesis as serious work without being grim
- "This argument needs another supporting point" not "needs more"
- "Strong methodological grounding here" specific feedback
- Calm authority

## Tier-specific features visible

- Linear chapter structure (Ch 1 → Ch 5/6/7 typical)
- Methodology Log
- Supervisor integration (full)
- Reflexivity Log (optional toggle)
- Coursework alongside thesis
- Single corpus for thesis
- Receipt
- Ethics tracking (sometimes required)

## Tier-specific features HIDDEN

- Phases & Strands (RHD only)
- Cross-Phase Amalgamation (RHD only)
- Defence Mode (RHD only)
- Co-author flows (Academic only)
- Multi-project workspace (Academic only)

## Honours → MRes/PhD upgrade path

If Honours student progresses to MRes/PhD:
- Tier upgrades to TIER_RESEARCH_HIGHER_DEGREE
- Existing thesis migrates
- New phases/strands added
- Existing chapters preserved
- Methodology Log carries over
- Character defaults to Bowser-OS (or user keeps Atlas)

## Aaron's hypothetical Honours seed

If Aaron had been at Honours tier (he isn't, his MRes is RHD tier):
- Single thesis "Inclusive Curriculum Design at NSW Universities"
- 5 chapters mapped
- Prof Cumming as supervisor
- Reflexivity Log enabled (his lived experience methodology)

This is illustrative — Aaron's actual tier is RHD.

## Theme-swap behaviour

Atlas is structured and serious. Some Honours students might prefer:
- Compass (lighter feel for less-imposter-syndrome users)
- Bowser-OS (those who want to feel like researchers already)

Layout stays linear chapter + coursework dual structure.

## Build cost

This mockup informs Honours-Masters build. Estimated 1-2 day sprint after Tier Architecture.

Lower priority than RHD (Aaron's tier) and Secondary (HSC opportunity).

## Notes added

- 2026-05-15: Atlas is the "thesis year" character. Heavier than Compass, lighter than Bowser-OS.
- Coursework + thesis dual structure is unique to this tier. Other tiers have one or the other.
- Many Honours students don't realise they need methodology + reflexivity scaffolding. Atlas makes it visible without being prescriptive.
