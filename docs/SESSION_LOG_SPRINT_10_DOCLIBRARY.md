# Session Log: Sprint 10 Complete — DocLibrary + Mid-Session Ingestion
Date: 2026-05-17

## Sprint 10 Complete

### What was built

**DocLibrary.jsx created** (`src/frontend/components/DocLibrary.jsx`, 390 lines)

Slide-out drawer, position fixed right, z-index 201. Renders all uploaded documents as cards showing:
- Filename
- Type badge (Brief/Rubric/Outline/Exam/Reading/Other) in type-specific colour via tokens
- Extraction status: node count if extracted, "extraction pending" if not
- View button (calls optional `onViewDocument` prop: hidden when not provided, ready for PDF preview modal in a future sprint)

"Add a document" button at drawer footer triggers a hidden file input (PDF/Word, multiple). Status message shown during ingest. Backdrop closes drawer on click.

Design: Obsidian aesthetic, design tokens only, no raw hex. All interactive elements minHeight 44. FOCUS_RING on all buttons.

**classifyDocumentText exported from useIngestion.js**

The `classifyText` function was an unexported closure inside `useIngestion`. Lifted to module-level named export `classifyDocumentText`. Internal hook alias `const classifyText = classifyDocumentText` preserves all existing callers with zero behaviour change.

**handleMidSessionIngest wired in CanvasScreen.jsx**

New async handler. Per file:
1. Reads PDF/Word via `processDocumentWithGCP` (pdfjs-dist, already used by full ingestion)
2. Classifies via `classifyDocumentText`
3. Extracts typed nodes via `DocumentNodeService.extractNodes` (dynamic import, same path as full ingest)
4. Builds typed doc object `{ filename, type, text (capped 5KB), nodes[] }`
5. Merges into course via `upgradeCourseExtraction`: appends to `documents[]`, `nodes[]`, `sourceFiles[]`
6. Fires `simplifii:document-added` CustomEvent with `{ courseId, filename, type }`
7. Sets status message per file; clears after 3 seconds

No canvas restart required. No new course created. Existing session state preserved.

**Docs button on canvas**

Small "Docs" button rendered right-aligned between CanvasNav and TaskPhaseBar. Opens DocLibrary drawer via `docLibOpen` state. Follows existing CanvasScreen CSS variable pattern (no token import added to that file).

**New imports in CanvasScreen.jsx**
- `useAuth` from `../contexts/AuthContext` (for `user.id` passed to node extraction)
- `processDocumentWithGCP` from `../services/DocumentAIService`
- `classifyDocumentText` from `./hooks/useIngestion`

**Loop 1 permanently closed**

Ingestion is now ongoing, not one-time. A student can add a rubric, a reading, or a supplementary brief at any point in their session without navigating away or restarting. AURA context updates automatically on the next prompt because `activeCourse.extractionData.documents` and `activeCourse.extractionData.nodes` are live React state.

The `simplifii:document-added` event is the hook point for AURA awareness (Sprint 10B when scoped).

## Commit SHAs

| SHA | Description |
|---|---|
| `d4d652b9` | feat(canvas): DocLibrary + mid-session ingestion, Sprint 10, Loop 1 permanently closed |
| `84fc3e45` | docs: Sprint 10 session log, explicit nav, B11, Tier 2, tab dots |
| `3ef58d44` | ux: AURA label + tutor description + content dots + CRAFT-T3/T4/T5/B13 to BACKLOG |
| `6738ad72` | feat(canvas): horizontal tab layout, 1. THINK FIRST 2. GET IDEAS 3. WRITE |
| `649d8b2e` | fix(canvas): Tier 2 Socratic questions from assessmentTitle when nodes empty |
| `b329c8fc` | fix(canvas): B11, onOverride updates documentType via upgradeCourseExtraction |

## Tests
- Build: clean (18 rgba() token warnings, non-blocking, legacy migration pending)
- Regression: 12/12 passed (auth-gated suites skipped correctly)

## Files changed this session

| File | Type | Summary |
|---|---|---|
| `src/frontend/components/DocLibrary.jsx` | New | Slide-out document library drawer |
| `src/frontend/CanvasScreen.jsx` | Modified | Import DocLibrary, useAuth, processDocumentWithGCP, classifyDocumentText; 3 state vars; handleMidSessionIngest; Docs button; DocLibrary render |
| `src/frontend/hooks/useIngestion.js` | Modified | classifyDocumentText lifted to module-level named export |

## Next session
**Sprint 11: Secondary tier, HSC and homework support.**
Read tester feedback first before scoping. Do not begin implementation until feedback is reviewed.

Sprint 11 scope (from BACKLOG, subject to tester feedback):
1. Secondary ingestion mode: detect HSC question format on upload
2. AURA secondary prompt variant: exam technique language, mark-allocation awareness, dot-point structure
3. Word count targets adjusted for Secondary tier (default 400 not 1500)
4. "4 Ways" UDL tool verified and extended
Depends on: SovereignRouter Secondary tier selectable at login
