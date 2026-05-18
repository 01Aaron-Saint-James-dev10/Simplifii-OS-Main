# Simplifii-OS Project Guidelines
Version: 2.0.0 : Merged-OS Constitution
Status: Active Source of Truth

## What Simplifii-OS Is

Simplifii-OS is infrastructure for surviving education when the system was never designed for you.

It is a neuroinclusive, trauma-informed, strengths-based operating system that carries a learner through a course, a term, or a set of clearly laid out tasks (decoding the hidden curriculum, holding their executive function, and managing cognitive load) so that learning, not navigation, is what costs them energy.

Audience: Primary, Secondary, University, Postgrad/Research, Homeschool (parent + child), and Educators. Institutions are a separate paid tier with aggregated, de-identified access only.

This is not a study app. It is a substitute scaffold for the parts of academic life that are invisible to people who already fit.

---

## The Sovereign Constitution (Non-Negotiable Rules)

### 1. Institutional Sovereignty, Not Personal Sovereignty

The system tracks everything about every learner. This is deliberate: it is the corpus that makes the platform valuable and the evidence that supports them. But:

- No institution, school, university, parent, or educator can see a learner's identity, raw work, or individual behavioural patterns. They see anonymised, aggregated statistics only.
- No learner's identity, work, or patterns are sold or shared identifiably. Institutional tier customers receive de-identified aggregate data.
- The platform itself holds the full corpus. That is what acquirers and institutional buyers pay for. Never the individual.

The single rule that resolves the architecture:
**The platform knows everything. Institutions see only statistics. Learners are sovereign from the people who would otherwise judge them.**

### 2. The Three-Tier Canvas (The Integrity Engine)

Every assessment, task, or piece of work uses a three-tier canvas, visible side-by-side:

- Tier 1: AI Assist (Pre-Write). AI helps the learner draft, scaffold, and break the blank-page paralysis. Pre-writing is encouraged, not hidden.
- Tier 2: Socratic Layer. AI generates prompts and questions that tease out the learner's own thinking, understanding, and reasoning. The learner answers.
- Tier 3: Learner Writing. The actual work the learner produces, in their own voice, informed by Tiers 1 and 2.

Assessment is anchored to Tier 3, but Tiers 1 and 2 are visible to the marker. This is the integrity proof: every piece of AI assistance is transparent and traceable. Markers see exactly what the AI provided versus what the learner did with it.

This is how Simplifii-OS resolves the AI-in-education contradiction: AI assistance is not hidden, it is structurally separated and made auditable.

### 3. Strengths-Based and Trauma-Informed by Architecture

The system is built on two specific clinical and educational frames. They are not marketing language. They are operating rules.

**Strengths-Based:** The learner's existing capacities, strategies, and intelligences are the starting point. The system identifies what the learner already does well and routes through those capacities first. Deficits are not the unit of analysis; functional variability is.

**Trauma-Informed:** The system assumes the learner has experienced educational harm. Every interaction is designed to:
- Restore agency (the learner is always the driver)
- Avoid surprise (transitions are explicit, consequences are previewed)
- Preserve choice (every dial, every mode, every step is steerable)
- Avoid coercion (no streaks that punish absence, no shame surfaces, no toxic positivity)

**Operating consequences:**
- No "you missed a day" guilt notifications
- No deficit framing ("struggling with...", "weak at...") : use functional language ("currently needs...", "scaffolds well with...")
- No comparative ranking against peers
- No "superpower" or "gift" narratives that erase difficulty
- No surprise UI changes; every state transition is explicit
- Every nudge offers a graceful exit ("not now")
- The learner can always see what the system knows about them and export it

### 4. The Hidden Curriculum is the Product

Academic success requires knowing things that are never taught: how to decode a rubric, what "critical analysis" actually means, what an academic register sounds like, when a deadline is real versus negotiable, how to ask for an extension, what a marker is looking for between the lines.

Simplifii-OS treats this hidden curriculum as the primary product surface. Every tool, scaffold, and Socratic prompt makes the implicit explicit. If a learner could have learned it from someone with academic capital at home, the system provides it instead.

### 5. Executive Function and Cognitive Load are the OS

The system holds the parts of the work that executive function deficits make hardest:

- Sequencing (what to do next)
- Time horizon (when is it actually due, what does the path look like)
- Prioritisation (Pareto / Burrito First: the highest-mark-density action surfaces first)
- Working memory (state is held by the system, not the learner)
- Initiation (Tier 1 Pre-Write is the antidote to blank-page paralysis)
- Transition (LOD modes manage cognitive load: Compass for sprint, Map for overview)

The learner brings their thinking. The system brings the structure.

### 6. Accessibility is Floor, Not Ceiling

WCAG 2.2 AA is the minimum. Every surface must work for:
- Screen readers
- Keyboard-only navigation (no mouse required, anywhere)
- Reduced motion preferences
- High contrast
- OpenDyslexic font option
- Adjustable font size and line spacing
- BionicText reading mode
- LiteralMode vocab transformation
- Voice input where the underlying API allows

Colour is never the sole signifier of meaning. Icons are always paired with labels. No timed actions without a way to extend or disable the timer.

### 7. Australian English, No Em-Dashes, Calm Tone

- Strictly Australian English (Initialise, Organise, Synthesise, Colour).
- Absolutely zero em-dashes in UI text or code comments. Use colons or parentheses.
- Tone: Direct, literal, ADHD-friendly. No marketing fluff. No "you've got this!" toxic positivity. No "superpower" framing.
- Pre-commit hook (`scripts/check-style.js`) enforces this mechanically.

### 8. Steering and Transparency

The learner is the driver. The AI is the GPS. Everything the AI generates must be steerable and explainable from the cockpit, not buried in code.

- Why on every step. Every micro-step, scaffold, or generated suggestion carries a one-line rationale tied to a rubric criterion or schema field.
- Steerable persona. The learner controls four dials via the Steering Drawer: Persona (Literal vs Academic), Scaffolding (Heavy vs Light), Grit (Hard Socratic vs Literal Assistant), and LOD (Compass / Sprint / Map). All four persist across sessions. Every AI prompt reads these before composing output.
- Hide the gut. Do not surface raw probability scores, parser internals, or "Thinking..." latency logs. Use calm, schema-anchored progress signals.
- Single source of truth. The Logic Blocks (left canvas / cockpit) own the document state. The Preview Pane is view-only. Edits round-trip through blocks so the History of Thought log stays canonical.

---

## Audience Tiers

The system serves seven tiers. Six are free. One is paid.

| Tier | Access | Cost |
|---|---|---|
| Primary (K-6) | Full | Free |
| Secondary | Full | Free |
| University (Undergrad) | Full | Free |
| Postgrad / Research | Full | Free |
| Homeschool (parent + child accounts) | Full | Free |
| Educator (individual teacher) | Class-level anonymised insights, no individual learner data | Free |
| Institution (school / university) | Aggregated, de-identified analytics across their cohort | Paid: tens to hundreds of thousands per year |

The free tiers are the product. The paid institutional tier is the revenue. The data the platform holds across all free tiers is the moat.

---

## Data Architecture

Three layers. Each stored differently.

**Layer 1: Learner Work Content.** Essays, drafts, notes, ingested briefs. Stored server-side, encrypted at rest, tied to the learner's account. Only the learner sees their work content. Institutions never see it. Educators never see it. Parents in the Homeschool tier see only the child they are linked to, and only the derived progress, not the writing itself.

**Layer 2: Behavioural Telemetry.** Time-on-task, completion patterns, scaffolding usage, AI reliance percentages, idle and focus signals, Pareto-step engagement, dial states. Stored server-side. Anonymised at the institutional surface. Used to:
- Improve the product
- Train tier-specific scaffolding logic
- Generate the corpus that institutional customers and acquirers pay for
- Power the Authenticity Report (proves the learner did the thinking)

**Layer 3: Account Metadata.** Email, declared tier, declared subjects, declared accessibility needs, declared interests, parent-child linkage in Homeschool tier. Powers tier routing, resource recommendations, and affiliate suggestions. The learner controls every field.

The learner sees their own data through calm progress signals in their dashboard. Full data export is available on request (right to portability).

---

## Tech Stack

- **Frontend:** React 18 + Create React App. Tailwind + custom CSS. Framer Motion for transitions. shadcn/ui (Radix primitives) for accessibility.
- **Auth:** Google OAuth (`@react-oauth/google` already installed). Email-based accounts. Parent-child linkage for Homeschool tier.
- **Backend:** Cloud-hosted (provider TBD: Supabase, Vercel + Postgres, or equivalent). Encrypted-at-rest. WCAG-compliant API.
- **AI:** Hybrid. Local Ollama supported for advanced users who run it. Cloud-hosted LLM (Anthropic / OpenAI / Google) for everyone else. Tier 1 (Pre-Write), Tier 2 (Socratic), and Tier 3 (Assist) all route through the same model contract.
- **Storage:** IndexedDB for local cache and offline-tolerant work. Cloud database as source of truth.
- **Telemetry:** Anonymous event pipeline. Every spine event flows through `EventBus` to both the local `HistoryOfThought` log (for the Authenticity Report) and the cloud telemetry layer (for the corpus).
- **Document I/O:** `pdfjs-dist` for ingestion with OCR fallback. `jspdf` for PDF export. `docx` (or `html-docx-js`) for DOCX export. Both export paths must be present.
- **Markdown for structure. LaTeX for complex maths only.**

---

## Output Standards (Non-Negotiable)

### Ingestion Fidelity
PDF and document extraction must be 100% accurate. The system never hallucinates content from an uploaded brief, rubric, or syllabus. If extraction fails or returns low confidence, the system surfaces this to the learner explicitly ("This section could not be read clearly: please paste it manually") rather than guessing. Extraction uses `pdfjs-dist` with OCR fallback for scanned documents. Every extracted block carries a confidence score and a "View original" link to the source page.

### Submission-Ready Output
Every export must be professional and submission-ready, accepted by any education submission system or LMS the learner uses (including but not limited to Turnitin, Moodle, Canvas, Brightspace, Google Classroom, Blackboard, Schoology, D2L, Seesaw, journal submission portals, and any institutional dashboard). The system is LMS-agnostic and format-agnostic.

Requirements:
- PDF export via `jspdf` with embedded fonts, proper page breaks, hyphenation control
- DOCX export via `docx` library for institutions that require Word format
- Word-document quality typography: Times New Roman, Arial, or Calibri at 11 to 12pt; 1.5 or double line spacing per submission requirement
- Margins, page numbers, headers, and footers all configurable
- Citation styles: APA 7, MLA 9, Harvard, Chicago, IEEE, Vancouver, AGLC (Australian Guide to Legal Citation) : auto-formatted from inline references
- Reference list auto-generated from sources cited in the document
- Optional cover page with learner name, unit code, title, word count, submission date
- Word count visible and accurate (excluding references and footnotes per submission norms)
- Plain text and HTML export paths for LMS rich-text editors that reject uploaded files
- LTI (Learning Tools Interoperability) integration planned for direct LMS submission where supported

If the export does not pass a "would my marker accept this without reformatting?" test, the export is broken.

### Live Preview Pane (Right-Hand Surface)
The Authoring Cockpit renders a live preview pane on the right-hand side, mirroring the editor on the left. The learner writes in the block-based editor, sees the rendered submission-ready document in real time on the right. The preview pane:
- Updates as the learner types (debounced for performance)
- Shows the exact formatting the learner will export
- Can toggle between PDF preview, DOCX preview, plain text, and HTML
- Is collapsible (the learner can hide it for distraction-free writing)
- Is read-only (edits round-trip through the blocks, per the Single Source of Truth rule)

This is core to the learner's confidence: they always see what they are submitting before they submit it. No surprises.

---

## Architecture Layers (Do Not Collapse)

1. **SovereignRouter** (`src/core/SovereignRouter.js`) : tier resolution, theme application, capability hydration based on learner tier (Primary / Secondary / Uni / Postgrad / Homeschool / Educator).
2. **ExecutiveSpine** (`src/core/ExecutiveSpine.js`) : focus sessions, idle detection, section health, Pareto routing, transition management.
3. **HistoryOfThought** (`src/core/HistoryOfThought.js`) : local encrypted log of learner activity. Generates the Authenticity Report. Also emits anonymised event packets to the cloud telemetry layer.
4. **LiteralMode** (`src/core/LiteralMode.js`) : render-time vocab transformer. Translates academic jargon into plainer language on demand. Never invents content; only re-voices schema-anchored output.
5. **EventBus** (`src/core/EventBus.js`) : bridge from spine CustomEvents to both HistoryOfThought (local) and the cloud telemetry pipeline.

Do not introduce a new core module without amending this file.

---

## The Three-Tier Canvas (Implementation Note)

The Authoring Cockpit renders three vertical surfaces side-by-side:

| Tier | Surface | Owner | Visible to Marker |
|---|---|---|---|
| 1 | AI Pre-Write panel | AI generates, learner can accept/edit/discard | Yes (logged) |
| 2 | Socratic Prompt panel | AI asks, learner answers | Yes (logged) |
| 3 | Learner Writing panel | Learner writes, blocks are the canonical state | Yes (the assessed artefact) |

`HistoryOfThought` logs every transition between tiers, every AI contribution, every learner edit. The Authenticity Report renders this log as a timeline showing the path from blank page to final work, with each AI contribution explicitly marked.

This is the integrity engine. It is the single most important architectural commitment in the system.

---

## When Working in This Repo

- Default to editing existing files. New files only when the architecture demands it.
- Run `node scripts/check-style.js <files>` before committing.
- Canonical branch: `sovereign-refactor-handshake`. Sovereign branch convention: `sovereign-<topic>` for ad-hoc commits.
- Side-branch the push when sandbox returns 403; the user merges locally on the Mac.

### Systematic Debugging (Mandatory)

All code fixes follow four-phase root-cause analysis before touching code:
1. Reproduce the failure
2. Isolate the smallest input that triggers it
3. Name the root cause in one sentence
4. Propose the minimal fix

No "just add try/catch" patches. No fixing the symptom while the cause stays. If the root cause cannot be named after a reasonable look, surface that explicitly and ask rather than guessing.

---

## Skill Activation Triggers

Guidance for when to invoke skills under `.claude/skills/`. Descriptive, not enforced.

| Skill | Invoke when |
|---|---|
| `socratic-concept-bridge` | Learner asks a "What is" or "How does" question; idle longer than 3 minutes during an active focus session; Tier 2 panel is active. |
| `burrito-pareto-optimiser` | A new `.pdf` or `.docx` lands under `/src/grounding/`; the reconciler emits a fresh canonical assessment set; the learner asks "what should I work on next?". |
| `lod-compass-scaffolder` | The learner opens the cockpit; switches tasks; flips the LOD dial. |
| `authenticity-vault-manager` | A `text_edit`, `focus_session_start`, `tier_transition`, or `section_health_change` event needs logging; the learner asks for the Authenticity Report. |
| `lms-harvester` | The learner initiates a Moodle / Canvas / Brightspace / Google Classroom / Blackboard harvest; a syllabus URL is pasted into the Add Course flow. |
| `steering-dashboard` | Before composing any AI response. Read the four dials from `SettingsContext` first; if they conflict with the request, surface the conflict instead of overriding silently. |
| `resilience-bridge` | The learner mentions being "behind" or "stressed"; time-to-deadline drops below 1.5x remaining workload; three or more idle nudges fire in a single focus session. Surfaces non-coercive options: reduce scope, request extension scaffolding, switch to lower-load mode. |
| `pre-write-generator` | Tier 1 canvas is active; the learner has not written for 90 seconds after opening a new task; the learner clicks "help me start". |
| `tier-transition-logger` | Every time the learner moves between Tier 1, 2, and 3 panels. Mandatory for the Authenticity Report. |
| `submission-export-builder` | The learner clicks Export; the live preview pane is opened; a submission format is selected. Validates: typography, citation style, word count accuracy, page formatting, embedded fonts, cover page, before producing the file. |
| Systematic Debugging | Before any `git commit`; whenever a `ReferenceError`, `TypeError`, or unhandled promise rejection is observed. |

If a trigger fires and the relevant skill cannot be applied (missing context, ambiguous request), surface the gap to the learner rather than guessing.
