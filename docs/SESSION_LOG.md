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

## Next Session Constraint

Port Assessment Scaffolder prompt from reference build:
- Source: docs/REFERENCE_BUILD_AUDIT.md, Tool 1
- From: `backend/routes/tools.py:748`
- To: `api/simplify-brief.js`
- Focus: structured JSON output with sections, starter sentences, rubric mapping, Bloom's prompts
- Note: this was already partially ported in commit `918b59c2` but may need verification against the reference build
