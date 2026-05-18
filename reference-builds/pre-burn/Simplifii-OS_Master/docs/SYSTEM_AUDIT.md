# Simplifii-OS System Audit

Audit date: 2026-05-13
Auditor: Automated code analysis (Claude Code)
Scope: Feature inventory, data flow trace, orphan check

---

## Part 1: Feature Inventory

### App.js (src/App.js)

| Feature/Button/Toggle | Location (file:line) | Status | Description |
|---|---|---|---|
| Landing Page / Get Started routing | App.js:53-56 | WIRED | Sets localStorage flag `simplifii_onboarding_complete` and transitions to MasterDashboard |
| Reset via `?reset=true` query param | App.js:44-51 | WIRED | Clears localStorage and returns to Landing Page |
| Reload OS (error boundary) | App.js:27-29 | WIRED | Reloads the page via `window.location.reload()` after a view crash |
| Google OAuth Provider wrapper | App.js:72 | WIRED | Wraps entire app in `GoogleOAuthProvider` using `REACT_APP_GOOGLE_CLIENT_ID` env var |

### LinearCanvas.js (src/frontend/LinearCanvas.js)

| Feature/Button/Toggle | Location (file:line) | Status | Description |
|---|---|---|---|
| Logic Blocks sidebar (left panel) | LinearCanvas.js:1043-1107 | WIRED | Nine draggable logic block cards (Analyse Methodologies, Identify Gap, Synthesise Findings, Clarify Logic, Faded Scaffold, Align to Rubric, Universal View, Translate Instructions, Action Steps). Click sets `activeLogicMode`; drag fires `application/json` data transfer |
| Collapse left sidebar toggle | LinearCanvas.js:1047-1051 | WIRED | Chevron button toggles `isLeftCollapsed` state (passed via props) |
| Collapse right sidebar toggle | LinearCanvas.js:1522-1527 | WIRED | Chevron button toggles `isRightCollapsed` state (passed via props) |
| Drag Research URL (mock) | LinearCanvas.js:1097-1103 | STUB | Draggable div sets `text/plain` data with a hardcoded PubMed mock URL; no real research lookup occurs |
| Section textarea (content authoring) | LinearCanvas.js:1303-1309 | WIRED | Textarea per section; `onChange` calls `handleContentChange` which persists to localStorage, triggers checklist auto-check, dopamine pulse, and haptic pulse |
| Synthesise / Summarise button | LinearCanvas.js:1363-1371 | WIRED | Calls `handleSynthesise` which routes through `RewriteService.synthesise` (Ollama or mock) |
| Elevate Rigour / Improve Clarity button | LinearCanvas.js:1372-1380 | WIRED | Calls `handleElevateRigour` which routes through `RewriteService.elevateRigour` |
| Apply Logic Mode button | LinearCanvas.js:1381-1391 | WIRED | Calls `handleApplyLogicMode`; only visible when a logic block is active |
| AI Declaration button | LinearCanvas.js:1392-1394 | STUB | Fires `speakSystemMessage` announcing export but performs no actual export or file generation |
| Export Proof button | LinearCanvas.js:1398-1417 | WIRED | Calls `generateAuthenticityPDF()` from ExportService; pulses when event count exceeds 50 |
| Neural Proof toggle | LinearCanvas.js:1418-1423 | STUB | Toggles `isProofing` state which overlays mock typo highlighting using `MOCK_TYPOS` array; no real NLP grammar check |
| Mark Final button | LinearCanvas.js:1424-1429 | WIRED | Calls `handleMarkFinal`; checks all checklist items as done, triggers confetti if keystroke count is high |
| Read to Me button | LinearCanvas.js:1430-1435 | WIRED | Calls `handleReadToMe` which uses Web Speech API (`SpeechSynthesisUtterance`) with word-boundary tracking |
| Simplify Logic button | LinearCanvas.js:1436-1441 | STUB | Calls `handleSimplifyLogic` which generates a hardcoded `mirrorDraft` ghost asset; no AI call; purely mock data |
| Branch Version button | LinearCanvas.js:183-186 | STUB | Renders a button in ToneHUD; has no `onClick` handler, does nothing |
| Bloom (Maximize/Minimize) toggle | LinearCanvas.js:1287-1299 | WIRED | Toggles `bloomedSectionId`; expands the section to a full-screen overlay within the cockpit |
| Zen Mode close | LinearCanvas.js:992 | WIRED | Renders `ZenTools` with an `onClose` callback that sets `isZenMode(false)` |
| Support Bridge (SOS) | LinearCanvas.js:994 | WIRED | Overlay component triggered by `showSupportBridge` state; `showSosPulse` activates after 50+ backspaces |
| Accessibility Vault | LinearCanvas.js:995 | UNKNOWN | Renders when `showAccessibilityVault` is true; no button in LinearCanvas itself sets this to true (likely triggered from a parent or sibling component) |
| Dev Insights Panel | LinearCanvas.js:996 | WIRED | Toggles via `toggle-dev-insights` CustomEvent dispatched from MasterDashboard keyboard shortcut |
| Presentation / Teleprompter view | LinearCanvas.js:1112-1130 | WIRED | Toggled by `toggle-view-mode` CustomEvent from DashboardNav; renders sections as large bullet-point slides |
| Procedural Roadmap (Stage A-D) | LinearCanvas.js:1134-1152 | WIRED | Four stage indicators driven by `currentStageIndex` which advances based on word count ratio or checklist completion |
| Topic Picker (Foundation stage) | LinearCanvas.js:1194-1237 | WIRED | Shown at Stage A when `availableTopics` exists in extraction data; selected topic injected into AI prompts via `selectedTopic` state |
| Active Sprint badge + Exit button | LinearCanvas.js:1165-1188 | WIRED | Displays `activeSprintTitle`, word progress, due date; Exit calls `switchSprint(null)` |
| Sprint Focus button (per checklist item) | LinearCanvas.js:1557-1567 | WIRED | Calls `switchSprint(item.text)` to focus a specific assessment as the active sprint |
| Definition of Done checklist (right sidebar) | LinearCanvas.js:1547-1591 | WIRED | Renders checklist items from `extractionData.doneWhenChecklist`; items auto-check when trigger words appear in section text |
| Density Scanner overlay | LinearCanvas.js:1313-1317 | WIRED | Highlights filler phrases (e.g. "in order to", "basically") inline with amber underline and tooltip |
| Bionic Reading overlay | LinearCanvas.js:1320-1324 | WIRED | Renders `BionicText` component when `isBionicActive` setting is on |
| Section Health ring | LinearCanvas.js:1269 | WIRED | SVG donut showing word count / 200 target per section |
| Neural Rewind slider (SectionHistory) | LinearCanvas.js:220-307 | WIRED | Range slider scrubs through IndexedDB block snapshots saved every 15 seconds; Restore button reverts content |
| ToneHUD (Academic Rigor + Semantic Density) | LinearCanvas.js:113-189 | WIRED | Dual progress bars; triggers `speakSystemMessage` on low density or high rigour lock |
| Grounding Pins [G] | LinearCanvas.js:77-111 | WIRED | Renders `[G1]`, `[G2]` superscripts with tooltip showing source PDF and snippet; populated by Elevate Rigour and Synthesise results |
| Ghost Layer rail (per section) | LinearCanvas.js:1457-1504 | WIRED | Retractable rail on hover showing dropped research assets; Bridge to Draft button inserts cited text into section |
| Drag-and-drop onto sections | LinearCanvas.js:912-949 | WIRED | `handleDrop` accepts `application/json` (logic block) or `text/plain` (research URL mock); creates ghost assets |
| Confetti overlay | LinearCanvas.js:533-552 | WIRED | 50 coloured divs rendered on strenuous Mark Final; auto-hides after 5 seconds |
| Dopamine Success Pulse | LinearCanvas.js:990 | WIRED | Green inset shadow overlay triggered every 100 words of total content |
| Schema Locked badge | LinearCanvas.js:1160-1164 | WIRED | Displays amber "Schema Locked" pill when `activeCourse.schemaLocked` is truthy |
| Dyslexic font mode | LinearCanvas.js:359 | WIRED | Toggles Comic Sans and wider tracking based on `profile.processingStyles` containing "Visual Scaffolding" |
| Literal Mode | LinearCanvas.js:360 | WIRED | Reads from profile; gates avatar messages to use literal alternative text |

---

## Part 2: Data Flow Trace (handleIngestGrounding)

The following trace documents what happens when the "Ingest Grounding Folder" button is clicked, starting from `handleIngestGrounding` in `src/frontend/hooks/useIngestion.js`.

### Step-by-step flow

1. **Guard check** (useIngestion.js:288-289). If `ingesting` is already true, return early. Otherwise set `ingesting` to true via `setIngesting(true)`.

2. **Purge transient context** (useIngestion.js:290). Calls `purgeTransientContext()` (useIngestion.js:276-279) which removes `simplifii_last_raw_text` from localStorage and dispatches `CustomEvent('simplifii:purge-context')`. LinearCanvas.js:411-413 listens for this event and resets `selectedTopic` to null.

3. **Status update** (useIngestion.js:291). Sets `ingestStatus` to "Locating grounding folder...".

4. **Reasoning start event** (useIngestion.js:292). Dispatches `CustomEvent(REASONING_START_EVENT)` (value: `simplifii:reasoning-start`). Consumed by AIAvatar.js:167 (triggers faster avatar pulse) and AuraLayer.js:137 (activates aura animation).

5. **Fetch grounding PDFs** (useIngestion.js:294). Calls `fetchGroundingPdfs()` from `src/utils/GroundingLoader.js`. Returns an array of File-like objects from `/src/grounding/active/`. The result is sorted by `classifyGroundingFile()` (useIngestion.js:262-270) which prioritises outlines (0), then briefs (1), rubrics (2), then others (3). Files with a recognised course code get priority -1.

6. **Group files by unit code** (useIngestion.js:301-308). Regex `COURSE_CODE_RE` (`/([A-Z]{4}\d{4})(?!\d)/i`) extracts course codes from filenames (e.g. BABS1201). Files without a code fall back to `profile.courseName`. Groups are sorted alphabetically (useIngestion.js:312).

7. **Per-group processing loop** (useIngestion.js:316-348). For each unit code group:

   7a. **Initialise aggregated object** (useIngestion.js:318-323). Contains `unitCode`, `level` (from profile), `theme`, and `sourceFiles`.

   7b. **Per-file PDF extraction** (useIngestion.js:330-344). For each file in the group:
   - Updates `ingestStatus` with current file name (useIngestion.js:331).
   - Calls `processDocumentWithGCP(file, 'mock_jwt_token_xyz123')` from `src/services/DocumentAIService.js:155`. This service uses `pdfjs-dist` to extract text from the PDF. The auth token is currently a mock placeholder.
   - Calls `extractDeepCourseData(text)` from `src/services/BriefService.js:123`. This regex-based extractor pulls out unit codes, assessment titles, learning outcomes, rubric criteria, referencing style, temporal maps (due dates/weightings), UDL audit data, and available topics.
   - Calls `mergeExtractionData(aggregated, {...deepData, rawText: text})` from `src/services/BriefService.js:356` to fold each file's data into the running aggregate.
   - The first successfully extracted file becomes `primaryRawText` (useIngestion.js:340).

   7c. **Create cockpit via handleSprintCreation** (useIngestion.js:347). Passes the aggregated data.

8. **handleSprintCreation (Shadow State path)** (useIngestion.js:79-214):

   8a. **Regex candidate briefs** (useIngestion.js:80-88). Extracts assessment titles from the aggregated data, strips weight percentages, builds brief objects.

   8b. **buildDerived** (useIngestion.js:55-67). Calls `reconcileBriefs()` from `src/services/SovereignReconciler.js:215` to deduplicate and canonicalise assessment briefs using token similarity clustering. Filters by `isEliteTitle` (must be 5+ chars, no leading conjunctions). Builds `assessmentTitles`, `doneWhenChecklist` (up to 12 items with trigger words), and `derivedRoadmap` via `deriveRoadmapFromAssessments()` from `src/services/BriefService.js:421`.

   8c. **Write raw text to localStorage** (useIngestion.js:98). Stores `simplifii_last_raw_text` so AuraHUD's Sovereign Format Import can access it.

   8d. **Set institutional data** (useIngestion.js:101-105). Calls `setInstitutionalData()` which updates InstitutionalContext with `learningOutcomes`, `referencingStyle`, and `rubricCriteria`.

   8e. **Generate workspace blocks** (useIngestion.js:94). Calls `mapToWorkspace(rawText, level)` from `src/services/BriefService.js:3`.

   8f. **Create draft course** (useIngestion.js:115). Calls `addCourseWithData(draftName, draftPayload)` from ProjectContext. The payload includes tasks, activeTask, extractionData (with `shadow: true`), project blocks, and roadmap. Returns `courseId`. State persists via ProjectContext which writes to localStorage.

   8g. **System message** (useIngestion.js:117-122). Calls `speakSystemMessage()` from `src/services/MessagingHub.js:161` announcing draft readiness.

   8h. **Background LLM upgrade** (useIngestion.js:128-212). If raw text exceeds 200 chars and provider is Ollama:
   - Dispatches `REASONING_START_EVENT`.
   - Calls `extractAssessmentBriefs(text)` from `src/services/RewriteService.js:926` (sends text to Ollama for structured assessment extraction).
   - Calls `nameCourse(text)` from `src/services/RewriteService.js:610` (asks Ollama to derive a human-readable course name).
   - Both run in parallel via `Promise.all`.
   - On success: unions LLM briefs with regex briefs, runs `buildDerived` again, then calls `upgradeCourseExtraction(courseId, {...})` from ProjectContext to overwrite the shadow draft with confirmed data (`shadow: false`).
   - Dispatches `SOVEREIGN_DATA_READY` event (consumed by PillarGallery.js:109 to refresh the gallery).
   - Dispatches `REASONING_END_EVENT` in the `finally` block.
   - If Ollama is not available: sets `shadow: false` immediately and dispatches `SOVEREIGN_DATA_READY`.

9. **Final status** (useIngestion.js:350-351). Sets `ingestStatus` to a summary string (e.g. "Ingested 4 files across 2 courses").

10. **Cleanup** (useIngestion.js:354-358). Dispatches `REASONING_END_EVENT`, sets `ingesting` to false, and clears `ingestStatus` after 6 seconds.

### State variables updated

| Variable | Hook/Context | Set by | Read by |
|---|---|---|---|
| `ingesting` | useState (useIngestion) | handleIngestGrounding | UI button disabled state (MasterDashboard) |
| `ingestStatus` | useState (useIngestion) | handleIngestGrounding | Status text in MasterDashboard |
| `selectedTopic` | useState (LinearCanvas) | purge-context listener | AI prompt composition (handleElevateRigour, handleSynthesise, handleApplyLogicMode) |
| Course data (tasks, extractionData, roadmap) | ProjectContext | addCourseWithData, upgradeCourseExtraction | LinearCanvas, PillarGallery, AuraHUD, and other cockpit components |
| `institutionalData` | InstitutionalContext | setInstitutionalData | AuraHUD, SmartIntake |
| `simplifii_last_raw_text` | localStorage | handleSprintCreation | AuraHUD Sovereign Format Import |

### Data persistence

| Location | What is stored | Durability |
|---|---|---|
| localStorage (`simplifii_last_raw_text`) | Raw extracted text from the most recent ingest | Session-persistent; cleared on purge or browser clear |
| localStorage (ProjectContext courses) | Full course objects including extractionData, tasks, roadmap, checklist | Session-persistent |
| IndexedDB (via IndexedDBService) | Block snapshots for Neural Rewind, ghost assets | Persistent across sessions |
| In-memory only | `ingesting`, `ingestStatus`, `selectedTopic` | Lost on page reload |
| Supabase | Not currently wired; auth token is `mock_jwt_token_xyz123` | N/A |

---

## Part 3: Orphan Check

### 3.1 Components imported but never rendered

| Component | Imported in | Explanation |
|---|---|---|
| `AccessibilityVault` | LinearCanvas.js:12 | Rendered conditionally when `showAccessibilityVault` is true (LinearCanvas.js:995), but no code path within LinearCanvas.js ever sets `showAccessibilityVault` to true. The toggle may exist in a parent component (MasterDashboard via `toggle-accessibility` event) but the state variable is local to LinearCanvas and never receives a true value from any visible code path within that file. Likely wired via a mechanism not visible in the audited files. Status: POSSIBLY ORPHANED. |

### 3.2 CustomEvents dispatched with no corresponding addEventListener

| Event name | Dispatched in | Listener |
|---|---|---|
| `trigger-onboarding-guide` | MasterDashboard.js:597 | No `addEventListener` for this event exists anywhere in the codebase. The event is dispatched but never consumed. |
| `simplifii:stress-detected` | SettingsContext.js:52 | No `addEventListener` for this event exists anywhere in the codebase. The EventBus mapping table does not include it either. |
| `simplifii:steering-update` | SettingsContext.js:64 | No `addEventListener` for this event exists. It is listed in EventBus.js:28,50 mapping table (`steering_adjusted`) but EventBus only bridges events that are explicitly subscribed to; no component calls `EventBus.on('steering_adjusted', ...)` or `addEventListener('simplifii:steering-update', ...)`. |
| `simplifii:lod-change` | SettingsContext.js:91 | No `addEventListener` for this event exists anywhere in the codebase. |
| `simplifii:playtime-granted` | LinearCanvas.js:594, ExecutiveSpine.js:232 | Mapped in EventBus.js:46 to `playtime_granted` for HistoryOfThought logging, but no UI component listens for it directly. Routed through EventBus only. This is intentional (telemetry-only event) rather than orphaned. |

### 3.3 Service functions exported but never imported or called elsewhere

| Function | Defined in | Notes |
|---|---|---|
| `verifyClaim` | services/MasterEngine.js:20 | Exported but never imported by any other file. Appears to be a planned Google Drive verification feature. |
| `mockGoogleAuth` | services/AuthService.js:4 | Exported but never imported. The app uses `@react-oauth/google` and AuthContext directly instead. |
| `signInWithGoogle` | services/AuthService.js:19 | Exported but never imported. Auth is handled through AuthContext which calls Supabase directly. |
| `signOut` (AuthService) | services/AuthService.js:31 | Exported but never imported. AuthContext has its own `signOut` implementation. |
| `getSession` | services/AuthService.js:36 | Exported but never imported. |
| `getCurrentUser` | services/AuthService.js:41 | Exported but never imported. |
| `getUserProfile` | services/AuthService.js:46 | Exported but never imported. |
| `updateUserProfile` | services/AuthService.js:56 | Exported but never imported. |
| `fetchContextualHistory` | services/AuthService.js:66 | Exported but never imported. |
| `reconcileTitles` | services/SovereignReconciler.js:226 | Exported but never imported. Only `reconcile` (which operates on brief objects) is used; `reconcileTitles` (which operates on plain strings) is never called. |
| `extractAssessmentsWithOllama` | services/RewriteService.js:918 | Exported but never imported. The codebase uses `extractAssessmentBriefs` (line 926) instead, which is a wrapper around a different internal function. |
| `processVoiceToLogic` | services/MessagingHub.js:1 | Only called internally by `simulateIncomingWebhook` (line 26). Never imported by any other module. Since `simulateIncomingWebhook` is imported by MasterDashboard, this is an internal-only function that is unnecessarily exported. |
| `getAvailableFeatures` | services/MasterEngine.js:91 | Exported but no import for it was found in any component file. |
| `getFeature` | services/MasterEngine.js:98 | Exported but no import for it was found in any component file. |
| `TIERS` | services/MasterEngine.js:62 | Exported constant but no import for it was found. |
| `FeatureRegistry` | services/MasterEngine.js:64 | Exported object but no import for it was found. |

The entire `services/AuthService.js` module appears to be orphaned. No file imports from it. Authentication is handled through `src/contexts/AuthContext.js` which calls Supabase auth methods directly.

### 3.4 State fields set but never read in JSX or passed to a function

| State variable | Defined in | Set by | Read by |
|---|---|---|---|
| `isDyslexic` / `setIsDyslexic` | LinearCanvas.js:359 | Initialised from `profile.processingStyles`; `setIsDyslexic` is never called after initialisation. | `isDyslexic` is read once in the root `div` class (line 987). The setter is dead code but the getter is used. Not orphaned, but the setter is vestigial. |
| `isLiteralMode` / `setIsLiteralMode` | LinearCanvas.js:360 | Initialised from `profile.processingStyles`; `setIsLiteralMode` is never called after initialisation. | `isLiteralMode` is read in `avatarSpeak` (line 459). Same as above: setter is vestigial, getter is live. |
| `showAccessibilityVault` / `setShowAccessibilityVault` | LinearCanvas.js:390 | `setShowAccessibilityVault(false)` is called on close (line 995) but `setShowAccessibilityVault(true)` is never called within LinearCanvas. | The component renders conditionally but the true path is unreachable from within this file. |
| `showSupportBridge` / `setShowSupportBridge` | LinearCanvas.js:389 | `setShowSupportBridge(false)` is called on close but `setShowSupportBridge(true)` is never called in the audited code. | Same pattern as above: the trigger may exist in a parent. No direct activation path found. |

### Summary of orphan categories

- **1 fully orphaned service module**: `services/AuthService.js` (9 exported functions, zero external imports)
- **3 orphaned CustomEvents**: `trigger-onboarding-guide`, `simplifii:stress-detected`, `simplifii:lod-change` (dispatched, never listened to)
- **1 partially orphaned CustomEvent**: `simplifii:steering-update` (mapped in EventBus but no subscriber)
- **6+ orphaned service exports**: Across MasterEngine, SovereignReconciler, RewriteService, MessagingHub
- **2 state variables with unreachable true-path**: `showAccessibilityVault`, `showSupportBridge` (closers exist but openers are not in LinearCanvas)
- **2 vestigial setters**: `setIsDyslexic`, `setIsLiteralMode` (initialised but never mutated)
- **1 stub button with no handler**: "Branch Version" in ToneHUD (LinearCanvas.js:183)
