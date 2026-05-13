# Simplifii Product Spec — v2 (Inclusion & Moat Additions)

**Owner:** Aaron Saint-James  
**Last updated:** 13 May 2026  
**Status:** Active. This document sits alongside `PRODUCT_SPEC.md` and `PRODUCT_SPEC_TIER_UPDATE.md`. All three files together are the source of truth.

This file covers the non-negotiable additions surfaced by the five-lens + three-pressure-test audit on 13 May 2026. Every item here is either a legal compliance requirement, a moat strengthener, or a marginalised-user accommodation that the product cannot ship without.

---

## 1. The non-negotiables (P0)

These ship in v1 or v1 does not ship.

### 1.1 Magic link sign-in (WCAG 2.2 SC 3.3.8)

Section 6 of the original spec specifies email + password. This fails WCAG 2.2 SC 3.3.8 (Accessible Authentication) which says cognitive function tests like passwords must have an alternative.

**Behaviour:** The Sign In screen offers two primary options of equal weight:
- "Send me a magic link" (default)
- "Use a password"

Magic link flow: student types email, gets a one-tap link in their inbox, opens the app authenticated. No password required.

Password flow: still exists for students who want one (and works as fallback for users who can't access email easily). Both are equally first-class.

No social sign-in (Google, Apple) in v1 — those create privacy and data-leakage concerns that contradict the local-first promise.

### 1.2 "Talk to someone" always-visible safety link

A youth-facing product needs a non-negotiable path to a human. The current spec has no escalation route at all.

**Behaviour:** On every screen, in the bottom strip, a small but always-visible link reads "Talk to someone." It opens a modal with:
- Kids Helpline (1800 55 1800, ages 5-25) — primary for under-25 students
- Lifeline (13 11 14) — all ages
- Beyond Blue (1300 22 4636) — mental health
- headspace (1800 650 890) — ages 12-25, mental health
- 13YARN (13 92 76) — Aboriginal and Torres Strait Islander support
- For postgrad: institution's counselling service (looked up by institution name from setup)
- Plain language opener: "It's OK to need help. These services are free and confidential."

The link **cannot be removed** from the UI by any user setting if the account is flagged as a minor (under 18). For adult users, it can be moved to Settings but never deleted.

### 1.3 Respect `prefers-reduced-motion`

Section 14 of the original spec specifies "Spring physics only for any animation." This breaks WCAG 2.3.3 unless we honour the system setting.

**Behaviour:** Every animation in the product checks `window.matchMedia('(prefers-reduced-motion: reduce)')` before firing. If the user has reduced motion enabled at OS level:
- Spring physics → instant transitions
- Panel expand/collapse → snap, no slide
- Page transitions → cross-fade only, no movement
- Loading spinners → static "Loading…" text, no spin

This is checked at runtime, not on app load. If the user toggles their OS setting, the app respects the new setting on next render.

### 1.4 Export all data (catastrophic data loss prevention)

The product is local-first by design. A single Chrome cache clear wipes a postgrad's entire thesis history. This is a product-killing event.

**Behaviour:** Settings → "Export everything" button:
- Generates a ZIP containing:
  - Profile JSON (TierProfile, focus prefs, hardest areas)
  - All courses with all assessments
  - All uploaded source PDFs
  - All draft writing across all tasks
  - All Work Provenance Records (see 1.6)
  - All tutor conversation history
  - All steering / authenticity logs
- Downloads to the user's device
- Filename: `simplifii-export-YYYY-MM-DD.zip`

Settings → "Import data" button:
- Accepts a ZIP from a previous export
- Validates schema version
- Merges or replaces (user chooses)
- Shows preview of what will change before committing

This is offered at end of first-time setup as a "schedule a backup reminder" — system can remind monthly to export.

### 1.5 Authenticity Report cryptographic verification

The Authenticity Report currently promises proof of human authorship but has no verification mechanism. A marker who receives the PDF has no way to confirm it's genuine.

**Behaviour:** Every generated report contains:
- SHA-256 hash of the canonical content (assessment text + timestamp log + AI suggestion log)
- A short verification code (6 character alphanumeric, easier than the hash) printed at the top
- A verification URL: `https://verify.simplifii.app/v/<short-code>`

The verification endpoint is the ONLY part of the product that needs a server. When a marker visits the URL:
- Page shows: student name (anonymisable), task title, generation date, hash
- Marker can paste a copy of the PDF or upload it
- The server recomputes the hash from the uploaded PDF
- If hashes match: "✅ This is an authentic, unmodified Work Provenance Record"
- If they don't: "⚠️ This document may have been altered"

The student can disable hash uploading entirely (privacy). In that case the marker sees a different message: "This student has chosen not to enable verification. Treat as you would any signed declaration."

### 1.6 Rename Authenticity Report → Work Provenance Record (default)

"Authenticity Report" frames every student as a defendant. The exact users we're serving (ESL, autistic, dyslexic) have been falsely flagged by detectors their whole lives. The name itself is a trigger.

**Behaviour:** The default name is **Work Provenance Record** (WPR for short).

At setup or in Settings, the student can rename it to any of:
- Work Provenance Record (default)
- Learning Journey Log
- Effort Record
- Authenticity Report (for students who prefer the original framing)
- Custom name (free text)

The framing of the report content also shifts:
- Lead with: "Here's the work you did on [task name]"
- Then: time spent, sections drafted, edits made, sources consulted
- THEN: the AI usage breakdown (% human, % AI-assisted)
- LAST: the verification hash

The student's effort is the headline. The AI percentage is supporting detail. Not the inverse.

### 1.7 Reframe reminder system: visual timeline first, push notifications opt-in

Section 11 of the original spec specified push notifications escalating from 7 days out to overdue. This is built on neurotypical anxiety response. For ADHD, autistic, and trauma-affected students, escalating push notifications trigger shutdown.

The neurodivergent-led apps (Tiimo, Thruday, Sunsama) have all moved past this model.

**Behaviour:** The default reminder paradigm is **visual time blocking + decision externalisation**, not push.

On the home screen, replace the "Priority panel" wording with a "Today" panel:
- Horizontal time strip showing the next 7 days
- Each task appears as a coloured block on the day it's due
- Tasks coloured by status (green = on track, amber = due soon, red = overdue)
- The student sees their week at a glance — no need to remember

Body doubling cue (opt-in at setup):
- A small "Working alongside you" indicator at the bottom of the canvas
- Shows an animated dot or a soft pulse — proof another student is also writing right now
- The data is anonymous, aggregate (e.g. "47 other students writing now")
- This is one of the highest-impact ADHD interventions, evidence-backed

Decision externalisation (the externalised executive function):
- "What should I do next?" button on the home screen
- The system picks ONE task and tells the student: "Open this for 15 minutes. I'll check on you then."
- The student doesn't have to decide between options. The system decides.
- After 15 minutes the system asks: "How's it going? Keep going / Take a break / Pick something else"

Push notifications:
- Off by default
- Opt-in at setup with explicit framing: "Want us to send you a reminder for things due tomorrow? You can turn this off any time."
- If on, only fires at 24 hours before due, not the 7d/3d/2h cascade
- The 2h-before notification is removed entirely (creates panic)
- The persistent red banner is removed entirely (it's shaming)

Overdue handling:
- Overdue tasks move to the top of the day block in red
- A gentle line of copy appears: "This was due [date]. Want to submit late or update the date?"
- No banners. No modals. No shame.

### 1.8 Full keyboard navigation + ARIA + screen reader compatibility

The product currently has no specification for keyboard or screen reader accessibility. A blind student cannot use it as currently spec'd.

**Behaviour:** Every interactive element in every screen must:
- Be reachable via Tab key in logical reading order
- Have a visible focus indicator (WCAG 2.4.11, 2.4.13)
- Be activatable via Enter or Space
- Have an ARIA label that describes its purpose
- Announce state changes to screen readers (e.g. "Brief panel expanded")

The four-panel canvas in particular needs rethinking for screen readers:
- The panel collapse/expand state is announced
- Each panel has a unique landmark role
- Tab order goes: top status bar → centre canvas → bottom strip → side panels (in reading order)
- Drag-and-drop of source files has a keyboard equivalent (button: "Upload source")

Screen reader testing is a CI gate. Every PR runs an axe-core scan. Zero violations to merge.

### 1.9 Plain Language Mode

The product has six tiers but no toggle for cognitive accessibility *within* a tier. A uni student with an intellectual disability needs Year 4 reading level for the brief panel even though their tier is uni.

**Behaviour:** A toggle in Settings: "Plain Language Mode." When on:
- The brief panel auto-rewrites the assessment instructions at Year 4 reading level
- The tutor switches to grade-3-equivalent prose: short sentences, simple words, no jargon
- Tasks break into single-sentence steps with checkboxes
- The preview shows the work in plain layout, no academic formatting
- The tutor proactively defines any word it uses that's above grade 4 vocab

The plain language version is generated alongside the standard version. Toggling switches the displayed copy. Both stay stored.

This is separate from tier. A primary student gets primary defaults. A uni student with Plain Language Mode on gets uni-tier features (citations, etc.) but at primary reading level.

### 1.10 Predictive analytics policy (the responsible way)

The spec must explicitly state how we handle predictions about student behaviour.

**Behaviour, written as policy in the product:**
- All predictive models run **on the student's device**. No prediction data is sent to a server.
- Predictions are visible **only to the student** in their own dashboard.
- The system never says "you'll fail." It says "you've spent less time on this task than usual. Want help?"
- The student can see exactly what data drove any prediction (full transparency).
- The student can disable predictive features entirely from Settings.
- Predictions are never shared with teachers, parents, or institutions without explicit per-prediction consent.
- Aggregate, anonymised data (used to improve the model) is opt-in, not opt-out.

This is documented in a Settings → Privacy section visible to every student. Plain language. No legal jargon.

---

## 2. Inclusion features (P1)

These ship in v1 because the moat depends on them.

### 2.1 Override tier defaults

The TierProfile sets defaults, not constraints. A Year 4 student who wants the senior tutor voice can switch. A postgrad who wants the warmer primary tutor can switch.

**Behaviour:** Settings → "Customise my experience":
- Pick a language pack (separate from tier)
- Pick a tutor voice tone (warm / direct / academic)
- Adjust reminder cadence (more / less / off)
- Change Plain Language Mode default
- Re-do the setup questions

The TierProfile shows what's currently active. The student can override any of it.

### 2.2 Accessibility controls in Settings

Add a Settings → Accessibility section:
- Text size: 100% / 125% / 150% / 200%
- Line height: standard / loose
- Letter spacing: standard / wide
- Word spacing: standard / wide
- Font choice:
  - System default (Inter)
  - **OpenDyslexic** (peer-reviewed dyslexia font)
  - **Lexend** (peer-reviewed dyslexia font)
  - Atkinson Hyperlegible (low-vision font from Braille Institute)
  - System fonts the user has installed
- Theme:
  - Obsidian Aesthetic (dark, default)
  - Light mode
  - High contrast (WCAG AAA contrast ratios)
  - Sepia / warm (for users sensitive to blue light)
- Animation: respect system / always on / always off
- Reading aids (see 2.3 below)

All settings persist in IndexedDB. All settings apply immediately without reload.

### 2.3 Reading aids (Bionic Reading + others)

A "Reading aids" submenu in Settings → Accessibility, and a quick-toggle in the Brief panel and Sources panel:

**Bionic Reading:** Bolds the first 30-50% of each word (configurable intensity). The user can toggle on for any text content in the product. The peer-reviewed evidence is mixed but subjective experience is strong for many ADHD/dyslexic users — we offer it as one of multiple aids.

**Syllable splitting:** Visually separates syllables with bullet points or colour. Primarily for primary and early secondary tiers, but available at all tiers.

**Reading ruler:** A semi-transparent horizontal bar that follows the user's cursor or focus. Highlights only the current line, dims the rest. Reduces visual overload for ADHD users.

**Background tint:** User can apply a tint colour to text backgrounds (for Irlen syndrome / Meares-Irlen). Choices: yellow, blue, pink, green, off.

**Text-to-speech:**
- Every panel has a small "Listen" button
- Uses the browser's Web Speech API (no external service, fully local)
- Adjustable speed: 0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x
- Adjustable voice: any voice installed on the user's OS
- Highlights the word being spoken as it reads (karaoke style)
- Works on every text element: brief, sources, tutor messages, draft, preview

These are offered alongside each other. The user picks what works for their brain. We don't pick for them.

### 2.4 Behavioural stress detection (the privacy-safe alternative to biometrics)

Detect distress from interaction patterns. No camera, no microphone, no wearable, no health data. Just keystroke and click telemetry on the device.

**Signals tracked:**
- Time on a single sentence > 5 minutes = stuck
- Backspace count > 50 in 2 minutes = frustration
- Time on canvas > 90 minutes straight = fatigue
- Switching between brief and canvas > 10 times in 5 minutes = confusion
- No typing for 10 minutes while on canvas = stuck or distressed
- Mouse jitter or rapid scrolling = anxiety signature
- Time of day — model learns the student's normal active hours and flags deviations

**Behaviour when signals fire:**
- Gentle non-blocking interventions only
- Never a modal. Never a pop-up. Just a soft suggestion in the bottom strip or a small breath-icon that pulses briefly
- Examples:
  - "Want to take a 5-minute break? Your last 90 minutes was solid."
  - "Stuck? The tutor can ask you a question about this section."
  - "Feels like a hard moment. Want to switch tasks, or call it for the day?"

**Privacy:**
- All signals are computed locally on the device
- Signals are never sent to a server
- The student can see what signals are active in Settings → Patterns ("you've been on this sentence for 7 minutes")
- The student can disable the entire system
- Aggregate, anonymised signals (for improving the model) are opt-in

This is **behavioural biometrics**. Same insight as wearable HRV. Zero data privacy risk. No device dependencies. And competitors can't easily copy because it requires the product to be running.

### 2.5 Audio-first mode (for blind / low-vision students)

A blind student needs a fundamentally different rendering of the product, not just screen reader compatibility.

**Behaviour:** Setting enabled at setup or in Settings → "Audio-first mode":
- The four-panel canvas restructures into a sequential audio interface
- Tutor speaks instead of shows text
- Brief is read aloud automatically when task opens
- Sources are described (file name, page count, last sentence) and the student can navigate by voice
- Writing is via dictation (Web Speech API)
- Preview is described aloud ("This is your draft. 450 words. 3 sections. Section 1: …")
- The Work Provenance Record reads aloud as a structured audio summary
- The student navigates with arrow keys or voice commands: "next section", "read brief", "ask tutor"

Audio-first mode is enabled by default if the system detects an active screen reader (NVDA, JAWS, VoiceOver) on first load.

### 2.6 Pictogram support (for intellectual disability)

For students with severe intellectual disability, words alone don't work. The product needs visual symbols alongside text.

**Behaviour:** Pictogram Mode toggle (works with Plain Language Mode):
- Every button has both text and a recognisable icon
- Each navigation step is shown as a numbered visual flow
- Tasks shown with action verbs as pictograms ("write", "read", "talk")
- Mood check-ins use emoji or symbol selection, not words
- Compatible with PCS (Picture Communication Symbols) and ARASAAC pictograms (open licence)

This is most useful for primary tier students with disability and TAFE students with intellectual disability. Available at all tiers.

### 2.7 Switch control + eye tracking compatibility

WCAG 2.5.7 (Dragging Movements) and 2.5.8 (Target Size).

**Behaviour:**
- Every drag-and-drop action has a button alternative (e.g. "Upload source" button next to the drop zone)
- All interactive targets are minimum 44x44 CSS pixels (we exceed WCAG 24x24 minimum because mobile and switch users need bigger targets)
- A single-switch / scan mode in Settings: the product cycles through interactive elements one at a time, the user presses one button to select
- The product is fully compatible with iOS Switch Control and Android's accessibility services
- Eye tracking compatible via standard focus management (Tobii devices and similar work because we use ARIA + keyboard nav correctly)

### 2.8 Mental health "softer pace" mode

A student in genuine difficulty needs the system to slow down, not push forward.

**Behaviour:** Settings → "I'm having a hard time right now":
- Pauses all reminders for 48 hours (extendable)
- Tutor switches to a check-in tone: "How are you doing today?" rather than "Let's work on the brief"
- The home screen surfaces support resources at the top (Kids Helpline, Lifeline, headspace)
- Tasks are still visible but de-emphasised (smaller cards, softer colours)
- No celebrations, no progress bars, no "you can do this" messaging
- A single line of copy: "Take what time you need. We'll be here."
- After 48 hours the system gently asks: "Still tough, or ready to look at things again?"

This setting can be toggled by the student without judgement. There's no log of who used it. There's no notification to anyone else.

### 2.9 Paste raw text fallback

Some institutions don't publish PDFs. Some students get instructions verbally or via a course site. The extraction pipeline must have a manual override.

**Behaviour:** On the Add course flow:
- Primary path: drag-and-drop PDF
- Alternative path: "Type or paste the assessment details"
- A simple form: course code (or "I don't know"), course name, term, then one row per assessment: title, due date, weight, brief description
- The extraction service runs the same brief decoder on pasted text as on PDFs
- This is the entry point for students at institutions that don't share documents

### 2.10 Re-entry "Where are you stuck?" after dormancy

Section 9.3 of the original spec fires the prompt once. Re-entry after time away is the hardest moment for ADHD / autism users — they need that prompt again.

**Behaviour:** If a student opens a task they haven't touched in 7+ days, the "Where are you stuck?" prompt fires again. Specifically:
- Shows whatever they did last time at the top: "Last time you wrote this paragraph about [topic]. Want to keep going, or restart?"
- Then the prompt options
- The student can dismiss to go straight to canvas

### 2.11 Empty / loading / error states for every screen

Currently the spec only mentions "empty state" once. Every screen needs all four states explicitly designed:
- Empty (no data yet)
- Loading (data fetching, processing, extracting)
- Success (the happy path)
- Error (extraction failed, network down, file corrupted, etc.)

Each error state has:
- A plain-language explanation of what went wrong
- The student's options for what to do next
- A way to retry
- A way to skip / continue
- A "send feedback" link (anonymised, opt-in)

No bare error codes. No "Something went wrong." Always explain what happened and what to do.

### 2.12 Offline mode

The spec is local-first but the AI tutor calls require an external model. What happens with no internet?

**Behaviour:**
- All extraction, writing, saving, preview, export work offline
- Reminder system works offline
- Only the cloud LLM tutor needs internet
- If the user goes offline mid-task:
  - A small badge appears in the bottom strip: "Offline. Saving locally."
  - Tutor panel shows: "Tutor offline. Writing and saving still work."
  - When connection returns, a sync indicator shows briefly
- Optional: ship a local LLM via Ollama or WebLLM for fully offline tutor in v1.1

### 2.13 Share progress with parent / tutor (opt-in)

For primary students, parents need to know if homework is being done. For senior secondary, parents pay tuition. For TAFE, employers may want visibility. For postgrad, supervisors check in.

**Behaviour:** Settings → "Share progress with..." :
- Add a person: name, email, relationship (parent / tutor / supervisor / mentor)
- The student generates a read-only link
- That link shows: assessment list, due dates, completion status
- The link **never** shows the writing itself, the tutor conversations, or the Work Provenance Record
- The student can revoke any link at any time
- Per-task share toggle (some tasks the student doesn't want shared)

This is opt-in by the student. Parents can't sign their child up for this without the child's account-level consent.

### 2.14 Voice-to-text input in canvas

Many students can talk better than they type. Especially dyslexic, dyspraxic, motor-affected, and ESL students.

**Behaviour:**
- A microphone button in each canvas section
- Click to start dictating
- Uses the browser's Web Speech API (local, no external service)
- Real-time transcription appears in the section
- Punctuation commands supported: "full stop", "new paragraph", "comma"
- The student can review and edit after dictating

---

## 3. Roadmap (P2 and beyond)

These are committed dates, not vague "v2."

### Q3 2026 (v1.1)

- Study buddy / co-working mode (UDL 3.0 interdependence)
- Glossary and symbol explanation for technical terms
- Auslan video tutorials for primary and junior secondary tiers (for deaf students)
- Predictive analytics dashboard, student-facing
- Local LLM tutor (Ollama integration) for fully offline mode

### Q1 2027 (v1.2)

- iOS native app
- Multimodal output (audio summary, slide deck export)
- Proactive strategy suggestions from tutor
- Institutional verification dashboard (the marker-facing verify endpoint, with UNSW as first partner)

### Q3 2027 (v2.0)

- Apple HealthKit / Fitbit / Whoop HRV integration (opt-in, premium tier)
- Real-time stress detection from wearable data combined with behavioural signals
- Federated learning across consenting students to improve predictive models
- B2B university partnerships (Authenticity Report as institutional service)

---

## 4. Quality gates (for every sprint)

CC must satisfy these before any PR merges:
- Every new component has E2E tests for the happy path
- Every new component passes axe-core accessibility scan with zero violations
- Every new component has Storybook stories
- Every tier path has at least one E2E test from setup to writing
- Every screen has explicit empty / loading / success / error states
- WCAG 2.2 AA conformance verified manually before any release tag

---

## 5. Positioning (the billion-dollar pitch)

For marketing and pitch decks:

> The only academic writing tool that:
> - Speaks to every Australian education tier in its own language
> - Works on the student's device with no data leaving it
> - Proves human authorship cryptographically
> - Is built from the ground up for blind, deaf, intellectually disabled, neurodivergent, and trauma-affected students
> - Detects student distress from interaction patterns without surveilling them
> - Respects learner agency over institutional control
> - Replaces the part of Grammarly that universities have started banning

Positioning lines for the deck:
- "The proof-of-learning layer for the AI era"
- "Authorship, not detection"
- "The tutoring layer on top of every LMS in the world"
- "Built for students universities lose"

Target institutional first partner: UNSW Sydney (via Aaron's existing affiliations and the Diversified Project).

---

## 6. Status

This document is the third pillar of the v2 spec. Read alongside:
- `docs/PRODUCT_SPEC.md` — the original v2 spec (5 screens, kill list, visual system)
- `docs/PRODUCT_SPEC_TIER_UPDATE.md` — tier-aware setup and language packs

Every CC prompt from this point forward must include:

> "This work must match `docs/PRODUCT_SPEC.md`, `docs/PRODUCT_SPEC_TIER_UPDATE.md`, AND `docs/PRODUCT_SPEC_INCLUSION_AND_MOAT.md`. The third file contains non-negotiable additions for legal compliance, accessibility, and competitive moat. If any feature in the spec conflicts with a current build assumption, the spec wins."

---

*End of file.*
