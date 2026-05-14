# Pre-Testing Audit Report
**Date:** 14 May 2026
**Scope:** Sprints A through I
**Status:** READ-ONLY AUDIT (no files modified)

---

## TLDR

1. **Auth works.** Google OAuth, email/password, sign-out, session persistence all functional.
2. **Courses are localStorage-only.** The Supabase `courses` table is written to but never read back. Courses do not persist across browsers or devices. This is the single biggest data integrity gap.
3. **After creating a course, the editor is a hollow shell.** No brief, no rubric, no guidance. A tester who creates a course via the modal then clicks "Open" lands in a blank editor with nothing to do.
4. **No feedback mechanism exists.** Sprint J (feedback button) is not built. Testers have no in-app way to report bugs.
5. **The critical path (sign up, onboard, create course, open it, do something useful) ends at "open it."** Everything before that works. Everything after is unfinished.

---

## Part 1: File Inventory

### Component Count
- **83 .jsx/.js files** in `src/frontend/` totalling ~13,945 lines
- Key directories: `auth/` (5), `components/` (25 + 3 disclaimers + 2 extensions + 2 games + 2 visuals), `hooks/` (3), `landing/` (7), `onboarding/` (3), `research/` (9), `workspace/` (3)

### Routes

| Path | Component | Auth | Status |
|---|---|---|---|
| `/` | LandingPage | Public-only | Working |
| `/login` | LoginScreen | Public-only | Working |
| `/signup` | SignupScreen | Public-only | Working |
| `/privacy` | PrivacyPage | Open | Working |
| `/terms` | TermsPage | Open | Working |
| `/ai-use` | AiUsePage | Open | Working |
| `/accessibility` | AccessibilityPage | Open | Working |
| `/onboarding` | OnboardingFlow | Protected | Working |
| `/app/*` | AppShell | Protected | Working (with caveats below) |
| `*` | Redirect to `/` | - | Working |

### Supabase Tables

| Table | Rows | RLS | Components that query it |
|---|---|---|---|
| `profiles` | 1 | Yes | AppShell (read), HomeScreen (read), OnboardingFlow (write), FirstRunModal (write) |
| `courses` | 0 | Yes | AddCourseModal (write only, **never read**) |
| `assessments` | 0 | Yes | AddCourseModal (write only, **never read**) |
| `history_of_thought_events` | 0 | Yes | HistoryOfThought.js (write only) |

### Supabase Storage Buckets
- `documents` (used by `src/lib/storage.js` for PDF uploads)
- `briefs` (created in Sprint I, user-scoped RLS)

### **CRITICAL: `courses` table schema mismatch**
The actual Supabase `courses` table has columns: `id`, `user_id`, `name`, `local_id`, `data` (jsonb), `created_at`, `updated_at`. But `AddCourseModal.jsx` tries to insert `code`, `tier`, `term` columns which **do not exist** in the actual table. The Sprint I migration likely ran against a pre-existing table from an earlier migration. **Every course insert from AddCourseModal will silently fail or drop those fields.**

### Env Vars Required
| Var | Used by | Status |
|---|---|---|
| `REACT_APP_SUPABASE_URL` | supabaseClient.js | Has hardcoded fallback |
| `REACT_APP_SUPABASE_ANON_KEY` | supabaseClient.js | **Falls back to empty string** (silent failure) |
| `REACT_APP_ANTHROPIC_API_KEY` | anthropicClient.js | Not wired (AI features stubbed) |
| `REACT_APP_GCP_PROJECT_ID` | DocumentAIService.js | Not wired |

### Orphaned Components (exist but never imported)
- `AuthGate.jsx` (superseded by RequireAuth in index.js)
- `BionicText.js` (replaced by BionicReadingExtension)
- `AiSuggestionLabel.jsx` (created in Sprint D, not yet wired)
- `RubricTranslatorTool.jsx` (stubbed, never imported)
- `ConfirmDialog.js` (never imported)
- `useStressSignals.js` (hook defined, never consumed)

### TODO/FIXME Comments (7 found)
- `CanvasScreen.jsx:200` — route to panel based on choice (not implemented)
- `HomeScreen.jsx:242` — pick most urgent task (not implemented)
- `BottomStrip.jsx:29` — wire to real telemetry (hardcoded)
- `TutorPanel.jsx:36` — wire to /api/tutor (Anthropic API not connected)
- `BodyDoublingLine.jsx:19` — wire to real telemetry (hardcoded)
- `CheckAgainstRubricService.js:51` — wire to Anthropic API
- `ScaffolderToolService.js:42` — wire to Anthropic API

---

## Part 2: Sprint Chain Verification

### Sprint A (Auth) — WORKING
- Google OAuth: `signInWithOAuth` in GoogleSignInButton.jsx. Correct redirect config.
- Email/password: `signUp` and `signInWithPassword` in AuthContext.js.
- Magic link: `signInWithOtp` in AuthContext.js.
- Sign-out: `signOut` clears session. Auth state listener updates UI.
- Session retry: 3-second retry on initial session check failure.
- **Verdict: Solid. No issues found.**

### Sprint B (Empty workspace gating) — WORKING
- Aaron email check in ResearchProjectContext.js (line 56): `isAaron = user?.email === 'aaronbugge@gmail.com'`
- Seed flag gated: `if (isAaron && localStorage.getItem(SEED_FLAG))` (line 103)
- ProposalOnboarding hides "Use Demo Data" for non-Aaron users (ResearchHomeScreen.jsx line 109)
- HomeScreen.jsx line 152: non-Aaron users see EmptyWorkspace (Sprint I)
- **Verdict: Working as designed.**

### Sprint C (Public landing + routing) — WORKING
- All 7 public routes render correctly.
- react-router-dom v7.15.0 installed and wired.
- SPA rewrite in vercel.json present.
- No broken internal links on landing page (all Link targets verified).
- **Verdict: No issues.**

### Sprint D (Legal + disclaimers) — WORKING (with fragility)
- FirstRunModal blocks app until both checkboxes ticked. Writes `acknowledged_disclaimers = true` to profiles.
- **Fragility:** If Supabase write fails, modal proceeds anyway (`catch` calls `onAcknowledged()`). User enters app but next session shows modal again.
- AiDisclaimerFooter visible in AppShell (line 78) and OnboardingFlow (line 103).
- Citation tooltip updated (CitationHighlightExtension.js line 40).
- PitStopOverlay health disclaimer added.
- TalkToSomeoneLink crisis disclaimer added.
- **Verdict: Functional. Silent failure on write is a known fragility, not a blocker.**

### Sprint F (Accessibility) — WORKING
- Skip navigation link: present, CSS positions it off-screen, visible on focus.
- `<main>` landmark: present (LandingPage.jsx line 163).
- `:focus-visible` rules in LandingPage.css (line 288).
- ARIA tab pattern on showcase: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, arrow-key handler.
- FAQ: `aria-expanded`, `aria-controls`, `id` pairing all correct.
- Comparison: semantic `<table>` with `<th scope="col">`.
- `prefers-reduced-motion` and `prefers-contrast: more` both handled.
- /accessibility page renders with 5 content sections.
- **Verdict: Landing page accessibility is strong.**

### Sprint E (Visual polish) — WORKING
- Geist font: `@fontsource/geist-sans` imported in LandingPage.jsx (lines 4-8). `FONT_DISPLAY` token used on all headlines.
- NeuralAvatar in hero: two-column layout, breathing + float animation via Framer Motion.
- Glassmorphism: `GLASS_SURFACE`, `GLASS_BORDER`, `backdrop-filter: blur()` on cards.
- Awards bar visible with 3 glass pills.
- Check/cross marks render as unicode glyphs (fixed from HTML entities).
- **Verdict: Visual polish layer working correctly.**

### Sprint G (Wordmark + previews + education) — WORKING
- "Simplifii-OS" wordmark below BrOWSER avatar in hero.
- ShowcasePreview.jsx: 3 distinct SVG illustrations (workspace, draft, reset). Wavy underline on draft view. NeuralAvatar with pulse rings on reset view.
- EducationLevels.jsx: 8 cards in responsive grid. Institutions card has mailto link.
- **Verdict: All rendering correctly.**

### Sprint H (Onboarding) — WORKING (with fragility)
- Tier picker: 7 cards, single-select, continue disabled until selection.
- Accessibility step: 4 controls (font, bionic, reduced motion, high contrast). Skip works.
- Writes to Supabase: `tier`, `preferences`, `onboarding_completed = true`.
- Hydrates localStorage for SettingsContext.
- **Fragility:** If Supabase write fails, `navigate('/app')` runs anyway. AppShell re-checks `onboarding_completed` from Supabase (still false), redirects back to `/onboarding`. **Infinite redirect loop on persistent network failure.**
- **Verdict: Works under normal conditions. Loop risk on failure.**

### Sprint I (Empty workspace + first course) — **PARTIALLY BROKEN**
- EmptyWorkspace renders with tier-specific copy. Working.
- AddCourseModal opens and allows input. Working visually.
- **BROKEN: Supabase insert likely fails silently.** The `courses` table in Supabase has columns (`id`, `user_id`, `name`, `local_id`, `data`, `created_at`, `updated_at`) but AddCourseModal tries to insert `code`, `tier`, `term` which are not present in the actual table. The insert will either fail or silently drop those fields.
- **BROKEN: Courses are never read from Supabase.** Zero instances of `supabase.from('courses').select()` exist in the codebase. Courses only persist in localStorage.
- "I have a brief to upload" button: opens the same modal at step 1 (no `initialStep` prop passed). Effectively a duplicate CTA, not broken but misleading.
- **Verdict: The visual flow works (modal opens, form fills, local course appears). The server persistence is broken or at least unreliable.**

---

## Part 3: Tester Journey Gap Analysis

### The Critical Path

| Step | Component | Status |
|---|---|---|
| 1. Land on `/` | LandingPage | Working |
| 2. Click "Start free" | Navigates to `/signup` | Working |
| 3. Sign up (Google OAuth) | GoogleSignInButton | Working |
| 4. Complete onboarding | OnboardingFlow (2 steps) | Working |
| 5. Acknowledge disclaimers | FirstRunModal | Working |
| 6. Land in `/app` | HomeScreen + EmptyWorkspace | Working |
| 7. Create a course | AddCourseModal | **Partially working** (local state OK, Supabase insert may fail) |
| 8. Course appears in grid | CourseCard | Working (from localStorage) |
| 9. Refresh page | CourseCard from localStorage | Working (same browser only) |
| 10. Click "Open" on course | CanvasScreen | **Hollow.** No brief, no rubric, title defaults to "Assessment" |
| 11. Do something useful | ??? | **Nothing meaningful.** Editor works but has no context, no guidance, no rubric |
| 12. Report feedback | Sprint J | **Not built** |

### **Step 10-11 is the critical dead end.**

When a tester clicks "Open" on a course created via AddCourseModal:
- `CanvasScreen` loads with `courseId` from RouterContext
- `courses[courseId]` exists in ProjectContext (localStorage)
- But: `briefs = []`, `rubricCriteria = []`, `rubricBands = []`, `currentTitle = 'Assessment'`
- The editor renders. The user can type. But there is no brief panel, no rubric to check against, no citation sources, no Socratic prompts, no AI assistance (Anthropic API not connected).
- **The tester has a blank editor with nothing to do in it.** The session effectively ends here.

### The alternative path: AddCourseButton (PDF upload)
The existing `AddCourseButton` in the nav triggers the `useIngestion` hook which:
- Uploads a PDF
- Extracts assessments, rubric criteria, and due dates
- Creates a fully-populated course in ProjectContext

This path gives the CanvasScreen meaningful content to work with. **The existing PDF flow is the functional one. The new Supabase-backed AddCourseModal creates empty shells.**

### No feedback mechanism
Confirmed: no `FeedbackButton`, `BugReportModal`, or any issue-submission component exists. The only way to report a bug is to email aaron@simplifii.com.au or message directly. For 10-20 testers this is manageable but not scalable.

---

## Part 4: Risk Register

### CRITICAL

| # | Risk | Impact | Location |
|---|---|---|---|
| **C1** | **Courses table schema mismatch.** AddCourseModal inserts `code`, `tier`, `term` columns that don't exist in the actual Supabase `courses` table. Insert may fail silently. | Course creation via AddCourseModal broken on server side | AddCourseModal.jsx:39, Supabase `courses` table |
| **C2** | **Post-course dead end.** After creating a course and clicking "Open", the editor is empty: no brief, no rubric, no AI. Tester has nothing to do. | Testing session ends at minute 3 | CanvasScreen.jsx:39-51 |
| **C3** | **No feedback mechanism.** Sprint J not built. Testers cannot report bugs in-app. | Feedback lost, bugs unreported | Not built |

### HIGH

| # | Risk | Impact | Location |
|---|---|---|---|
| H1 | Courses are localStorage-only. Never read from Supabase. Cross-device = blank. | Data loss on browser switch | ProjectContext.js (no Supabase read path) |
| H2 | Onboarding infinite redirect loop if Supabase write fails. `navigate('/app')` runs unconditionally, but `onboarding_completed` stays false. | User stuck in loop | OnboardingFlow.jsx:69-72 |
| H3 | `REACT_APP_SUPABASE_ANON_KEY` falls back to empty string. All Supabase calls fail silently if env var missing on Vercel. | Complete data layer failure | supabaseClient.js:4 |

### MEDIUM

| # | Risk | Impact | Location |
|---|---|---|---|
| M1 | "I have a brief to upload" button opens same modal as "Add course" (no skip to upload step). | Misleading CTA, not broken | EmptyWorkspace.jsx:50, AddCourseModal has no `initialStep` prop |
| M2 | DecisionButton `onDecide` is a console.info stub. Clicking does nothing visible. | Confusing but skippable | HomeScreen.jsx:242 |
| M3 | HistoryOfThought.js creates its own Supabase client instances (bypasses shared singleton). | Potential auth state inconsistency | HistoryOfThought.js:250, 376 |
| M4 | No profiles row = skips onboarding entirely (null check in AppShell). | Edge case: user with no profile row lands in app with tier=null | AppShell.jsx:44-55 |
| M5 | Parallel course creation paths: AddCourseButton (PDF) and AddCourseModal (Supabase). No deduplication. | Duplicate courses possible | HomeScreen nav vs EmptyWorkspace |

### LOW

| # | Risk | Impact | Location |
|---|---|---|---|
| L1 | FirstRunModal proceeds if Supabase write fails. Re-shows next session. | Annoying, not blocking | FirstRunModal.jsx:43 |
| L2 | 6 orphaned components in codebase. | Code bloat, no runtime impact | Various (see Part 1) |
| L3 | 7 TODO comments for unbuilt features. | Expected for beta | Various |
| L4 | "Research" nav button leads to ProposalOnboarding for non-Aaron users (requires proposal upload). | Dead end for testers without a proposal | ResearchHomeScreen.jsx |

---

## Part 5: Recommendations

### 3 Most Important Things to Fix/Build (Next 2 Days)

1. **Fix the post-course dead end (C2).** The simplest fix: after course creation via AddCourseModal, show a prompt to upload a PDF syllabus via the existing `useIngestion` hook. This gives CanvasScreen real content. Alternatively, wire the "Open" action on a new course to show a brief upload prompt before the editor. The existing PDF extraction pipeline works. Use it.

2. **Fix courses table schema (C1).** Either alter the Supabase `courses` table to add `code`, `tier`, `term` columns, OR update AddCourseModal to use the existing schema (`name`, `local_id`, `data` jsonb). This is a 5-minute fix either way.

3. **Add a minimal feedback mechanism (C3).** Even a floating mailto link ("Report a bug") is better than nothing. Sprint J's full build is ideal but a lightweight version (mailto button + Supabase insert) can ship in 2 hours.

### 3 Things to Explicitly Defer

1. **Cross-device course sync (H1).** localStorage-only is fine for a 2-day testing sprint. All testers will use a single device/browser. Sync is a post-testing architecture decision.

2. **Anthropic API integration.** All AI features (TutorPanel, CheckAgainstRubric, Scaffolder) are stubbed. Testers should not expect AI responses. Communicate this in the tester brief.

3. **Research workspace for non-Aaron users (L4).** ProposalOnboarding is functional but niche. Tell testers to use the undergrad/course flow, not the research workspace.

### Should Sprint J (feedback) be next?

**No. Fix C1 and C2 first.** The courses schema mismatch and the post-course dead end are more critical than feedback infrastructure. A tester who creates a course and finds nothing to do will stop testing. A tester who encounters a bug but has to email it is annoyed but continues testing.

Recommended order:
1. Fix courses schema (C1) — 10 minutes
2. Fix post-course flow (C2) — 2-4 hours (wire PDF upload into post-creation flow)
3. Minimal feedback button (C3) — 1-2 hours (floating mailto or simple Supabase insert)
4. Sprint J full feedback infrastructure — after testing starts, using tester input to prioritise

### Final Verdict

**Is the app ready for 10-20 testers in 2 days?**

**YES IF:**
1. The courses table schema mismatch is fixed (C1)
2. The post-course experience gives the tester something to do (C2: wire PDF upload into the flow so CanvasScreen has content)
3. Testers are given a clear brief explaining: use one browser, use the course flow (not research), AI features are not live, email bugs to aaron@simplifii.com.au

Without fixing C2, the test session ends at minute 3. That is not a viable test.
