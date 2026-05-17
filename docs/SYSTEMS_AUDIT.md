# Systems Audit: Node Contracts and Broken Connections
**Date:** 2026-05-17
**Scope:** 10 key system nodes, their contracts, actual output, and broken connections

---

## Node 1: useIngestion.js (Upload Pipeline)

**Input:** Files (PDF/DOCX), profile, activeCourseId, courses, addCourseWithData, upgradeCourseExtraction
**Contract:** Extract text from each file individually, classify by type (brief/rubric/exam/outline/reading), store typed documents array, create course with full extractionData
**Actual Output:** Creates courses with `extractionData.documents[]` array containing `{ type, filename, text, title, rubricCriteria, words, weighting, dueDate }`. Shadow state flag set initially, cleared after LLM confirmation.
**Broken Connections:**
- `documents` array is NOT reconstructed on Supabase hydration (ProjectContext only rebuilds `assessmentBriefs`)
- Per-document metadata (type, rubricCriteria, words, weighting) lost on cloud round-trip
- `shadow: true` flag set but no downstream consumer reads it
**Fix Required:** Persist `documents` array in Supabase `data` JSONB and reconstruct it on hydration.

---

## Node 2: ProjectContext.js (Course State)

**Input:** user from useAuth, localStorage, Supabase courses + assessments tables
**Contract:** Provide full course state with `documents`, `extractionData`, `assessmentBriefs`. Hydrate from localStorage first, then Supabase on auth.
**Actual Output:** Hydrates `assessmentBriefs` from Supabase with only 3 fields (title, brief_text, due_date). Does NOT reconstruct `documents` array from cloud.
**Broken Connections:**
- Asymmetric serialization: useIngestion pushes full metadata; Supabase hydration returns 3 fields only
- `dueDate` (camelCase in local state) vs `due_date` (snake_case in Supabase) not converted on hydration
- Old localStorage data may lack `documents` array (stale fallback)
**Fix Required:** Hydrate `documents` from `data` JSONB column. Convert snake_case to camelCase on read.

---

## Node 3: HomeScreen.jsx + CourseCard (Dashboard)

**Input:** courses from ProjectContext, activeTerm, user
**Contract:** Render sorted course list by earliest next-due date. Show overdue/this-week/upcoming counts.
**Actual Output:** Reads `assessmentBriefs[].dueDate` for sorting and counting. Falls back gracefully with optional chaining.
**Broken Connections:**
- `dueDate` camelCase expected but Supabase-hydrated briefs have `due_date` (snake_case) causing undefined reads
- Assumes `assessmentBriefs` always exists; `documents` array not consulted
- No shadow-state awareness (shows partially-extracted courses as complete)
**Fix Required:** Normalise `due_date` to `dueDate` on Supabase hydration in ProjectContext.

---

## Node 4: AuraChatOverlay.jsx (AURA Context Assembly)

**Input:** open flag, courseId, activeCourse.extractionData, user, settings (dials, tier, accessibility)
**Contract:** Build structured context from typed documents. Send to /api/tutor with assessment title, brief text, rubric criteria, document inventory.
**Actual Output:** Priority chain: `documents[] > assessmentBriefs[].body > rawText`. Builds labelled context per document type with headers.
**Broken Connections:**
- After Supabase hydration, `documents` array is missing; falls back to `assessmentBriefs` which lacks `body` field (only has `brief_text`)
- `documentType` read from `extractionData.documentType` but this field is only set during initial ingestion, not on Supabase reload
- `rubricCriteria` not always populated in hydrated data
**Fix Required:** Ensure Supabase hydration maps `brief_text` to `body` in assessmentBriefs. Persist `documentType` in JSONB.

---

## Node 5: api/tutor.js (AURA API)

**Input:** messages, assessmentTitle, tier, briefText, documentType, documentCount, steeringDials, lastSession, overwhelmSignal, learnerContext
**Contract:** Build full AURA system prompt with context, call Claude, return reply. Detect institutional barriers (LMS, extensions, disability, AI detection).
**Actual Output:** Correctly builds prompt via buildAuraPrompt(). Injects document context, overwhelm signal, EAL support. Detects barriers via regex on last message.
**Broken Connections:**
- `documentContextAvailable` logic is redundant with separate `briefText.length` and `documentCount` checks
- If briefText is empty string (not null), it passes the truthy check but provides no context
- `steeringDials` passed through but not all dials are consumed by `buildAuraPrompt`
**Fix Required:** Simplify context-available check to single condition: `briefText && briefText.length >= 100`.

---

## Node 6: api/_aura-prompt.js (AURA System Prompt)

**Input:** tier, persona, scaffolding, grit, lod, assessmentTitle, briefText, documentType, learnerContext, accessibilityProfile, literalMode, voiceMode, specialInterests
**Contract:** Return complete AURA v3.0 system prompt string with: identity, first principles, runtime context, dials, tier modes, language rules, crisis protocols, prohibitions, tool surfacing, brief content, learner context.
**Actual Output:** Concatenates 11 prompt sections. Injects brief content if provided (max 3000 chars). Includes tool manifest with 9 contextual triggers.
**Broken Connections:**
- `specialInterests` param duplicated (also in learnerContext); unclear which is used
- `decisionSkeleton` parameter received but never referenced in prompt sections
- voiceMode injected in runtime context but not referenced in STEERING_DIALS section
**Fix Required:** Remove `decisionSkeleton` dead parameter. Consolidate `specialInterests` source.

---

## Node 7: ToolPanel.jsx (Panel Tools)

**Input:** toolId, endpoint, buildPayload fn, resultKey, briefText, rubricText, draftText, assessmentTitle, courseId
**Contract:** Call endpoint with payload, parse structured JSON (scaffold or rubricData), render rich UI via StructuredScaffold or StructuredRubric.
**Actual Output:** Calls endpoint, reads `data[resultKey]` for raw text, then separately checks for `data.scaffold` or `data.rubricData` for structured rendering.
**Broken Connections:**
- resultKey pattern is fragile: simplify-brief returns `plan` (raw) AND `scaffold` (JSON) as separate fields
- If endpoint returns unexpected shape, no error handling
- Structured data detection is type-checking only (`data.scaffold` truthy), could break if Claude returns string instead of object
**Fix Required:** Refactor to always check structured fields first, fall back to resultKey for raw display.

---

## Node 8: api/simplify-brief.js (Brief Scaffolder)

**Input:** briefText, assessmentTitle, assessmentType, tier, wordCount, documentType, literalMode, accessibilityProfile, learnerContext
**Contract:** Route by documentType (exam_paper, rubric, default). Return `{ success, plan, scaffold }` where scaffold is structured JSON.
**Actual Output:** Correctly routes. Default path returns `{ success: true, plan: rawText, scaffold: parsedJSON }`. Exam/rubric paths return `{ success: true, plan: rawText }` only (no scaffold).
**Broken Connections:**
- `wordCount` parameter received but not passed to Claude prompt as target (prompt hardcodes `${wordTarget}` which reads `wordCount || 1500`)
- `assessmentType` parameter received but never used (routing uses `documentType` instead)
- Exam/rubric document type paths return no structured data; ToolPanel shows raw text only
**Fix Required:** Remove unused `assessmentType` param. Ensure exam/rubric paths also parse JSON where possible.

---

## Node 9: api/decode-rubric.js (Rubric Decoder)

**Input:** rubricText, assessmentTitle, tier, literalMode, accessibilityProfile, learnerContext
**Contract:** Detect grading scale, extract every criterion with ALL grade bands, return `{ success, decoded, rubricData }`.
**Actual Output:** Correctly prompts Claude for structured JSON. Returns `{ success: true, decoded: rawText, rubricData: parsedJSON }`. Handles parse failures by returning decoded without rubricData.
**Broken Connections:**
- No validation that `rubricData.criteria` exists or has expected fields before returning
- If Claude returns malformed JSON, `rubricData` is null but ToolPanel still tries to render StructuredRubric (fails gracefully but shows nothing)
- `rubricText` in ToolPanel comes from `rubricCriteria?.join('\n')` which is a flat string of criteria names, not the full rubric text
**Fix Required:** Ensure ToolPanel passes full rubric text (from brief body) not just criteria names.

---

## Node 10: AppShell.jsx (App Shell)

**Input:** user from useAuth, window events, Supabase profiles table
**Contract:** Wrap app with providers. Check auth + disclaimers + onboarding. Initialise study tracking and HistoryOfThought vault. Handle AURA orb and chat open/close.
**Actual Output:** Wraps with 4 context layers. Checks disclaimers/onboarding on user change. Listens for 3 events (open-settings, canvas-ready, aura-ask). Renders ViewSwitch, AURA orb, chat overlay.
**Broken Connections:**
- `aura:canvas-ready` event listened for but dispatched from CanvasScreen (which we cannot verify without reading it)
- `simplifii:open-settings` event source unclear
- Disclaimer state not reset on user logout/login (race condition possible)
- `unlockWithUserId` errors swallowed silently
**Fix Required:** Verify event dispatchers exist. Reset disclaimerState on user change.

---

## PRIORITY FIX LIST

### BLOCKING (nothing works without this)

| Priority | Issue | Location | Status |
|----------|-------|----------|--------|
| B1 | `dueDate` vs `due_date` camelCase mismatch on Supabase hydration | ProjectContext.js:274 | **RESOLVED** in `2d8a4acb`. Line 274 maps `a.due_date` to `dueDate`. Line 288 does the same for JSONB fallback. |
| B2 | `documents` array not reconstructed from Supabase | ProjectContext.js:296 | **RESOLVED** in `2d8a4acb`. Line 296 reads `d.documents \|\| d.extractionData?.documents`. Line 300 stores in extractionData. |
| B3 | `assessmentBriefs[].body` never set on Supabase hydration (only `brief_text`) | ProjectContext.js:273 | **RESOLVED** in `2d8a4acb`. Line 273 maps `a.brief_text` to `body`. Line 287 does the same for JSONB fallback. |

### DEGRADING (works but produces wrong output)

| Priority | Issue | Location | Impact |
|----------|-------|----------|--------|
| D1 | ToolPanel passes `rubricCriteria.join('\n')` as rubricText (names only, not full text) | CanvasScreen.jsx:388 | Rubric Decoder gets criteria names instead of full rubric content. Output is shallow. |
| D2 | `documentContextAvailable` redundant logic | api/tutor.js:57-80 | Edge cases where AURA gets contradictory context signals (has briefText but no documentCount). |
| D3 | Exam/rubric document type paths in simplify-brief return no structured JSON | api/simplify-brief.js:75-134 | ToolPanel shows raw text instead of rich UI for exam papers and rubrics. |
| D4 | Shadow state flag set but never read | useIngestion.js:196 | Users see partially-extracted data with no indication it may be incomplete. |

### MISSING (feature not present)

| Priority | Issue | Location | Impact |
|----------|-------|----------|--------|
| M1 | `decisionSkeleton` parameter received but never used in prompt | api/_aura-prompt.js | Dead code. No functional impact. |
| M2 | `assessmentType` parameter in simplify-brief unused | api/simplify-brief.js | No functional impact; routing uses documentType. |
| M3 | Per-document metadata not persisted to Supabase | coursePersistence.js | Documents with type/rubricCriteria/words/weighting lose metadata on round-trip. |

---

**End of audit. Do not build. Wait for instructions.**
