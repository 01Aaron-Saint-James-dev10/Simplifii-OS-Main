# Sovereign Study — HSC Practice Exam System [SPEC]

## What this is

UDL 3.0-formatted exam practice for NSW Year 11-12 students. Question regenerator that takes past papers, keeps the assessed content the same, but maps it out differently. Marker breakdowns. Information retention scaffolds.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15.

## Audience

- NSW HSC students (Years 11-12)
- Extension subject students specifically (Maths Ext 1/2, English Ext 1/2, Science Ext, History Ext)
- Tutors using Simplifii to support students
- Parents helping their kids prep
- Adaptable to IB, A-Levels, other state curricula

## Why this matters

HSC is high-stakes, high-stress. Many neurodivergent students get crushed by exam format anxiety even when they know the content. The same question phrased differently could be the difference between fail and band 6. Current tools (ATAR Notes, EzyMath, etc) give static content. Nobody applies UDL 3.0 to exam prep at scale.

## Core features

### 1. Past paper ingestion
Upload PDF past papers (BOSTES / NESA archives) or single questions via photo. System parses:
- Question structure
- Command verbs (analyse, evaluate, demonstrate)
- Marks allocation
- Section structure (Section I, II, III)
- Stimulus material (case studies, sources, data)

### 2. Question regenerator
Same content, different framing. Examples:

Original HSC Biology question:
> "Describe the structural features of the small intestine that facilitate absorption. (5 marks)"

Regenerated variations:
- **Visual entry:** Diagram of small intestine with labels removed. "Label each structure and explain how it helps absorption."
- **Scenario framing:** "A doctor explains to a patient why their absorption is impaired after part of the small intestine is removed. Write the explanation."
- **Reverse engineering:** "List the features. For each, predict what would happen if it were missing."
- **Compare/contrast:** "Compare absorption in the small intestine to gas exchange in the lungs. What features serve similar functions?"

The system generates 3-5 variations per source question. Student practices the underlying concept from multiple angles.

### 3. UDL 3.0 multiple means of representation
Same question available as:
- Text (default)
- Audio (read aloud)
- Visual diagram
- Video explainer (linked)
- Plain-language version (for ESL or processing disorder students)

### 4. Command verb decoder
Hover over "evaluate" → tooltip explains what evaluating means in HSC context:
- Make a judgement based on criteria
- Provide both strengths and weaknesses
- Conclude with your overall stance
- Use evidence to support

NSW NESA glossary of command verbs pre-loaded.

### 5. Marker breakdowns
For every question:
- "What is this question REALLY asking?"
- "Common pitfalls students make"
- "What a Band 6 answer includes"
- "Marking criteria translated"

### 6. Practice modes

**Timed mode:** Full exam conditions, no feedback during, full report after.

**Coached mode:** Hints available, command verbs explained inline, low-stakes.

**Drill mode:** Single concept, many variations, spaced repetition.

**Review mode:** Past attempts shown, weakness areas highlighted, suggested next questions.

### 7. Retention scaffolds
- Spaced repetition based on Anki algorithm
- Auto-generated flashcards from missed questions
- Concept maps showing relationships
- Pre-exam confidence check ("Which topics do you actually know?")

### 8. Subject coverage (Year 1)
Priority subjects (high enrolment, high anxiety):
- English Standard, Advanced, Extension 1, Extension 2
- Mathematics Standard, Advanced, Extension 1, Extension 2
- Biology, Chemistry, Physics
- Modern History, Ancient History, Extension History
- Economics, Business Studies, Legal Studies
- Society and Culture
- Science Extension

Year 2 expansion:
- Languages (Japanese, French, Italian, Chinese, etc)
- Music, Drama, Visual Arts
- Industrial Tech, Design and Tech
- Studies of Religion
- Geography, Earth and Environmental Science

## Question regenerator AI prompt

```
You are a UDL 3.0 exam question regenerator for HSC students.

Given a source question:
1. Identify the underlying concept being tested
2. Identify the command verb requirements
3. Generate 3-5 variations that test the SAME concept through different cognitive entry points:
   - Visual entry (diagram, image, spatial reasoning)
   - Scenario framing (real-world application)
   - Reverse engineering (work backwards from outcome)
   - Compare/contrast (relate to another concept)
   - Practical demonstration (show working / steps)

Constraints:
- DO NOT change the assessed knowledge requirement
- DO NOT make it easier or harder than the original
- DO match the original mark allocation
- Australian English, no em-dashes
- Use HSC marking language

Return JSON only.
```

## Personas

### Persona 1: The High-Achieving Neurodivergent (Year 12)
- ADHD or dyslexia
- Knows the content but struggles with exam format
- Needs: question variation to break format dependency, command verb scaffolding
- Pricing: $20/month or $200/year individual

### Persona 2: The Late Starter (Year 12 Term 3)
- Realises HSC is real, panicking
- Needs: rapid topic coverage, weakness identification, intensive drill mode
- Pricing: Term 4 crunch pack — $99 one-time

### Persona 3: The Parent (kid in Year 11-12)
- Doesn't know the syllabus
- Wants to help but can't
- Needs: explainers in plain English, progress dashboard
- Pricing: Family plan $35/month (parent + 1 child)

### Persona 4: The Tutor
- Manages 5-15 students
- Needs: question banks per student, progress tracking, custom question generation
- Pricing: Pro $79/month per tutor, supports unlimited students

### Persona 5: The Equity Pathway Student
- Low-SES, first-in-family, ESL
- HSC is the gate to university aspirations
- Needs: confidence building, plain-language scaffolding, free/subsidised access
- Pricing: Free tier or scholarship program (partner with Smith Family, Aboriginal organisations)

## Container architecture

```
Subject (e.g. Biology)
├── Module (e.g. Module 6: Genetic Change)
│   ├── Topic (e.g. Mutations)
│   │   ├── Source Questions (real past papers)
│   │   └── Regenerated Variations (AI-built)
│   └── Concept Map
├── Practice Sessions (timed attempts)
├── Drill Sessions (concept-focused)
└── Weakness Tracker
```

## Integration with broader Sovereign OS

- **Tier:** TIER_SECONDARY
- **5 Sovereign Layers:** Adapted for short-form answer writing
  - Layer 1 Logic Frame: "What is the marker looking for?" questions
  - Layer 2 Faded Scaffold: Answer stems with [BLANK] for analysis
  - Layer 3 Cognitive Anchor: Pinned syllabus dot points relevant to question
  - Layer 4 Vibe Meter: Calibrated to Band 6 answer density
  - Layer 5 History of Thought: Practice session history

- **Receipt:** "Aaron practised 47 Biology questions, average 4.2/5 marks, weak area: mutation effects"
- **Ingestion Engine:** Photo of textbook page, voice memo of concept explanation

## Build cost

3-week dedicated sprint to launch with 1 subject (Biology). Each additional subject = 3-5 days.

## Dependencies

- Tier architecture
- Ingestion engine (for question photo upload)
- Citation engine (for syllabus references)
- 5 Sovereign Layers (for canvas integration)

## Go-to-market

- Launch term 4 of HSC year (the peak panic window)
- Partner with: Smith Family, Schools Plus, individual schools' learning enrichment
- Content marketing: parent guides, ATAR explainers, neurodivergent study guides
- Pricing: launch at $15/month introductory, scale to $25 standard

## Why this is a real business

HSC tutoring market in NSW: $500M+/year. Equity gap means low-SES students get nothing. Simplifii could be both premium tier AND scholarship-funded equity tier.

## Notes added

- 2026-05-15: Raised by Aaron during creative explosion. Real product opportunity.
- Question regenerator is the killer feature. No one else does this.
- UDL 3.0 framing aligns with Aaron's MRes — strong dogfooding narrative.
