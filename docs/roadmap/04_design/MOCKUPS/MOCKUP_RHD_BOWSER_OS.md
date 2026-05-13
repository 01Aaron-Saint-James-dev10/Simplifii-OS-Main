# Mockup: TIER_RHD — Bowser-OS [SPEC]

## Tier identity

- **Tier:** TIER_RESEARCH_HIGHER_DEGREE
- **Character:** Bowser-OS
- **Audience:** Honours / MRes / PhD / postdoc research candidates
- **Aaron's tier:** YES (dogfood priority)
- **Archetype:** Heavyweight intellectual, reflexive, methodologically dangerous

## Palette overrides

- Primary: `--zinc-950` (Obsidian base, unchanged)
- Accent: `--emerald-500` (#10B981)
- Highlight: `--acid-yellow` (#E8FF00) — sparingly, for milestone moments
- Mute: `--zinc-700`
- Mascot SVG: heavy armoured figure, learned silhouette

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [🛡 Bowser-OS]   Aaron Saint-James   [🔍 search]   [⚙]            │
├─────────────┬──────────────────────────────────────────────────────┤
│             │                                                      │
│  PROJECT    │   ACTIVE PROJECT                                     │
│             │   ─────────────────────────────────────              │
│  ▼ MRes     │   UDL 3.0 Adoption Across Australian Universities    │
│    Phase 1  │   Phase 1 of 3 • Strand 2 of 2 active                │
│    ▼ S1 ✓   │                                                      │
│    ▼ S2 ●   │   ┌──────────────┬──────────────┬──────────────┐    │
│      Ch 4   │   │ Methodology  │ Reflexivity  │ Supervisor   │    │
│      Ch 5 ● │   │ Log          │ Log          │ Feedback     │    │
│    Ch 1     │   │              │              │              │    │
│    Ch 2     │   │ 47 entries   │ 23 entries   │ 12 items     │    │
│    Ch 3     │   │ Last: today  │ Last: 3 days │ 3 unaddressed│    │
│    Ch 6     │   └──────────────┴──────────────┴──────────────┘    │
│    Ch 7     │                                                      │
│             │   RECENT SESSIONS                                    │
│  ▷ Phase 2  │   ─────────────────────────────────────              │
│  ▷ Phase 3  │   Today        2h 14m   Ch 5 • added 487 words      │
│             │   Yesterday    1h 47m   Ch 5 • 234 words            │
│  CORPUS     │   2 days ago   3h 02m   Ch 4 • finalised section    │
│  47 sources │                                                      │
│  3 unverif. │   [▶ Resume Chapter 5]                               │
│             │                                                      │
│  RECEIPT    │   CORPUS SNAPSHOT                                    │
│  87% auth.  │   ─────────────────────────────────────              │
│             │   47 verified citations • 23 sources awaiting verify │
│             │   Recent: Cumming 2024, Hamraie 2019, ADCET 2022     │
│             │   [Open corpus] [+ Add source]                       │
│             │                                                      │
└─────────────┴──────────────────────────────────────────────────────┘
```

## Navigation structure (left rail)

### Always visible
- Active Project hierarchy (Phase → Strand → Chapter tree)
- Corpus indicator (sources count + unverified flag)
- Receipt indicator (auth score)
- Settings / appearance toggle

### Collapsible sections
- Other projects (if multiple — rare for RHD)
- Archived chapters
- Reference library

### Bottom anchor
- Aaron's name + character mascot small
- Sync status (local-first, but show if syncing)
- Help / docs link

## Key panels visible

### Primary canvas area
- TipTap editor (existing build)
- 5 Sovereign Layers accessible via right rail or slash commands
- Vibe Meter top-right, sweet spot 75-95 (RHD calibration)
- Word count, session timer, Pomodoro state

### Right rail (collapsible)
- References Manager (R tab)
- Live Tutor (T tab)
- Brief / Rubric (B tab)
- Sources (S tab) — when added separately from References
- Authenticity Receipt (A tab)
- Check Against Rubric (C tab)

### Bottom strip
- Real-time status: word count delta, session duration, last save
- Co-writing indicator (X others writing — when Co-Writing Rooms ship)
- Submit-to-LMS button (when LMS integration ships)

## Welcome screen (first login as RHD)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│        [Bowser-OS mascot, heavy emerald glow]          │
│                                                        │
│              Welcome to Sovereign Research              │
│                                                        │
│         Ready to make your contribution to the field.  │
│                                                        │
│   [Set up your project]    [Import existing thesis]    │
│                                                        │
│                                                        │
│         "The corpus awaits. The findings unfold."      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Empty state copy

- "No active chapter. Pick a chapter from your project tree to begin."
- "Corpus empty. Drop your first sources to get started."
- "Methodology Log empty. Capture your first decision when ready."

## Loading messages (Bowser-OS specific)

- "Bowser-OS is loading the corpus"
- "Theoretical weight incoming"
- "Methodological armour engaged"
- "Citation chain verifying"
- "Reflexive register loading"

## Confetti / celebration moments

- Chapter complete: deliberate emerald pulse, 600ms, no sound by default
- Phase complete: full-screen emerald flash with acid yellow highlight, mascot animation, optional Bowser-OS deep tone
- Thesis complete: ceremonial sequence (3-second), Receipt generated, optional ritual moment
- All celebrations user-toggleable (some users want zero, some want full)

## Voice and copy register

- Direct, theoretically sharp
- Allows critique
- Doesn't soften unnecessarily
- Peer-academic register
- "Ready to defend?" not "You can do this!"
- "Corpus shows tension" not "There might be a small issue"
- Critical without bitterness

## Tier-specific features visible

- Phases & Strands (RHD only)
- Methodology Log (RHD + Honours/Masters)
- Reflexivity Log (RHD prominent, optional Honours/Masters)
- Cross-Phase Amalgamation (RHD only)
- Defence Mode (RHD only)
- Full corpus management
- Voice DNA enforcement (toggleable)

## Mobile layout (when shipped)

- Single column
- Project tree as hamburger menu
- Editor primary
- Right-rail features as bottom drawer
- Practice Mode optimised for camera + mic on phone
- Quick capture (photo, voice memo) prominent

## Aaron's seed data displayed

On first login as Aaron (RHD pre-seeded):
- Project: "UDL 3.0 Adoption Across Australian Universities"
- Supervisor: Prof Terry Cumming
- Phase 1 active with 2 strands
- 7 chapters with statuses
- 5+ methodology log entries (SA merger pivot, Strand 2 broadening)
- 5+ reflexivity log entries (dual UNSW role, lived experience, power dynamics)
- 10+ corpus seed sources (Thorpe 2025, Cumming 2024, ADCET 2022, etc)

## Theme-swap behaviour

If Aaron switches theme to (e.g.) Sage:
- Palette changes (bronze + burgundy)
- Mascot changes (owl/scholar)
- Loading messages change to Sage register ("Sage is loading your workspace")
- LAYOUT UNCHANGED (still phase/strand/chapter)
- Methodology + Reflexivity logs still visible
- Container shape preserved

This is the toggle promise.

## Build cost

This mockup informs the build sprint for TIER_RHD. The build sprint itself is "Sprint 4: Sovereign Research MVP" in the priority queue (6-8 hours).

This mockup file is the SPEC for that build. No additional design sprint needed.

## Notes added

- 2026-05-15: First mockup file. Aaron's tier, dogfood priority, first to ship.
- Palette intentionally heavyweight: zinc-950 + emerald + acid yellow = serious researcher aesthetic without coldness.
- Layout shape (phase/strand/chapter) is the data law. Theme can shift; structure cannot.
