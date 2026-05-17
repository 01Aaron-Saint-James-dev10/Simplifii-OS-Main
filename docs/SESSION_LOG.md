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
