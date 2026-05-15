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

## Sprint DD — Reading + Writing Support Layer

Active reading + writing assistance throughout the editor. 12 features: read-aloud for editor content, read-aloud for original document, reading speed estimator, comprehension break reminders, reading ruler, focus mode, sentence starters, idea-to-sentence helper (voice to structured text), dyslexia-friendly spell help, writing analysis sidebar, word prediction, citation/reference helper. Profile-aware defaults per accessibility profile. Effort: 40-50 hours. Priority: build after multimodal canvas.
