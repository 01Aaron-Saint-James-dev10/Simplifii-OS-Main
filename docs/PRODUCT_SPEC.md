# Simplifii Product Spec — v2 (Canvas-First Rebuild)

**Owner:** Aaron Saint-James  
**Last updated:** 13 May 2026  
**Status:** Active — this document is the single source of truth. Every sprint, feature, and design decision is checked against this spec. If something is not in this spec, it is not in v1.

---

## 1. The user

Any Australian student at any education tier:
- Primary (K-6)
- Secondary (Years 7-10)
- Senior (Years 11-12)
- Tertiary undergraduate
- Tertiary postgraduate
- TAFE / vocational

The user picks their tier at first setup. The product adapts language, scaffolding depth, and prompts to match. The data pipeline is universal. The presentation is tier-aware.

## 2. The pain

Students drown in:
- Too much information arriving at once across multiple courses
- Unclear or jargon-heavy assessment instructions
- No structure to prioritise what to do first
- No human-paced support from their institution
- Anxiety, executive function challenges, fear of failing or missing deadlines

The institutional system was not designed for neurodivergent or marginalised learners. AI detectors and rigid rubrics often penalise them further. Simplifii exists because students are dropping out, failing, and breaking down when the support gap could have been closed.

## 3. The job to be done

Take everything a student is supposed to be doing. Map it out. Walk them through it task by task. Help them write the actual deliverable. Give them something they can print and submit. Prove the work is theirs.

## 4. The success criteria for v1 launch

A student opens Simplifii for the first time, completes setup, uploads their course materials, sees a structured priority-ordered task map, opens the next-due task, drafts it with AI support that respects their voice, exports a printable submission, and downloads an Authenticity Report. End to end. No broken steps. No dead buttons.

If any step in that flow fails, v1 is not ready.

---

## 5. The five screens

The entire product is five screens. No more.

### Screen 1 — Sign in
### Screen 2 — First-time setup
### Screen 3 — Course list (home)
### Screen 4 — Writing canvas (the task surface)
### Screen 5 — Settings & vault

Each is documented below.

---

## 6. Screen 1 — Sign in

**Purpose:** Authenticate the student. Nothing else.

**State:** Anonymous user lands here.

**Layout:** Obsidian Aesthetic. Centre-aligned. Single column.

**Elements:**
- Simplifii logo
- One-line value statement: *"Your coursework. Mapped, paced, made yours."*
- Email field
- Password field
- Sign in button
- "Create account" link
- Footer: *"Local-first. Your work stays on your device."*

**Behaviour:**
- Existing user → goes to Screen 3 (Course list)
- New user → goes to Screen 2 (First-time setup)

**Not in v1:** Social sign-in, magic links, passkeys, biometric unlock as a primary gate.

---

## 7. Screen 2 — First-time setup

**Purpose:** Collect everything the system needs to personalise, in one place, with no repetition later.

**Layout:** Single page. Scrollable. Obsidian Aesthetic. Each question is one card. Student fills as they scroll. One Save button at the bottom.

**Questions (in order):**

1. **What is your name?** Text field.
2. **What is your education tier?** Single-select: Primary / Secondary / Senior / TAFE / Tertiary Undergrad / Tertiary Postgrad.
3. **Which institution are you with?** Text field with autocomplete from known AU institutions. *(Free text is fine if not on list.)*
4. **What is your current term / trimester / semester?** Single-select based on tier + institution lookup. Trimester 1/2/3 for UNSW, Semester 1/2 for most AU unis, Term 1-4 for schools.
5. **How many courses are you enrolled in this term?** Number input 1-8.
6. **What helps you focus best?** Multi-select: *Quiet stretches / Short bursts / Body doubling / Music / Background noise / Visual scaffolds / Audio narration*. Used to set canvas defaults.
7. **What feels hardest when you write?** Multi-select: *Starting / Staying focused / Finishing / Citing properly / Saying what I mean / Structure / Editing*. Used to surface the right canvas helper first.

**No questions about diagnoses. No medical labels.**

**Save behaviour:** Profile stored in IndexedDB. Editable later from Settings. Never sent to a server.

**After save:** Goes to Screen 3 (Course list), empty state asking to upload first course.

---

## 8. Screen 3 — Course list (home)

**Purpose:** Show every course the student has uploaded. Show what is due next. Make priority unmissable.

**Layout:** Obsidian Aesthetic. Top nav. Main grid. Right column for the next-due summary.

**Top nav (only these items, in this order):**
- Simplifii logo (clicks home)
- Add course (uploads PDFs)
- Settings (Screen 5)

**Main area — the course list:**
Each course is a card showing:
- Course code (e.g. BABS1201)
- Course name (extracted from outline)
- Term / Year
- Total assessments detected
- Next due date with countdown
- Status indicator: *On track / Due this week / Overdue*

Cards are sorted by **earliest next-due date first**, always. The most urgent course is the first card.

**Right column — the priority panel:**
Always visible. Pinned. Shows:
- **Up next**: The single next-due task across all courses. Big. Bold. Clickable.
- **This week**: Tasks due in the next 7 days.
- **Overdue**: Any task past its due date, in red.

This panel does not collapse. It is the executive-function lifeline. The student cannot miss what is coming.

**Empty state (no courses yet):**
- Large illustration or icon
- "Upload your first course"
- Drag-and-drop zone
- Accepts PDFs (course outlines, assessment briefs, rubrics)

**Upload behaviour:**
- Files persist in IndexedDB (already shipped in Sprint 9.1a)
- System extracts: course code, course name, all assessments, all due dates, all weights, all rubric criteria
- Extraction shows live progress
- On completion, the new course appears in the grid

**What's visible on every course card (this is critical):**
- Course code
- Course name
- Term
- Every assessment title
- Every due date
- Every weight (%)
- Every rubric criterion (if extracted)

Nothing is hidden. The student can see all extracted data at a glance and trust the system has read everything.

---

## 9. Screen 4 — Writing canvas

**Purpose:** The student opens a specific task. This is where the work happens.

**Layout:** Obsidian Aesthetic. Top status bar. Centre canvas. Four collapsible side panels. Bottom authenticity strip.

### 9.1 Top status bar

Always visible. Single row. Shows:
- Course code · Task title
- Weight (e.g. 25%)
- Words written / Words target
- **Due date with countdown** (e.g. *Due Friday · 3 days*)
- Save status (auto-saves silently)
- Settings icon (opens Screen 5)

If the task is **overdue**, the status bar turns amber with an explicit warning: *"This task was due on [date]. Submit ASAP or update your due date."*

### 9.2 The canvas (centre)

A focused writing surface. Sections appear as the task structure dictates (e.g. Introduction / Main Body 1 / Main Body 2 / Conclusion for a Literature Review).

Each section has:
- Section title
- Word count / target
- Plain writing area
- Three quick-action buttons: **AI Assist**, **Rephrase**, **Ask Tutor**

When AI generates text, the AI-suggested content is **visually distinct** (emerald border-left accent) until the student edits or accepts it. This visual track is what powers the Authenticity Report.

### 9.3 First-time empty state on a task

When a student opens a task for the first time, the canvas shows a single question instead of a blank document:

> **"Where are you stuck?"**
>
> - I don't get the brief
> - I can't start
> - I'm stuck mid-draft
> - I want feedback on what I wrote
>
> *Or just start writing ↓*

Each option opens the relevant side panel. After the first answer, the question disappears. The student lands on the canvas directly on every subsequent visit.

### 9.4 The four side panels

Each panel collapses to a thin rail icon. Click the icon to expand. Click the X to collapse. Multiple panels can be open at once.

#### Panel 1 — Brief (left)

What the assessment is actually asking for, in plain language.

Contains:
- The original task title and weight
- Due date with countdown
- A plain-English summary of what the rubric is asking for
- The rubric bands and what each is worth (Synthesis 40%, Methodology 30%, Critical voice 30%)
- Word limit
- Format requirements (APA 7, MLA, etc.)
- A *"Decode this brief"* button that runs the AI explainer

#### Panel 2 — Sources (left)

Resources the student adds for this specific task.

Contains:
- Files they have uploaded for this task only
- A drop zone for new PDFs, links, notes
- A *"Suggest sources"* button that prompts the AI to suggest source types (no fabricated citations — only categories like "find one systematic review on X")
- A note pad for jotting quotes and references

#### Panel 3 — AI Tutor (right)

A conversation with the AI tutor about this task.

Contains:
- Chat history scoped to this task only
- A text input for asking questions
- Quick prompts: *"Explain this section", "Give me starter questions", "Check my logic", "What's missing?"*
- The tutor's voice respects the student's tier. A Year 7 student gets simpler language than a postgrad.
- The tutor never writes the assignment for them. It asks questions, offers structure, surfaces gaps. The student writes.

#### Panel 4 — Preview (right)

A live submission-ready preview.

Contains:
- The student's current draft rendered as the final submission would look (proper formatting, citations, page layout)
- Toggle: *Plain / Formatted / Print preview*
- *"Export PDF"* button — generates the print-ready document
- *"Export Word"* button — for institutions that require .docx

The Preview panel is what makes the moment feel real. The student sees the actual document growing as they write.

### 9.5 Bottom authenticity strip

Always visible. Slim. Cannot be collapsed.

Shows:
- **Authenticity percentage**: e.g. "87% human · 13% AI-assisted"
- **Steering log indicator**: a small green dot when the log is recording, grey if disabled
- **Local-only badge**: confirms the data has not left the device
- **"View Report" link**: opens the Authenticity Report viewer

### 9.6 The Authenticity Report (sub-screen)

Opened from the bottom strip. Renders as a print-ready PDF in a modal.

Contains:
- Student name + course + task + submission date
- Total words written
- Total AI suggestions offered
- Total AI suggestions accepted unchanged
- Total AI suggestions edited
- Total AI suggestions rejected
- A side-by-side excerpt: AI offered → student wrote
- A timestamped action log: keystrokes, AI calls, edits, panel opens
- A final percentage: human vs AI-assisted
- A signed footer: *"Generated by Simplifii on [date]. This document attests that the human authored this work with AI-assisted scaffolding. No content has been generated wholesale by AI. Local-only proof, signed with the student's device key."*
- Download as PDF button

The report is the moat. Universities and teachers get something they can trust. Students who write authentically — including neurodivergent and ESL students whose patterns get flagged by detectors — get proof of authorship.

---

## 10. Screen 5 — Settings & vault

**Purpose:** Manage profile, courses, PDFs, and account.

**Layout:** Obsidian Aesthetic. Left nav with sections. Right content area.

**Sections:**

1. **Profile** — name, tier, institution, term, focus preferences. All editable.
2. **Courses** — list every course. Delete a course. Rename a course. Adjust extracted due dates manually if the system got them wrong.
3. **PDFs** — every PDF stored on the device. Delete, re-classify, re-extract.
4. **Notifications** — control reminder cadence and types (see Section 13).
5. **Account** — change email, change password, export all data, delete everything.
6. **About** — version, license, the local-first promise restated.

**Not in v1:** Theme picker, language picker, accessibility overrides as separate toggles. Accessibility is built into the default experience and tier-aware prompts.

---

## 11. The reminder system

This is critical. The student fails if they forget. The system must never let them.

### 11.1 What gets a reminder

Every assessment with a due date.

### 11.2 When the reminder fires

- **Seven days before due**: Gentle nudge in the priority panel.
- **Three days before due**: Stronger nudge. Card moves to top of course list. Persistent banner on home screen.
- **Twenty-four hours before due**: Modal popup on app open. *"Your Literature Review is due tomorrow. Open it now?"*
- **Two hours before due**: Browser notification (if user has granted permission). Same wording.
- **Past due**: Persistent red banner. Cannot be dismissed until the student either submits, marks complete, or updates the due date.

### 11.3 Cross-task awareness

If a student is working on Task A while Task B is closer to due, the system surfaces a non-blocking nudge in the bottom strip: *"Heads up — your [Task B name] is due in 24 hours. Want to switch?"* The student can dismiss or switch. The system never auto-switches.

### 11.4 Notification permissions

Asked once, during first-time setup or first upload. The student can decline. If they decline, in-app modals still fire. Browser notifications do not.

### 11.5 What the student sees about every deadline

- On the course list: every assessment with a due date
- On the priority panel: the next three due tasks
- On the canvas: the task's due date in the top status bar
- On overdue: persistent red banner
- On settings: list view of all deadlines across all courses

Nothing is hidden. Nothing is buried in a menu.

---

## 12. What gets extracted from uploads

The extraction pipeline is the system's brain. Every uploaded PDF is parsed for:

1. **Course code** (regex 4 letters + 4 digits)
2. **Course name** (LLM-confirmed from outline body text)
3. **Term / Year** (regex + outline scanning)
4. **Assessment titles** (every assessment named in the documents)
5. **Assessment weights** (the % of the final grade)
6. **Assessment due dates** (specific dates, week numbers, "TBA")
7. **Rubric criteria** (the bands the student will be marked against)
8. **Word limits or page limits**
9. **Format requirements** (APA, MLA, etc.)
10. **Submission method** (Moodle, Turnitin, in-person, etc.) when detectable

Every extracted field is **shown to the student** on the course card or in the brief panel. Nothing is hidden in a JSON blob. If extraction missed a field, the student can add it manually. The system asks the student to confirm extraction once and remembers their corrections.

---

## 13. What stays from the current build

Keep:
- `src/services/` — all extraction, AI service, rewrite, brief services
- `src/core/` — EventBus, HistoryOfThought (now persists steering log for Authenticity Report)
- `src/theme/tokens.js` — Obsidian Aesthetic design system
- `src/grounding/` — baked-in PDFs for demo and test
- `src/utils/` — GroundingLoader, IndexedDBService, helpers
- `src/frontend/hooks/useIngestion.js` — the ingestion logic
- All Sprint 9.1a IndexedDB persistence work
- All Sprint 8.3-8.5 data quality fixes
- Skills in `~/.claude/skills/`

## 14. What gets killed

Removed entirely. Not hidden. Deleted.

- AURA voice / Karen voice synthesis (postponed to v2)
- Three.js AIAvatar (the green blob face)
- The four steering dials (Persona, Scaffolding, Grit, Level of Detail)
- The Sovereign Vault passphrase prompt as a session gate
- EEG / Neural / Bio-Sovereignty / ToneHUD
- AI Declaration button (stub)
- Neural Proof button (stub)
- Simplify Logic button (stub)
- Branch Version button (stub)
- Drag Research URL feature (stub)
- AuthService.js (orphaned)
- View as Speech mode
- UDL Overrides toggle
- Literal Mode toggle as a global setting (becomes a tier-aware default instead)
- The four dead CustomEvents (trigger-onboarding-guide, stress-detected, steering-update, lod-change)
- All gamification, streaks, completion badges, social features
- "Pillar" as user-facing language (replaced with "Assessment" or "Task")
- "Sovereign User" voice greetings
- The nav button labelled "SOS"

## 15. Visual system

Every screen uses the Obsidian Aesthetic, defined in `src/theme/tokens.js`. No exceptions.

- **Base background**: Zinc-950 (#09090b)
- **Cards / panels**: Zinc-900 (#18181b)
- **Accents**: Emerald (Pulse #10b981, Hover #0f9d80, Glow #34d399)
- **Primary type**: Inter, weights 400 and 500 only
- **Mono type**: JetBrains Mono, 9px for metadata labels
- **No raw hex values** in component code. Tokens only.
- **No em-dashes**. No American spelling.
- **Buttons**: solid emerald for primary action, ghost (border only) for secondary, transparent for tertiary.
- **Spring physics only** for any animation. No linear easings.

If a screen renders with a white background, it is not following the spec.

## 16. The language of the product

Words the user reads in the UI:

- **Course** (not "pillar")
- **Assessment** or **Task** (not "pillar")
- **Section** (a part of a single assessment)
- **Brief** (the panel explaining what the assessment wants)
- **Tutor** (the AI helper, never "AURA")
- **Authenticity Report** (the export)
- **Due date** (not "deadline anchor")
- **Sources** (not "grounding assets")
- **Preview** (the final-document panel)

Words the user never reads:

- Sovereign, Sovereign User, Sovereign Engine
- Pillar
- Pareto
- Neural, Bio, Authenticity Hash, History of Thought
- Aura, Karen
- Stage A / B / C / D as labels (these are internal phase markers, not user labels)

## 17. v1 success metrics

- A student completes setup in under 3 minutes
- A student uploads a course and sees their assessments mapped within 60 seconds
- A student can identify the next-due task within 3 seconds of opening the app
- A student can export a print-ready PDF without leaving the app
- A student can produce an Authenticity Report
- Zero buttons in the UI do nothing
- Every assessment, due date, and weight is visible without clicking through

If any of these is not true, v1 is not ready.

## 18. v2 and beyond — out of scope for this rebuild

- Real-time collaboration
- Cloud sync (still local-first by default in v2 also)
- Voice mode and AURA personality
- EEG and biometric integration
- Multi-language UI
- Mobile app (web responsive only for v1)
- B2B university partnerships
- Marketplace of templates
- LMS integrations (Moodle, Canvas, etc.)
- Browser extension to import from LMS

These are good ideas. None of them ship in v1.

---

## 19. Branch strategy

- `sovereign-refactor-handshake` — frozen. Becomes the v1-archive.
- `v2-rebuild-canvas-first` — active rebuild branch.
- Tag `v1-archive-2026-05-13` marks the pre-rebuild snapshot.

## 20. How CC is instructed

Every sprint prompt to Claude Code includes this opening line:

> "This work must match `docs/PRODUCT_SPEC.md`. If you find yourself adding a feature not in the spec, stop and ask. If you find yourself touching a screen not in the spec's five screens, stop and ask."

CC has no creative license. The spec is the law.

---

*End of spec.*
