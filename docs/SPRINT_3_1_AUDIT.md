# Sprint 3.1 Audit: PDF to SovereignCell Data Path

**Branch:** sovereign-refactor-handshake
**Node:** 04 - Neural Grounding
**Sprint:** 3.1 (Audit only. Zero code changes.)
**Purpose:** Map the full PDF -> ProjectContext -> SovereignCell data path so
Sprint 3.2 can lock the schema and Sprint 3.3 can patch the prompt against
a known target.

---

## Section 1: Entry point

**File:** `src/frontend/hooks/useIngestion.js`

**Two entry paths exist. Both converge on `handleSprintCreation`.**

### Path A: Grounding folder (developer/power-user)

**Trigger:** Button click in AuraHUD calling `handleIngestGrounding()`.

**Input:** None from the user. Reads files from `/src/grounding/active/`
via `fetchGroundingPdfs()` from `src/utils/GroundingLoader.js`.

**First operation:** Sorts files by document class
(outline=0, brief=1, rubric=2, other=3) so the extraction sees the most
information-dense document first. Groups files by unit code regex
`/\b([A-Z]{3,4}\d{4})\b/` so each code gets its own course.

**Passes downstream:** For each code group, calls `processDocumentWithGCP(file, token)`
to extract text, then `extractDeepCourseData(text)` to parse it. Aggregates via
`mergeExtractionData`. Passes the aggregated `data` object to `handleSprintCreation`.

### Path B: Drag-drop / file picker (primary user flow)

**Trigger:** AuraHUD drag-drop or file picker calls `handleGroupedIngest(data)`,
where `data` is already a parsed extraction object produced upstream by
`processDocumentWithGCP` + `extractDeepCourseData`.

**First operation:** Groups by unit code from `data.sourceFiles` filenames.
If only one group, calls `handleSprintCreation(data)` directly.

---

## Section 2: Ingestion hook

**File:** `src/frontend/hooks/useIngestion.js`
(confirmed path: `src/frontend/hooks/useIngestion.js`)

### 2.1 Signature

```js
export function useIngestion({
  profile,
  activeCourseId,
  addCourseWithData,
  upgradeCourseExtraction,
  setInstitutionalData,
  onCoursesReady
})
// Returns: { handleGroupedIngest, handleIngestGrounding, ingesting, ingestStatus, groundingCount }
```

### 2.2 Internal state

```js
const [ingesting, setIngesting] = useState(false);
const [ingestStatus, setIngestStatus] = useState('');
// groundingCount is derived directly (not state): listGroundingPdfs().length
```

### 2.3 PDF text extraction trace

**Library:** `pdfjs-dist/legacy/build/pdf` via `DocumentAIService.js`.

**Extraction strategy (three-tier, automatic fallback):**
1. GCP Document AI (only if `REACT_APP_GCP_PROJECT_ID` env var and a real OAuth
   token are present; mock token `mock_jwt_token_xyz123` is currently hardcoded
   in `handleIngestGrounding`, so this path never fires in production).
2. `extractWithPdfJs` (local parse, privacy-first). This is the live path.
   Reads each page, reconstructs line breaks from Y-position deltas (threshold:
   6px shift). No chunking. Full text concatenated and returned as a single string.
3. Canned mock (only if both above throw; keeps UI alive in dev).

**Is there a chunking step?** No. The full extracted text string is passed to
`extractDeepCourseData` and later to Ollama. Ollama receives at most 25,000
characters (hard-sliced in `__callAssessmentExtractor`).

**Where does the extracted text go next?**
`extractWithPdfJs` returns raw text -> `processDocumentWithGCP` returns it ->
`handleIngestGrounding` calls `extractDeepCourseData(text)` on it ->
`mergeExtractionData` unions results across grouped files ->
`handleSprintCreation(aggregated)` receives the merged object.

### 2.4 Extraction prompt (verbatim, as it exists after Sprint 3 patch)

In `handleSprintCreation`, the following is prepended before calling
`extractAssessmentBriefs`:

```
Focus: Extract only Assessment names, Weightings, and Due Dates. Ignore unit policies, contact details, and reading lists.

[rawText, up to 25,000 chars]
```

The system prompt sent to Ollama (defined in `ASSESSMENT_SYSTEM_PROMPT`,
`RewriteService.js` lines 420-449) reads as follows (abbreviated):

```
You are an extraction tool. Read course syllabus material and return ONLY the graded assessments.

CRITICAL CONTEXT: The input may be MULTIPLE documents concatenated together...

OUTPUT FORMAT: A JSON array of objects. Each object MUST use these EXACT lowercase keys:
  "title"           (string, required, 3 to 60 chars, capital first letter)
  "weight"          (string like "30%", or "" if not specified)
  "wordCountGoal"   (integer like 1500, or 0 if not specified)
  "dueDate"         (string like "Friday Week 5", or "" if not specified)

ABSOLUTE RULES:
1. Australian English only.
2. Never use em-dashes or en-dashes.
3. Return ONLY the JSON array. No preamble, no markdown fence, no commentary.
4. EXCLUDE lecture titles, tutorial topics, weekly schedule entries, learning outcomes,
   course themes, rubric column headers, navigation copy, and word fragments.
5. INCLUDE only items that are explicitly graded...
6. Each title must appear ONLY ONCE...
7. The weightings should sum to approximately 100%...
8. Keep the output compact...
9. If no assessments, return [].
```

The user content passed is:

```
SYLLABUS (may include multiple documents joined together):

[Focus prepend + rawText, truncated to 25,000 chars]

Return the JSON array of every graded assessment across all documents. Output ONLY the JSON array, nothing else.
```

### 2.5 API and model details

| Parameter | Value |
|---|---|
| API | Local Ollama (`http://localhost:11434/api/chat`) |
| Model | `llama3.2` (default; overridable via `localStorage.simplifii_ollama_model`) |
| num_predict | 2000 tokens |
| temperature | 0.1 |
| stream | false |
| Timeout | 45 seconds (AbortController) |

No cloud API is called during assessment extraction.

### 2.6 Response shape

Ollama returns `{ message: { content: '...' } }`.
The `content` field is expected to be a raw JSON array string.

### 2.7 Response parsing

Three-pass parsing in `__callAssessmentExtractor`:

1. `JSON.parse(raw)` direct.
2. Strip markdown code fences (```` ```json ``` ````) then `JSON.parse`.
3. Extract the substring between the first `[` and the last `]`, then
   `JSON.parse` that substring.

If all three fail, the function returns `[]` and logs the failure.

### 2.8 Output validation

After parsing, each item is validated:

```js
- typeof item === 'object'
- typeof item.title === 'string' and item.title.trim().length >= 3
- item.title[0] === item.title[0].toUpperCase()  (capital first)
- typeof item.weight === 'string'
- Number.isInteger(item.wordCountGoal) or wordCountGoal converts cleanly
- typeof item.dueDate === 'string'
```

Items failing validation are filtered out. The remainder is returned as an
array of normalised `{ title, weight, wordCountGoal, dueDate, source: 'outline' }` objects.

### 2.9 Event fired on completion

`REASONING_END_EVENT` (`'simplifii:reasoning-end'`) fires in the `finally`
block after both `extractAssessmentBriefs` and `nameCourse` resolve.

**MISSING:** No `SOVEREIGN_DATA_READY` or `INGEST_COMPLETE` event is dispatched
from `Events.js` when extraction upgrades a course. The downstream UI
(SovereignCell, SemesterSidebar) re-renders purely through React state
propagation from `upgradeCourseExtraction` -> `setCourses`. The event
constants in `Events.js` exist but are not yet consumed.

---

## Section 3: Persistence

**File:** `src/services/IndexedDBService.js`

### 3.1 Schema version

`DB_VERSION = 3`

### 3.2 Object stores

| Store | Key path | Auto-increment |
|---|---|---|
| `blockHistory` | `id` | Yes |
| `ghostAssets` | `id` | No |

### 3.3 Which function persists extracted data?

**None. Extracted course data is not written to IndexedDB.**

`extractionData`, `assessmentBriefs`, `roadmap`, and `tasks` all live in
React state managed by `ProjectContext`. They are serialised to
`localStorage` (not IndexedDB) via `JSON.stringify(courses)` on every
state change (confirmed by the `loadJSON` / `saveJSON` pattern in
`ProjectContext`).

IndexedDB stores only:
- `blockHistory`: per-block editor snapshots for the Authenticity Report.
- `ghostAssets`: PDF file blobs and metadata uploaded by the student.

### 3.4 Shape of a ghost asset record

```json
{
  "id": "ghost_BABS1201_1715000000000",
  "name": "BABS1201_Course_Outline.pdf",
  "type": "application/pdf",
  "size": 204800,
  "uploadedAt": 1715000000000,
  "courseId": "course_BABS1201"
}
```

(Shape derived from `saveGhostAsset` call sites; not formally typed.)

### 3.5 Indexes

None. No indexes exist on any object store.

### 3.6 Migration

`onupgradeneeded` creates both stores if absent. It does not migrate data
from v1 or v2. The `resetLocalSovereignVault` auto-recovery handles
VersionError by deleting the DB and reloading, which means any stored
block history is lost on a version conflict. This is acceptable only
because block history is not yet surfaced to the student.

---

## Section 4: Render layer

**File:** `src/frontend/SovereignCell.js`

### 4.1 Props

```js
{
  id:       string,   // course key from ProjectContext courses map
  course:   object,   // full course object from courses[id]
  isActive: boolean,  // true when this course matches activeCourseId
  onClick:  Function  // (id: string) => void
}
```

### 4.2 Fields read from the course object

```js
course.extractionData?.academicTier       // TierChip
course.extractionData?.unitCode           // unit code label
course.extractionData?.udl3Score          // UdlBar (primary)
course.extractionData?.udlScore           // UdlBar (fallback)
course.roadmap?.currentTask               // next assessment label (primary)
course.roadmap?.nextAssessment            // next assessment label (fallback)
course.name                               // course name heading
```

### 4.3 Field-to-render mapping

| extractionData field | Rendered as | Token used |
|---|---|---|
| `academicTier` | TierChip label and icon | `TEXT_FAINT`, `SURFACE_RAISED` |
| `unitCode` | Small unit code label above course name | `TEXT_FAINT`, `FONT_SYSTEM` |
| `udl3Score` or `udlScore` | UdlBar fill width and score label | `ACCENT_PULSE`, `ACCENT_GLOW`, `COLOUR_WARN`, `COLOUR_DANGER` |
| (roadmap) `currentTask` or `nextAssessment` | "Next" label and truncated text | `TEXT_MUTED`, `FONT_SYSTEM` |
| `course.name` | Card heading (2-line clamp) | `TEXT_PRIMARY`, `FONT_SYSTEM` |

### 4.4 Fields expected by SovereignCell that ingestion does NOT produce

| Field | Status | Impact |
|---|---|---|
| `extractionData.udl3Score` | MISSING from all extraction paths. Neither `extractDeepCourseData` nor `extractAssessmentBriefs` computes it. | UdlBar never renders. The most distinctive visual element of SovereignCell is invisible for every course. |
| `extractionData.udlScore` | MISSING for the same reason. The fallback is also absent. | Same as above. |

### 4.5 Fields ingestion produces that SovereignCell does NOT render (dead data)

These fields exist on `extractionData` after a successful ingest but are
not consumed by SovereignCell:

`learningOutcomes`, `referencingStyle`, `rubricCriteria`, `evidenceFormula`,
`tierData`, `detectedLevel`, `words`, `weighting`, `assessmentDates`,
`udlRequirements`, `udlPrinciples`, `udlSuggestions`, `doneWhenChecklist`,
`theme`, `assessmentBriefs` (reconciled), `shadow`.

These are consumed by other components (LinearCanvas, Scaffolder, DoneWhen
panel) and are not dead at the system level, only at the SovereignCell level.

---

## Section 5: Gap analysis

### 5.1 Shape match

**Partial.**

The `extractionData` object leaving `handleSprintCreation` contains
`academicTier` (from `extractDeepCourseData`) and `unitCode` (from the
grouping step, spread via `{ ...data }`). Both are present and correctly
read by SovereignCell.

`udl3Score` and `udlScore` are never produced. SovereignCell's UdlBar
will return null for every course.

### 5.2 Field match

**Partial.** SovereignCell reads six fields. Four are present
(`academicTier`, `unitCode`, `currentTask` / `nextAssessment` via roadmap,
`course.name`). Two are absent (`udl3Score`, `udlScore`).

### 5.3 Event sync

SovereignCell re-renders via React state only. `upgradeCourseExtraction`
calls `setCourses` in ProjectContext, which propagates to all consumers
including PillarGallery and SovereignCell. This is correct.

`SOVEREIGN_DATA_READY` and `INGEST_COMPLETE` from `Events.js` are defined
but not yet dispatched or consumed. The event system is wired in theory
(EventBus exists) but has not been connected to the ingestion pipeline.

### 5.4 Error path

If the Ollama API call fails (network, timeout, model not found):

- `briefsPromise.catch` returns `[]`.
- `namePromise.catch` returns `null`.
- `upgradeCourseExtraction` fires with the regex draft unchanged and
  `shadow: false`.
- The student sees the regex roadmap as if it were final. No error message
  is shown. No toast, no banner, no console-visible user-facing signal
  beyond the `console.warn` calls.
- IndexedDB is unaffected (no course data is written there).

### 5.5 Empty state

If `extractionData` is null (course added manually before any PDF drop):

- `academicTier` defaults to `'General'` (TierChip shows General/Brain icon).
- `unitCode` falls back to `id.split('_')[1]?.toUpperCase() || 'UNKN101'`.
- UdlBar returns null (no bar rendered).
- Next assessment section not rendered.
- Card heading shows `course.name || '(unnamed)'`.

This is a clean, minimal empty state. No crash.

---

## Section 6: The verdict

### 6.1 Does the pipeline work end-to-end with a real UNSW course outline?

The regex path (no Ollama) works end-to-end: PDF -> pdfjs text -> regex
extraction -> roadmap -> SovereignCell renders course name, tier, and next
task. Confirmed by tracing the code path; not live-tested in this sprint
against a real UNSW PDF.

The Ollama path has not been live-tested in Sprint 3. It is inherited from
earlier work. The 45-second timeout, JSON repair logic, and focus prepend
are all in place. Whether llama3.2 produces clean JSON from a UNSW outline
is unknown.

### 6.2 Weakest link

**`udl3Score` / `udlScore` is never computed.** The UdlBar -- the most
distinctive visual feature of SovereignCell and the primary signal of UDL
compliance to the student -- is permanently invisible. Every card renders
an empty progress slot. The `udlPrinciples` array (engagement,
representation, action_expression) IS correctly extracted by
`extractDeepCourseData`, but it is never converted into a numeric score.

Secondary weakness: no `SOVEREIGN_DATA_READY` event is fired, so any
future listener (e.g. AURA HUD, a notification panel) cannot react to
ingest completion without polling state.

### 6.3 Smallest possible fix for Sprint 3.2

Add a `udlScore` computation function in `BriefService.js` that converts
the `udlPrinciples` array and `assessmentTitles.length` into a 0-100
integer, and write it into `extractionData` inside `extractDeepCourseData`.
SovereignCell will render UdlBar immediately with no further changes.

---

## Section 7: Standards violations discovered (not fixed in this sprint)

- [ ] Raw hex `#3f3f46` found in: `src/services/BriefService.js:252` -- inside a regex string matching source documents (deliberate; not a visual token violation, but worth noting)
- [ ] Em-dash character `\u2014` found in: `src/services/BriefService.js:252` -- same regex, matching against source PDFs that use em-dashes. Correct: we need to detect them in source material. Not a violation.
- [ ] `format: 'json'` removed from Ollama call in `RewriteService.js:480` (comment explains the reason). Linear easing: none found in these service files.
- [ ] American spelling: `color` appears in CSS transition strings inside `SovereignCell.js` -- confirmed not present (using `border 0.15s` correctly, no `color` in transition).
- [ ] `src/frontend/ProjectContext.js:35-38`: `institution`, `referencingStyle: 'Harvard'`, `integrations` still exist in `DEFAULT_PROFILE`. These were removed from NeuroProfiler onboarding but the DEFAULT_PROFILE constant was not cleaned up. Dead fields. No visual impact, but schema drift.

---

## Definition of Done for Sprint 3.1

- [x] All seven sections filled in
- [x] No code edited in any file other than this audit document
- [x] Committed to `sovereign-refactor-handshake` as `docs/SPRINT_3_1_AUDIT.md`
- [ ] Aaron has reviewed and signed off before Sprint 3.2 begins

---

## Sprint 3.2 target (derived from Section 6.3)

**Task:** Compute `udlScore` and write it to `extractionData` in
`extractDeepCourseData` (`src/services/BriefService.js`).

**Scoring formula (proposed, for Aaron to approve):**

| Condition | Points |
|---|---|
| 1+ UDL principle detected | +25 per principle (max 75) |
| 3+ assessments extracted | +15 |
| 1-2 assessments extracted | +10 |
| Due dates present on all assessments | +10 |

Range: 0-100. Score above 70 renders green. 40-69 amber. Below 40 red.
This is a heuristic, not a clinical UDL audit. It signals syllabus richness.

**One-line code change:** In `extractDeepCourseData`, after the `udlPrinciples`
array is built, add:

```js
const udlScore = Math.min(100,
  udlPrinciples.length * 25 +
  (assessmentTitles.length >= 3 ? 15 : assessmentTitles.length > 0 ? 10 : 0) +
  (assessmentDates.length >= assessmentTitles.length && assessmentTitles.length > 0 ? 10 : 0)
);
```

Then include `udlScore` in the return object. SovereignCell picks it up on
next render with zero further changes.
