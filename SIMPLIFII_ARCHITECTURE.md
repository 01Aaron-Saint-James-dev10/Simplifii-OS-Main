# Simplifii-OS: Master System Architecture
Version: 2.0.0 (Merged-OS)
Status: Active Build Specification
Constitution: CLAUDE.md v2.0.0

## 1. The Mandate

Simplifii-OS is the technical implementation of the merged vision documented in CLAUDE.md. It absorbs and unifies three prior builds:

- Simplifii-Beta (simplifii-beta.com): nine assessment tools and the credit/ticket activity model
- Neural Docs (neural-flow-docs.base44.app): block-based editor, per-block AI feedback, and the educator dashboard with anonymised wellbeing signals
- NeuroDoc Cognitive OS (neurodoc-versa-scriptum): the multi-document workspace shell, AI reliance tracking, collaboration, homework dashboard, and Institution Mode

The merged product serves seven audience tiers (Primary, Secondary, University, Postgrad, Homeschool, Educator, Institution) through a single cloud-backed React application with the three-tier canvas as its core integrity engine.

## 2. The Stack

- Frontend: React 18 + Create React App (no TypeScript). Tailwind CSS + custom CSS. Framer Motion. Lucide-React. Three.js / React-Three-Fiber for the Concept Visualiser.
- Authentication: Google OAuth via @react-oauth/google (already installed) plus email-based accounts. Parent-child linkage for the Homeschool tier.
- Cloud Backend (provider TBD): PostgreSQL via Supabase or Vercel + Neon. Encrypted at rest. WCAG-compliant REST API.
- Local Cache: IndexedDB for offline-tolerant work and the History of Thought local mirror.
- AI Layer (hybrid): Local Ollama (for advanced users who run it) routed through localhost:11434. Cloud-hosted LLM (Anthropic/OpenAI/Google) for all other users. Both routed through a single model contract so Tier 1, Tier 2, and Tier 3 outputs are interchangeable.
- Document I/O: pdfjs-dist (ingestion + OCR fallback), jspdf (PDF export), docx library (DOCX export). Both export paths required.
- Telemetry: Anonymous event pipeline. Events flow through EventBus to both HistoryOfThought (local) and the cloud telemetry layer (anonymised, aggregated).
- Style Guard: Pre-commit hook in scripts/check-style.js blocks em-dashes and US English spellings.

## 3. The Five-Stage User Flow

### Stage 01: The Sovereign Handshake (Personalised Account Entry)

Function: cloud account authentication, tier selection, and a world-class personalisation onboarding that profiles the learner so every other surface in the OS adapts to them from day one.

Surface: src/frontend/LandingPage.js (entry) plus a new OnboardingFlow component (multi-step).

Mechanics:
- Step 1: Google OAuth (primary) or email/password (fallback). Optional passwordless magic link.
- Step 2: Tier picker. Primary, Secondary, University, Postgrad, Homeschool, Educator, Institution.
- Step 3: Homeschool tier only: parent account first, then child account linkage with age-appropriate flow.
- Step 4: Personalisation onboarding (the world-class part). The system asks the learner to surface, in their own words and through low-load choices, the following profiles:
  - Learning style: how they take in information (visual / auditory / kinesthetic / multimodal). Surfaced through scenario choices, not a quiz.
  - Communication style: how they prefer to receive instructions (literal / metaphorical / step-by-step / overview-first).
  - Memory profile: working-memory load tolerance, recall strengths, where they tend to lose track.
  - Processing style: fast / deliberate, top-down / bottom-up, single-thread / parallel, divergent / convergent.
  - Accessibility preferences: font, contrast, motion, dyslexia mode, reading speed, BionicText, LiteralMode default, screen reader use, keyboard-only use, voice input.
  - Energy and load pattern: when they study best, how long they can focus, what depletes them.
  - Strengths and existing strategies: what they already do well; what scaffolds they have built for themselves.
  - Past educational harm signal (optional, opt-in only): general indicators that adjust the trauma-informed defaults (slower transitions, softer language, less surprise).
- Step 5: System mirrors the profile back to the learner in plain language. They can adjust any answer. Nothing is locked in.
- Step 6: System sets the four SteeringDrawer dials to the profile-derived defaults (Persona, Scaffolding, Grit, LOD) and saves them to SettingsContext.
- Step 7: System offers Stage 02 (Ingestion) or a guided tour of the OS.

Status: Needs Rebuild. The current LandingPage.js implements passphrase-as-encryption-key (Gemini drift) which contradicts the cloud-backed architecture. Must become real account auth plus the personalisation onboarding.

### Stage 02: The Ingestion Drive (Auto-Organising Timeline)

Function: the learner drops in everything they have (briefs, rubrics, syllabi, course outlines, weekly readings, lecture slides, past assignments, homeschool curriculum documents) and the system does the heavy lifting. The learner never has to organise anything themselves. The system organises the chaos into a coherent timeline of tasks they can follow.

Surface: src/frontend/UniversalOnboarding.js and a new IngestionPipeline service that orchestrates the multi-stage extraction.

Mechanics:
- Accepts: PDF, DOCX, plain text, pasted text, images of handwritten or scanned material, syllabus URLs, LMS exports.
- pdfjs-dist extraction with OCR fallback for scanned documents.
- Per-block confidence scoring: every extracted block carries a confidence value. Anything below threshold gets flagged for manual paste with the original source page visible alongside.
- Auto-classification per document: brief, rubric, syllabus, reading, lecture, past assignment, weekly schedule.
- Auto-grouping into Pillars: documents are clustered by course/subject/unit code without the learner having to tag anything.
- Auto-timeline construction: the system reads dates, due dates, weeks, topics, deadlines from across all ingested documents and builds a unified timeline of tasks for the learner. Each task carries its source document, its weight, its due date, its rubric criteria, and its first Pareto step.
- The timeline is the OS's spine: every surface in Simplifii-OS references it. Stage 03 (Pillar Gallery) is a course-grouped view of the timeline. Stage 04 (Cockpit) is the active-task view of the timeline.
- The system surfaces conflicts and gaps explicitly: overlapping deadlines, missing rubrics, ambiguous dates. The learner is asked to confirm, not guess.
- The system never hallucinates structure. If a document does not declare a deadline, the timeline shows the task as undated until the learner provides one. If a rubric is missing, the task is flagged as un-scoped.
- Brief auto-decomposition: the system reads each assessment brief and produces five Pareto Steps (the highest-mark-density actions, in order). The learner can edit or replace any step.

Status: Partially Shipped. Ingestion works for university briefs. Needs extension for: homeschool curriculum imports (Australian Curriculum, NSW syllabus, state syllabi internationally), universal LMS scope (Canvas, Moodle, Brightspace, Google Classroom, Blackboard, Schoology, D2L, Seesaw), auto-timeline construction, per-block confidence scoring with manual paste fallback, and the auto-decomposition into Pareto Steps.

### Stage 03: The Pillar Gallery (Course Navigation)

Function: the main navigation surface. Learner picks which course/subject to work on. Each Pillar is a course-grouped slice of the master timeline built in Stage 02.

Surface: to be extracted from MasterDashboard.js (currently a 77KB monolith).

Mechanics:
- Grid of Pillar cards (one per course/subject).
- Zen empty state if no Pillars exist.
- Tier-aware icons and labels (e.g., Year 6 Maths vs Constitutional Law).
- Add Course tile launches Stage 02.
- Anonymised activity signal per Pillar (focused / behind / ahead) for the learner only.
- Each Pillar tile shows next due task and time horizon.

Status: Pending. Logic likely exists inside MasterDashboard.js but is buried in the monolith.

### Stage 04: The Authoring Cockpit (Where Work Happens)

Function: the three-tier canvas. The primary work surface.

Surface: currently inside MasterDashboard.js, will be split into a dedicated Cockpit component. Block editor lives in LinearCanvas.js.

Mechanics:
- Three vertical panels rendered side-by-side.
- Tier 1 panel (left): AI Pre-Write. AI generates drafts, scaffolds, outlines. Learner accepts, edits, or discards.
- Tier 2 panel (centre): Socratic Prompts. AI generates questions; learner answers. Surfaces thinking before writing.
- Tier 3 panel (right): Learner Writing. Block-based editor (from Neural Docs). This is the assessed artefact.
- Live preview pane on the far right: rendered submission-ready document (PDF or DOCX preview), collapsible.
- All transitions between tiers logged to HistoryOfThought.
- Pareto Steps surfaced above the canvas: the five highest-mark-density actions for the active task (auto-decomposed in Stage 02).
- SteeringDrawer for the four dials (Persona, Scaffolding, Grit, LOD).

Status: Pending. The single most important build target. Block editor exists. Three-tier canvas does not. Live preview pane does not.

### Stage 05: The AURA Layer (Persistent AI Companion)

Function: the always-available AI assistant overlay. Cross-stage.

Surface: src/frontend/AuraLayer.js, src/frontend/AskAura.js, src/frontend/AIAvatar.js

Mechanics:
- Triggered by the AskAura pill at the bottom of the viewport.
- Citation pills tie AI answers to ingested source material.
- Neural Dot visual state indicator.
- Can be invoked from Stage 02 (during ingestion), Stage 03 (course-level questions), Stage 04 (mid-writing).
- In Stage 04, AURA routes the four dials and the active Tier into its prompt construction.
- AURA reads the learner's personalisation profile (from Stage 01) on every prompt construction so responses adapt to communication style, processing style, and load tolerance.

Status: Partially Shipped. Citation pills work. Pre-writing capability (Tier 1) needs to be added. Personalisation-profile integration needs to be added.

## 4. Cross-Stage Surfaces

These run alongside the five stages:

- Settings Vault: AccessibilityVault.js and SettingsContext.js. All accessibility, dial, and preference state including the personalisation profile.
- Steering Drawer: SteeringDrawer.js. The four dials.
- Resilience Bridge: IdleNudge.js and SupportBridge.js. Trauma-informed nudges when load is too high.
- History Vault: HistoryVaultUnlock.js. The learner's authenticity log.
- Resource Drawer: FloatingResourceCard.js and ResourceIngestor.js. Tier-aware affiliate and resource recommendations.
- Dev Insights: DevInsightsPanel.js. Developer-only diagnostic surface (hidden in production).
- Concept Visualiser: GraphView.js plus Three.js. The Simplifii-Beta concept-mapping tool.

## 5. The Nine Simplifii-Beta Tools

These are the toolkit, callable from the Cockpit or directly:

- Brief Simplifier: logic in UniversalOnboarding.js and SmartIntake.js. Partially Shipped.
- Course Planner: to be extracted. Pending.
- Rubric Simplifier: to be built into the ingestion pipeline. Pending.
- Essay Scorer: EssayScorer.js. Shipped (basic).
- Humaniser: Humaniser.js. Shipped (basic).
- Scaffolder: Scaffolder.js plus scaffolder.css. Shipped.
- Hidden Curriculum Decoder: lives inside AURA prompt patterns. Pending.
- Concept Visualiser: GraphView.js. Partially Shipped.
- Executive Planner: to be built. Pending.

## 6. The Core Engine

These five modules live in src/core/ and must not be collapsed:

1. SovereignRouter (src/core/SovereignRouter.js). Function: tier resolution, theme application, capability hydration based on learner tier. Status: Needs Evolution. Currently routes by "stream"; must be extended to route by audience tier (Primary, Secondary, etc.) and also by personalisation profile.

2. ExecutiveSpine (src/core/ExecutiveSpine.js). Function: focus sessions, idle detection, section health, Pareto routing, transition management. The behavioural-telemetry source. Status: Shipped.

3. HistoryOfThought (src/core/HistoryOfThought.js). Function: encrypted local log of learner activity + Authenticity Report generator + cloud telemetry emitter. Status: Needs Evolution. Currently local-only. Must also emit anonymised event packets to the cloud telemetry layer (without leaking work content).

4. LiteralMode (src/core/LiteralMode.js). Function: render-time vocab transformer (academic jargon to plain language). Status: Shipped.

5. EventBus (src/core/EventBus.js). Function: pub/sub bridge from spine CustomEvents to HistoryOfThought (local) and cloud telemetry pipeline. Status: Needs Evolution. Currently local only. Must dual-emit to cloud.

New core modules require an amendment to this document and to CLAUDE.md before introduction.

## 7. Data Architecture (Three Layers)

Per the Constitution's Institutional Sovereignty rule, data is stored in three separate layers with three different access models:

### Layer 1: Learner Work Content
- What: essays, drafts, notes, ingested briefs, rubrics, the actual artefact, the personalisation profile responses
- Where: cloud database, encrypted at rest
- Who sees it: only the learner. Parents in the Homeschool tier see only their linked child's progress derivatives, never the writing or profile content itself.
- Local mirror: IndexedDB, for offline tolerance

### Layer 2: Behavioural Telemetry
- What: time-on-task, scaffolding usage, AI reliance percentage, focus signals, dial states, Pareto-step engagement, tier transitions, AI contributions per artefact, ingestion patterns
- Where: cloud telemetry pipeline
- Who sees it identified: nobody (not even Simplifii-OS staff in normal operation)
- Who sees it aggregated: institutional customers (paid tier) see cohort-level only. The platform team sees aggregate for product improvement.
- Powers: Authenticity Report (for the learner), institutional dashboards (paid), the data corpus moat

### Layer 3: Account Metadata
- What: email, declared tier, declared subjects, declared accessibility needs, declared interests, parent-child linkage
- Where: cloud database
- Who sees it: the learner (full control). Simplifii-OS uses it for tier routing and personalisation. Advertisers and affiliates only see it in aggregate.
- Powers: tier routing, Resource Drawer recommendations, affiliate suggestions

## 8. Output Standards

Per the Constitution's Output Standards rule, exports must be universally LMS-compatible:

- Export formats: PDF via jspdf, DOCX via docx library, plain text, HTML
- LMS targets: Turnitin, Moodle, Canvas, Brightspace, Google Classroom, Blackboard, Schoology, D2L, Seesaw, plus any institutional dashboard or journal portal. LMS-agnostic by design.
- Typography: Times New Roman, Arial, or Calibri at 11 to 12pt
- Citation styles: APA 7, MLA 9, Harvard, Chicago, IEEE, Vancouver, AGLC
- Configurable: margins, page numbers, headers, footers, line spacing, cover page
- Auto-generated: reference list from inline citations, word count (excluding refs and footnotes per submission norms)
- LTI (Learning Tools Interoperability) integration planned for direct LMS submission where supported

The live preview pane (right-hand surface of the Cockpit) renders the export in real time so the learner always sees what they are submitting before they submit it.

## 9. Implementation Status (Honest)

| Stage / Surface | Status | Notes |
|---|---|---|
| Stage 01: Sovereign Handshake | Needs Rebuild | Currently Gemini-drift passphrase auth; needs Google OAuth + tier picker + personalisation onboarding |
| Stage 02: Ingestion Drive | Partially Shipped | University briefs work; LMS-universal + curriculum imports + auto-timeline + Pareto auto-decomposition pending |
| Stage 03: Pillar Gallery | Pending | Buried in MasterDashboard.js 77KB monolith |
| Stage 04: Authoring Cockpit | Pending | Three-tier canvas not built; live preview not built |
| Stage 05: AURA Layer | Partially Shipped | Citations work; pre-write capability and profile integration needed |
| Core: SovereignRouter | Needs Evolution | Tier-aware + profile-aware routing needed |
| Core: ExecutiveSpine | Shipped | |
| Core: HistoryOfThought | Needs Evolution | Cloud telemetry emission needed |
| Core: LiteralMode | Shipped | |
| Core: EventBus | Needs Evolution | Dual-emit local + cloud needed |
| Cloud auth surface | Not Started | Google OAuth installed but unused |
| Tier picker | Not Started | |
| Personalisation onboarding | Not Started | The world-class profiler |
| Auto-timeline constructor | Not Started | Critical Stage 02 piece |
| Parent dashboard (Homeschool) | Not Started | |
| Educator dashboard | Not Started | Neural Docs pattern to copy |
| Institution mode (paid tier) | Not Started | NeuroDoc pattern to copy |
| Anonymous telemetry pipeline | Not Started | |
| Live preview pane | Not Started | |
| DOCX export | Not Started | docx library not yet installed |
| Three-tier canvas | Not Started | The central build target |
| Authenticity Report | Spec only | HistoryOfThought generates fragments; full report rendering pending |
| LMS-universal export | Partial | PDF only; DOCX, HTML, plain-text pending |

## 10. Build Priority (Suggested Order)

1. Foundation cleanup: this document and CLAUDE.md aligned (done). Stale Gemini drift removed.
2. MasterDashboard.js audit and split: 77KB monolith broken into discrete components (Pillar Gallery, Cockpit shell, etc.). Job for Claude Code.
3. Cloud auth surface plus tier picker plus personalisation onboarding (Stage 01 rebuild): replace Gemini's passphrase auth with Google OAuth and add the world-class profiler.
4. Auto-timeline constructor (Stage 02 completion): the system that takes the brunt off the learner.
5. Three-tier canvas in the Cockpit (Stage 04 core build): the integrity engine. The killer feature.
6. Live preview pane: Claude-artefact-style right-hand surface.
7. HistoryOfThought plus EventBus cloud emission: anonymised telemetry pipeline.
8. Educator and Institution dashboards: aggregated views for paid and free educator tiers.
9. Resource Drawer: tier-aware affiliate and resource surface.
10. Homeschool tier specifics: parent-child linkage, curriculum imports, scope-and-sequence.
11. DOCX, LTI, and universal LMS export: the submission-readiness commitment.

Items 2 through 6 are the critical path. Everything else is sequenced behind them.
