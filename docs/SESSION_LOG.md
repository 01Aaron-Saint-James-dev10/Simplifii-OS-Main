## Sprint 17: P0 Fixes + AURA Upgrades + Section Nav + Dashboard Org + Rubric Scaffold
**Date:** 2026-05-18

### Commits

| SHA | Change |
|-----|--------|
| `e195cc62` | fix(P0): stripMarkdown on injected AURA messages, format raw ISO dates |
| `91e622b5` | feat(AURA): formatted markdown rendering in tutor messages |
| `114d9423` | feat(AURA): navigation intent detection and canvas routing |
| `3529c44e` | feat(canvas): section navigation pills in WRITE tab |
| `2f3343ab` | feat(dashboard): pin and archive controls for course cards |
| `fd84c09b` | feat(PreWrite): rubric-mapped scaffold with per-criterion starters |

### Summary

1. **P0 fix: raw markdown + ISO dates**: injected and phase AURA messages now pass through stripMarkdown. All due date render sites (AuraChatOverlay, AssessmentSwitcher, BriefPanel) format as en-AU human dates.
2. **AURA formatted responses**: new FormattedMessage component renders bold, italic, bullets, numbered lists, headers as React elements (no innerHTML). rawText stored for display, stripped text for voice.
3. **AURA navigation**: matchNavTarget() detects nav intent ("take me to", "open my") and fuzzy-matches course/assessment names. Navigates immediately with confirmation button. open_canvas tool suggestion wired.
4. **Section navigation pills**: section architecture already existed (SectionEditor, activeSections) but had no user-facing nav. Added clickable section pills in WRITE tab header with word count targets ("Introduction (300w)").
5. **Dashboard pin/archive**: localStorage-backed pin and archive per course. Pinned sort to top with accent border. Archived courses collapse to bottom section with show/hide toggle. No Supabase changes.
6. **Rubric-mapped scaffold**: PreWritePanel now receives rubricCriteria from CanvasScreen. When criteria exist, generates per-criterion starter sentence + two Socratic questions. Falls back to generic bullets when no rubric.

### Test Results

122 tests pass (4 suites). Build compiles clean, no errors.

---

## Sprint 15: Journey Tests + Brief Weight Fix + rgba Cleanup + QuestionCoach
**Date:** 2026-05-18

### Commits

| SHA | Change |
|-----|--------|
| `9815fb77` | journey-tests: replace smoke suites 1-4 with J1-J5 BABS1201 journey tests |
| `9dd87362` | fix-brief-weight: prioritise dedicated weighting field over first-percentage match |
| `0a4fedae` | rgba-cleanup: guard last unexempted raw rgba() in CanvasScreen with allow-style |
| `e4738c04` | transform-question-api: four parallel UDL question variants via Promise.all |
| (staged)  | secondary-canvas: QuestionCoach three-tier exam canvas |

### Summary

1. **Journey tests J1-J5**: replaced low-value smoke suites 1-4 with fixture-seeded journey tests covering dashboard, THINK tab, IDEAS tab, WRITE tab, and AURA Socratic guard. 20/20 pass in test mode, 12/12 against prod.
2. **Brief weight fix**: BriefService.js line-anchored weighting regex now requires a weighting/weight/worth keyword context before accepting a percentage, preventing first-in-document grab from multi-assessment course outlines.
3. **rgba cleanup**: last unguarded raw rgba() in CanvasScreen.jsx marked allow-style (CSS variable fallback for --sov-line-dim).
4. **transform-question API**: new /api/transform-question — 5/min rate-limited, four parallel Claude calls returning plainLanguage, visualBreakdown, workedExample, audioReady.
5. **QuestionCoach**: new three-tier exam canvas component replacing MultimodalCanvas + QuestionNav. Horizontal pill strip, UDL buttons calling /api/transform-question, AURA Tier 2 button, answer workspace with localStorage persistence. Bundle shrunk 2.25 kB.

### Test Results

12/12 regression tests pass (prod mode). Build compiles clean, no errors.

---

## Sprint 14: AI Permission Level + Weight Fix + Test Fixture
**Date:** 2026-05-18

### Commits

| SHA | Change |
|-----|--------|
| `d43a4071` | fix-weight-extraction: disambiguate weight for multi-assessment briefs |
| `3a572f15` | fixture-babs1201: real BABS1201 test fixture with XN/YN/QN nodes |
| `c4179331` | sprint-14-ai-permission: extract aiPermission, No Assistance banner in canvas |

### Summary

1. **Weight extraction fix**: extract-document.js prompt disambiguates weight to the specific assessment described in the brief, not the first percentage found.
2. **Test fixture**: tests/fixtures/test-course.json with real BABS1201 structure (5 XN, 2 YN, 5 QN nodes, 6 rubric criteria).
3. **AI Permission Level**: new `aiPermission` field in extract-document.js (no_assistance, assistance_with_attribution, full_assistance). useIngestion stores it. CanvasScreen displays dismissible amber banner when no_assistance detected.
4. **Sprint 14 backlog entry**: AI Permission Level documented in docs/BACKLOG.md.

### Test Results

15/15 regression tests pass. Build compiles clean.

---

## Sprint 13.7: Weight Extraction Fix + BABS1201 Test Fixture
**Date:** 2026-05-18

### Commits

| SHA | Change |
|-----|--------|
| `d43a4071` | fix-weight-extraction: disambiguate weight for multi-assessment briefs |
| `3a572f15` | fixture-babs1201: real BABS1201 test course fixture + Sprint 14 backlog |

### Summary

1. **Weight extraction fix**: api/extract-document.js prompt now instructs Claude to extract weight for the specific assessment only, not the first percentage found in multi-assessment documents.
2. **Test fixture**: tests/fixtures/test-course.json with real BABS1201 structure (XN1-5, YN1-2, QN1-5, six rubric criteria with mark allocations).
3. **Sprint 14 AI Permission Level**: logged to docs/BACKLOG.md for next session.

### Test Results

15/15 regression tests pass. Build compiles clean.

---

## Sprint 13.5: Socratic Greeting + Composite Progress + Email Capture + Keyboard Tests
**Date:** 2026-05-18

### Commits

| SHA | Change |
|-----|--------|
| `bbe7d794` | fix-aura-greeting: Socratic-first opening replaces assistant-first |
| `d733339f` | composite-progress: three-factor progress bar (words+thinking+scaffold) |
| `04bfe181` | wire-progress-keys: SocraticPanel and PreWritePanel write localStorage |
| `05531145` | email-capture: waitlist table + EmailCapture.jsx on landing page |
| `bb3e18fb` | keyboard-nav-tests: Suite 7 Tab/Enter/Escape (15 tests total) |

### Summary

1. **AURA Socratic-first**: greeting now asks "what do you already know?" grounded in task, never "what would you like to start with?"
2. **Composite progress**: BottomStrip shows words (50%) + thinking (25%) + scaffold (25%) capped at 100%
3. **localStorage writers**: SocraticPanel increments tier2-count, PreWritePanel sets scaffold-accepted
4. **Email capture**: waitlist table (RLS: public insert, service select), EmailCapture component on landing footer
5. **Keyboard nav tests**: ArrowRight between tabs, Enter activates, Escape closes AURA

### Test Results

15/15 regression tests pass. Build compiles clean.

### Known Gap

Composite progress thinking/scaffold components show 0% until a student actually answers Tier 2 questions or accepts a scaffold. The localStorage keys are written correctly but require user interaction.

---

## Design Token Migration
**Date:** 2026-05-18

### Commits

| SHA | Change |
|-----|--------|
| `b1c9c7c1` | design-token-migration: all 16 raw rgba() violations replaced with named tokens (9 eliminated, 7 remain as allow-style exemptions) |

---

## Sprint 12.5: A/B/C Variants for AURA Responses
**Date:** 2026-05-18

### Commits

| SHA | Feature |
|-----|---------|
| `3edd2057` | abc-variants: three parallel AURA responses A/B/C, student picks preferred style, logged to HistoryOfThought |

### Test Results

12/12 regression tests pass. Build compiles clean.

---

## Sprint 12 (Partial): Exam Paper QN Extraction + DocLibrary Hydration Fix
**Date:** 2026-05-18

### Commits

| SHA | Fix |
|-----|-----|
| `1d0ea500` | fix-doclibrary-hydration: promote sourceFiles into extractionData |
| `3e4d51f2` | exam-question-extraction: QN node extraction for exam papers |

### Summary

1. **DocLibrary hydration fix**: Pre-Sprint-10 courses stored `sourceFiles` at course root level. Hydration now promotes `d.sourceFiles` into reconstructed extractionData so DocLibrary shows documents for all courses.

2. **QN node extraction**: DocumentNodeService now handles `exam_paper` type documents locally via regex (no API call). Splits on "Question N" or numbered patterns, extracts marks from "(X marks)" pattern, detects question_type (multiple_choice, short_answer, extended_response). Returns QN-prefixed nodes.

### Deferred (BACKLOG)

- **Firecrawl NESA HSC corpus crawl**: Crawl educationstandards.nsw.edu.au past papers, populate `past_papers` and `past_questions` tables. Deferred to post-tester session.
- `past_questions` Supabase schema already exists and is ready for population.

### Test Results

12/12 regression tests pass. Build compiles clean. No failures.

### Next Session Constraint

Tester feedback defines Sprint 11 scope. Firecrawl NESA crawl is Sprint 12 continuation post-tester.

---

## Sprint 10.5: Six-Fix Pass (SHARP/FORGE/CRAFT)
**Date:** 2026-05-18

### Commits

| SHA | Fix |
|-----|-----|
| `8cb588ae` | fix-voice-default: voice TTS on by default with mute tooltip |
| `a7ec891d` | fix-stt-cleanup: abort SpeechRecognition on unmount |
| `b9a20e97` | fix-scaffold-button: ensure rail visible before panel activation |
| `79fc32b5` | fix-assessment-title: strip markdown from assessment title in nav |
| `a62da8f8` | fix-tier2-blooms: Socratic questions use Bloom's taxonomy 4-6 |
| `d297a744` | fix-dragon-controls: replace orb clicks with +/- buttons |

### Summary

1. **Voice TTS default on**: voiceMode initialises true; tooltip clarifies mute action.
2. **STT cleanup**: IdeaToSentence aborts SpeechRecognition on unmount, preventing AURA STT conflicts.
3. **Scaffold button rail visible**: all paths that open a panel (DocumentClassifiedModal, ReentryOverlay, ComprehensionBreak, onAskTutor) now call setRailVisible(true) first.
4. **Assessment title**: stripMarkdown() applied to assessmentTitle in CanvasNav breadcrumb.
5. **Tier 2 Bloom's 4-6**: Socratic prompt replaced with six TYPE A-F question patterns (Analyse, Evaluate, Create), task-grounded, trauma-informed, exactly 3 questions.
6. **Dragon Ball +/- controls**: orbs display-only (aria-hidden), dedicated + and - buttons (minHeight 44, accessible), count display in ACCENT_PULSE.

### Test Results

12/12 regression tests pass. Build compiles clean. No failures.

### Next Session Constraint

Tester feedback defines Sprint 11 scope.

---

## Sprint 9 Complete: Tier 2 Socratic Panel
**Date:** 2026-05-17

### What was built

**Three-tier canvas now complete:**
- Tier 1: PreWritePanel (AI pre-write scaffolds)
- Tier 2: SocraticPanel (thinking before writing) — NEW
- Tier 3: SectionEditor (learner writing)

**fix(api): systemOverride in tutor.js**
- `/api/tutor.js` now reads `systemOverride` from request body
- If present, bypasses full AURA prompt build and uses custom system prompt
- Fixes orphaned systemOverride calls in PreWritePanel, FirstLookCard, MultimodalCanvas

**tier_2_response added to EVENT_TYPES**
- HistoryOfThought.js EVENT_TYPES array now includes `tier_2_response`
- Authenticity Report can now log Socratic thinking events

**SocraticPanel.jsx created (230 lines)**
- Calls /api/tutor with systemOverride for Socratic question generation
- Grounded in XN1 node content + current task phase
- Student types answers in textarea per question
- Each answer logged via appendEvent as `tier_2_response`
- Payload: { question, answer, phase, assessmentTitle, courseId }
- Design tokens only, no raw hex. Obsidian aesthetic.
- 240px width, collapsible. Header: "THINK FIRST"

**SocraticPanel wired into CanvasScreen**
- Renders between PreWritePanel and canvas-centre
- Guarded: `!isExamPaper && currentTitle`
- Props: currentTitle, courseId, currentPhase, nodes

**Backlog entries logged:**
- B10: Raw markdown in classification card
- B11: No document type options after classification
- B12: __BABS1201__ raw markdown in canvas breadcrumb
- CRAFT-T1: AURA default opening is assistant-first (not Socratic)
- CRAFT-T2: Reading level displayed live (anxiety-inducing)

### Loop 1 fully closed

The integrity engine is now architecturally complete. Every AI contribution (Tier 1) is separated from the student's thinking (Tier 2) and their writing (Tier 3). The Authenticity Report can now render a timeline showing: what AI provided, what the student thought about it, and what they wrote.

### Files changed

| File | Type | Summary |
|---|---|---|
| `api/tutor.js` | Modified | systemOverride support added |
| `src/core/HistoryOfThought.js` | Modified | tier_2_response event type added |
| `src/frontend/components/SocraticPanel.jsx` | New | Tier 2 Socratic panel (230 lines) |
| `src/frontend/CanvasScreen.jsx` | Modified | Import SocraticPanel, wire between Tier 1 and Tier 3 |
| `docs/BACKLOG.md` | Modified | B10, B11, B12, CRAFT-T1, CRAFT-T2 logged |

### Commit SHAs

| SHA | Description |
|---|---|
| `77ae2f9c` | feat(canvas): SocraticPanel Tier 2 wired into CanvasScreen (CRAFT-A2) |
| `77ae2f9c` | (includes SocraticPanel.jsx + B10/B11/B12/CRAFT-T1/T2 backlog) |
| Prior this session: `64595d47` | feat(accessibility): LiteralMode (CRAFT-A1) |
| Prior this session: `8a22ba36` | feat(accessibility): BionicText + OpenDyslexic (CRAFT-A3) |
| `77ae2f9c` (parent): `77ae2f9c` | fix(api): systemOverride + tier_2_response |

### Tests

Build: passing (zero errors). Regression: 12/12 passed.

### Next session constraints

B10 + B11 + B12 fixes:
- B10: raw markdown in classification card
- B11: no document type options after classification
- B12: __BABS1201__ raw markdown in canvas breadcrumb

---

## Sprint 8 Complete: Accessibility Features Wired Globally
**Date:** 2026-05-17

### What was built

**CRAFT-A1: LiteralMode transformer wired**
- `AuraChatOverlay.jsx`: imports `literalise` from LiteralMode.js. After markdown strip, applies `literalise(clean)` when `isLiteralMode` is true. AURA responses now have academic jargon transformed to plain English at render time.
- `PreWritePanel.jsx`: imports `literalise`. AI scaffold text is transformed before setting state when `isLiteralMode` is true.
- This is the second-pass safety net: even if the AI prompt instruction fails to produce plain language, the transformer catches remaining jargon.

**CRAFT-A3: BionicText + OpenDyslexic applied globally**
- `SettingsContext.js`: new `fontPreference` state synced from `localStorage('simplifii_editor_font')` via `simplifii:font-change` event listener. Root div now carries `data-bionic` and `data-font` attributes.
- `src/index.css`: global CSS rules for `[data-font="opendyslexic"]` (forces OpenDyslexic on all text surfaces) and `[data-bionic="true"]` (bold emphasis at weight 700).
- Both settings now affect AURA chat, scaffold panel, and all text surfaces (not just the editor).

**Also this session:**
- Removed benign console.log from AppShell (security hygiene)
- CRAFT-A1/A2/A3 logged to BACKLOG.md for tracking

### Files changed

| File | Type | Summary |
|---|---|---|
| `src/frontend/components/AuraChatOverlay.jsx` | Modified | Import literalise, apply to AURA response |
| `src/frontend/components/PreWritePanel.jsx` | Modified | Import literalise, apply to scaffold text |
| `src/frontend/SettingsContext.js` | Modified | fontPreference state, font-change listener, root data attributes |
| `src/index.css` | Modified | Global CSS for OpenDyslexic and BionicText |
| `src/frontend/AppShell.jsx` | Modified | Remove console.log |
| `docs/BACKLOG.md` | Modified | CRAFT-A1/A2/A3 entries added |

### Commit SHAs

| SHA | Description |
|---|---|
| `1202f3b7` | fix(security): remove console.log + CRAFT entries to BACKLOG |
| `64595d47` | feat(accessibility): wire LiteralMode transformer (CRAFT-A1) |
| `8a22ba36` | feat(accessibility): BionicText + OpenDyslexic globally (CRAFT-A3) |

### Tests

Build: passing (zero errors). Regression: 12/12 passed.

### Next session constraints

Sprint 9: Tier 2 Socratic panel. Build SocraticPanel.jsx as centre panel of three-tier canvas. AURA generates questions from XN1 node + current phase. Student answers. Answers logged to HistoryOfThought as tier_2_response events. This is the integrity engine the architecture is built around.

---

## Sprint 6B Complete: Anonymised Cloud Telemetry
**Date:** 2026-05-17

### What was built

**New Supabase migration: `simplifii_telemetry_events`**
- File: `supabase/migrations/20260517120000_telemetry_events.sql`
- Fields: `id`, `user_id_hash` (SHA-256), `event_type`, `assessment_title_hash` (SHA-256), `course_code`, `tier`, `schema_version`, `created_at`
- Never stores: raw user_id, payload content, encrypted data, device signatures
- RLS: INSERT for authenticated (hash-verified), SELECT for service_role only
- Append-only: no UPDATE/DELETE policies
- pgcrypto extension enabled for server-side SHA-256 in RLS check

**HistoryOfThought.js: pushToCloud rewritten**
- New `hashValue(str)` utility: SHA-256 via crypto.subtle
- `pushToCloud(event, payload)` now targets `simplifii_telemetry_events`
- Emits only: `user_id_hash`, `event_type`, `assessment_title_hash`, `course_code`, `tier`, `schema_version`
- Never emits: raw user_id, payload_encrypted, stream_id, device_signature, event_id
- Removed unused `getLocalUserId`
- `appendEvent` passes raw payload (pre-encryption) to pushToCloud for hash extraction

**AppShell.jsx: enableCloudSync wired**
- Called after `unlockWithUserId` succeeds in the auth useEffect
- Passes `user.id` to set module-scoped cloud sync flags

### MANUAL STEP REQUIRED BEFORE TELEMETRY ACTIVATES

Apply the migration to the Supabase project:
1. Go to: Supabase dashboard > SQL Editor
2. Paste and run: `supabase/migrations/20260517120000_telemetry_events.sql`

Until this is done, `enableCloudSync` will activate but inserts will fail silently (RLS or missing table). Cloud telemetry will not flow.

### Files changed

| File | Type | Summary |
|---|---|---|
| `supabase/migrations/20260517120000_telemetry_events.sql` | New | Anonymised telemetry table with hashed identifiers |
| `src/core/HistoryOfThought.js` | Modified | pushToCloud rewritten for anonymised emission |
| `src/frontend/AppShell.jsx` | Modified | enableCloudSync wired after vault unlock |

### Commit SHAs

| SHA | Description |
|---|---|
| `9e38601b` | feat(telemetry): anonymised cloud emission to simplifii_telemetry_events |
| `dd82772a` | feat(telemetry): wire enableCloudSync in AppShell after auth |

### Tests

Build: passing (zero errors). Regression: 12/12 passed.

### Next session constraints

Sprint 7: AI Risk Score port from reference build. Read reference build first, identify AI reliance tracking components, port to Simplifii-OS canvas without breaking existing tools.

---

## Sprint 6 (Partial): Authenticity Report
**Date:** 2026-05-17

### What was built

**ProvenanceService expanded to AI events:**
- New `buildMilestones()`: fetches `pre_write_accepted`, `ai_assist_invoked`, `tier_transition`, `phase_advanced`, `pre_write_generated` events with display labels and types
- New `computeAiRatio()`: `ai_accepted / (ai_accepted + text_edit)` as percentage, framed positively
- Export bumped to version 2: includes milestones array and `ai_assistance_percentage`
- Filter uses strict `courseId OR assessmentTitle` match (no fallback for missing courseId)

**startIdleDetection wired into CanvasScreen:**
- Import from ExecutiveSpine, call on mount with 180s threshold
- Cleanup on unmount via stopIdleDetection
- Guarded: only fires when courseId exists
- Enables AURA idle nudges after 3 minutes of inactivity during focus sessions

**PDF export added to ProvenancePanel:**
- Dark-themed A4 PDF matching ExportService pattern
- Sections: AI Assistance (percentage), Writing Summary (sessions/time/edits/words), Phase Progression (timestamped), AI Interactions (up to 30 events)
- Footer statement: "This report was generated by Simplifii-OS and documents the student's authentic learning process."
- SHA-256 tamper detection signature
- Page numbers on all pages
- jsPDF hardcoded RGB values accepted as API constraint exception

**Cloud sync deferred to Sprint 6B:**
- `enableCloudSync()` exists in HistoryOfThought.js but is not called
- Requires security review and Supabase migration before wiring
- No raw content emitted to cloud in any path

### Files changed

| File | Type | Summary |
|---|---|---|
| `src/services/ProvenanceService.js` | Modified | buildMilestones, computeAiRatio, version 2 export with milestones |
| `src/frontend/CanvasScreen.jsx` | Modified | Wire startIdleDetection from ExecutiveSpine |
| `src/frontend/components/ProvenancePanel.jsx` | Modified | PDF export with jsPDF, milestones/aiRatio state, Download PDF button |

### Commit SHAs

| SHA | Description |
|---|---|
| `3dd16b7f` | feat(authenticity): expand ProvenanceService to AI events |
| `9ed03d51` | feat(spine): wire startIdleDetection into CanvasScreen |
| `d4817f58` | feat(authenticity): PDF export for Authenticity Report |

### Tests

Build: passing (zero errors). Regression: 12/12 passed.

### Next session constraints

Sprint 6B: Wire enableCloudSync for anonymised event emission to Supabase. Requires security review and Supabase migration first.

After 6B: Sprint 7 — AI Risk Score port from reference build.

---

## B9 Fix + Extraction Robustness (D2 Resolution)
**Date:** 2026-05-17

### What was fixed

**B9: Raw markdown in breadcrumb and assessment heading**
- `CanvasNav.jsx:106`: `stripMarkdown(courseName)` in breadcrumb
- `AssessmentListView.jsx:51`: `stripMarkdown(courseName)` in heading
- Course names stored with markdown formatting (e.g. `__BABS1201__`) now render clean

**D2: Rubric truncation (resolved via intelligent chunking)**
- Root cause: `DocumentNodeService.js` hardcoded `doc.text.slice(0, 4000)` and `api/extract-nodes.js` applied a redundant second truncation
- Multi-page rubrics were silently truncated; AURA told students "instructions appear cut off"

### What was built

**DocumentNodeService.js (full rewrite):**
- `chunkDocument(text, maxChunkSize)`: splits at paragraph breaks; rubrics get 6000 char chunks, briefs/outlines get 4000
- Sequential chunk loop: calls `/api/extract-nodes` once per chunk with `chunkIndex`/`totalChunks`
- `mergeChunkNodes()`: YN1/YN2 get JSON array merge (parse, concat, re-stringify); all other nodes get string-concatenation with 2000 char cap; confidence is `Math.max` across chunks
- Returns `truncationWarning`, `originalLength`, `documentChunks` when doc exceeds single chunk

**api/extract-nodes.js (enhanced):**
- Removed redundant `text.slice(0, 4000)` (service owns chunking now)
- Added format-agnostic preamble to system prompt: handles PDF artefacts, linearised columns, table rows, varied formats
- Added `chunkContext` note for multi-chunk documents so Claude knows it is seeing a partial
- Enhanced node descriptions: XN1 (clearer task extraction), XN5 (inference from verbs/format signals), YN1 (unspecified weightings), YN3 (exact institutional labels), YN4 (hidden curriculum specifics), Z5 (scattered policy sections)

### Files changed

| File | Type | Summary |
|---|---|---|
| `src/frontend/components/CanvasNav.jsx` | Modified | stripMarkdown on courseName breadcrumb (B9) |
| `src/frontend/components/AssessmentListView.jsx` | Modified | stripMarkdown on courseName heading (B9) |
| `src/services/DocumentNodeService.js` | Rewritten | Intelligent chunking, merge logic, truncation flags |
| `api/extract-nodes.js` | Modified | Removed double truncation, format-agnostic prompt, chunkContext |

### Commit SHAs

| SHA | Description |
|---|---|
| `ef5d9edc` | fix(markdown): strip markdown from breadcrumb and assessment list heading |
| `de1b3d97` | feat(extraction): intelligent chunking + universal prompt |

### Tests

Build: passing (zero errors). Regression: 12/12 passed.

### Important note for next session

After this deploys, BABS1201 rubric needs a fresh re-upload to trigger chunked extraction. Existing Supabase nodes are from the old truncated extraction. New uploads will use robust chunking automatically.

### Next session constraints

Sprint 6: Authenticity Report. Wire unlockWithUserId() in AppShell. Wire startIdleDetection() in ProjectContext. Basic report renders from HistoryOfThought log.

---

## P0 Bug Fix: B6, B7, B8 (Markdown Leak)
**Date:** 2026-05-17

### What was fixed

Three P0 bugs where AI-generated markdown formatting leaked into plain-text surfaces:

- **B6:** Scaffold display in Tier 1 Starter Ideas panel showed raw `**bold**` asterisks. Fixed by applying `stripMarkdown()` before rendering (PreWritePanel line 229).
- **B7:** Scaffold insertion into Tier 3 editor passed raw markdown to onInsert. Fixed on both insert paths (PreWritePanel lines 120 + 124).
- **B8:** AffirmationBanner on dashboard rendered raw `__[Learn more](url)__` from Supabase `affirmations` table. Fixed by applying `stripMarkdown()` before render (AffirmationBanner line 78).

### New utility

`src/utils/stripMarkdown.js`: word-boundary-safe markdown stripper. Covers bold, italic (with lookbehind to avoid snake_case false matches), links, headers, inline code, bullet markers, numbered lists.

### Files changed

| File | Type | Summary |
|---|---|---|
| `src/utils/stripMarkdown.js` | New | Plain-text markdown stripper utility |
| `src/frontend/components/PreWritePanel.jsx` | Modified | Import stripMarkdown; apply to scaffold display (B6) and both onInsert paths (B7) |
| `src/frontend/components/AffirmationBanner.jsx` | Modified | Import stripMarkdown; apply to {copy} render (B8) |

### Commit SHAs

| SHA | Description |
|---|---|
| `7ff64e33` | fix(markdown): strip markdown from scaffold display, editor insertion, and dashboard affirmations |

### Tests

Build: passing (zero errors). Regression: 12/12 passed.

### Next session constraints

Sprint 6: Authenticity Report. Wire unlockWithUserId() in AppShell. Wire startIdleDetection() in ProjectContext. Basic report renders from HistoryOfThought log.

---

## Sprint 5 Complete: Task Guidance Engine
**Date:** 2026-05-17

### What was built

Sprint 5 turns Simplifii from a tool collection into a guided OS. Every assessment now has a 5-phase task sequence (Understand, Plan, Gather, Draft, Review) generated from the actual brief and rubric content. AURA knows which phase the student is in and opens each phase with an assessment-specific question.

### Files changed

| File | Type | Summary |
|---|---|---|
| `api/generate-task-sequence.js` | New | Generates 5-phase task sequence from XN1 brief and YN1 rubric. 25% neurodivergent buffer on estimatedMinutes. calibrationWarning when inputs are thin. Rate limit: 10/min. |
| `src/frontend/components/TaskPhaseBar.jsx` | New | Horizontal 5-phase progress bar. Accessible chip UI. Expandable phase instruction on click. Graceful absence when no sequence exists. Design token compliant. |
| `src/core/TaskSequenceManager.js` | New | Per-assessment phase state persisted to localStorage. advancePhase(), getCurrentPhase(), getCurrentPhaseId(), resetPhase(). Dispatches simplifii:phase-advanced on transitions. |
| `src/frontend/hooks/useIngestion.js` | Modified | Fire-and-forget call to /api/generate-task-sequence after cloud enhancement. Prefers XN1/YN1 typed nodes, falls back to enriched brief body + rubricCriteria. |
| `api/_aura-prompt.js` | Modified | Adds currentPhase param to buildAuraPrompt. Injects phase label, instruction, and auraOpeningPrompt into RUNTIME CONTEXT. Backwards compatible. |
| `src/frontend/components/AuraChatOverlay.jsx` | Modified | Derives currentPhase from extractionData.taskSequence. Passes currentPhase in /api/tutor payload. |
| `src/frontend/CanvasScreen.jsx` | Modified | Renders TaskPhaseBar between CanvasNav and NextStepBanner. Phase state via useState + useEffect, persisted via TaskSequenceManager. Graceful absence guard. |
| `docs/BACKLOG.md` | Modified | Added B6, B7, B8, D2-confirmed, Knowledge Sprints A-E. |

### Commit SHAs

| SHA | Description |
|---|---|
| `fc26b1b0` | Add api/generate-task-sequence.js, TaskSequenceManager.js, TaskPhaseBar.jsx |
| `7e65c147` | Wire task sequence into ingestion pipeline and AURA prompt |
| `61fcbc16` | Wire TaskPhaseBar into CanvasScreen |
| `8b75a3af` | Wire currentPhase into AuraChatOverlay |
| `0a28349c` | Fix eslint-disable comments (unknown react-hooks plugin) |

### Tests

Build: passing. Regression: 12/12 passed.

### Known issues logged this session

B6: Raw markdown in Tier 1 Starter Ideas output (PreWritePanel rendering).
B7: Raw markdown inserted into Tier 3 editor on scaffold accept (PreWritePanel onInsert).
B8: Footer raw markdown link visible on dashboard.
D2-confirmed: AURA "instructions cut off" on BABS1201 Literature Review. XN1 truncation at 4000 chars. Tracked as E1.

### Next session constraints

Fix P0 bugs B6, B7, B8 first. All three are in or near PreWritePanel.

Then Sprint 6: Authenticity Report. Wire unlockWithUserId() in AppShell. Wire startIdleDetection() in ProjectContext. Basic report renders from HistoryOfThought log.

---

# Session Log: B1/B2/B3 Verification + Test Infrastructure
**Date:** 2026-05-17

---

## Auth Bypass for Testing

**Commit:** `c4fb17ee`
**Status:** Complete

Test mode auth bypass added to `src/contexts/AuthContext.js`. Double safety gate: requires `REACT_APP_TEST_MODE=true` AND `NODE_ENV !== 'production'`. Mock user satisfies all auth checks. signOut is a no-op. `.env.test` created (gitignored). Playwright config loads it via dotenv.

---

## B1/B2/B3 Fix Status

**All three already resolved in commit `2d8a4acb`.**

Confirmed by reading ProjectContext.js lines 262-314:

| Bug | Line | Fix |
|-----|------|-----|
| B1: `due_date` not mapped to `dueDate` | 274 | `dueDate: a.due_date \|\| jsonMatch.dueDate \|\| null` |
| B2: `documents[]` not reconstructed | 296 | `d.documents \|\| d.extractionData?.documents \|\| null` |
| B3: `brief_text` not mapped to `body` | 273 | `body: a.brief_text \|\| jsonMatch.body \|\| ''` |

JSONB fallback path (lines 285-293) also normalises all three fields for courses with no assessments table rows.

SYSTEMS_AUDIT.md updated to mark B1/B2/B3 as RESOLVED.

---

## Suite 6: Data Persistence Verification

**Status:** Added to tests/regression.spec.js
**Result against production:** SKIP (expected, requires test mode auth)
**What it tests:** After PDF upload, reads localStorage course data and checks:
- `extractionData.documents[]` exists and is non-empty (B2)
- `assessmentBriefs[].dueDate` is present (B1)
- `assessmentBriefs[].body` is populated (B3)

Full authenticated test requires: `npm run test:regression` (starts local dev server with `.env.test`)

---

## D5 Logged to BACKLOG.md

**Issue:** `weight` field on assessmentBriefs is empty after Supabase round-trip if JSONB extractionData did not include it. Assessments table has no `weight` column.
**Impact:** Low. Weight is cosmetic on dashboard.
**Fix when:** Porting Assessment Scaffolder prompt.

---

## Regression Suite Results

12/12 tests pass against production.
Suite 6 skips gracefully when not in test mode.

---

## Assessment Scaffolder Port

**Commit:** `27e13a1d`
**Source:** `reference-builds/Emergent_AI_Simplifii-beta_MVP_Build-main/backend/routes/tools.py:748`
**Target:** `api/simplify-brief.js`

### What changed in api/simplify-brief.js

**Before:** System prompt requested a JSON schema with 7 fields per section (`sectionName`, `wordCount`, `keyQuestion`, `starterSentence`, `commonMistakes`, `rubricCriteriaLink`, `bloomsPrompt`) and 5 top-level fields (`beforeYouStart`, `timeEstimate`, `normalisingMessage`, `hiddenExpectations`, `rubricAlignment`).

**After:** Same 7 per-section fields preserved (renderer already handles them), plus 2 new per-section fields (`purpose`, `tipForThisSection`) and 4 new top-level fields (`overallGuidance`, `higherOrderScaffolding`, `workforceReadiness`, `successTips`). `timeEstimate` gained a `total` field. `normalisingMessage` rule updated: must acknowledge neurodivergent, time-poor, or returning-to-study students; never a productivity tip; speaks to the student who has been told they cannot do this. System prompt adds: "The student may be neurodivergent, time-poor, returning to study after a break, or carrying the weight of past educational harm."

Exam paper and rubric routing paths unchanged.

### What changed in StructuredScaffold.jsx

6 new render blocks added:
1. `overallGuidance`: "What this assessment is really asking" card (after normalising message)
2. `purpose`: one-sentence purpose below each section name
3. `tipForThisSection`: actionable tip per section in accent colour
4. `successTips[]`: "What separates the top band" card with accent left border
5. `higherOrderScaffolding[]`: "Push your thinking further" in italic
6. `workforceReadiness`: "Why this matters beyond the grade"

All existing rendering preserved. No fields renamed or removed.

### Test Results

12/12 regression tests pass against production. Build compiles clean.

---

## Rubric Simplifier Port

**Commit:** `0db6288a`
**Source:** `reference-builds/Emergent_AI_Simplifii-beta_MVP_Build-main/backend/routes/tools.py:253`
**Target:** `api/decode-rubric.js`

### What changed in api/decode-rubric.js

**Before:** System prompt was a single inline string. User message was embedded in the JSON.stringify call as a concatenated string. JSON schema had 3 per-criterion fields (`name`, `gradeBands[].{label, description, evidence}`, `microTaskChecklist[]`, `selfAssessmentQuestion`) and 2 top-level fields (`normalisingMessage`, `scaleDetected`). max_tokens: 2500.

**After:** System prompt expanded with neurodivergent/returning-to-study acknowledgement and "rubrics are written for markers, not students" framing. User message extracted into readable `userMsg` variable. 4 new schema fields: `overallStrategy` (how to approach rubric as a whole), `criteria[].weighting` (marks/percentage), `criteria[].plainEnglish` (one-sentence translation), `criteria[].topBandSecret` (what separates highest from second-highest). `selfAssessmentQuestion` rule: must start with "I have..." for checkbox use. Scale detection: auto-detect, never assume HD/D/C/P. max_tokens: 3000.

### What changed in StructuredRubric.jsx

Renderer already existed. 4 new render blocks added:
1. `overallStrategy`: "How to approach this rubric" card after scale badge
2. `weighting`: badge on criterion header (e.g. "25%")
3. `plainEnglish`: prominent bold text at top of expanded criterion, before grade bands
4. `topBandSecret`: "Top band secret" callout with accent left border
5. `selfAssessmentQuestion`: converted from static italic text to interactive checkbox with amber accent, strikethrough on check, tracked via useState

### Bugs logged

- D1-CONFIRMED: CanvasScreen.jsx:399 passes criteria names not full rubric text to decoder
- B4: AURA markdown still rendering in chat despite no-markdown rule
- B5: [TOOL:simplify] tag leaking into canvas editor content

### Test Results

12/12 regression tests pass against production. Build compiles clean. No failures.

---

## Next Session Constraint

Port Exam Paper structured output:
- Location: `api/simplify-brief.js` exam_paper routing path (lines 35-94)
- Current: returns raw text practice plan only, no structured JSON
- Target: structured JSON with section breakdown (MCQ, short answer, essay), time allocation per section, question type identification, what each question type is actually testing, approach sequence, worked example format per question type
- Renderer: needs new component or extension of StructuredScaffold.jsx for exam mode

---

## Assessment-Scoped AURA Context

**Commit:** `30eaf694`
**File:** `src/frontend/components/AuraChatOverlay.jsx`

### What changed

**Before:** `allDocs` was derived inline from `activeCourse.extractionData.assessmentBriefs` (or `.documents` or `.files`). This loaded ALL documents for the entire course into AURA context regardless of which assessment the student had open.

**After:** Two-stage derivation:
1. `allCourseDocs` (useMemo): stable reference to all course documents, depends only on `activeCourse.extractionData`
2. `allDocs` (useMemo): filters `allCourseDocs` by `routerAssessment` title. Matches both raw title and `title (weight)` display format. Falls back to all docs when no match or no router assessment.

All downstream context (`primaryDoc`, `activeAssessmentTitle`, `activeBriefText`, `assessmentSummary`, `docInventory`) automatically scopes because they derive from `allDocs`.

### Backwards compatibility

Confirmed. Three fallback paths:
- `routerAssessment` is null (dashboard view): returns all docs
- Only 1 document in course: returns it regardless
- No title match found: returns all docs

No ProjectContext or CanvasScreen changes required.

### Bugs logged

- A1: Assessments have no stable ID, matched by title string only. Deferred to Sprint 4.

### Test Results

12/12 regression tests pass against production. Build compiles clean. No failures.

---

## Next Session Constraint

Surface activeAssessmentId in the Pillar Gallery card so tapping an assessment card opens its scoped canvas directly (not the course-level canvas). Requires: assessment cards in HomeScreen/PillarGallery to call `navigateToCanvas(courseId, assessmentTitle)` with the specific assessment title.

---

## StructuredScaffold Rendering Fix

**Commit:** `250d805a`
**Files:** `src/services/BriefSimplifierService.js`, `src/frontend/components/BriefSimplifierTool.jsx`

### Root cause

Two paths call `/api/simplify-brief`:
1. ToolPanel "Simplify" tab: checks `data.scaffold`, passes to `<StructuredScaffold>`. Works correctly.
2. BriefPanel "Decode this brief" button: calls `runBriefSimplifier()` in BriefSimplifierService.js, which received `data.scaffold` from the API but **discarded it** (line 91-97). It wrapped `data.plan` into `weeklyTasks: [{ week: 1, tasks: [data.plan] }]`. BriefSimplifierTool.jsx then rendered this as a single bullet point. Students saw 4 raw bullets instead of the structured card UI.

### Fix

**BriefSimplifierService.js:** API success path now returns `{ scaffold: data.scaffold || null, rawPlan: data.plan }` instead of the weeklyTasks wrapper. Mock fallback path unchanged (still returns weeklyTasks for offline/dev).

**BriefSimplifierTool.jsx:** Three-tier render priority:
1. `result.scaffold.suggestedStructure` present → renders `<StructuredScaffold>`
2. `result.rawPlan` present → readable paragraphs
3. `result.weeklyTasks` present → legacy mock bullets

### Test Results

12/12 regression tests pass. Build compiles clean.

---

## Next Session Constraint

Fix B5: strip `[TOOL:tag]` from rendered output before it reaches the canvas editor or AURA chat display. Location: PreWritePanel insert path and AuraChatOverlay message rendering.

---

## B5 Fix: [TOOL:tag] stripped from user-facing output

**Commit:** `84dae71a`
**Files:** `api/tutor.js`, `src/frontend/components/AuraChatOverlay.jsx`, `docs/BACKLOG.md`

### Root cause

`[TOOL:]` tags were embedded in Claude's reply string by the AURA system prompt (TOOL SURFACING manifest in `api/_aura-prompt.js`). The tag leaked to two user-facing surfaces:
1. Canvas editor: PreWritePanel called `/api/tutor`, received `data.reply` with `[TOOL:simplify]` in the text, inserted it verbatim into the Tiptap editor via `onInsert()`.
2. TTS: AuraChatOverlay stored the raw reply (with tag) in `m.text`, then passed it to `speak()`. AURA would say "[TOOL:simplify]" out loud.

The tag was also visible in AURA chat messages until the render-time parse at line 474 stripped it and rendered a button instead. But cached messages in sessionStorage retained the raw tag.

### Fix

**Server-side separation (api/tutor.js:184-189):** Before returning the reply, extract `[TOOL:\w+]` via regex, store as `toolSuggestion` (string or null), strip the tag from `reply`. Return `{ reply (clean), toolSuggestion }` as two separate fields. All downstream consumers now receive clean text automatically — no frontend stripping needed anywhere.

**AuraChatOverlay.jsx:** Message objects now store `{ text (clean), toolSuggestion }`. Render-time button reads from `m.toolSuggestion` instead of parsing `m.text`. Proactive doc-added messages also use the `toolSuggestion` field instead of embedding tags in text.

**PreWritePanel.jsx:** No changes needed. `data.reply` from tutor.js is now clean at the source.

### Pattern established

Machine signals (tool suggestions) are separated from human-readable text at the API boundary. The `toolSuggestion` field is the canonical routing signal. `m.text` is always clean.

### Sprint 5 logged

Task Guidance Engine added to BACKLOG.md. Five phases per task (Understand, Plan, Gather, Draft, Review). Depends on B5 fix (done) and assessment context scoping (done).

### Test Results

12/12 regression tests pass. Build compiles clean. No failures.

---

## Next Session Constraint

Sprint 4: Document Node Tree. Build the typed extraction layer. Every uploaded document becomes addressable typed nodes (Z, XN, YN schema). Foundation for Task Guidance Engine, Homework Decoder, UDL Transform, and LiteralMode wiring.

---

## Sprint 4: Document Node Tree (COMPLETE)

**Date:** 2026-05-17

### Commits

| SHA | Description |
|-----|-------------|
| `04598caa` | `/api/extract-nodes` + `DocumentNodeService` — typed node extraction |
| `a1ec51fa` | Wire node extraction into ingestion — `useIngestion.js` + `ProjectContext.js` + `coursePersistence.js` |
| `ef2ab47c` | AURA context from typed nodes — `AuraChatOverlay.jsx` |

### What was built

**`api/extract-nodes.js`** (new, 179 lines): Typed node extraction via Claude. Three document type branches:
- Brief: XN1 (task description), XN2 (format requirements), XN3 (due date), XN4 (learning outcomes), XN5 (hidden curriculum)
- Rubric: YN1 (criteria + weightings), YN2 (grade band descriptors), YN3 (scale detected), YN4 (rubric hidden curriculum)
- Outline: Z1 (metadata), Z2 (learning outcomes), Z3 (schedule), Z4 (assessment overview), Z5 (policies)

YN1/YN2 validated via JSON.parse() — confidence downgraded to 0.1 if not valid array. All content capped at 2000 chars. Rate limit 15/min. Exam papers excluded (deferred to E1).

**`src/services/DocumentNodeService.js`** (new, 59 lines): Non-blocking extraction service. Calls `/api/extract-nodes`. Returns `{ nodes[], extractionError }`. Never throws.

**`useIngestion.js`** (modified): Dynamic import for `DocumentNodeService`. After Claude structured extraction, calls `extractNodes()` per document. Each document carries `nodes[]`. Course-level `aggregated.nodes` = flatMap of all document nodes.

**`coursePersistence.js`** (modified): Persists `extractionData.nodes` as top-level `dataPayload.nodes` in Supabase JSONB. Excluded from rest spread to prevent duplication.

**`ProjectContext.js`** (modified): Reconstructs `nodes` from `d.nodes || d.extractionData?.nodes` on Supabase hydration. Round-trip complete.

**`AuraChatOverlay.jsx`** (modified): Typed nodes are the highest-priority context source. Assembles labelled sections (`[TASK DESCRIPTION]`, `[RUBRIC CRITERIA]`, `[HIDDEN CURRICULUM]`, etc.) from nodes with confidence > 0. Falls back to existing typed docs, assessmentBriefs, rawText for courses without nodes.

### Architecture

Fallback chain: `nodes[] → typed documents[] → assessmentBriefs[].body → rawText`. All existing courses continue working without nodes. Additive only — no existing fields replaced.

### Bugs and backlog logged

- E1: extract-nodes 4000 char input cap (exam papers truncated). Deferred.
- Community Sprints A-E: Course boards, peer experts, contribution credits, group accountability, AURA surfacing. All deferred until Sprint 6.

### Test Results

12/12 regression tests pass. Build compiles clean. No failures.

---

## Next Session Constraint

Sprint 5: Task Guidance Engine. Build `api/generate-task-sequence.js` using XN1 + YN1 node content as inputs. Build `TaskPhaseBar.jsx`. Build `src/core/TaskSequenceManager.js`. Wire into canvas and AURA context. Five phases per task: Understand, Plan, Gather, Draft, Review.
