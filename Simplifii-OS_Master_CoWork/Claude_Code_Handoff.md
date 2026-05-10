# Claude Code Handoff — Sovereign.html → Production Build

**Built:** 8 May 2026
**Inputs that exist in this folder:**

- `Sovereign_Architecture_Blueprint.md` — the architecture spec (4 layers, hard rules, what's out of scope)
- `sovereign_schema_update.json` — the additive DB migration + file-system additions
- `BABS1201_Project_Blueprint.md` + `babs1201_assessment_schema.json` — the prior-art rubric-anchoring pattern, reused as the template for all stream feedback
- `design-bundle/` — the Claude Design export. The primary file is `design-bundle/project/simplifii-studio/Sovereign.html`, which loads `handshake.jsx` (~22 KB) and `handshake.css` (~32 KB). Read those two files top-to-bottom; that's where the design lives, not in `Sovereign.html` itself.

---

## What Claude Code is being asked to do

Take a static HTML/JSX prototype that ships three views — Handshake portal, 5-Stream board, Focus Tunnel — and make it real. "Real" means: pixel-faithful to the design, but wired to the architecture in the Blueprint, not to the mock arrays in `handshake.jsx`. The design is the spec for how it looks. The Blueprint is the spec for how it behaves.

**Do not redesign.** The visual language has been validated. Match it.
**Do not copy the prototype's component structure if it doesn't fit production.** The `data-stream` attributes, CSS variables, and animation timings are correct; the React file structure may need to be split.
**Do not let LLM calls invent stream data, rubric data, or weights.** Everything comes from disk (`/streams/{id}/`) or the schema.

---

## Order of operations

### Step 1 — Apply the schema migration

Run `sovereign_schema_update.json` as an additive migration. Verify:
- All existing users default to `stream_id = "tertiary"` (the existing Studio V3 build is the tertiary surface, no UI change for current users).
- Five rows seeded into the `streams` table per the `seed_data` block.
- No destructive changes (drop column, rename, retype).

### Step 2 — Extract the existing build into the `tertiary` stream profile

Create `/streams/tertiary/{profile.json,vocab.json,theme.json,capabilities.json}`. Populate by reading the current Studio V3 codebase. The current app should still work after this step, just routed through `SovereignRouter.hydrate()` with a `tertiary` profile.

### Step 3 — Build the four core modules per Blueprint sections 1–4

Order: `SovereignRouter.ts` → `ExecutiveSpine.ts` → `HistoryOfThought.ts` → `LiteralMode.ts`. Each module's verification test must pass before moving to the next.

### Step 4 — Stand up the Handshake view

The Handshake portal in `handshake.jsx` is currently a 4-phase animation (`idle → scan → map → done`) with hardcoded labels. In production:

- Replace the `setTimeout` auto-advance with real backend phases:
  - Phase 1 (`scan`): file upload → server-side text extraction (PDF, syllabus)
  - Phase 2 (`map`): structure extraction → schema match (e.g. BABS1201 detected → load BABS1201 schema)
  - Phase 3 (`done`): write `users.stream_id`, hydrate SovereignRouter, redirect to default landing
- The four step cards (`01 · Identity`, `02 · Document`, `03 · Mapping`, `04 · Stream`) each gate a real backend call. State driven by the response, not by `setTimeout`.
- The `bps` line ("1.2 GB/s · 47% complete") should reflect real upload progress — keep the line-height styling, replace the static string.

### Step 5 — Stand up the 5-Stream board

The `StreamsBoard` component renders all five skins side-by-side as a *demo* of the visual language. In production:

- The board itself is admin-only or marketing-only (it's not the user-facing route).
- The user-facing route is `/dashboard`, which renders ONE skin based on `getCurrentStream()` from the SovereignRouter.
- Each skin (`PrimaryQuestEngine`, `SecondaryFocusHub`, `TertiaryResearchCockpit`, `TafeSkillLab`, `HomeschoolingSelfPaced`) becomes a separate route module under `/streams/{id}/dashboard.tsx`, each declaring `enabledFor: [<id>]` in its module manifest.
- The hardcoded data (`comps`, `cells`, `months` arrays in the JSX) gets replaced with live queries against the schema.

### Step 6 — Stand up the Focus Tunnel

The `FocusTunnel` component is the cleanest map between design and architecture. Direct wiring:

- `[data-zen="true"]` on `.ft-stage` ↔ `[data-focus-locked="true"]` from the Blueprint. Same CSS rule, same behaviour. Standardise on `data-focus-locked` as the attribute name (it's the architecturally honest one); keep the design's `0.4` opacity (visually validated, supersedes the `0.3` placeholder in the Blueprint).
- The "Zen on / Zen off" toggle becomes the `FocusSession.start()` / `FocusSession.end()` call.
- The `ft-task-title` ("Write the opening sentence…") is a `LiteralMode.literalise()` output. The string must come from a schema-anchored task object, never inferred by an LLM.
- The AURA tip ("Take your time. I'm here if you stall…") is the IdleDetection nudge. After 180s of input silence (configurable per stream), the tip swaps to a one-step instruction relevant to the current sub-task.
- Add a `data-focus-locked="true"` to the `.ft-bg` panels (Sources / Cockpit / AURA columns at 0.4 opacity); leave the `.ft-task-shell` and `.ft-aura-tip` un-locked.

### Step 7 — Verification

Run all 10 BABS1201 verification tests from the BABS1201 Blueprint AND the verification list at the end of the Sovereign Architecture Blueprint. Fix anything that fails before declaring done.

---

## Design ↔ Architecture mapping

| Design element (in `handshake.jsx` / `handshake.css`) | Architecture layer (in Blueprint) | Notes |
|---|---|---|
| `App()` tab nav (Handshake / 5 Streams / Focus Tunnel) | Demo router only — admin/marketing surface, not user-facing route table | In production, only one of these renders at a time per the user's session state |
| `HandshakePortal()` 4-phase scanner | `SovereignRouter.hydrate(session)` | Replace `setTimeout` chain with real backend events |
| `steps[3]` Stream calibration | Writes `users.stream_id` enum | Persisted, immutable mid-session |
| `PrimaryQuestEngine` | `/streams/primary/dashboard.tsx` | Reads `vocab.primary.json` for "G'day, Sam!" / "quests" / "Reading Champion" |
| `SecondaryFocusHub` 14-day streak grid | Derived from `focus_sessions` table aggregations | Each cell = one day's session count |
| `TertiaryResearchCockpit` Foundation/Core/Polish progressive fill | Section progress derived from rubric scores | Width = % toward target word count for that section |
| `TafeSkillLab` competency rows + cells | TAFE-specific schema (deferred — needs rubric upload like BABS1201) | Out of scope for v1; ship a placeholder that reads from a stub schema |
| `HomeschoolingSelfPaced` Year 5 roadmap (Jan–Jun months) | Australian Curriculum mapping (deferred — Phase 3) | Ship visual shell; populate when ACARA data is sourced |
| `qe-buddy-xp` "+ 240 XP today · Streak 4 🔥" | `users.sovereign_credit_balance` + focus_sessions streak | Live count, not hardcoded |
| `fh-bd` Body Double tiles | Phase 3 (deferred per Blueprint) | Ship as static visual placeholder; do NOT wire video/camera in v1 |
| `rc-card` "Citation density 1.4/100 words" | Derived metric from `history_of_thought_events.event_type='citation_added'` | Live calculation |
| `rc-card` "2,418 / 2,500 words · 96.7%" | Derived from `text_edit` events + section target | Live calculation |
| `FocusTunnel` `[data-zen="true"]` | `[data-focus-locked="true"]` from `ExecutiveSpine.FocusSession` | Same mechanism, rename attribute to architecturally honest name |
| `ft-task-title` "One Literal Task" | `LiteralMode.literalise(currentSubtask, stream_id)` | Schema-anchored, transformer re-voiced |
| `ft-aura-tip` AURA coaching message | `ExecutiveSpine.IdleDetection` nudge after 180s silence | Tip text varies per stream via Literal Mode |
| Top bar emerald `S` mark + "Simplifii-OS" eyebrow | Global app shell, stream-agnostic | Lives outside SovereignRouter |
| Bar tabs (Handshake / 5 Streams / Focus Tunnel) | Marketing-site only or admin-only | NOT in the user dashboard |
| Top of stage emerald pulse + eyebrow + h1 | Per-stream landing page header | Each stream's `dashboard.tsx` renders its own version |

---

## Reconciliations (where design and architecture diverge)

| Conflict | Win | Reason |
|---|---|---|
| Design: `data-stream="home"` (Homeschooling); Schema: `stream_id="homeschool"` | Schema (`homeschool`) | Single canonical id across DB, JSON, and CSS selectors |
| Design: `[data-zen="true"]`; Blueprint: `[data-focus-locked="true"]` | Blueprint (`data-focus-locked`) | Naming honesty: "zen" is marketing, "focus-locked" is what the attribute actually does |
| Design: opacity 0.4 in Focus Tunnel; Blueprint: opacity 0.3 | Design (0.4) | Visually validated by Aaron in the Claude Design session; Blueprint number was a placeholder |
| Design: AURA buddy character "Mango" in Primary skin; Blueprint: AURA only | Both — AURA is the global agent name; "Mango" is the Primary stream's avatar persona for AURA | Document in `vocab.primary.json` as `{ "aura_avatar_name": "Mango" }` |
| Design: "Lola Costa · UNSW · z5384921" demo identity | Demo only | Replace with real auth/SSO in production |
| Design: hardcoded `cells`, `comps`, `months` arrays | Hardcoded → live queries | Schema-anchored data only |

---

## Deliberately out of scope for v1

These are in the design but should NOT ship in the first production build, with reasons. If Aaron pushes to include them, refer to the Blueprint section "Out of scope (deliberate, with reasons)".

- **Body Double live video tiles** (`fh-bd-grid`) — privacy + camera permissions complexity; ship as static visual.
- **Australian Curriculum month-by-month roadmap** with real outcome mapping — multi-month ACARA data engineering project; ship visual shell only.
- **TAFE competency rubrics** (BSBPMG540 etc.) — needs rubric upload + ground-truth schema like BABS1201; ship visual shell only.
- **Native app blocking during Focus Tunnel** — covered at length in Blueprint section "Question 2 / Layer 2"; in-app focus only for v1.
- **Auto-cycling Handshake demo** (`setTimeout` chain) — replace with real backend events; do not ship the demo loop.

---

## Paste-ready Claude Code prompt

```
Mission: Implement the Sovereign Onboarding & Stream Experience as production code.

Working directory: the Simplifii Beta build (Emergent project root).

Inputs (all in this folder unless stated):
- Sovereign_Architecture_Blueprint.md
- sovereign_schema_update.json
- BABS1201_Project_Blueprint.md
- babs1201_assessment_schema.json
- design-bundle/project/simplifii-studio/Sovereign.html
- design-bundle/project/simplifii-studio/handshake.jsx (PRIMARY DESIGN SOURCE)
- design-bundle/project/simplifii-studio/handshake.css (PRIMARY VISUAL SOURCE)
- design-bundle/README.md (handoff instructions from the design tool)

Read order:
1. design-bundle/README.md
2. design-bundle/chats/chat1.md (the design intent, full transcript)
3. Sovereign_Architecture_Blueprint.md (the architecture spec)
4. design-bundle/project/simplifii-studio/handshake.jsx and handshake.css (read top to bottom)
5. This file (Claude_Code_Handoff.md) — sections "Order of operations" and "Design ↔ Architecture mapping"

Order of operations:
1. Apply sovereign_schema_update.json migration. Verify additive only.
2. Extract existing build into /streams/tertiary/. Confirm existing Studio V3 still works.
3. Build core modules in order: SovereignRouter, ExecutiveSpine, HistoryOfThought, LiteralMode. Run each module's verification test before moving on.
4. Build Handshake view: replace setTimeout demo with real backend phase events (upload → schema match → stream calibration → router hydrate).
5. Build per-stream dashboards as separate routes under /streams/{id}/dashboard.tsx. Each declares enabledFor in its module manifest.
6. Build Focus Tunnel: rename data-zen to data-focus-locked, wire to FocusSession.start/end, wire ft-task-title to LiteralMode, wire ft-aura-tip to IdleDetection nudge.
7. Run BABS1201 + Sovereign verification suites. All must pass.

Hard constraints:
- Do not redesign. The visual language is locked.
- Do not let LLM calls return stream data, rubric data, weights, or task strings. Those come from disk, not inference.
- Do not build native app blocking, body-double video, or curriculum mapping in v1 — see "Deliberately out of scope" in this file.
- Existing tertiary users must keep working unchanged after Step 2.
- Do not invent new tables outside the schema without an explicit Blueprint amendment.

Reconciliations to apply (design → production):
- data-stream="home"  →  stream_id="homeschool"
- [data-zen="true"]   →  [data-focus-locked="true"]
- opacity 0.3 (placeholder in Blueprint) → opacity 0.4 (validated in design)
- AURA + "Mango" persona for primary stream → both kept; "Mango" goes in vocab.primary.json as aura_avatar_name
- All hardcoded arrays in handshake.jsx → live schema queries

Verification before declaring done:
- Existing Studio V3 user logs in, sees no change. stream_id resolves to "tertiary".
- New user uploads BABS1201 syllabus during Handshake; lands on Tertiary dashboard with Lit Review at 25% (Master Pillar test from BABS1201 Blueprint).
- Focus Tunnel toggle locks in-app navigation only. No code path attempts to block external apps.
- Idle 180s during a Focus Session → AURA nudge fires with literal one-step instruction (not LLM-invented).
- text_edit event written to encrypted IndexedDB on every keystroke (debounced 5s).
- au_karen_lint and literal_mode_lint both pass on all rendered feedback strings.
```

---

*End of handoff. Three documents (Blueprint + Schema + this) plus the design bundle are everything Claude Code needs.*
