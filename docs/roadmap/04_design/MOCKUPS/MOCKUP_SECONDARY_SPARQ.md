# Mockup: TIER_SECONDARY — Sparq [SPEC]

## Tier identity

- **Tier:** TIER_SECONDARY (Year 11-12, HSC, IB, A-Levels)
- **Character:** Sparq
- **Audience:** 16-18 year olds, often neurodivergent, equity pathway, HSC students
- **Archetype:** Curious apprentice, scrappy, high-energy

## Palette overrides

- Primary: `--zinc-950` (Obsidian base, unchanged)
- Accent: `--electric-blue` (#2E7CF6)
- Secondary accent: `--emerald-500` (carry-through)
- Warm: `--orange-500` (#F97316) for celebrations
- Mascot SVG: lightning bolt motif, energetic angles

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [⚡ Sparq]   Hi Aisha   [🔍]   [⚙]                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   YOUR MAJOR WORK                                                  │
│   ─────────────────────────────────                                │
│                                                                    │
│   ┌──────────────────────────────────────────────────────┐         │
│   │  Science Extension — Investigative Report             │         │
│   │  Due: 23 August 2026  •  87 days to go                │         │
│   │                                                       │         │
│   │  Progress: ████████░░░░░░  47%                        │         │
│   │                                                       │         │
│   │  Last session: Yesterday, 1h 12m                      │         │
│   │  Words: 1,847 of 5,000                                │         │
│   │                                                       │         │
│   │  [▶ Keep going]                                       │         │
│   └──────────────────────────────────────────────────────┘         │
│                                                                    │
│   QUICK START                                                      │
│   ─────────────────────────────────                                │
│   [📷 Photo notes]  [🎙 Voice memo]  [📝 New section]   [🧪 Practice]│
│                                                                    │
│   PRACTICE EXAM ROOM                                               │
│   ─────────────────────────────────                                │
│   Available subjects:                                              │
│   ▷ Biology — 47 questions                                         │
│   ▷ English Advanced — 23 essays                                   │
│   ▷ Mathematics Ext 1 — coming soon                                │
│                                                                    │
│   THIS WEEK                                                        │
│   ─────────────────────────────────                                │
│   📌 Sci Ext peer review due Friday                                │
│   📌 English drafting session Monday                               │
│   📌 Biology trial Tuesday                                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation structure

### Top tabs (clearer for younger users)
- Home (dashboard)
- Major Work (canvas + chapters)
- Practice (exam practice)
- Notes (captured content from photos/voice)
- Calendar (due dates, milestones)

### Less complexity than RHD
- No phases/strands (single major work)
- No methodology log
- No reflexivity log (unless equity pathway flag triggers it)
- Simpler corpus (just "sources" tab)

## Key panels visible

### Major work canvas
- TipTap editor
- Word count vs target (e.g., 1,847 / 5,000)
- Vibe Meter sweet spot 40-60 (don't expect HD register)
- Friendly progress bar prominent
- Brief and rubric tabs visible by default

### Practice mode
- Subject selector
- Question regenerator
- Timer (timed mode)
- Marker breakdown panel
- Confidence-first feedback throughout

### Notes capture
- Photo of textbook page → OCR → editable text
- Voice memo → transcript → editable
- Web article → reader view → save to notes
- Discord export → conversation parser

## Welcome screen

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│        [⚡ Sparq mascot, electric blue spark]           │
│                                                        │
│              Hi! I'm Sparq.                            │
│                                                        │
│        I'll help you with your major work,             │
│        HSC prep, and everything in between.            │
│                                                        │
│   [Tell me about your subjects]                        │
│                                                        │
│         "You've got this. We'll build it together."    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Empty state copy

- "No major work yet. Tell us what you're working on and we'll get started."
- "No practice attempts yet. Pick a subject above to begin."
- "No notes yet. Drop a photo, paste text, or record a voice memo."

## Loading messages (Sparq specific)

- "Sparq's warming up"
- "Let's go!"
- "Almost there"
- "Cooking your scaffold"
- "On the way"

## Confetti / celebration moments

- First 500 words: subtle electric blue spark, "Nice start"
- Section complete: bright burst, sparkle particles, optional sound
- First practice question correct: warm orange pulse
- Major work submitted: full ceremony with Sparq animation

## Voice and copy register

- Encouraging, casual, no jargon
- Treats user as capable, not dumbed-down
- Occasionally playful but never sarcastic
- "Nice work" not "Great job!" (less infantilising)
- "Stuck? Let's break this down" not "I noticed you might be struggling"

## Tier-specific features visible

- Major work canvas (single project focus)
- Practice exam room (HSC-specific, when shipped)
- Quick capture (photo, voice, text paste)
- Brief simplifier (HSC jargon decoder)
- Rubric translator
- Calendar with due dates
- Receipt at submission

## Tier-specific features HIDDEN

- Phases & Strands
- Methodology Log
- Reflexivity Log (unless equity pathway flag set)
- Cross-Phase Amalgamation
- Defence Mode
- Co-author workflows
- Cohort dashboards

## Equity pathway overlay

When user identifies as equity pathway (UNSW Come On, Indigenous, refugee, first-in-family):
- Academic Literacy Coach visible in right rail
- Jargon Decoder hover hints aggressive
- Confidence-building copy emphasised
- Reflexivity Log enabled (lite version for cultural responsiveness)
- Free tier scholarship indicator if applicable

## Family / parent view

If parent has family plan:
- Parent dashboard separate route
- Aaron Junior's progress visible
- Suggested explanations parent can use
- No spying on actual content (parent sees stats, not text)

## Mobile-first considerations

Year 12 users live on phones. Mobile layout is primary, not afterthought.

- Bottom nav (Home / Major Work / Practice / Notes)
- Photo capture prominent (one tap from anywhere)
- Voice memo prominent (long-press anywhere)
- Practice mode optimised for short-burst study (10 min sessions on bus)
- Notifications respectful (opt-in only, customisable)

## Theme-swap behaviour

If Year 12 student theme-swaps to (e.g.) Compass:
- Palette shifts to teal + amber
- Loading messages change
- LAYOUT UNCHANGED (still major work focus, no phases)

Maturity-seeking users (some Year 12s want to feel grown-up) might prefer Compass aesthetic. Sparq aesthetic appeals to younger/more playful preference.

## Build cost

This mockup informs build sprint for TIER_SECONDARY home dashboard. Estimated 1-day sprint after Tier Architecture ships.

## Notes added

- 2026-05-15: Sparq is energetic but never patronising. Critical distinction.
- Equity pathway overlay is the differentiator — Sparq becomes confidence-first scaffolding for students who need it most.
- Mobile-first design is non-negotiable for this tier.
