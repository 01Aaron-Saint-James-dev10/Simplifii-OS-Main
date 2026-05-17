# Simplifii-OS Backlog

---

## Sprint O: Game Layer (Cognitive Breaks)

Embedded mini-games as ADHD/EF regulation tools: 5-min breath visualiser, pattern matching, word association, Pomodoro break activities. Voluntary, never forced. Tracks total break time as positive metric. Schema: game_sessions. Effort: 12-16 hours.

---

## Sprint P: Joke Generator (Joy Moments)

/api/joke endpoint (Anthropic), voice command "tell me a joke", ephemeral overlay, favourites library, style prefs (puns/wordplay/observational/nerdy). Schema: user_jokes. Effort: 3-4 hours MVP.

---

## Sprint Q: Community Library (Shared Tips)

Peer-to-peer tips: shared_tips table, AI pre-screen moderation, anonymous by default, topic taxonomy, upvote/save. New panel rail tab "Community". REQUIRES legal review (eSafety Commissioner, content moderation laws) before any code. Effort: 60-80 hours including T&S framework.

---

## Sprint R: Animated AI Assistant (BrOWSER 2.0 Full)

AI character with 6 states (idle/listening/thinking/celebrating/concerned/suggesting), eye tracking, TTS speech, movement between corners. profiles.character_enabled/character_voice. All original art, NO branded IP. Effort: 20-30 hours.

---

## Sprint V: About Page with Founder Credentials

Move Aaron's personal awards (NDRP, ADCET, UN SDG) to a dedicated /about page rather than the landing page. Include founder story, research background, institutional affiliations. Effort: 2-3 hours.

---

## Sprint U: Sector Research Ingestion Pipeline

**Goal:** Ingest publicly available Australian education research, synthesise student pain points by tier/demographic, feed into tutor system prompts so AI responses are informed by sector-wide evidence.

**Phase 1 (12-16 hrs):** Automated scrape of CYDA, QILT SES, Headspace/Orygen, Universities Accord submissions, NCVER VET, ADCET, data.gov.au. Store raw text in research_documents table.

**Phase 2 (8-12 hrs Aaron):** Claude-assisted synthesis of pain points from research documents. Aaron reviews + curates. Stored in pain_points table with tier, demographic, frequency.

**Phase 3 (3-4 hrs):** Tutor system prompt injection. Query top 5 relevant sector findings before each Claude call. Tutor becomes sector-evidence-informed.

**Phase 4:** UNSW HREA ethics approval. Source citations in product. MRes thesis integration.

**Total:** 35-40 hours minimum. Post-tester, 1 month to full pipeline.

**Constraints:** No Reddit/Twitter scraping (TOS). Free-text QILT needs institutional access. Synthesis requires Aaron's validation. Annual source refresh.

---

## Sprint M: Universal Document Type Detection and Routing

**Goal:** User uploads any document. System detects type, routes to correct parser, surfaces output in matching UI.

**Document types:** Assignment brief, exam paper, rubric, lecture notes/slides, reading list, research paper, study notes, generic text.

**Architecture:** DocumentClassifier.js (Anthropic classification) > DocumentRouter.js (picks parser) > per-type parsers returning normalised output > UI shows detected type with override option.

**Effort:** 24-40 hours. Priority: Sprint M post-tester week 1. Driven by which types testers actually upload.

---

## Sovereign-OS v3 Visual Overhaul (from Claude Design handoff)

Source: `/Users/adonis666/Downloads/Simplifii-OS_Master-handoff.zip` and `Sovereign-OS v3.html`
Prototype: 1364 lines of pixel-perfect HTML/CSS/JS with 4 themes, 4 character signatures, animated effects.

### Phase 1: Theme System + Top Bar (2-3 hrs)

**1a. CSS Variable Theme System**
- Extract 4 theme definitions from prototype into tokens.js or a new themes.js:
  - Obsidian (current default, zinc-950 + emerald)
  - Vaporwave (deep purple + magenta + cyan)
  - Surreal (cream + ink + terracotta, hand-drawn font Caveat)
  - Minimal (near-white + black + teal)
- Each theme: --bg, --bg-1, --bg-2, --grid, --line, --line-soft, --line-dim, --accent, --ink, --ink-dim, --ink-faint, --hairline, --glow, --font-display, --stroke
- Apply via `html[data-theme]` attribute (same pattern as prototype)
- SettingsContext: add `theme` state, persist to localStorage

**1b. Theme Switcher**
- Keyboard shortcut: T key cycles themes
- Small button in top-right of AppShell or CanvasNav
- Visual: current theme name as a monospace pill
- Accessible: aria-label announces current theme

**1c. Top Bar Restyling**
- Match prototype's `.topbar` layout: brand with dot + tag, spacer, stat readouts
- Stats: word count, session time, streak days (from StudyPatternTracker)
- Obsidian Aesthetic with hairline borders and corner markers

### Phase 2: Character Signatures (4-6 hrs)

**2a. 4 SVG Glyphs**
- ARMOUR: hexagonal shell with Star of David inner geometry, rotating outer cage
- VECTOR: octagonal logic gate with compass chevrons, tick-mark ring
- NEXUS: triple orbital ring system with satellite nodes
- VELOCITY: arrow/streak geometry with motion lines
- All from the prototype's SVG markup (hand-crafted, not generated)

**2b. Matrix Rain Effect**
- Falling monospace characters behind each glyph
- Mask: radial gradient (transparent centre, visible edges)
- Speed varies by state (idle: slow, sprint: fast, success: accent colour)

**2c. Aura Particle System**
- Floating character sparks around the glyph (foreground)
- Characters from a configurable charset
- Spawn rate + speed varies by state
- GPU-friendly: will-change transform + opacity

**2d. State Animations**
- idle: gentle breathe (opacity 0.55 to 1.0 over 5s)
- sprint: fast draw, jitter, accelerated rain + aura
- success: flare (stroke thickens then settles), accent colour rain

### Phase 3: Steering Drawer + ASCII Refinery (3-4 hrs)

**3a. Steering Drawer UI**
- 4 control panels from prototype: Persona, Scaffolding, Grit, LOD
- Each panel: 4-option segmented button grid
- Values already in SettingsContext, just need the visual UI
- Corner markers (pseudo-elements) per prototype design

**3b. ASCII Refinery Upgrade**
- Match prototype's `.refinery` section: bordered panel with corner markers
- Show real-time extraction/processing status
- Upgrade existing AsciiLoader to use the prototype's visual style

### Phase 4: Polish + Responsive (2-3 hrs)

- Grid paper background (32px grid lines via CSS gradient, per prototype)
- Corner markers on all panels (::before/::after pseudo-elements)
- Selection colour: emerald bg with dark text
- Responsive breakpoints: 1100px (2-col grid), 600px (1-col)
- prefers-reduced-motion: disable all spin/rain/aura/jitter animations

**Total: 18-24 hours across 4 phases**
**Priority:** Phase 1 ships first (post-tester-readiness queue). Phases 2-4 in Sprint N/O.

---

## Tester-Surfaced (logged during Y10-12 queue)

### HSC Past Paper Ingestion via User Upload

**Problem:** User uploaded an HSC 2025 Biology exam paper + marking guidelines. DocumentAI + BriefService extracted text successfully, but the editor showed generic placeholder scaffold steps instead of the actual exam structure.

**Root cause:** The ingestion pipeline treats every PDF as an "assessment brief" (course outline with assessments, rubrics, due dates). HSC exam papers are a fundamentally different document type: they contain numbered questions with mark allocations, not assessment briefs with due dates and weightings.

**Fix required:**
1. **Document type detection:** After PDF text extraction, classify the document as one of: assessment brief, exam paper, rubric, syllabus, or unknown. Use regex signals: "Question 1" + "(X marks)" patterns = exam paper. "Assessment Task" + "Due Date" = brief. "Band 6" + "Criteria" = rubric.
2. **Exam paper parser:** New parser that extracts questions, mark allocations, sections, and any stimulus material references. Different from BriefService's assessment extraction.
3. **Routing:** If exam paper detected, route to the Past Questions panel (Sprint 11) instead of creating a course with generic scaffolds. Surface the questions as practice prompts with the marker feedback from the NESA corpus if available.
4. **User choice:** Before routing, ask the user: "This looks like an exam paper, not an assignment brief. Would you like to: (a) Use it as practice questions, or (b) Treat it as an assignment brief anyway?"

**Estimated effort:** 4-6 hours
**Sprint allocation:** Post-tester Sprint L

### Ask User What They Want to Work On

**Problem:** After upload, the system assumes the user wants to write an assignment. But Y10-12 students may want to: practise past exam questions, decode a rubric, plan a study schedule, or understand a syllabus. The system should ask.

**Fix required:**
- After PDF upload and text extraction, show a quick-pick: "What do you want to do with this?"
  - Write an assignment (current default)
  - Practise exam questions
  - Decode a rubric
  - Understand a syllabus
- Route each choice to the appropriate parser and UI surface
- Align output format to the detected document type and chosen intent

**Estimated effort:** 3-4 hours
**Sprint allocation:** Post-tester Sprint L

---

## Sprint M — Document-Type-Aware Ingestion

**Goal:** When a Y10-12 user uploads a document, ask them what they want to do with it. Route to the appropriate parser. Surface output in the format that matches their intent.

**User flow:**
1. User uploads PDF/DOCX
2. Modal appears: "What's this document? What do you want to do?"
3. Options shown as cards:
   - "Assessment brief: help me plan + write a response"
   - "Past exam paper: help me practice these questions"
   - "Study notes or textbook: help me understand and remember this"
   - "Marking rubric or criteria: help me check my work against this"
   - "Reading or article: help me extract key ideas"
   - "I'm not sure: figure it out for me" (AI classification fallback)
4. Selection routes to the correct parser + UI surface

**Parser branches:**
- Assessment brief -> existing BriefService -> Editor scaffold (current behaviour)
- Past exam paper -> ExamPaperParser -> Practice mode (one Q at a time, timer, marker notes if uploaded together)
- Study notes -> NotesParser -> Knowledge graph or flashcards (post-tester scaffold)
- Marking rubric -> RubricParser -> Check-against-rubric tool (already partially built)
- Reading/article -> ReadingParser -> Annotation + summary tool
- AI classification -> Anthropic /api/tutor with classification system prompt -> routes automatically

**Schema:**
- documents.document_type enum ('brief'|'exam'|'notes'|'rubric'|'reading'|'unknown')
- documents.user_intent text (what they said they wanted to do)
- documents.parsed_content jsonb (varies by type)

**UI:**
- New panel: "Practice Mode" for exam papers (one Q at a time, "I'm done" button, optional self-marking against guidelines)
- Existing editor scaffold stays for briefs
- New panel: "Annotated reading" for articles (PDF view + side notes)
- Reuse existing components where possible

**Privacy:**
- All processing local where possible
- AI classification calls minimal: subject + first paragraph + question count, not full text
- User can re-classify if AI gets it wrong

**Estimated effort:** 8-10 hours (UI + 5 parsers + AI classification + schema + testing)

**Priority:** Sprint M (first post-tester sprint, informed by what testers actually upload)

---

## Sprint M+ — Enhancement Features

### Text-to-Speech (TTS)

Read AI responses + editor content aloud for accessibility and processing-disorder support.
- Browser SpeechSynthesis API (free, native, no API key needed)
- Settings: voice selection, speed, pitch
- Surfaces: read AI tutor responses, read BionicText passages, read selected text in editor
- Keyboard shortcut: Cmd+Shift+R to read selection
- Accessibility: pause/resume, skip sentence, stop
- Estimated effort: 3-4 hours MVP, 6-8 hours full

### Teleprompter Mode

Auto-scrolling presentation view for reading rehearsal, oral assessments, speech practice.
- Toggle in editor: "Teleprompter Mode"
- Auto-scrolls at user-configurable WPM
- Optional countdown timer for total speech length
- Mirror toggle for actual teleprompter hardware setups
- Auto-pause on voice detection (you stop speaking, scroll pauses)
- Combines with TTS for "read along while it auto-scrolls" mode
- Surfaces: oral presentation prep, debate prep, speech assessments, reading aloud for dyslexic learners
- Estimated effort: 4-6 hours

Priority: Sprint M/M+ post-tester, informed by Y10-12 feedback on voice features

---

## Post-Testing Sprint L+

### Study Pattern Tracking (location + time + session telemetry)

**Goal:** Understand WHERE, WHEN, and HOW LONG learners study so the OS can adapt (e.g. quieter UI when studying at home late at night, fuller scaffolding when studying at the library mid-afternoon).

**Why it matters:** Personalisation profile (Stage 01 Step 4 full version) needs behavioural data to refine over time. Self-reported "energy and load pattern" gets us a starting point; observed patterns refine it.

**Three signals to capture:**

1. **Time-of-day patterns**
   - Browser-native, no permission needed
   - Capture: session start timestamp, session duration, time-of-day band (morning/afternoon/evening/late-night)
   - Inferred: chronotype (early bird vs night owl), peak focus windows

2. **Location patterns (TIERED: user controls precision)**
   - Three opt-in tiers, user picks at onboarding (Sprint K) or in Settings:
     - **None (default):** no location captured
     - **Country only:** IP-based, no permission prompt, no precise location
     - **Place tags:** user manually tags "Home", "Library", "Uni Campus", "Other" before each session: full user control, no GPS
   - DO NOT use browser Geolocation API (precise lat/long). Privacy risk too high for the brand positioning.
   - Place tags are stored as opaque labels, no addresses, no coordinates

3. **Session telemetry**
   - Time on task per assessment
   - Tasks switched per session
   - Idle time between actions
   - Focus session length before break

**Architecture decisions to make:**
- Where does this data live? (HistoryOfThought local + Layer 2 telemetry per architecture doc)
- Aggregation interval (real-time vs hourly batch)
- User-facing surface (a "your patterns" panel showing trends, never raw data)
- Institutional dashboards: aggregated only, never identifiable
- Privacy posture: explicit consent screen at onboarding, settings to revoke anytime, full export + delete in line with Australian Privacy Act 1988

**Privacy compliance checklist before building:**
- [ ] Privacy Act 1988 APP 3 (collection of personal info): explicit consent
- [ ] APP 5 (notification): clear at-collection notice
- [ ] APP 11 (security): encrypted at rest
- [ ] APP 12 (access): user can view their own data
- [ ] APP 13 (correction): user can delete their data
- [ ] GDPR Article 7 (consent): granular opt-in per signal type
- [ ] GDPR Article 17 (right to erasure): one-click delete

**Estimated effort:** 6-10 hours including the privacy UX. Not a one-sprint job.

**Sprint allocation:** Post-testing Sprint L or M. Pair with personalisation profiler (Sprint K) so the data has somewhere meaningful to live.

---

### Voice Input + Output

**Goal:** Speech-to-text for editor input. Text-to-speech for AI responses and BionicText-flagged passages. Aligns with UDL 3.0 "Voice input where the underlying API allows" commitment.

**MVP scope (Sprint L):**
- Web Speech API only (free, browser-native, no API keys)
- Mic button in CanvasEditor: transcript inserted at cursor
- Language: en-AU
- First-run permission modal with honest disclosure about browser-side processing
- Privacy: no recordings stored, no transcripts sent to Supabase, no logging

**Full scope (Sprint M):**
- Whisper API for premium accuracy (paid, opt-in)
- Text-to-speech via SpeechSynthesis API
- Voice control of nav (e.g. "open feedback", "switch to assessment 2")
- Read-aloud of AI responses with adjustable speed
- Read-aloud of BionicText passages
- Mobile voice (currently desktop-only in MVP)

**Out of scope:**
- Speaker diarisation
- Custom vocabulary training
- Real-time meeting transcription

**Estimated effort:** MVP 45 min. Full scope 4-8 hours.

---

### Full Personalisation Profiler

**Goal:** Stage 01 Step 4 from Simplifii-OS_Architecture.docx: the world-class profiler that captures learning style, communication style, memory profile, processing style, accessibility prefs, energy/load pattern, strengths, past educational harm signal.

**Currently shipped:** MVP slice only (4 accessibility toggles). The other 7 dimensions are not collected.

**Sprint K (post-testing):** Build all 8 dimensions via scenario-based prompts (not Likert quizzes). Mirror profile back, allow adjustments. Wire profile into SteeringDrawer defaults and AURA prompt construction.

**Estimated effort:** 8-12 hours including writing trauma-informed prompts.

---

### BrOWSER 2.0 Sophistication

**Goal:** Evolve the existing BrOWSER avatar (Sprint H spec mentioned 5 states, eye-tracking, Apple Siri-orb-level polish).

**STRICT CONSTRAINT:** Original character only. No reference to Nintendo IP (Bowser, Mario, any character). The BrOWSER name is intentional wordplay on "browser" + "BrOWSER" the OS companion. The visual must be original: green emerald-line creature, antennae, friendly menace. Iterate the existing direction; never reference licensed characters as styling targets.

**Sprint M scope:** 5 states (idle, listening, thinking, speaking, resting), micro-animations, optional eye-tracking responding to cursor.

**Estimated effort:** 4-6 hours.

---

### Display Name Personalisation (extension of tonight's basic greeting)

**Currently shipped:** "Welcome back, [name]" on /app.

**Future additions:**
- Time-of-day awareness: "Good morning, Aaron" / "Working late, Aaron?"
- Streak awareness: "Welcome back, Aaron. Day 3 of your assessment sprint."
- Context awareness: "Picking up where you left off in Chapter 5"
- All optional, all dismissible, never patronising

**Estimated effort:** 2 hours.

---

## Sprint Y — Dragon Ball Energy Tracking (Spoon Theory remixed)

Goal: ND-affirming energy capacity tracking. Reframes Spoon Theory through
Dragon Ball metaphor — gathering balls equals building capacity, losing
balls equals depletion, recovery equals finding them again.

Phase 1 — Daily check-in (3 hours)
- Session-start modal: "How many dragon balls today?"
- 7-point visual scale with descriptions:
  1 ball: surviving, low capacity
  2-3 balls: limited but okay
  4-5 balls: standard day
  6-7 balls: high capacity, ready for challenge
- Skip-able, never forced, dismissable
- Schema:
  ALTER TABLE profiles ADD COLUMN daily_energy_check JSONB DEFAULT '[]';
  Stored as array of { date, balls_morning, balls_evening, notes }

Phase 2 — Per-task estimation (4 hours)
- Each scaffold step shows estimated cost: "approximately 1 dragon ball"
- Calibrated per tier
- User can adjust: "this is taking more than expected"

Phase 3 — Tutor empathy integration (3 hours)
- Tutor system prompt receives current dragon ball count
- Low (1-3): gentle tone, simplified responses, suggests breaks
- Medium (4-5): standard tone
- High (6-7): can offer complex challenges
- Crisis low (1 ball + concerning content): surface crisis resources gently

Phase 4 — Pattern recognition (8 hours, post-tester data needed)
- After 14 days of data, surface patterns
- "Your best days are Tuesdays. Your worst are after sport."
- Optional, dismissable, exportable

Effort: 18-20 hours staged across 4 sprints
Priority: Sprint Y, post-tester window
Critical: Consult with disability advocates before final copy. Must not
trivialise chronic illness or imply users should push through low-energy days.
References: Christine Miserandino Spoon Theory (2003), Australian Disability
Discrimination Act compliance.

---

## Sprint AA — Affiliate Revenue Stream

Non-cheesy, evidence-based affiliate categories: stim toys (Stimtastic, Spiffing AU), ND-friendly stationery (Passion Planner), noise-cancelling (Loop Earplugs, Flare Audio), books (Bookshop.org not Amazon), therapy directories (Headway, Headspace), assistive tech (ReadAlong, OrCam). Always disclosed, personally used, curated not algorithmic. Sits in Resources section, never in workflow. User can hide entirely. Revenue split: 50% infrastructure, 50% pays testers. Effort: 6-8 hours. Priority: post-tester.

---

## Sprint BB — Accessibility Features Audit

Check against current build, add missing only: high contrast mode, reading ruler, colour overlays (Irlen syndrome), word-by-word reveal, adjustable letter spacing, reading speed estimator, comprehension break reminders, focus mode (current paragraph only), switch control compatibility, eye-tracking gaze input. Audit first, research second, build third. Effort: 20-40 hours. Priority: post-tester.

---

## Sprint CC — Features from Prior Builds to Restore

Review docs/PRIOR_BUILD_AUDIT.md. Top candidates from prior builds: AI risk scoring algorithm (10-dimension text authenticity), hidden curriculum decoder structured JSON schema, V1/V2/V3 depth levels for brief simplifier, key terms extraction prompt, heuristic outline bucketing. Aaron to pick 3-5 features. Effort: TBD. Priority: post-tester.

---

## Sprint EE — Visual Polish and Theme Consistency

Light/Paper mode: side panels render white while canvas stays black. Audit theme tokens for paper theme. Canvas background must use theme background var, not hardcoded black. Check tokens.js, CanvasScreen.jsx, SectionEditor.jsx for hardcoded dark values. System-wide aesthetic update: rounded corners (8-12px border-radius on panels, modals, cards), subtle shadows (0 2px 8px rgba(0,0,0,0.08)), smoother 200ms transitions on hover, softer focus rings. Effort: 8-12 hours. Priority: post-autism-first.

---

## Sprint DD — Reading + Writing Support Layer

Active reading + writing assistance throughout the editor. 12 features: read-aloud for editor content, read-aloud for original document, reading speed estimator, comprehension break reminders, reading ruler, focus mode, sentence starters, idea-to-sentence helper (voice to structured text), dyslexia-friendly spell help, writing analysis sidebar, word prediction, citation/reference helper. Profile-aware defaults per accessibility profile. Effort: 40-50 hours. Priority: build after multimodal canvas.

---

## Sprint FF — Universal Resource Library (60-80 hours)

**Purpose:** Replace "upload your own PDF" workflow with "choose from pre-parsed library" as PRIMARY path. Upload becomes secondary fallback. Solves PDF parsing reliability at scale and creates a knowledge moat through curated content.

**Two-tier system:**
- **Tier 1: Curated Library** (server-side, pre-parsed). HSC past papers (NESA, public, 2018-2024), marking guidelines, VCE/QCE/WACE equivalents, ACARA syllabuses, OpenStax textbooks. Each item: pre-classified, pre-parsed, pre-chunked, multimodal transformations cached for popular items.
- **Tier 2: User Uploads** (existing flow). Students upload their own PDFs. Successful parses optionally contributed to community library (anonymised, consented, reviewed).

**Legal scope:** NESA (educationstandards.nsw.edu.au), VCAA (vcaa.vic.edu.au), QCAA (qcaa.qld.edu.au), ACARA (australiancurriculum.edu.au), OpenStax (CC-BY), MIT OCW (CC-BY-NC-SA). DO NOT scrape: Chegg, Course Hero, StuDocu, Khan Academy, anything behind auth, anything with robots.txt disallow.

**Schema:** resource_library table (id, source, category, subject, year, level, state, title, raw_text, parsed_content, question_count, total_marks, time_allowed_minutes, source_url, license, verified, tags). library_usage table for tracking. GIN index on tags.

**UX:** Fork after "Add Course": Browse Library (recommended, instant load) or Upload Your Own (existing flow). Library picker: subject, year, type filters, preview before selecting.

**Phase 1 (30 hours):** Schema + RLS. Firecrawl background scrape of top 8 HSC subjects (112 docs). Parse + seed library. Build picker UI.
**Phase 2 (15 hours):** Community contribution flow. Anonymisation pipeline. Review queue. Contributor crediting.
**Phase 3 (20 hours):** Scale to VCE, QCE, WACE.

**Priority:** Build AFTER current autism-first + multimodal sprints complete and tester window opens.

---

## Sprint GG — Universal Sandpit Tools

**For Teachers:** UDL Lesson Planner, Visual Supports Planner, Strengths and Interests, Task Analysis, Skill Chaining, Differentiation Levels, Social Script Generator, Assignment Helper, Reflective Lens.

**For Students:** Floating Thoughts, First Strings, Pathway, Student Multi-Tool, Concept Explainer.

Each is a focused mini-tool on a secondary page, not main canvas. Spoon Theory Planner already logged as Sprint Y (Dragon Ball Energy Tracking: orange visual, 11-13 balls per Aaron's preference). Effort: TBD per tool. Priority: post-Sprint FF.

---

## Sprint HH — Postgrad Pathway Mapper + Public Thesis Library (90 hours)

**Purpose:** Map the full Australian postgraduate research pathway (Honours, MRes, Masters by Research, PhD) across major institutions. Build a depository of publicly-accessible thesis examples. Provide timeline scaffolding, scholarship discovery, and milestone tracking.

**Sources (all public/open access):** Trove (NLA), UNSWorks, Minerva Access (Melbourne), eScholarship (Sydney), ANU Open Research, UQ eSpace, Monash Bridges, Adelaide Research & Scholarship, UWA Research Repository, Macquarie ResearchOnline, OATD, AOASG. Pathway/scholarship data from each uni's public "Future Students" pages, StudyAssist.gov.au, data.gov.au RTP data.

**Schema:** postgrad_pathways (university, program_type, entry_requirements, milestones, word_count_range), scholarships (name, provider, amount, eligibility, deadlines, tags), thesis_library (title, author, year, university, level, abstract, chapter_structure, license), user_pathway_progress (current_milestone, milestone_status, scholarships_applied).

**UX:** New /pathway route. User selects program type, discipline, state(s). Dashboard shows matching universities, timeline with milestones, eligible scholarships, and sample theses. "Use as template" imports chapter structure into canvas.

**Phase 1 (40 hours):** NSW unis (UNSW, Sydney, Macquarie, UTS, Western Sydney, Newcastle, Wollongong). Seed data from Aaron's lived MRes experience.
**Phase 2 (30 hours):** Group of Eight national (Melbourne, ANU, UQ, Monash, Adelaide, UWA).
**Phase 3 (20 hours):** Regional + specialist unis.

**Legal:** Check each repository's ToS. Only store CC-licensed theses. Link-only for unclear licences. DMCA-style takedown button. UNSW supervisor sign-off before build.

**Prerequisite:** Aaron writes "My MRes Journey at UNSW" one-pager as seed data.

**Scope expansion:** Pathway Mapper covers ALL levels, not just postgrad:
- Undergraduate pathway (Year 12 to first year uni)
- TAFE pathway (cert III/IV/diploma to workforce or articulation)
- Apprenticeship pathway
- Return-to-study pathway (mature age entry, RPL)
- International student pathway (visa, English proficiency, agents)

**Priority:** Build AFTER Sprint FF ships and tester window opens. Timeline: ~6-8 weeks from now.

---

## Sprint LL — Source-Grounded RAG + Multimodal Ingestion (40 hours)

**Strategic intent:** Make Simplifii the only AI study tool that can prove its answers come from the student's own uploaded sources. Source-grounded RAG with citations = technical implementation of the Authenticity Report integrity promise.

**Phase 1: Foundation (12 hours).** Enable pgvector on Supabase. Create document_chunks table (user_id, document_id, file_name, page_number, chunk_index, content, embedding vector(1536)). Build VectorStorageService.js: chunkDocument (500-word chunks), generateEmbedding (OpenAI text-embedding-3-small), upsertChunks (batch insert), searchSimilar (cosine similarity). Hook into existing PDF upload flow (async, non-blocking).

**Phase 2: Grounded Retrieval (10 hours).** Build GroundedRAGService.js: retrieveContext (top 5 chunks with relevance scores), buildGroundedPrompt (system prompt with strict citation rules). AI answers ONLY from source blocks, appends [filename, page N] citations, refuses when sources lack the answer. Confidence threshold: top chunk relevance < 0.7 triggers UI warning.

**Phase 3: Citation UI (8 hours).** Parse AI output for [filename, page N] citations. Render as clickable inline badges. Click opens document preview at correct page. Hover shows exact source text quoted.

**Phase 4: Multimodal Input (10 hours).** Extend tutor input to accept text + PDF + image + audio attachments. Wire to Claude API multi-part content. Combine image vision with RAG retrieval for cross-modal grounded responses.

**Integration:** Tier 2 Socratic AI uses grounded RAG for every response. Multimodal Canvas transformations grounded in source document. Authenticity Report tracks citation usage. Brief Simplifier grounds decoding in actual uploaded brief.

**Dependencies:** OpenAI API key for embeddings (OPENAI_API_KEY in Vercel env, embeddings only). Supabase pgvector extension. Existing PDF parsing pipeline.

**Cost:** ~$0.0001 per document indexed, ~$50-200/month per 1,000 active users for embeddings (negligible vs Claude API costs).

**Deferred:** Sprint LL.2 (audio overview generation, 15 hours). Sprint LL.3 (video generation via Veo, 20 hours, only after 1,000+ paid users).

**Priority:** Build AFTER current P0s verified + tester window + before Sprint FF and HH (both need RAG plumbing). Suggested order: P0s ship, tester window, Sprint LL, Sprint FF, Sprint HH.

---

## Sprint II — Scholarship Discovery (20 hours)

Extracted from Sprint HH as standalone feature. Aggregate ALL Australian scholarships from data.gov.au, StudyAssist, state and federal databases. Filter by user profile (disability, first-gen, low-SES, indigenous, regional). Push deadline notifications. Available to Y10-12 students for early scholarship awareness, not just postgrad. Priority: post-Sprint HH Phase 1.

---

## Sprint JJ — Thesis Template Importer (15 hours)

"Use as template" button on every thesis in Sprint HH library. Imports chapter structure (heading hierarchy, word count targets per chapter, methodology type) into Three-Tier Canvas. User starts writing with a proven structural scaffold. Priority: ships alongside Sprint HH.

---

## Sprint KK — Institutional Sales Mode (40 hours)

B2B dashboard for schools/unis. Bulk student licence management. Admin reporting on Authenticity Report aggregates. SSO integration (SAML, OAuth via institutional providers). Procurement-friendly billing (POs, ABN invoicing, annual contracts). Target customers: Aria Learning, UNSW Equitable Learning Services, disability service providers, NDIS-funded learning support orgs. Priority: post-tester, post-Sprint FF.

## AURA Active Question Context (deferred)

AURA should know which question the learner is on (e.g. Question 25)
and respond about that specific question. Currently not possible
without passing activeQuestion from CanvasScreen to AuraChatOverlay.

Requires: CanvasScreen refactor to emit activeQuestion via event or context.
Defer to: next session after CanvasScreen is confirmed stable.


---

## SPRINT: Special Interest Personalisation
**Priority:** P1 (high value, not blocking)
**Estimated effort:** 8-12 hours

### Summary
Every AURA response, UDL transformation, joke, encouragement message, and analogy should draw from the learner's declared special interests.

### Required Changes

1. **Onboarding:** add "What do you love?" question
   - Store as `profile.specialInterests: string[]`
   - Up to 5 interests, free text
   - Editable from Settings

2. **Supabase:** add `special_interests TEXT[]` column to profiles table

3. **api/_aura-prompt.js:** inject special interests into system prompt context

4. **api/represent.js:** pass interests to UDL transformation prompts

5. **api/joke.js:** generate jokes in interest domain

6. **TaskLifecycleManager:** pass interests to milestone acknowledgement messages

7. **Dashboard greeting:** reference interests and cognitive style in welcome message

### Acceptance Criteria
- A student who lists "Dragon Ball Z" gets DBZ analogies from AURA, a DBZ joke, and DBZ-framed encouragement
- A student who lists "marine biology" gets ocean analogies and marine examples in UDL output
- A student with no interests set gets universally accessible generic examples (graceful fallback)
- Interests are editable from Settings at any time

### Status: NOT STARTED. Logged for future sprint.

---

## Multi-doc Ingestion Redesign (deferred)

Course outline, brief, and rubric need to be parsed as separate linked
documents that each contribute their own data to the assessment record.
Currently all merge into rawText. Fix requires ingestion pipeline redesign.

Separate sprint. Not blocking current functionality.

---

## SPRINT: Learning Journey Spine
**Priority:** P1 - high value, changes product identity
**Estimated effort:** 16-20 hours

### Summary
Replace the 13-tab canvas with a visible 5-stage learning journey spine. Student always knows where they are, what comes next, and how they are progressing.

### Five Stages
1. **Plan** - decode brief, understand rubric, set Pareto steps
2. **Research** - find sources, add to corpus, build argument
3. **Draft** - write with AI scaffold and Socratic support
4. **Review** - rubric check, formative feedback, Authenticity split
5. **Submit** - checklist, Authenticity Report, reflection prompt

### AURA Adapts to Current Stage
- Plan: asks "what must this essay prove?"
- Research: asks "what evidence supports that?"
- Draft: monitors silently, nudges every 10min if stuck
- Review: asks 3 Socratic questions about weakest section
- Submit: asks "what did you learn about your process?"

### Frameworks to Implement
- **ZPD:** AURA calibrates to edge of student capability
- **Bloom's:** identify cognitive level per task, scaffold to it
- **SDT:** competence feedback + growth acknowledgement
- **Metacognition:** end-of-task reflection prompt
- **UDL 3.0 Expert Learning:** student becomes aware of own profile

### Acceptance Criteria
- Student can see their stage at a glance
- AURA responses are stage-aware
- 13 tabs reorganised under 5 stages
- End-of-task reflection is prompted automatically
- Growth signals shown across sessions

### Status: NOT STARTED. Logged for future sprint.

---

## SPRINT: Pedagogical Spine
**Priority:** P0 - this is the product
**Status:** NOT STARTED - architecture work required
**Prerequisite:** Full design session before any code

The canvas tools exist but have no pedagogical logic connecting them. Missing:

### 1. Task decomposition with rationale

AURA explains WHY each step matters, not just what to do.

### 2. Bloom's taxonomy scaffolding

Questions tied to rubric criterion and cognitive level, building upward.

### 3. Hidden curriculum decoder wired to canvas

Surfaces implicit expectations per section as student writes each part.

### 4. Session memory

HistoryOfThought vault unlocked. AURA knows what was done last session. Adapts support based on demonstrated capability.

### 5. Thinking before writing

AURA asks 3 questions before student writes a single word. Forces concept clarity before prose.

### 6. Normalising layer in every response

Quiet counter-narrative for students who have been told they cannot do this.

### 7. Transition support module

Year 12 to uni expectations explained. Hidden curriculum of tertiary education. What markers actually reward.

### 8. Tool sequencing

Tools recommend the next tool on completion. Rubric decode -> Brief simplify -> Starter ideas -> Write -> Check -> Submit. Each tool knows what came before and after.

**DO NOT BUILD YET.** This is architecture work. Requires a full session to design properly.

---

## D5: weight field empty after Supabase round-trip

**Priority:** Degrading (not blocking)
**Location:** ProjectContext.js:275
**Issue:** `weight` field on assessmentBriefs is empty after Supabase round-trip if JSONB `extractionData` did not include it. The assessments table has no `weight` column, so weight only survives if the JSONB extractionData.assessmentBriefs stored it. Low impact: weight is cosmetic on dashboard, not used for sorting or AURA context.
**Fix:** Address when porting Assessment Scaffolder prompt (docs/REFERENCE_BUILD_AUDIT.md, Tool 1).

---

## D1-CONFIRMED: Rubric Decoder receives criteria names only, not full rubric text

**Priority:** Degrading (not blocking)
**Location:** CanvasScreen.jsx:399-400
**Issue:** ToolPanel for rubric-decoder passes `rubricText: rubricCriteria?.join('\n') || ''` which is a flat newline-joined list of criterion names extracted by regex. It does NOT pass the full rubric text with grade bands, descriptions, and mark allocations. The Rubric Decoder therefore receives only criterion headings, not the actual rubric content it needs to decode.
**Impact:** Rubric Decoder output is shallow. Grade bands are fabricated by Claude from criterion names alone rather than extracted from the actual rubric document.
**Root cause:** CanvasScreen.jsx:400 uses `rubricCriteria` (regex-extracted names) as the rubric source. The full rubric text is available as `briefOrText` but is passed as the `briefText` prop, not `rubricText`.
**Fix:** Change CanvasScreen.jsx:399 `buildPayload` to pass `rubricText: brief` (full document text) instead of `rubricText: rubric` (criteria names only). Requires touching CanvasScreen.jsx (currently constrained).
**Constraint:** DO NOT fix until CanvasScreen.jsx constraint is lifted.

---

## B4: AURA markdown still rendering in chat despite no-markdown rule

**Priority:** Degrading (user-facing)
**Location:** api/_aura-prompt.js (rule 2), src/frontend/components/AuraChatOverlay.jsx (cleanMarkdown)
**Issue:** Bold text (**text**) still visible in production AURA chat at BABS1201 Literature Review, despite no-markdown language rule added in commit `81142494`. Two possible causes: (1) Claude ignores the rule intermittently, (2) cleanMarkdown() regex has edge cases (e.g. bold spanning newlines, nested formatting).
**Investigate:** Test cleanMarkdown() against multi-line bold, nested bold+italic, bold with parentheses. Check if cached sessionStorage responses from before the rule was added are leaking.
**Fix:** Strengthen cleanMarkdown() regex. Consider clearing sessionStorage AURA cache on deploy version change.

---

## B5: [TOOL:simplify] tag leaking into canvas editor content

**Priority:** Degrading (user-facing)
**Location:** Starter Ideas tool output (PreWritePanel or similar) inserting into Tier 3 editor
**Issue:** The `[TOOL:simplify]` tag from AURA tool surfacing is appearing as visible text in the canvas editor. This tag is meant for AuraChatOverlay message rendering only and should never reach the editor content.
**Investigate:** Trace how PreWritePanel inserts text into the editor (likely via `simplifii:voice-transcript` event). Check if AURA responses containing [TOOL:] tags are being passed through to the insert path without stripping.
**Fix:** Strip `[TOOL:\w+]` tags from any text before inserting into the Tier 3 editor.

---

## A1: Assessments have no stable ID — matched by title string only

**Priority:** Architecture (not blocking, but fragile)
**Location:** AuraChatOverlay.jsx:42-47, ProjectContext.js ingestion path, CanvasScreen.jsx:107-109
**Issue:** Assessments are identified by title string throughout the app. AuraChatOverlay filters documents by title match. CanvasScreen finds the active brief by title match. RouterContext passes `assessmentTitle` (string) not an ID. If two assessments share a title (e.g. "Assessment Task 1" across different courses), scoping breaks. If a title is renamed after ingestion, the link breaks.
**Fix:** When the document node tree is built (Sprint 4), every assessment must be assigned a UUID at ingestion time. AuraChatOverlay, CanvasScreen, and ProjectContext should then scope by ID not title. Requires: UUID field on assessmentBriefs[], RouterContext passing assessmentId, Supabase assessments.id used as the canonical key.
**Constraint:** Deferred to Sprint 4 (document node tree architecture).

---

## Sprint 5: Task Guidance Engine — per-task instruction sequences

**Priority:** P0 architecture — this is the sprint that makes Simplifii an OS, not a tool collection
**Status:** NOT STARTED
**Depends on:** B5 fix (done), assessment context scoping (done)

Every assessment node needs a `taskSequence` generated at ingestion and stored in Supabase. Five phases per task:

1. **Understand** — decode the brief, identify what is being asked
2. **Plan** — structure the response, map rubric criteria to sections
3. **Gather** — find sources, build evidence corpus
4. **Draft** — write with AI scaffold and Socratic support
5. **Review** — rubric check, formative feedback, Authenticity split

Each phase has:
- `instruction`: what the student does in this phase
- `whyThisPhase`: one-sentence rationale
- `auraOpeningPrompt`: the question AURA asks when this phase begins
- `toolsForThisPhase`: which canvas tools are relevant (e.g. Plan phase = simplify + rubric)
- `completionSignal`: what triggers phase advancement (e.g. "3 sources added" or "draft > 500 words")
- `estimatedMinutes`: realistic time estimate including neurodivergent buffer
- `lockedUntil`: optional prerequisite phase ID (prevents skipping ahead)

### Canvas integration

`TaskPhaseBar.jsx`: horizontal phase progress bar at top of canvas. Current phase highlighted. Time estimate visible. Clicking a phase shows its instruction.

AURA receives `currentPhase` in contextPacket, uses `auraOpeningPrompt` as opening question when the student enters a phase.

Tool rail filters to `toolsForThisPhase` for the current phase (e.g. during Gather phase, only show Sources + Tutor, hide Brief Simplifier).

`ExecutiveSpine` monitors `completionSignals` and advances `currentPhaseId` when criteria are met.

### New files

- `api/generate-task-sequence.js` — generates the 5-phase sequence from brief + rubric text
- `src/frontend/components/TaskPhaseBar.jsx` — phase progress renderer
- `src/core/TaskSequenceManager.js` — phase state management, signal monitoring, advancement logic

### Modified files

- `useIngestion.js` — call generate-task-sequence after ingestion
- `ProjectContext.js` — store taskSequence per assessment
- `api/_aura-prompt.js` — inject currentPhase into AURA context
- `AuraChatOverlay.jsx` — pass currentPhase in API payload
- `CanvasScreen.jsx` — render TaskPhaseBar, filter tool rail

Can build before Sprint 4 using raw text inputs. Upgrade to typed node inputs when Sprint 4 lands.
