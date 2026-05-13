# Sovereign Maths — Homework Support for Autistic Learners [SPEC]

## What this is

Step-by-step mathematics support designed specifically for autistic learners, with strong support for ADHD and dyslexia comorbidities. Multiple representations of every problem (visual, verbal, manipulative, equation). Predictable structure. Special interest integration.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15 in context of parents of autistic children struggling with maths.

## Why this matters

Mathematics is where many autistic learners simultaneously excel AND struggle. They often have:
- Pattern recognition strengths (a maths superpower)
- Sequential processing differences (one missed step breaks the whole problem)
- Sensory overwhelm from busy textbook pages
- Special interests that could be brilliant problem contexts
- Resistance to imprecise language ("about", "roughly")
- Strong preference for predictable structure

Standard maths instruction does none of this well. Khan Academy is busy and ad-driven. Math Antics is video-only. Mathletics is gamified but not autism-aware. Reflex Math drills facts but not concepts.

Gap: no maths product designed FROM the start for autistic cognitive style.

## Audience

### Primary
- Autistic children (ages 6-16) struggling with maths
- Their parents (often the de-facto teacher)
- Their teachers (looking for accommodations)

### Secondary
- Twice-exceptional students (gifted + autistic)
- ADHD students with maths anxiety
- Dyslexic students (numbers can flip like letters)
- Dyscalculic students (specific maths learning difference)

## Core design principles

### 1. Predictable structure
Every problem follows the same layout. No surprise. No clutter.

```
┌─────────────────────────────────┐
│  PROBLEM                        │
│  [The question, plain language] │
├─────────────────────────────────┤
│  WHAT YOU NEED TO KNOW          │
│  [Prior concepts, with links]   │
├─────────────────────────────────┤
│  STEP BY STEP                   │
│  Step 1: [tiny action]          │
│  Step 2: [tiny action]          │
│  Step 3: [tiny action]          │
├─────────────────────────────────┤
│  CHECK YOUR ANSWER              │
│  [Reverse process]              │
└─────────────────────────────────┘
```

Every problem in every topic in every year level. Identical layout. Cognitive load drops dramatically.

### 2. Multiple representations (UDL 3.0)

Every concept available as:
- **Words:** Plain language explanation
- **Symbols:** Standard maths notation
- **Visual:** Diagrams, area models, number lines
- **Manipulative:** Drag-and-drop blocks, counters, fractions
- **Real-world:** Concrete scenarios (often using special interests)

User picks their preferred representation. Can switch any time. Concept stays the same.

### 3. Special interest integration

At onboarding, parent enters child's special interests:
- Minecraft
- Pokemon
- Trains / specific train networks
- Dinosaurs
- Pokemon TCG
- Animal Crossing
- Specific YouTube channels
- Chess
- Birds
- Cars
- (free text for anything)

System rewrites problem contexts using these interests:

Generic problem: "A baker makes 24 cupcakes. They give 1/3 to a friend. How many cupcakes does the baker keep?"

Minecraft-personalised: "You mined 24 diamonds in your Minecraft world. You give 1/3 to your friend in multiplayer. How many diamonds do you keep?"

Pokemon-personalised: "Ash caught 24 Pokemon. He trades 1/3 to Brock. How many does Ash keep?"

Train-personalised: "The Sydney Trains T1 line has 24 stations. 1/3 are between Central and Strathfield. How many stations are between Central and Strathfield?"

The maths is identical. The engagement is exponential.

### 4. No surprise sounds, no flashing, no ads

- Zero ambient sound by default
- Sound effects opt-in only, customisable
- No "Great job!" pop-ups (often experienced as patronising or overwhelming)
- No animated mascots
- No streaks (can create anxiety)
- Calm visual palette

### 5. Honest progress

No fake celebrations. Real progress shown plainly:
- "You've worked through 47 problems on fractions."
- "You got 9 of the last 10 questions on equivalent fractions right."
- "You haven't done division yet. Want to try?"

For families that want gamification, opt-in:
- Sticker album (printable)
- Minecraft achievement-style badges
- Parent dashboard celebrations

### 6. Parent dashboard

Parent sees:
- Where child got stuck (specific step in specific problem)
- What helped (which representation they switched to)
- Suggested explanations to try at the kitchen table
- Pattern recognition: "Your child consistently flips digits in 2-digit subtraction. Here's a video that helps."

## Subject coverage

### Year 1 launch
- Number concepts (counting, place value)
- Operations (addition, subtraction)
- Fractions (concept, equivalent, operations)
- Measurement (length, mass, capacity)
- Time
- Basic geometry

### Year 2 expansion
- Decimals, percentages
- Multiplication, division (with manipulatives)
- Area, volume
- Probability
- Algebra introduction
- Coordinate geometry

### Year 3+
- Full Year 7-10 syllabus
- HSC Maths Standard preparation
- Bridging to HSC Extension levels for high-ability autistic learners

## Australian Curriculum alignment

Mapped to ACARA Mathematics v9.0:
- Content strands: Number, Algebra, Measurement, Statistics, Probability, Space
- Proficiency strands: Understanding, Fluency, Reasoning, Problem-Solving
- Year levels: Foundation through Year 10

Optional: alignment to NSW Stage system (Stage 1, 2, 3, 4, 5, 6).

## Special features

### "Read the problem to me" (TTS)
Tap any problem → read aloud in calming voice. Speed adjustable. Helps dyslexic and ESL students.

### "Show me how" (worked example)
Shows step-by-step solution to a similar problem (different numbers). Never the exact problem (so student does their own work).

### "I'm stuck" button
Three levels:
- Level 1: Hint (one step forward)
- Level 2: More hint (next two steps)
- Level 3: Worked example with explanation

Each level logged. Parent can see where stuck-patterns happen.

### Movement breaks
Every 20-30 minutes (configurable):
- Gentle visual cue (no sound by default)
- Suggested movement: "Walk to the kitchen and back. Drink water."
- Timer for return
- Resume exactly where you left off

### Sensory profile
Onboarding asks about sensory preferences:
- Visual: high contrast / low contrast / sepia
- Movement: animations on / off
- Sound: enabled / disabled / customise
- Font: standard / dyslexic
- Reading ruler: on / off
- Number size: small / medium / large

Saves to profile. Applied everywhere.

## Personas

### Persona 1: The Autistic Maths-Anxious Year 4 (Mia, 9)
- Strong reader, struggles with maths
- Special interest: Hairy McLary book series
- Sensory: overwhelmed by busy pages
- Parent helps with homework, both stressed
- Needs: predictable structure, special interest integration, parent guidance

### Persona 2: The Twice-Exceptional Year 8 (Jordan, 13)
- Gifted, autistic, anxious
- Special interest: chess, prime numbers
- Sensory: needs quiet, hates surprise sounds
- Frustrated by school-level maths (too slow)
- Needs: acceleration, no patronising tone, depth not breadth

### Persona 3: The Parent (Sarah, mum to 2 autistic kids)
- Both kids struggle with maths, different ways
- Sarah has ADHD herself
- Wants to help but doesn't know how
- Tired of crying-at-the-table homework battles
- Needs: clear parent guidance, no judgement, kids occupied while parent rests

### Persona 4: The Homeschool Family (Tom, dad homeschooling)
- Two autistic boys, ages 9 and 12
- Following Australian Curriculum but adapting
- Needs to generate progress reports for registration
- Needs: portfolio output, Australian Curriculum mapping, multi-child management

### Persona 5: The Special Education Teacher (Priya)
- Class of 6 autistic students, all different levels
- Limited maths PD
- Needs personalised practice per student
- Needs: classroom mode, student progress dashboard, IEP-aligned reports

## Pricing

- Individual student: $19/month
- Family (up to 4 kids): $39/month
- Homeschool family with reporting: $59/month
- Teacher/SLSO single classroom: $89/month
- Whole-school site licence: tiered

Free tier for families with a verified diagnosis and financial hardship.

## What this sprint should ship

Minimum viable (3-week sprint):
1. Year 4 fractions module (one focused topic, all features)
2. Special interest personalisation (start with 5 interests)
3. Predictable structure layout
4. Multiple representations
5. Parent dashboard
6. Sensory profile
7. Honest progress tracking

Full v1 (12-week sprint):
8. Years 1-6 number, fractions, operations
9. Australian Curriculum mapping
10. Movement breaks
11. Stuck-button with three levels
12. Worked examples
13. Sticker album (opt-in)
14. Mobile app

## Dependencies

- Tier architecture (TIER_SECONDARY can be extended to TIER_PRIMARY, or new tier created)
- Ingestion engine (for homework sheet photos)
- 5 Sovereign Layers adapted for problem-solving (different from writing)

## Why this is a real business

- 1 in 70 Australian children autistic (rising)
- Maths anxiety affects 25%+ of all students
- Existing tools fail autistic learners specifically
- Parents of autistic children pay for solutions (NDIS-fundable potentially)
- Schools struggle to provide individualised maths support
- NDIS-aligned: could be funded as capacity-building under "Improved Learning"

Aaron's connection: directly aligns with neuroinclusion mission. Could partner with Aria Learning (existing client, neurodivergent support specialist).

## Notes added

- 2026-05-15: Raised by Aaron during creative explosion. He noted parents he knows whose autistic kids struggle with maths.
- Possible co-development with Abby at Aria Learning (already supports neurodivergent learners).
- NDIS-fundability would be huge differentiator and revenue model.
