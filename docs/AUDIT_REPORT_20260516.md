# Simplifii-OS Full System Audit
**Date:** 2026-05-16
**Auditor:** Claude Code (Opus 4.6)
**Scope:** All 242 source files in src/ and api/
**Method:** 6-pass read-only audit. No fixes applied.

---

## PASS 1: FILE INVENTORY

**Total files:** 242 (.js and .jsx in src/ and api/)
- api/: 21 files (16 routes + 5 helpers)
- src/core/: 7 files
- src/frontend/: ~170 files (components, screens, hooks, services)
- src/services/: ~40 files
- src/lib/: 3 files
- src/data/: 2 files
- src/utils/: 2 files
- src/theme/: 2 files

### Dead Code (never imported anywhere)

| File | Type | Notes |
|------|------|-------|
| src/frontend/components/AuraResponseFlag.jsx | Component | Created this session, never imported |
| src/frontend/components/DecisionPoint.jsx | Component | Never imported |
| src/frontend/components/SectionRail.jsx | Component | Never imported (removed from canvas in prior session) |
| src/frontend/components/ReadAloudButton.jsx | Component | Never imported |
| src/frontend/components/RubricTranslatorTool.jsx | Component | Never imported |
| src/frontend/components/disclaimers/AiSuggestionLabel.jsx | Component | Never imported |
| src/frontend/components/PracticeMode.jsx | Component | Never imported (created this session, no UI entry point) |
| src/frontend/hooks/useStressSignals.js | Hook | Never imported |
| src/services/ChatService.js | Service | Calls /api/chat which does not exist |
| src/services/MicroStepService.js | Service | Calls /api/chat which does not exist |
| src/services/RewriteOllama.js | Service | Calls /api/chat which does not exist |
| src/services/EvidenceFormulaService.js | Service | Only imported by itself (circular) |
| src/services/KnowledgeGraphService.js | Service | Only imported by EvidenceFormulaService (dead chain) |
| src/services/TranslationService.js | Service | Only imported by EvidenceFormulaService (dead chain) |
| src/services/RubricTranslatorService.js | Service | Never imported |
| src/services/VerificationService.js | Service | Never imported |

**Note:** UDLAuditService.js IS imported (by DocumentAIService.js line 14).

### Files in Wrong Directory
- src/data/lms_navigator.js duplicates api/_lms_navigator.js (same content in two places)

---

## PASS 2: API ROUTE AUDIT

### 16 Active Routes

| Route | Purpose | Rate Limit | Quota | Input Validation | Called From | Status |
|-------|---------|------------|-------|------------------|-------------|--------|
| /api/tutor | AURA Socratic tutor | 30/min | Yes | Yes | TutorPanel, AuraChatOverlay | GOOD |
| /api/decode-rubric | Rubric translator | 15/min | Yes | Yes (rubricText min) | ToolPanel | GOOD |
| /api/next-step | Tool orchestrator | 20/min | Yes | Yes | NextStepBanner | GOOD |
| /api/scaffold-suggest | Past question lookup | 20/min | No quota | Subject validation | PastQuestionsPanel | NEEDS FIX (no quota) |
| /api/score-essay | Formative feedback | 15/min | Yes | Yes (draftText min) | ToolPanel, CheckPanel | GOOD |
| /api/generate-sections | Section structure | 20/min | Yes | Yes (briefText min) | CanvasScreen | GOOD |
| /api/simplify-brief | Study plan | 15/min | Yes | Yes | ToolPanel | GOOD |
| /api/audio-overview | Spoken script | 5/min | Yes | Yes | AudioOverviewPlayer | GOOD |
| /api/classify-document | Doc type detector | 30/min | No quota | textSnippet check | useIngestion, CanvasScreen | GOOD |
| /api/decode-hidden | Hidden curriculum | 15/min | Yes | Yes | ToolPanel | GOOD |
| /api/generate-practice | Practice questions | 10/min | Yes | Yes | PracticeMode (NOT IMPORTED) | DEAD |
| /api/represent | UDL representations | 20/min | Yes | Yes | RepresentationsPanel | GOOD |
| /api/joke | Joke generator | 10/min | Yes | No input needed | JokeOverlay | GOOD |
| /api/tts | Text-to-speech | 20/min | No quota | Text min check | useAuraVoice | GOOD |
| /api/scrape | URL scraping | 10/min | No quota | URL validation | UrlIngestModal | GOOD |
| /api/study-session | Session tracking | N/A | N/A | N/A | Nothing | STUB (returns 501) |

### Critical Finding: Missing /api/chat

4 services call `/api/chat` (Ollama local endpoint) but the file does not exist:
- src/services/AssessmentExtractor.js:98
- src/services/MicroStepService.js:149
- src/services/RewriteOllama.js:177, 294
- src/services/ChatService.js:190

These services are dead code (never imported by active components), so the missing endpoint does not crash production. But it represents architectural drift.

### Version Mismatch

api/_aura-prompt.js implements **v2.0.0**. docs/AURA_SYSTEM_PROMPT_V3.md describes **v3.0.0**. The live system runs v2, not v3.

---

## PASS 3: CORE MODULE AUDIT

| Module | File | Status | Issue |
|--------|------|--------|-------|
| SovereignRouter | src/core/SovereignRouter.js | WORKING | Used in HomeScreen, ProjectContext |
| ExecutiveSpine | src/core/ExecutiveSpine.js | BROKEN | `startIdleDetection()` exported but NEVER CALLED anywhere |
| EventBus | src/core/EventBus.js | WORKING | Started/stopped in ProjectContext |
| HistoryOfThought | src/core/HistoryOfThought.js | BROKEN | `unlockWithUserId()` / `unlockWithPassphrase()` NEVER CALLED from outside the file |
| LiteralMode | src/core/LiteralMode.js | ORPHANED | `literalise()` never imported. All literal mode work done server-side via API params |
| TaskLifecycleManager | src/core/TaskLifecycleManager.js | WORKING | Used in CanvasScreen, CourseCard, AuraChatOverlay |
| StudyPatternTracker | src/core/StudyPatternTracker.js | WORKING | start/endSession called in AppShell, LogoutButton |
| Events | src/core/Events.js | WORKING | Constants used across codebase |

### P0 Findings:

1. **ExecutiveSpine.startIdleDetection() never called.** The function exists (line 146), exports correctly, but zero call sites exist in the entire codebase. Idle detection is completely non-functional. AURA idle nudges cannot fire.

2. **HistoryOfThought vault never unlocked.** `unlockWithUserId(userId)` exists (line 129) and internally calls `unlockWithPassphrase`. But no component or service ever calls it. The vault remains locked. All `appendEvent()` calls silently fail (the function checks `isUnlocked()` and throws). This means the Authenticity Report has no data.

---

## PASS 4: FRONTEND COHERENCE

### Auth: 1 system (correct)
Google OAuth via AuthContext. Single provider. Supabase auth for session.

### Data Storage: 4 layers
1. localStorage: settings, dial states, orb position, theme, matrix rain preference
2. sessionStorage: AURA chat cache, classification seen flags, section cache
3. Supabase: profiles, courses, session_feedback, assessment_representations, session_summaries, accuracy tables
4. In-memory React state: ProjectContext (courses, blocks), SettingsContext (dials)

IndexedDB is referenced in HistoryOfThought but vault is locked so it never writes.

### Router: 1 (RouterContext)
Views: home, canvas, assessments, research. Single `navigateToCanvas(courseId, title)` pattern.

### Console.log in production: 0
All console calls properly guarded or removed.

### AURA Prompt Version in Use: v2.0.0
api/_aura-prompt.js line 4: "AURA System Prompt v2.0.0"
docs/AURA_SYSTEM_PROMPT_V3.md exists but is NOT loaded by any code.

### Raw Markdown: None in source
All AURA responses stripped via cleanMarkdown before render.

---

## PASS 5: DEAD CODE AND UNREACHABLE FEATURES

### Components Created This Session With No UI Entry Point

| Component | Purpose | Why Dead |
|-----------|---------|----------|
| PracticeMode.jsx | Practice question UI | Never imported. No button/route leads to it. |
| AuraResponseFlag.jsx | Improved flag widget | Never imported. Old inline flag button still used. |
| AssessmentSwitcher.jsx | Switch between assessments in canvas | Imported in CanvasScreen but only shows when briefs.length > 1 (rare path) |
| GradeInput.jsx | Grade entry after submission | Imported in CourseCard, shows only for Phase 6+ courses (untested path) |

### Services That Call Non-Existent Endpoint

| Service | Calls | Impact |
|---------|-------|--------|
| ChatService.js | /api/chat | Dead (not imported) |
| MicroStepService.js | /api/chat | Dead (not imported) |
| RewriteOllama.js | /api/chat | Dead (not imported) |
| AssessmentExtractor.js | /api/chat | Imported by RewriteService but Ollama path never activates (no local model) |

### Unreachable Code Paths

1. HistoryOfThought: all encrypt/decrypt/append operations guarded by `isUnlocked()` which is always false
2. ExecutiveSpine idle events: dispatch code exists but timer never starts
3. LiteralMode.literalise(): client-side transformation function never called

---

## PASS 6: THE MUSK QUESTIONS

### 1. What breaks in the first 5 minutes?

**AURA does not proactively greet or guide.** The orb sits silently. The learner must discover they can click it. There is no onboarding for AURA, no first-message push, no "hey I am here" moment. For a product built on the premise of a cognitive GPS, the GPS is invisible until manually activated.

### 2. What complex code could be 10x simpler?

**AuraChatOverlay.jsx (450+ lines).** It handles: context derivation, multi-doc assembly, staleness detection, voice mode, continuous listening, phase message queuing, greeting logic, session continuity, markdown stripping, flag buttons, and the actual chat UI. This should be 3-4 files: AuraChatPanel (UI), AuraContextBuilder (data), AuraVoiceController (voice).

### 3. What feature built this session should be deleted?

**AuraResponseFlag.jsx.** Created but never imported. The inline flag button in AuraChatOverlay already works. Two implementations of the same thing, one dead.

### 4. Biggest security risk?

**Rate limiting is in-memory per Vercel instance.** Cold starts reset counters. A determined attacker can exhaust the Anthropic API quota by hitting endpoints from multiple IPs during cold start windows. Needs Redis or Vercel KV for production.

### 5. Which 30% of files would you delete?

Delete these 16 files (all confirmed unused):
- src/services/ChatService.js
- src/services/MicroStepService.js
- src/services/RewriteOllama.js
- src/services/EvidenceFormulaService.js
- src/services/KnowledgeGraphService.js
- src/services/TranslationService.js
- src/services/RubricTranslatorService.js
- src/services/VerificationService.js
- src/frontend/components/AuraResponseFlag.jsx
- src/frontend/components/DecisionPoint.jsx
- src/frontend/components/SectionRail.jsx
- src/frontend/components/ReadAloudButton.jsx
- src/frontend/components/RubricTranslatorTool.jsx
- src/frontend/components/disclaimers/AiSuggestionLabel.jsx
- src/frontend/hooks/useStressSignals.js
- src/data/lms_navigator.js (duplicate of api/_lms_navigator.js)

### 6. Does frontend match CLAUDE.md architecture?

**Partially. Key drifts:**

| CLAUDE.md Says | Reality |
|----------------|---------|
| ExecutiveSpine: idle detection, section health | Idle detection DEAD, section health works |
| HistoryOfThought: local encrypted log, Authenticity Report | Vault locked, no data collected, report impossible |
| LiteralMode: render-time vocab transformer | Never applied client-side, done server-side only |
| Three-tier canvas visible side-by-side | PreWritePanel (left) + Editor (centre) + TutorPanel (right) exists but not labelled as Tiers |
| EventBus bridges spine to HoT | EventBus works but HoT is locked so events drop silently |

---

## FIX PLAN

### P0 Fixes (blocks users, broken architecture)

1. **Call startIdleDetection() on focus session start** (ExecutiveSpine). Wire into ProjectContext or CanvasScreen. Without this, AURA idle nudges are impossible.

2. **Call unlockWithUserId() on auth session start** (HistoryOfThought). Wire into AppShell after disclaimerState=done. Without this, Authenticity Report is empty.

3. **AURA proactive greeting on first load.** When a learner opens the app for the first time in a session, AURA should push one message automatically (not wait for click). Wire into AppShell: auto-open chat with greeting on session start.

4. **Upgrade api/_aura-prompt.js to v3.0.0** or mark docs/AURA_SYSTEM_PROMPT_V3.md as aspirational. Current version mismatch is confusing.

### P1 Fixes (incoherent, causes confusion)

5. Delete duplicate src/data/lms_navigator.js (api/_lms_navigator.js is canonical)
6. Import AuraResponseFlag.jsx in AuraChatOverlay (replace inline flag button) or delete it
7. Import PracticeMode.jsx somewhere reachable (add to PanelRail or HomeScreen) or delete it
8. Wire /api/generate-practice to the PastQuestionsPanel as an alternative data source
9. Remove api/study-session.js stub (returns 501, confusing)

### DELETE List (dead code, safe to remove)

16 files listed in Pass 5 question 5. All confirmed zero imports.

### DEFER List (do not touch until core is stable)

- Calendar integration (feature request, not broken)
- Notification system (feature request, not broken)
- ElevenLabs voice quality (works with browser TTS fallback)
- Past paper scraper (infrastructure ready, needs data)
- Accuracy system commit 3 (admin dashboard, behaviour divergence)
- AURA v3 full implementation (v2 is functional)

---

**End of Audit.**
