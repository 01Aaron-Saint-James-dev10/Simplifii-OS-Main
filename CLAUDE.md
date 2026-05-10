# Sovereign OS Project Guidelines

## The Sovereign Constitution

1. **Never Give, Always Tease.** Do not complete tasks for the student. Scaffold them, then use the `socratic-concept-bridge` skill to verify mastery before moving on.
2. **Burrito First.** Strictly enforce Pareto prioritisation. If the user grinds on formatting or low-yield polish, nudge them back to the Meat (the high-mark-density task).
3. **Universal Architecture.** Treat this system as a universal academic OS. Do not reference specific university course codes (BABS1201, MRes, UNSW, Western Sydney) inside engineering specs, prompts, or feature flags. Course-specific data lives in the schema and on disk, not in the architecture.
4. **LOD Enforcement.** Default to Compass Mode. Reduce visual and cognitive noise by limiting the visible task set to the immediate 20-minute sprint.
5. **Sovereign by Design.** No data leaves the device unless the student explicitly opts in. Local-first, encrypted at rest, no telemetry, no auth required.

## Tech Stack Rules

- **Stack.** React 18 + Create React App (no TypeScript). Tailwind + custom CSS. Local Ollama (`http://localhost:11434/api/chat`) with `llama3.2` default. IndexedDB for vault storage. Web Crypto AES-GCM-256 + PBKDF2 600k.
- **Formatting.** Use Markdown for structure. Use LaTeX only for complex maths.
- **Style.** Human, ADHD-friendly tone. Australian English only. Zero em-dashes (the pre-commit hook in `scripts/check-style.js` will block them).
- **Safety.** Every spine event must funnel through `EventBus` so it lands in the History of Thought vault when unlocked. Vault-locked sessions soft-drop, never throw.

## Architecture Layers (do not collapse)

1. **SovereignRouter** (`src/core/SovereignRouter.js`) — stream resolution, theme application, capability hydration.
2. **ExecutiveSpine** (`src/core/ExecutiveSpine.js`) — focus sessions, idle detection, section health, PlayTime, Sovereign Credits. Per-stream tunables via `configureSpine()`.
3. **HistoryOfThought** (`src/core/HistoryOfThought.js`) — encrypted IndexedDB log, Authenticity Report generator. AES-GCM only.
4. **LiteralMode** (`src/core/LiteralMode.js`) — render-time vocab transformer. Never invents content; only re-voices schema-anchored output.
5. **EventBus** (`src/core/EventBus.js`) — bridge from spine CustomEvents to HistoryOfThought.

Do not introduce a new core module without amending this file.

## When working in this repo

- Default to editing existing files. New files only when the architecture demands it.
- Run `node scripts/check-style.js <files>` before committing. The pre-commit hook blocks em-dashes and US spellings.
- Side-branch the push when `fix/cockpit-restoration` returns a sandbox 403; the user merges locally on the Mac.
- Sovereign branch convention: `sovereign-<topic>` for ad-hoc commits.

## Steering and Transparency

The student is the driver. The AI is the GPS. Everything Claude generates must be steerable and explainable from the cockpit, not buried in code.

1. **Why on every step.** Every micro-step, scaffold, or generated suggestion must carry a one-line rationale tied to a rubric criterion or schema field. The Pedagogical Why toggle on `SimplifiiStudio.js` is the canonical surface; new generators must populate the same `why` field.
2. **Selective harvesting.** When pulling material from an LMS or video lecture, prioritise transcripts (`.vtt` / `.srt`) and structured text over raw video or full HTML scrapes. Surface clean Markdown to the student; never raw scrape data.
3. **Steerable persona.** The student controls four dials via the Steering Drawer: Persona (Literal vs Academic), Scaffolding (Heavy vs Light), Grit (Hard Socratic vs Literal Assistant), and LOD (Compass / Sprint / Map). All four are persisted to localStorage; new AI prompts must read these before composing output.
4. **Hide the gut.** Do not surface raw probability scores, parser internals, or "Thinking..." latency logs. Use calm, schema-anchored progress signals (Section Health dots, Shadow State pill, Authenticity Pulse).
5. **Single source of truth.** The Logic Blocks (left canvas / cockpit) own the document state. The Preview Pane is view-only; edits must always round-trip through the blocks so the History of Thought log stays canonical.
6. **Systematic Debugging.** All code fixes follow a four-phase root-cause analysis before touching code: (1) reproduce the failure, (2) isolate the smallest input that triggers it, (3) name the root cause in one sentence, (4) propose the minimal fix. No "just add try/catch" patches; no fixing the symptom while the cause stays. If the root cause cannot be named after a reasonable look, surface that explicitly and ask, rather than guessing.

