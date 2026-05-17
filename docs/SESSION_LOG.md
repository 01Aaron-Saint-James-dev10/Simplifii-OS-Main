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
