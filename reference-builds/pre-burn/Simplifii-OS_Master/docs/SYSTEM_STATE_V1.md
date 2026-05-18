# Simplifii-OS: Sovereign System State v1.0

**Session:** Stages 01-04 complete.
**Date locked:** 2026-05-12
**Purpose:** Permanent memory for AI continuation. Load this at the start of every
new session before touching any code.

---

## 1. What Has Been Built

Simplifii-OS is a neuroinclusive academic operating system. The core thesis: the
education system was designed for a narrow range of learners and everyone else is
left to sink. The platform exists to eliminate that gap. It is not a study app. It
is a scaffold for the parts of academic life that are invisible to people who already
fit.

The system is architecturally sovereign: all student data is processed locally,
encrypted at rest, and de-identified before any cloud transmission. No institution
can see an individual student. The platform knows everything. Institutions see only
statistics.

---

## 2. File Registry (Everything Built in Stages 01-04)

### Core Layer

| File | Lines | Purpose |
|---|---|---|
| `src/core/HistoryOfThought.js` | 408 | AES-GCM-256 encrypted event log. `appendEvent`, `listEvents`, `generateAuthenticityReport`. `unlockWithUserId(googleSub)` seeds key from Google OAuth. |
| `src/core/Personas.js` | 420 | 21-persona registry. `selectPersona`, `getStagnationOverride`, `getNudge`. Auto-selects by CFS + baseline + tags. |
| `src/core/SovereignRouter.js` | existing | Tier routing: Primary / Secondary / University / Postgrad / TAFE / Homeschool / Educator. |
| `src/core/ExecutiveSpine.js` | existing | Focus sessions, idle detection, section health, Pareto routing. |
| `src/core/grounding/UDL_3_0_SPEC.md` | spec | CAST UDL 3.0 (2024) + AHEAD Ireland compliance specification. Authoritative reference for the audit engine. |

### Services Layer

| File | Lines | Purpose |
|---|---|---|
| `src/services/AuraTagWriter.js` | 209 | `computeCognitiveFrictionScore` (0-100, async, reads HistoryOfThought). `computeAuraTags` (sync, returns string[]). |
| `src/services/CognitiveTelemetry.js` | 238 | Shadow Profiler. Passive browser-side monitoring: click latency, time-to-first-action, scroll velocity, idle gaps. `useCognitiveTelemetry` React hook. Zero API cost. |
| `src/services/DocumentAIService.js` | 486 | PDF extraction (GCP Document AI > pdfjs-dist fallback). `convertToSovereignFormat(rawText, ctx)` outputs valid `.sm` document. Now calls `auditCurriculum` internally and embeds `udl_audit` block in YAML front matter. |
| `src/services/UDLAuditService.js` | 372 | `auditCurriculum(text)` scans against 19-barrier registry. Returns `{ barriers, criticalCount, highCount, udl3Score, aheadCompliant, systemicExclusions, teacherNotes }`. Social-model language: barriers are curriculum failures, not student deficits. |

### Frontend Layer

| File | Lines | Purpose |
|---|---|---|
| `src/frontend/LandingPage.js` | 176 | Google OAuth gate. Renders `NeuroProfiler` after auth. Calls `unlockWithUserId` + `enableCloudSync` on completion. |
| `src/frontend/NeuroProfiler.js` | 517 | 4-5 step onboarding wizard (5 steps for Homeschool branch). Collects: cognitive preference, emotional baseline, level, homeschool platform, institution. Sovereign Guarantee panel + 3-clause granular consent. |
| `src/frontend/ProjectContext.js` | existing | Central state. Extended `DEFAULT_PROFILE` with neuro fields + AURA fields. `useCognitiveTelemetry` hook wired in `MasterDashboard`; merges passive CFS into profile. |
| `src/frontend/MasterDashboard.js` | 667 | Main shell. Imports `useCognitiveTelemetry`. Passive telemetry runs from first session second. |
| `src/frontend/AuraHUD.js` | 481 | Floating draggable HUD (native pointer events, zero dependencies). Reads `toolIntentTags`. Shows persona nudge, affiliate scaffold cards, Homeschool Import button. Runs `auditCurriculum` on import and displays UDL score. Auto-proposes Zen Monk / Anchor on CFS > 75. |

### Docs

| File | Purpose |
|---|---|
| `docs/SovereignFormat.md` | Full `.sm` spec v1.0: front matter schema, three-tier structure, parser behaviour, conversion rules. |
| `docs/SYSTEM_STATE_V1.md` | This file. |

---

## 3. The .sm (Simplifii-Markdown) Format

### What it is

A plain-text document standard for neuro-inclusive coursework. A superset of CommonMark
with three additions: YAML front matter, Tier annotations, and UDL instruction blocks.

Any Markdown renderer shows readable content. The Simplifii-OS parser unlocks the
adaptive layer.

### Front matter shape (key fields)

```yaml
---
sm_version: "1.0"
title: "Newton's Laws"
level: "secondary"
source_platform: "euka"
friction_coefficient: 0.62
udl_audit:
  barrier_count: 5
  critical_count: 2
  udl3_score: 58
  ahead_compliant: false
  teacher_notes:
    - "CHECKPOINT 8.1 (CRITICAL): Single expression format..."
learning_objectives:
  - "Describe Newton's three laws in plain language"
---
```

### Three-tier structure

```
# Tier 1: Summary        (AI scaffold: overview, key concepts, step breakdown)
# Tier 2: Socratic Layer (AHEAD PDMR: Plan, content questions, Belonging cue, Joy prompt, Monitor, Reflect)
# Tier 3: Your Writing   (Learner work: Interaction Sandbox + Notes)
```

### Strategic value

- **Friction coefficient** per file is the raw signal for the institutional curriculum
  heatmap (the Global Learning Index commercial product).
- **UDL audit block** embedded in every file. Academics see their score and the exact
  barriers, with drop-in remediation text.
- **Conversion is lossless:** every sentence from the source traces to the `.sm` output.
  Nothing is invented; AI-generated additions are explicitly marked.

---

## 4. The UDL 3.0 Audit Engine

### Authority

CAST Universal Design for Learning Guidelines 3.0 (2024) + AHEAD Ireland UDL
Curriculum Design Framework (2022).

### How to call it

```js
import { auditCurriculum } from '../services/UDLAuditService';

const result = auditCurriculum(rawText);
// result.udl3Score        0-100 (100 = zero barriers)
// result.criticalCount    barriers at CRITICAL severity
// result.aheadCompliant   bool (true only if criticalCount === 0 and highCount === 0)
// result.teacherNotes     string[] for YAML injection
// result.systemicExclusions string[] for HUD display
```

### Barrier registry summary (19 barriers)

| ID | Principle | Severity | What it detects |
|---|---|---|---|
| `fixed_time` | action_expression | CRITICAL | Fixed-time constraints without accommodation note |
| `single_expression` | action_expression | CRITICAL | Essay-only mandate with no alternative |
| `no_success_criteria` | action_expression | CRITICAL | No rubric, no "what good looks like" |
| `competitive_framing` | engagement | CRITICAL | "Top students", "outperform", peer ranking |
| `deficit_framing` | engagement | CRITICAL | "Students who struggle", "weak students" |
| `assumed_knowledge` | representation | HIGH | "As you know", "obviously", "of course" |
| `no_objectives` | engagement | HIGH | No learning objectives detected |
| `undefined_jargon` | representation | HIGH | Jargon density > 8 terms per 500 words |
| `wall_of_text` | representation | HIGH | Structure density < 2% headings + bullets |
| `no_step_breakdown` | action_expression | HIGH | No numbered steps in task instructions |
| `no_monitor_prompt` | action_expression | HIGH | No mid-task self-check prompt |
| `no_plan_prompt` | action_expression | HIGH | No "before you begin" planning prompt |
| `sensory_specific` | representation | HIGH | "Look at the diagram" without text alternative |
| `no_choice` | engagement | HIGH | No dimension of learner choice offered |
| `no_self_regulation` | engagement | MEDIUM | No self-assessment or confidence rating |
| `no_transfer_prompt` | representation | MEDIUM | No real-world application prompt |
| `no_joy_play` | engagement | MEDIUM | No exploratory language (3.0 Joy/Play principle) |
| `no_belonging_cue` | engagement | MEDIUM | No identity or community connection prompt |
| `text_only` | representation | MEDIUM | No visual, audio, or diagram reference |

### AHEAD Ireland PDMR scaffold (embedded in every `.sm` Tier 2)

Every lesson now includes, in order:
1. **Plan:** "Before you begin, list the steps you intend to take."
2. Content-specific Socratic questions (derived from learning objectives)
3. **Belonging cue:** "How does this connect to your own experience or community?"
4. **Joy prompt:** "Without worrying about being right yet: what surprises you?"
5. **Monitor:** "Pause at the halfway point. Are you on track?"
6. **Reflect:** "Rate your confidence (1-5). What would you do differently next time?"

This maps to CAST Checkpoints 9.1, 9.2, 9.4, and the 3.0 Belonging/Joy principles.
No other commercial EdTech platform implements PDMR at the document transformation layer.

---

## 5. The 21-Persona Registry

### How to call it

```js
import { selectPersona, getNudge, getPersonaById } from '../core/Personas';

const persona = selectPersona({
  emotionalBaseline,    // 'overwhelmed' | 'on_top' | 'starting' | 'burned_out'
  cognitiveFrictionScore, // 0-100
  toolIntentTags,       // string[] from computeAuraTags()
  preferredMode,        // 'visual' | 'literal' | 'deep_focus' | 'standard'
  level,                // 'university' | 'tafe' | 'secondary' | 'homeschool' | 'postgrad'
  lastEditMs,           // Date.now() of last text_edit event (stagnation override)
});

const nudge = getNudge(persona, nudgeIndex);
```

### Priority

1. Stagnation override (10+ min no text_edit, or scaffolder_trigger without burnout_risk) → Hype-Man
2. Tag matches (lit_review_active → Librarian; homeschool_mode → Navigator / Minimalist)
3. CFS bracket + baseline scoring
4. preferredMode / level tie-breaker
5. Fallback: Coach

### Persona list

| ID | Name | Baseline | CFS | Key tags |
|---|---|---|---|---|
| `hype_man` | The Hype-Man | starting | 0-50 | stagnation override |
| `zen_monk` | The Zen Monk | overwhelmed | 51-100 | burnout_risk |
| `strict_professor` | The Strict Professor | on_top | 0-40 | deep_focus mode |
| `coach` | The Coach | any | 30-65 | high_friction |
| `librarian` | The Librarian | any | any | lit_review_active |
| `cheerleader` | The Cheerleader | burned_out | 0-75 | burnout_risk |
| `sprinter` | The Sprinter | starting/on_top | 0-35 | standard mode |
| `planner` | The Planner | any | 0-60 | scaffolder_trigger |
| `philosopher` | The Philosopher | on_top/starting | 0-45 | deep_focus |
| `minimalist` | The Minimalist | overwhelmed | any | homeschool_mode |
| `explorer` | The Explorer | any | 0-60 | visual mode |
| `drill_sergeant` | The Drill Sergeant | on_top | 0-30 | literal mode |
| `therapist` | The Therapist | burned_out | 60-100 | burnout_risk + scaffolder |
| `scientist` | The Scientist | any | 0-50 | literal mode |
| `artist` | The Artist | starting/on_top | 0-55 | visual mode |
| `navigator` | The Navigator | any | 0-70 | homeschool_mode |
| `mentor` | The Mentor | any | any | secondary level |
| `strategist` | The Strategist | any | 0-55 | tafe level |
| `night_owl` | The Night Owl | burned_out/overwhelmed | 40-80 | late session |
| `anchor` | The Anchor | overwhelmed/burned_out | 76-100 | CFS crisis |
| `shadow_observer` | The Observer | any | 0-0 | explicit activation only |

### visualProfile (for AURA dot animation)

Each persona has `{ dotColour, pulseSpeed, hudTint }`. `pulseSpeed` is `fast`, `medium`,
`slow`, or `still`. CSS animations injected once by AuraHUD on mount.

---

## 6. The Shadow Profiler (CognitiveTelemetry)

### What it is

A passive browser-side monitor that builds a cognitive friction profile without asking
the student anything. Runs on the student's own CPU. Zero API cost.

### How to use it

```js
import { useCognitiveTelemetry } from '../services/CognitiveTelemetry';

// In MasterDashboard (already wired):
const { passiveFrictionEstimate, shadowTags, isProfileReady } = useCognitiveTelemetry();
```

When `isProfileReady` becomes true (10 min elapsed or first friction event >= 50),
MasterDashboard merges `passiveFrictionEstimate` into `profile.cognitiveFrictionScore`
and appends `shadowTags` to `profile.toolIntentTags`.

### What it tracks

| Signal | How | Output weight |
|---|---|---|
| `time_to_first_action` | ms from mount to first click/keystroke | 0-40 pts of CFS |
| `click_latency` | rolling avg inter-click interval (ms) | 0-30 pts |
| `idle_gaps` | gaps > 30 s with no interaction | 0-20 pts |
| `scroll_velocity` | near-zero scroll during active session | 0-10 pts |

Threshold: `click_latency > 4 s avg AND time_to_first_action > 5 min` → CFS >= 70,
`shadowTags` = `['burnout_risk', 'scaffolder_trigger', 'micro_task_only']`.

---

## 7. The AURA Intelligence Layer

### CFS Algorithm (HistoryOfThought events)

Four components, 0-100 total:

| Component | Signal | Weight |
|---|---|---|
| 1 | `nudge_triggered` density in last 60 min | 0-40 |
| 2 | `focus_session_start` to first `text_edit` latency | 0-30 |
| 3 | Emotional baseline modifier | 0-20 |
| 4 | Open session + no `text_edit` in last 30 min | 0-10 |

### AURA Tag Registry

| Tag | Trigger | Consumer |
|---|---|---|
| `burnout_risk` | CFS >= 76 OR baseline burned_out/overwhelmed | Persona selector, HUD dot colour |
| `micro_task_only` | CFS >= 76 | Pareto roadmap: suppress full list |
| `scaffolder_trigger` | CFS >= 51 | Scaffolder overlay |
| `high_friction` | CFS 51-75 | Persona selector |
| `lit_review_active` | Task label matches lit review / essay / report | Librarian persona, citation panel |
| `citation_needed` | Same as above | Zotero upsell card |
| `zotero_upsell` | citation_needed + no Zotero linked | Affiliate card in HUD |
| `gamma_upsell` | burnout_risk OR visual mode + no Gamma linked | Affiliate card in HUD |
| `homeschool_mode` | profile.level === 'Homeschool' | UDL transform, Navigator persona |
| `platform_migration` | homeschoolPlatform in KNOWN_PLATFORMS | Ingestion hook: migration templates |
| `udl_transform` | homeschool_mode | Strips default platform mascots, activates UDL layout |
| `homeschool_transform` | Import button clicked | Triggers `.sm` conversion pipeline |

---

## 8. Profile Schema

```js
const DEFAULT_PROFILE = {
  // Core identity
  name: '', deadline: 'Friday', courseName: '',
  level: 'university',      // 'university' | 'tafe' | 'secondary' | 'homeschool' | 'postgrad' | 'primary'
  processingStyles: [],

  // NeuroProfiler (set on first launch)
  preferredMode: null,      // 'literal' | 'visual' | 'deep_focus'
  emotionalBaseline: null,  // 'overwhelmed' | 'on_top' | 'starting' | 'burned_out'
  institution: '',
  homeschoolPlatform: null, // 'euka' | 'khan_academy' | 'distance_ed' | 'other'
  referencingStyle: 'Harvard',
  integrations: { zotero: false, mendeley: false },

  // Consents (APP 5 three-clause structure)
  consents: {
    dataSharing: false,          // Required: real-time personalisation
    commercialResearch: false,   // Optional: Global Learning Index + institutional licensing
    affiliateOptimisation: false // Optional: Gamma.ai / Zotero affiliate suggestions
  },

  // AURA runtime fields
  institutionId: null,
  cognitiveFrictionScore: null, // 0-100; merged from CognitiveTelemetry + AuraTagWriter
  toolIntentTags: [],           // string[] from computeAuraTags() + shadowTags
};
```

---

## 9. Revenue Architecture

### Free tier (all students)

The platform is free for every learner. This is non-negotiable. The free tier is the
product. The data it generates across millions of sessions is the moat.

### Commercial tier (institutions)

| Product | What it is | Price signal |
|---|---|---|
| Global Learning Index | Anonymised curriculum friction coefficients per module, subject, institution. Ranked heatmap. | Tens to hundreds of thousands AUD/year per institution |
| Curriculum Audit API | `auditCurriculum()` exposed as a white-label API for LMS providers | Per-call or per-seat licensing |
| Predictive Attrition Model | "Module 4 of LAW101 has 0.85 friction. 12% of students will drop in 14 days." | Premium tier |

### Affiliate layer (student-facing)

| Product | Trigger tag | Model |
|---|---|---|
| Gamma.ai | `gamma_upsell` | Referral fee on signup (register at gamma.app) |
| Zotero | `zotero_upsell` | Brand partnership / direct link |

### Legal architecture (2026 AU Privacy Code)

- Data de-identified in the browser before any transmission
- Three-clause APP 5 consent names every secondary use at collection
- `commercialResearch` consent explicitly covers Global Learning Index licensing
- `affiliateOptimisation` consent explicitly covers HUD tool suggestions
- Full data export and consent withdrawal available in Settings

---

## 10. What is Missing / Next Sprint

### Immediate

| Item | File to create/modify | Priority |
|---|---|---|
| `SmViewer` component | `src/frontend/SmViewer.js` | NEXT |
| Wire `simplifii_last_raw_text` into ingestion hook | `src/frontend/hooks/useIngestion.js` | HIGH |
| Character names for personas (Jax, Silas, Bea) | `src/core/Personas.js` | PENDING user input |
| Gamma.ai affiliate URL | `src/frontend/AuraHUD.js` line ~364 | Pending user registration |

### SmViewer spec (for next session)

The `SmViewer` component renders a `.sm` file in the Three-Tier Canvas layout:
- Tier 1: read-only scaffold panel (left or top)
- Tier 2: interactive Socratic prompt panel (PDMR sequence, one prompt at a time)
- Tier 3: live editable Interaction Sandbox (the assessed artefact)
- UDL score badge in the header: "UDL Score: 58/100 (original) → 100/100 (Sovereign)"
- Export to PDF / DOCX from Tier 3

Props: `smContent: string`, `onEdit: (content) => void`, `readOnly?: boolean`

### MasterDashboard refactor (deferred)

MasterDashboard is at 667 lines. To reach 300 lines requires extracting the remaining
state + effects + handlers into custom hooks. Deferred until SmViewer lands.

### Supabase hardening (deferred)

`HistoryOfThought.js` has a hardcoded Supabase URL at line 219 and 329. Move to
`process.env.REACT_APP_SUPABASE_URL` exclusively. Currently functional but fragile.

---

## 11. How to Resume This Session

Load this file at the start of the next conversation. Paste the following as the
first message:

```
Load docs/SYSTEM_STATE_V1.md as permanent context.
We are building the SmViewer component (see section 10).
The .sm format spec is in docs/SovereignFormat.md.
The UDL audit engine is in src/services/UDLAuditService.js.
Start with a plan for SmViewer.js before writing any code.
```

---

## 12. Commit History (Stages 01-04)

| Commit | What landed |
|---|---|
| `b895b1e7` | Step 3: MasterDashboard refactor (DashboardNav, SemesterSidebar, CognitiveArchive extracted) |
| `0d9aa158` | Stage 01: LandingPage Google OAuth + HistoryOfThought.unlockWithUserId |
| `91e2fbde` | NeuroProfiler v1 (4-step wizard) |
| `860501e7` | NeuroProfiler v2 (emotional baseline step + homeschool branch) |
| `17cae22d` | AURA Intelligence: AuraTagWriter + ProjectContext hydration + homeschool tags |
| Stage 02 | Personas.js (21 personas) + CognitiveTelemetry.js + AuraHUD.js |
| Stage 03 | SovereignFormat.md + convertToSovereignFormat + AuraHUD upgrade state |
| Stage 04 | UDL_3_0_SPEC.md + UDLAuditService.js + DocumentAIService audit injection + PDMR scaffold |
