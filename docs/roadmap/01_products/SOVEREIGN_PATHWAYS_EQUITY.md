# Sovereign Pathways — Equity Scaffolding [SPEC]

## What this is

Scaffolding specifically for Year 11-12 extension students (Science Extension, English Extension 1/2, History Extension, Society & Culture PIP, IB Extended Essay) AND university equity pathway students (UNSW Come On, Indigenous Pre-Programs, refugee pathways, first-in-family).

The students the system forgot.

## Status

[SPEC] — Originally part of Ingestion+Comms sprint. Never built.

## Why this matters

These students arrive with brilliance but no training. They are disproportionately:
- Low-SES
- First-in-family
- Indigenous
- Refugee or recent migrant
- Neurodivergent
- ESL
- Mature-age returners
- Care-experienced

The current academic system assumes prior literacy capital. They don't have it. They're not lacking intelligence — they're lacking insider language.

Standard tools (Grammarly, ChatGPT) actively harm them by:
- Erasing their voice
- Substituting "academic-sounding" for what they actually mean
- Reinforcing the feeling they're not smart enough
- Cheating shortcuts that bypass the learning they need

Sovereign Pathways does the opposite: builds capacity, preserves voice, scaffolds without erasing.

## Audience

### Year 11-12 Extension Students
- **HSC Science Extension** (5000-word scientific research report)
- **HSC English Extension 1** (major work)
- **HSC English Extension 2** (4500-word major work + reflection statement)
- **HSC History Extension** (historical project)
- **HSC Society & Culture PIP** (Personal Interest Project)
- **IB Extended Essay** (4000 words)
- **IB Theory of Knowledge** (essay + presentation)

### University Equity Pathway Students
- **UNSW Come On** (pre-uni bridging)
- **Indigenous Pre-Programs** (various unis)
- **Refugee Pathway** programs
- **Aspire UNSW** (high school engagement)
- **First-in-Family** support programs
- **Mature-Age Bridging** courses

### Universal Pathway Users
- Anyone who clicked "I'm new to academic writing"
- TAFE students with academic components
- Vocational students transitioning to academic study

## Core philosophy

### 1. Voice preservation, NOT erasure

The biggest harm done by AI writing tools to equity students: making them sound like everyone else. Stripping cultural voice, accent in writing, code-switching, register-mixing — all of which can be strengths.

Sovereign Pathways:
- Detects user's natural voice from their early writing
- Preserves it in all suggestions
- Shows them code-switching as a SKILL ("This is your conversational voice. Here's how the same idea sounds in academic register. Both are valid. Pick your audience.")
- Never replaces, only offers
- Celebrates cultural reference points (Indigenous knowledge systems, refugee experiences, working-class perspectives) as legitimate scholarship

### 2. Confidence-first, never patronising

Equity students are often hyper-aware of being patronised. Sovereign Pathways:
- Treats first academic writing with seriousness it deserves
- Uses scaffolding without dumbing down
- Celebrates milestones quietly (no fake fanfare)
- Names what they're doing well, specifically
- Frames feedback as growth, not deficit

### 3. Invisible scaffolding

The scaffolding is there when needed, gone when not. Doesn't permanently brand the student as "the equity one."
- Jargon decoder is hover-based, optional
- Academic literacy coach can be hidden
- Structure explainer collapses
- Student controls visibility

### 4. Strengths-based language

NEVER: "You don't know what a thesis statement is. Here's how to write one."
ALWAYS: "Your idea here is strong. Let's give it the academic shape that makes markers see it clearly."

## Core features

### 1. Pathway Detection at Onboarding

User selects their situation (single-select, can update later):
- Year 11/12 (HSC, IB, A-Levels, other)
- University access / equity pathway
- TAFE / Vocational with academic component
- Returning to study (mature age)
- 'I'm new to academic writing'

Sub-options if Year 11/12:
- Major work type (Science Ext, English Ext 1/2, History Ext, Society & Culture PIP, IB EE, etc)
- School curriculum (HSC, IB, A-Levels, NSW, VIC, QLD, etc)

Sub-options if equity pathway:
- UNSW Come On / Indigenous / Refugee / First-in-Family / Aspire / Other
- Whether they've done any prior tertiary study
- Whether English is their first language

Pathway sets:
- Active tier (TIER_SECONDARY or TIER_UNDERGRAD)
- Equity scaffolding flag: true
- Default jargon decoder: aggressive
- Structure explainers: visible by default
- Vibe Meter sweet spot: lower (don't expect HD register from a first major work)
- Confidence-building copy throughout
- Cultural responsiveness flag: true

### 2. Academic Literacy Coach

Right-rail persistent helper (collapsible, opt-out).

Contextually surfaces:
- "What is a thesis statement?" with examples in student's interest area
- "What does 'critically analyse' mean in YOUR assessment?" tied to their specific brief
- "What's a topic sentence?" with example from their own writing
- "How do paragraphs link?" with their current draft as reference
- "What's the difference between summary and analysis?" using their draft as example

Triggers contextually:
- User pastes brief with academic command verbs → coach explains each
- User struggling (deletes paragraph 3 times) → coach offers "Stuck? Let's look at what this section needs to do"
- User asks a question in chat → coach answers in plain English

### 3. Jargon Decoder

Hover over any academic word in brief/reading/rubric → tooltip explains in plain English.

Pre-loaded dictionary of 200+ academic terms:
- "thesis" → the main argument your whole piece is trying to prove
- "critically analyse" → break it down, evaluate strengths and weaknesses, give your view with evidence
- "synthesise" → bring multiple sources together to make a new point
- "methodology" → the approach you're using and why
- "epistemology" → how we know what we know
- "ontology" → what exists / what's real
- "positionality" → who you are and how that affects what you see
- "reflexivity" → noticing yourself in the process
- "intersectionality" → how multiple identities overlap and interact

User can pin a personal glossary to their workspace, add their own terms.

### 4. Structure Explainer

For each major work type, pre-loaded structures with explanations:

**Science Extension:**
- Sections: Abstract / Introduction / Scientific Research Question / Methodology / Findings & Analysis / Conclusion / Bibliography / Appendices
- "What is an abstract?" "What does each section actually do?" "What does the marker want here?"
- Marking criteria visible
- Common pitfalls listed
- Exemplar markers (without giving away exemplars themselves)

**English Extension 2:**
- Major work options: Short story / Speech / Critical response / Multimedia / Poetry / Performance / Investigative
- Section structures per option
- Reflection statement guidance ("This isn't a summary. This is your thinking made visible.")

**HSC History Extension:**
- Historical project options
- Historiography requirements explained simply
- "What is historiography?" with examples

**Society & Culture PIP:**
- Central material concept explained
- Cross-cultural component explained
- Bibliography requirements
- Continuum (micro/macro) explained

**IB Extended Essay:**
- Subject-specific guides
- 4000-word structure
- RPPF (Reflection on Planning and Progress) integration
- Common pitfalls

### 5. Confidence Building

For these users:
- All feedback strength-first
- Vibe Meter sweet spot lower
- "First academic writing? That's exciting" framing (not patronising)
- Celebrate milestones quietly:
  - "First 500 words"
  - "First citation added"
  - "First completed paragraph"
  - "First section finished"
- No red warnings — all amber and emerald
- Optional anonymous peer comparison: "Students at your stage typically draft 3-5 times before first submission. You're at draft 2."

### 6. Cultural Responsiveness

For Indigenous students:
- Acknowledgement of Country prompt
- Recognition of Indigenous knowledge systems as legitimate scholarship
- Pre-loaded reading suggestions: Smith (1999) Decolonising Methodologies, Moreton-Robinson, Martin
- Suggested supervisors / mentors with Indigenous research expertise
- Yarning circle as a legitimate research method (where appropriate)

For refugee students:
- Lived experience as data: properly framed methodologically
- Trauma-informed scaffolding
- Multi-lingual support (write in mother tongue, translate, both versions preserved)

For ESL students:
- Mother tongue drafting mode (write in your strongest language first, translate after)
- Australian English specifically (not US)
- Plain language alternatives shown alongside formal academic versions
- Pronunciation guides for tricky academic terms

For working-class / regional students:
- Reading list balanced: not all elite metropolitan sources
- Case studies relevant to regional Australia
- Practical research (action research, applied research) valued

For care-experienced / first-in-family:
- Supervisor expectation explainers (how to email, what to ask, how meetings work)
- Resource accessibility flagged (which library databases, which scholarships, who to ask)
- Imposter syndrome acknowledgement directly addressed
- Peer community connection prompts

### 7. Integration with 5 Sovereign Layers

**Layer 1 Logic Frame:** Plain-language questions, no jargon, encouraging tone.

**Layer 2 Faded Scaffold:** More generous stems, less assumption of prior knowledge, voice-preserving phrasing.

**Layer 3 Cognitive Anchor:** Includes plain-language definitions, supportive reading suggestions, cultural reference points.

**Layer 4 Vibe Meter:** Lower sweet spot, more amber-tolerant, framed as growth not deficit.

**Layer 5 History of Thought:** Same, with milestone celebrations and growth visualisation.

## Personas

### Persona 1: The First-Year HSC Science Extension Student (Aisha, 17)
- Western Sydney high school
- First in family to consider uni
- Parents Lebanese background, English their second language
- ADHD, undiagnosed dyslexia
- Brilliant in conversations, freezes when writing
- Has assessment brief, 16 readings, no idea where to start
- Needs: structure explainer, jargon decoder, Voice DNA from her speaking style

### Persona 2: The UNSW Come On Student (Marcus, 19)
- Wiradjuri, from regional NSW
- First in family at university
- Coming on program, anxious about week 1
- Strong storyteller, weak at "academic register"
- Needs: cultural responsiveness, code-switching support, mentor matching

### Persona 3: The Mature-Age Refugee Bridging Student (Mariam, 34)
- Came to Australia as adult refugee
- Was a doctor in home country, not recognised here
- Doing bridging course at UNSW
- Strong subject knowledge, weak English academic register
- Needs: mother tongue drafting, trauma-informed scaffolding, suspension of judgement on English

### Persona 4: The IB Extended Essay Student (James, 17)
- Private school, IB diploma
- Twice-exceptional (gifted + autistic)
- Special interest deep, narrow
- Reflection statements feel impossible (asks him to talk about himself)
- Needs: scaffolding for reflective writing, special interest integration in topic choice

### Persona 5: The Care-Experienced First-Generation Bachelor's Student (Tia, 22)
- Out-of-home care background
- Made it to uni, second year, struggling
- Doesn't know how to email a lecturer
- Feels like a fraud
- Needs: communications layer for emailing lecturers, supervisor expectation explainers, imposter syndrome address

## Pricing

- Free tier: full access for students on scholarship / equity programs
- Standard: $15/month or $89/year (subsidised)
- Family: $25/month
- Schools site licence: tiered

Funding model: partner with university widening-participation funds, philanthropic education funders, government access-and-participation initiatives.

## What this sprint should ship

Minimum viable (2-week sprint):
1. Pathway detection at onboarding
2. Academic Literacy Coach (basic)
3. Jargon Decoder (50 core terms)
4. Structure Explainer (Science Extension + IB EE)
5. Confidence-first feedback throughout

Full v1 (6-week sprint):
6. All major work types (HSC + IB)
7. Cultural responsiveness modules
8. Mother tongue drafting
9. Anonymous peer comparison
10. Mentor matching service
11. Free tier infrastructure

## Dependencies

- Tier architecture
- Ingestion engine (for brief, readings, lecture content)
- 5 Sovereign Layers adapted for confidence-first

## Why this is a real business AND a real mission

- Equity programs are well-funded but content-poor
- Universities have widening-participation budgets specifically for tools like this
- Government funding (HEPPP, equity scholarships) available
- Philanthropic interest (Smith Family, Schools Plus, Paul Ramsay Foundation)
- Mission-aligned for Aaron (his MRes is literally about this gap)
- Scholarship-funded tier preserves access regardless of family wealth

## Notes added

- 2026-05-15: Raised by Aaron in Ingestion+Comms sprint. Foundational equity dimension to whole product.
- "We cater for all students, all neurotypes, all people, especially those the system forgot" — Aaron's words.
- This is the moral spine of Simplifii. Other products are revenue; this product is mission.
- Distinct from HSC Practice Exam System: that's exam prep, this is writing support.
- Could be combined or kept separate depending on go-to-market.
