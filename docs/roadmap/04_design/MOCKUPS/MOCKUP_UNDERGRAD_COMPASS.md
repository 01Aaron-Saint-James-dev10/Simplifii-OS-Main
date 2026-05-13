# Mockup: TIER_UNDERGRAD — Compass [SPEC]

## Tier identity

- **Tier:** TIER_UNDERGRAD
- **Character:** Compass
- **Audience:** Bachelor's degree students, mature-age returners, TAFE bridging students
- **Archetype:** Steady navigator, smart-but-not-show-off, dependable

## Palette overrides

- Primary: `--zinc-950` (Obsidian base)
- Accent: `--teal-500` (#14B8A6)
- Secondary: `--amber-500` (#F59E0B) for warmth in highlights
- Mascot SVG: compass rose, geometric, clean

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [🧭 Compass]   Aaron Saint-James   [🔍]   [⚙]                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   THIS WEEK                                                        │
│   ─────────────────────────────────                                │
│                                                                    │
│   ┌─────────────────────────────┬─────────────────────────────┐   │
│   │  PSYC1011 — Essay Due Fri   │  ECON1101 — Quiz Due Wed    │   │
│   │  Word count: 1,247 / 2,000  │  Practice attempts: 3       │   │
│   │  Last session: yesterday    │  Average: 78%               │   │
│   │  [▶ Continue]               │  [▶ Practice more]          │   │
│   └─────────────────────────────┴─────────────────────────────┘   │
│                                                                    │
│   YOUR COURSES                                                     │
│   ─────────────────────────────────                                │
│   ▷ PSYC1011 Introduction to Psychology     4 assessments         │
│   ▷ ECON1101 Microeconomics 1               6 assessments         │
│   ▷ ARTS1690 Sociology of Difference        3 assessments         │
│   ▷ BIOL1002 Molecules, Cells, and Genes    5 assessments         │
│                                                                    │
│   RECENT WORK                                                      │
│   ─────────────────────────────────                                │
│   Yesterday    PSYC1011 Essay        1h 47m   added 487 words    │
│   2 days ago   ECON1101 Tutorial      45m     practice           │
│   3 days ago   ARTS1690 Reflection    1h 12m  final draft        │
│                                                                    │
│   STUDY SESSIONS                                                   │
│   ─────────────────────────────────                                │
│   This week: 8h 34m across 12 sessions                            │
│   Streak: 5 days [Disable streaks ⓘ]                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation structure

### Top tabs / left rail
- Home (this week overview)
- Courses (per-course canvas)
- Practice (per-course practice exam)
- Notes (captured content)
- Calendar
- Library (cross-course sources)

### Per-course view
Each course expands to:
- Course info (lecturer, semester, enrolment status)
- Assessments list with due dates
- Active draft for current assessment
- Lecture content (uploaded slides, recordings, readings)
- Course-specific corpus

## Key panels

### Assessment canvas
- TipTap editor with brief, rubric visible
- Vibe Meter sweet spot 55-75 (HD register expected for undergrads)
- 5 Sovereign Layers accessible
- Citation Engine fully active (APA7, Harvard, Vancouver common for undergrads)

### Course-level corpus
- Lecture slides
- Required readings
- Tutorial materials
- Lecturer's marking guide
- Past student exemplars (with permission)

### Practice exam (when shipped)
- Multiple choice practice
- Short answer practice
- Question regenerator
- Performance tracking per topic

## Welcome screen

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│        [🧭 Compass rose, teal accent]                   │
│                                                        │
│              Welcome to Sovereign.                     │
│                                                        │
│        Ready to navigate. What are we working on?      │
│                                                        │
│   [+ Add your first course]                            │
│   [Upload your timetable]                              │
│                                                        │
│         "Let's figure out where you're heading."       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Empty state copy

- "No courses added yet. Start by adding your first course."
- "No active assessment. Pick a course and assessment to begin."
- "No practice attempts yet. Practice helps. Try one."

## Loading messages (Compass specific)

- "Compass is plotting your course"
- "Navigating to your work"
- "On the way"
- "Charting your assessment"

## Confetti / celebration moments

- Section complete: smooth teal sweep, directional
- Assessment submitted: Compass animation, optional gentle chord
- HD result received: subtle, dignified, no overshoot

## Voice and copy register

- Direct, supportive, treats user as adult
- Occasionally witty without forcing it
- "Nice work on the intro" not "Amazing job!"
- "This section needs more evidence" not "Hmm, could you maybe add more?"
- Confident, never anxious

## Tier-specific features visible

- Per-course organisation
- Multiple assessments tracked
- Cross-assessment progress
- Practice mode (when shipped)
- Receipt per assessment
- Communications Layer (email lecturer, supervisor for honours students)
- Full Citation Engine

## Tier-specific features HIDDEN by default

- Phases & Strands (Honours-Masters territory)
- Methodology Log (only if Honours capstone)
- Reflexivity Log
- Cross-Phase Amalgamation
- Defence Mode

## Honours upgrade path

If undergrad enrolls in Honours, they tier-upgrade with confirmation:
- Existing courses migrate
- Thesis project added
- Methodology Log enabled
- Reflexivity Log enabled (optional)
- Character defaults to Atlas (or user keeps Compass)

## Mature-age returner variant

If user identifies as mature-age:
- Less academic-jargon onboarding
- Voice DNA emphasis (preserve their existing voice)
- Optional Academic Literacy Coach
- Family-friendly time tracking (study squeezed between life)

## Equity pathway overlay

If user identifies as equity pathway:
- Academic Literacy Coach visible
- Jargon Decoder active
- Confidence-first copy
- Reflexivity Log enabled lite
- Free tier eligibility checked

## Theme-swap behaviour

Compass is intentionally neutral — many users will keep it. Swappable to:
- Sparq (younger feel, energetic)
- Atlas (heavier, more academic)
- Bowser-OS (if user wants the research aesthetic)

Layout stays course-assessment-draft.

## Build cost

This mockup informs build sprint for TIER_UNDERGRAD home dashboard. Estimated 1-day sprint after Tier Architecture ships.

The CURRENT canvas-first build (v2-rebuild-canvas-first) already assumes Undergrad-shaped data. This mockup formalises that shape.

## Notes added

- 2026-05-15: Compass is the "default" character. Many users land here.
- Layout = current build's existing assumption. Minimal new design work needed.
- Equity overlay is critical (Sovereign Pathways elements live here for undergrad equity students).
