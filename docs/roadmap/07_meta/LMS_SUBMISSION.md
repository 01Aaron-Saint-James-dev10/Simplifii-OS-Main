# LMS Submission Integration [SPEC]

## What this is

Submit directly from Sovereign to Canvas, Moodle, Brightspace, Turnitin, Blackboard. With Receipt attached. Without leaving the canvas.

## Status

[BACKLOG → SPEC] — Year 2 priority. Major UX moat.

## Why this matters

Current workflow:
1. Write in Sovereign
2. Export to .docx
3. Download
4. Open LMS in browser
5. Upload .docx
6. Confirm submission
7. Worry about whether it uploaded right

5 steps, 4 chances to mess up. For an ADHD student, this is where things break — uploading the wrong version, submitting after deadline, forgetting to click confirm.

Sovereign LMS Integration:
1. Click "Submit" in canvas
2. Choose LMS + assessment
3. Confirm with Receipt attached
4. Done

The Receipt attached IS the differentiator. Universities adopting Sovereign get authenticity-attached submissions natively.

## Supported LMS targets

### Tier 1 (high priority)
- **Canvas** (Instructure) — dominant in US/AU, full API
- **Moodle** — open-source, widely used in AU TAFE/uni
- **Blackboard / Ultra** — common in UK/AU
- **Brightspace** (D2L) — growing market share
- **Google Classroom** — secondary school dominant

### Tier 2 (medium priority)
- **Schoology** — secondary school
- **Edmodo** — secondary school
- **Microsoft Teams Education**
- **OpenLearning** — Australian platform

### Tier 3 (specialty)
- **Turnitin** — anti-plagiarism, often required pre-submission
- **iThenticate** — research papers
- **Studiosity** — common Australian academic support platform

## Integration approaches

### Approach 1: Official API (best when available)
- Canvas LTI 1.3 + API
- Moodle Web Services API
- Blackboard REST API
- Brightspace Valence API
- Google Classroom API

Requires:
- OAuth flow for user authentication
- Per-institution app registration
- Regular API token refresh
- Rate limit handling

### Approach 2: LTI Tool Provider
Sovereign registers as an LTI 1.3 tool. Students access Sovereign FROM their LMS. Submission round-trip is native.

This is the elegant solution. Universities install Sovereign as an LTI tool in their LMS. Students see Sovereign as a tab in their course. Submissions stay within LMS.

### Approach 3: Browser Extension (fallback)
For LMS without good APIs, browser extension:
- Detects assessment upload page
- Offers "Insert from Sovereign"
- Auto-attaches Receipt
- Confirms submission

Approach 3 has security implications but solves edge cases.

## Submission flow (user-facing)

### Step 1: Initiate submission
User clicks "Submit to LMS" in canvas:
- Modal opens
- Detects which assessment they're working on
- Suggests target LMS (based on prior choice)

### Step 2: Choose target
- Canvas / Moodle / Brightspace / etc
- First time: OAuth flow to connect
- Subsequent: connection remembered
- Pick course
- Pick assessment slot

### Step 3: Final preparation
- Format selection: .docx / .pdf / both
- Receipt attachment: yes / no / metadata-only
- Final word count confirmation
- Pre-submission rubric check (Layer 5 final check)

### Step 4: Confirm
- "About to submit [filename] to [course]/[assessment]"
- "Receipt will be attached as [filename]_Receipt.pdf"
- "Deadline: [date/time] — you are [X hours before / X hours after]"
- BIG submit button
- Cancel button always prominent

### Step 5: Confirmation
- LMS confirms receipt
- Receipt ID stored locally
- Confirmation email (via Comms Layer)
- Snapshot taken as "Submitted" milestone

### Step 6: Post-submission
- Submission visible in Sovereign timeline
- Linked to Receipt
- Status tracked (submitted / marked / returned)

## Critical safety features

### Pre-submission gate
Before submission, Sovereign shows:
- Final word count vs target
- All citations verified status
- Receipt summary
- Last edit timestamp
- "Are you sure?" with deadline awareness

### Versioning
Every submission captures:
- Submitted version snapshot
- Receipt at moment of submission
- Hash of submitted document
- Returns/marks linked back to this version

### Recall (where supported)
If LMS supports submission recall before deadline:
- Sovereign offers "Recall and revise"
- User can submit updated version
- Both versions logged in History of Thought
- Receipt updated with revision sequence

### Deadline awareness
- Visible countdown in canvas if assessment has deadline
- Submission attempt within 1 hour of deadline: extra confirmation
- Submission attempt after deadline: explicit acknowledgement required

## Receipt attachment policy

User chooses per submission:
- **Full Receipt:** Process details + cryptographic proof (default for RHD tier)
- **Summary Receipt:** Aggregate metrics only (default for Undergrad)
- **Metadata-only:** Just hash + verification URL (default for Secondary)
- **No Receipt:** explicit choice, logged

Why this matters: some assessments don't allow Receipts (oral exams, group work where Receipt would be misleading). Choice respected.

## Institutional adoption pathway

Year 1: Voluntary student use via API
- Students submit through Sovereign because it's faster
- Receipt attached as PDF
- Universities see Receipts on uploaded submissions
- Awareness builds

Year 2: LTI integration with pilot universities
- 1-2 universities install Sovereign as LTI tool
- Whole-cohort access in those institutions
- Receipt becomes default attachment in those institutions

Year 3: Multi-university adoption
- 5-10 universities integrated
- Receipts becoming sector standard for authenticity verification
- Department of Education / TEQSA awareness

Year 5: Sector standard
- Receipt-attached submissions as default expectation
- Sovereign becomes infrastructure
- Universities procuring through formal vendor processes

## Technical implementation

### Service architecture
```
SubmissionService.js
├── lmsAdapters/
│   ├── CanvasAdapter.js
│   ├── MoodleAdapter.js
│   ├── BlackboardAdapter.js
│   ├── BrightspaceAdapter.js
│   ├── GoogleClassroomAdapter.js
│   └── TurnitinAdapter.js
├── authentication/
│   └── OAuthFlowManager.js
└── manifest/
    └── LtiRegistration.js
```

Each adapter implements:
- `connect(credentials)` — auth flow
- `listCourses()` → courses
- `listAssessments(courseId)` → assessments
- `getDeadline(assessmentId)` → datetime
- `submit({ file, receipt, metadata })` → submission ID
- `canRecall(submissionId)` → boolean
- `recall(submissionId)` → status

### Security
- OAuth tokens stored encrypted in IndexedDB
- Never transmitted except to LMS API
- Token refresh handled silently
- User can revoke per-LMS connection any time
- Per-action confirmation (no automatic submission)

### Failure modes
- LMS down: queue submission, retry
- Network failure: local snapshot preserved, prompt to resubmit
- Auth expired: re-auth prompt, no data loss
- Rate limited: queue + delay
- LMS rejects (file too large, wrong format): clear error message

## Build cost

### Phase 1 (3-week sprint)
- SubmissionService skeleton
- Canvas adapter (most common, best API)
- OAuth infrastructure
- Submission flow UI
- Receipt attachment
- Pre-submission gate

### Phase 2 (additional 2-week sprint)
- Moodle adapter
- Brightspace adapter
- Google Classroom adapter

### Phase 3 (3-week sprint)
- LTI Tool Provider registration
- LTI launch flow
- Institutional installation guide
- Compliance documentation (FERPA equivalent, Australian Privacy Principles)

### Phase 4 (specialty)
- Turnitin integration
- iThenticate integration
- Studiosity integration

Total cost to launch with 3 major LMS support: 8-10 weeks of dedicated work.

## Dependencies

- Receipt feature (must exist)
- Authentication infrastructure (must exist)
- IndexedDB encryption layer (for token storage)
- Voice DNA + Citation Engine (for pre-submission quality check)

## Revenue impact

### Direct
- Premium feature: LMS submission included in Standard tier
- Differentiator: unique to Sovereign in 2027 market

### Indirect (larger)
- Institutional sales: universities require LMS integration to consider buying
- Without LMS integration: B2B sales conversion <10%
- With LMS integration: B2B sales conversion >40%
- Estimated B2B revenue uplift: 4-5x

This makes LMS Integration a Year 2 must-ship feature for revenue scaling.

## Why this is the right time (Year 2, not Year 1)

Year 1: prove product-market fit with B2C users using direct download workflow.
Year 2: when starting B2B sales, LMS integration is the unlock.

Build B2C value first. LMS integration second. Universities buy when they see students already using product successfully outside LMS — then LMS becomes the natural expansion.

## Notes added

- 2026-05-15: Year 2 priority. Critical for institutional sales.
- Phase 1 starts after Sovereign Research has 1,000+ paying users.
- Each LMS adapter is ~5 days of work; sequence by user demand.
- LTI Tool Provider registration unlocks institutional purchasing.
