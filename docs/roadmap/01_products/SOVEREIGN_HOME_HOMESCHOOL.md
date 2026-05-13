# Sovereign Home — Homeschool Annexation [SPEC]

## What this is

A homeschool platform that ingests existing curriculum (Euka, Simply Homeschool, state syllabi) and refactors it through UDL 3.0. Generates state-compliant progress reports. Tracks Australian Curriculum v9.0 alignment. Built for the families the mainstream system forgot.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15 with the "Curriculum Alchemist" framing.

## Market

Australia has 30,000+ registered homeschool families. Growing 10-15% annually. Disproportionately autistic / ADHD / twice-exceptional. Many removed from mainstream because mainstream failed them.

Existing tools:
- Euka: $99-149/month for static PDFs, content quality variable
- Simply Homeschool: $29/month, curriculum tracker only
- Khan Academy: free but generic, not Australia-aligned
- Wolsey Hall: $200+/month, UK-focused
- Schools of Distance Education: state-run, limited choice

Gap: no platform built for neurodivergent homeschool families that genuinely refactors curriculum.

## The Curriculum Alchemist concept

Parent uploads existing curriculum content (Euka PDFs, state syllabus, textbook chapter, YouTube link). System:

1. **Extracts learning outcomes** (which Australian Curriculum descriptors does this cover?)
2. **Identifies pedagogy gaps** (where is this not UDL-aligned?)
3. **Refactors content** into UDL 3.0 format with:
   - Multiple means of representation (text, video, audio, interactive)
   - Multiple means of engagement (special interest framing, real-world application)
   - Multiple means of expression (write / video / build / present)
4. **Outputs structured lesson** ready to teach
5. **Tracks completion against Australian Curriculum**

This is the "Refinery" model: raw material in (existing content), refined output (UDL-aligned lesson).

## State curriculum compliance

Australian homeschool registration varies by state:
- NSW: NESA registration, portfolio + plan annually
- VIC: VRQA registration, samples of work
- QLD: Home Education Unit, education plan + report
- SA: SACE-aligned, reporting twice a year
- WA: Department registration, education programme
- TAS: Office of Education Registrar, written plan
- NT: Department of Education, annual report
- ACT: Education Directorate, annual notification

Sovereign Home generates state-specific reports automatically. Parent presses "Generate Q2 Report" → portfolio document for their state's registrar.

## Australian Curriculum v9.0 alignment

Every lesson, every output, every project mapped to:
- Learning Area (English, Maths, Science, etc)
- Year Level / Band (F, 1-2, 3-4, 5-6, 7-8, 9-10)
- Content Descriptor codes
- Achievement standards

The system shows parents and students a live map of coverage. "You've covered 73% of Year 5 Mathematics descriptors so far this year."

## Core features

### 1. Curriculum Refactor Mode

Upload anything → system refactors:
- Euka PDF lesson → multi-modal UDL version with special interest framing
- Lecturer YouTube → transcribed, structured, with check-questions
- Textbook chapter → broken into 3 difficulty levels (struggling / on-track / extension)
- News article → adapted reading level

### 2. Quest Mode (kid-facing)

Instead of "Stage A: Foundation Maths" → "Quest 1: The Number Wizardry"
Instead of "Module 4: Fractions" → "The Fraction Forest"
Instead of "Assessment Task 2" → "The Number Wizardry Trial"

Engagement framing. Not infantilising. Properly themed (think Pokemon-quality, not toddler-quality).

Parent can toggle Quest Mode off for older / different-preference learners. Default off for ages 14+.

### 3. Special Interest Integration (shared with Maths product)

Onboarding gathers each child's interests. System weaves them through every subject.

Minecraft-obsessed Year 4 doing biology? Lessons reference biomes, mob behaviour, breeding mechanics — all real biology dressed in Minecraft.

Trains-obsessed Year 7 doing geography? Sydney Trains network as the case study for human geography, transport, urban planning.

### 4. Multi-Child Management

Family has 2-5 kids at different stages. Parent dashboard:
- Each child's profile, sensory settings, interests
- Combined timetable suggestions (when can siblings learn together?)
- Cross-age collaboration prompts (older teaches younger = both benefit)
- Individual progress per child
- Combined reporting for registrars

### 5. Portfolio Generation (the killer feature)

State registrars require evidence. Sovereign Home builds it as you go:
- Every completed quest captured (text, photo, video)
- Worked examples preserved
- Progress over time documented
- Australian Curriculum mapping included
- Parent commentary fields
- Authenticity Receipts (child's actual time-on-task, engagement, output)

Press "Generate NSW Registrar Report" → 30-page portfolio PDF appears. Designed for registrar review. Parent edits before submitting.

### 6. Co-Learning Mode

For parents who feel out of their depth:
- "I don't know fractions either. Learn alongside your child."
- Parent and child see the same lesson
- Parent gets adult-level explainer
- Child gets age-appropriate
- Shared completion tracking
- Removes the "expert teacher" pressure on parents

### 7. Movement and Sensory Breaks

Every 30-45 minutes (per child profile):
- Suggested movement (walk, dance, jump)
- Sensory regulation (heavy work suggestion, calm-down activity)
- Hydration prompts
- Snack reminder

### 8. The Authenticity Report for Kids

Per child, per term:
- Total learning hours
- Subjects covered
- Quests completed
- Heart-rate variability if wearable connected (stress indicator)
- Time on task
- Engagement patterns
- Strengths identified
- Areas to grow

For parents: real evidence their child IS learning, even if it doesn't look like school.
For registrars: undeniable proof.

## Subject coverage

Year 1 launch:
- English (reading, writing, speaking) F-Year 6
- Mathematics F-Year 6
- Science F-Year 6
- HASS (History, Geography, Civics, Economics) F-Year 6
- The Arts F-Year 6

Year 2 expansion:
- Year 7-10 full coverage
- Health & PE
- Technologies (Design, Digital)
- Languages (Japanese, French, Italian, Auslan, Mandarin)

Year 3+:
- HSC / VCE / QCE pathways
- Vocational pathways
- University preparation
- Adult learner re-entry

## Personas

### Persona 1: The Burned-Out Mum (Tracey, 38, two autistic boys ages 8 and 11)
- Pulled both kids from school after meltdowns and bullying
- Both diagnosed autism + ADHD
- Tracey works part-time, manages everything else
- Currently spending $200/month on tutors, $99 on Euka, $30 on Mathletics, $40 on reading apps
- Needs: ONE platform that does it all, less screen-shaped chaos
- Sovereign Home replaces 4 subscriptions at $59/month family plan

### Persona 2: The Confident Educator (Helen, 45, three kids ages 6, 9, 13)
- Former teacher, intentional homeschooler
- All three kids gifted, one twice-exceptional
- Knows pedagogy, wants flexibility and Australian Curriculum alignment
- Needs: state-compliance automation, multi-child management, depth over hand-holding
- Sovereign Home as professional tool, not curriculum dictator

### Persona 3: The Single Dad (Marcus, 51, one autistic son age 13)
- Lost his wife to cancer 2 years ago
- Pulled son from school during grief
- Marcus is finance background, no education training
- Son has special interest in chess, climate change
- Needs: Marcus to feel capable, son to feel valued
- Sovereign Home as co-pilot for Marcus, identity-affirming for son

### Persona 4: The Worldschooler (Aisha, 32, two kids ages 5 and 8, living between Sydney and Bali)
- Family travels for partner's work
- Kids learn through experience + curriculum
- Needs: works offline, photo-based capture, flexible pacing
- Sovereign Home as light-touch backbone

### Persona 5: The Recovering Distance-Education Family (Jen, 41, daughter age 14 with chronic illness)
- Daughter can't attend school physically
- Did NSW Distance Education, found it inflexible
- Wants engagement, not boring videos
- Sovereign Home as engagement-first alternative

## Pricing

- Single child: $39/month or $390/year
- Family (up to 4 children): $59/month or $590/year
- Family + state reporting: $79/month (includes auto-portfolio generation)
- Co-op (5+ families sharing): custom

Free tier: 1 subject, 1 child, basic features. Sufficient for trial.

NDIS-fundable for autism/disability diagnoses: pursue Capacity Building - Improved Learning category.

## Container architecture

```
Family
├── Child 1 (profile, interests, sensory, year level)
│   ├── Subjects
│   │   ├── Mathematics
│   │   │   ├── Quest 1: Number Wizardry
│   │   │   │   ├── Lesson 1
│   │   │   │   ├── Worked Examples
│   │   │   │   └── Practice
│   │   │   └── Quest 2: ...
│   │   └── English, Science, etc
│   ├── Portfolio (auto-built)
│   └── Progress Map (Australian Curriculum alignment)
├── Child 2
└── Parent Dashboard (cross-child view)
```

## Curriculum ingestion AI prompt

```
You are a Curriculum Alchemist for an Australian homeschool family.

Given:
- Source content: [Euka PDF / YouTube transcript / textbook chapter / etc]
- Child profile: age, year level, interests, sensory needs
- Australian Curriculum descriptors that this content addresses

Refactor this content into a UDL 3.0 lesson with:

1. WHAT YOU'LL LEARN (plain language, no jargon)
2. WHY IT MATTERS (real-world or special-interest framing)
3. EXPLORE (3 different entry points to the concept)
4. PRACTICE (3 difficulty levels)
5. SHOW WHAT YOU KNOW (3 expression options: write / video / build / present)
6. AUSTRALIAN CURRICULUM ALIGNMENT (which descriptors)

Constraints:
- Australian English, no em-dashes
- Special interest woven naturally (not tokenistic)
- Age-appropriate but never patronising
- Multiple paths through every concept

Return structured JSON.
```

## What this sprint should ship

Minimum viable (4-week sprint):
1. Single subject (Year 4 Mathematics)
2. Curriculum refactor pipeline (one source type: PDF)
3. Quest Mode UI
4. Special interest integration (5 interests)
5. Single-child profile
6. Basic progress tracking
7. NSW registrar report generator

Full v1 (16-week sprint):
- All Year F-6 subjects
- Multi-child families
- All states' reports
- YouTube ingestion
- Curriculum mapping
- Co-learning mode
- Sticker album
- Mobile app

## Dependencies

- Tier architecture (new tier: TIER_HOMESCHOOL or extension of existing)
- Ingestion engine (PDF, YouTube, text)
- Multi-child container model
- Australian Curriculum descriptor database (needs to be built / licensed)

## Distribution and partnerships

- Home Education Australia (national peak body)
- Otherways Homeschool Network
- State home education associations
- Autism associations (AMAZE Victoria, AspectAustralia, etc)
- NDIS-aligned support coordinators
- Influencer parents on Instagram (homeschool mum community is strong on socials)

## Why this is a real business

- 30,000+ Australian homeschool families
- Average spend $200-500/month per family on multiple tools
- Growth 10-15% per year
- Underserved by mainstream and existing homeschool tools
- Neuroinclusive angle is a true differentiator
- NDIS funding model unlocks scale beyond family-pay
- High retention (families stay homeschooling for years)
- Cross-sell potential to HSC product when kids reach Years 11-12

Revenue potential: 5,000 families × $59/month = $295K/month = $3.5M/year ARR
At scale (15,000 families) = $10M+ ARR

## Notes added

- 2026-05-15: Raised by Aaron with "Curriculum Alchemist" / "LMS Scraper" framing.
- The framing is dramatic ("annex", "shit content") but the underlying product is genuinely needed.
- Closely paired with Maths Autistic product — share infrastructure, can launch together or sequentially.
- Aria Learning partnership relevant (Abby's clients overlap with target market).
