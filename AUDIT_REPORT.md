# Sovereign OS - System-Wide Drift Audit

**Generated:** automated scan, no fixes applied per directive.
**Branch:** `sovereign-refactor-handshake` at HEAD `0a75188`.
**Spec read:** `SIMPLIFII_ARCHITECTURE.md` v1.0.0 (Target Specification - Pending Implementation).
**Method:** filesystem scan + grep + Python text walker over `src/**`.

---

## 1. Stage-by-Stage: spec vs reality

| Stage | Spec path | Actual handler | Spec claims | Reality |
|---|---|---|---|---|
| **01 Sovereign Handshake** | `src/frontend/LandingPage.js` | `src/frontend/LandingPage.js` | Center-aligned, high-contrast light theme. Zinc-50 background with zinc-900 text. JetBrains Mono on the passphrase field and the Zero-Disclosure banner only. 4-character passphrase decrypts the HistoryOfThought AES-GCM-256 vault. Siltbrand Pulse 1px emerald-500 perimeter on focus. UDL Toggle. Pinned Zero-Disclosure footer. | **In Progress, doc table says Pending.** Component is the framer-motion-driven Stage 01 implementation: `bg-zinc-50 text-zinc-900` (matches), JetBrains Mono on passphrase (matches), 4-char gate via `unlockWithPassphrase` (matches), Siltbrand Pulse via `motion.div` `[opacity: 0, 0.5, 0]` repeating animation (matches), UDL toggle in upper right (matches), Zero-Disclosure pinned footer (matches). Status table is stale. |
| **02 Ingestion Drive** | `src/frontend/UniversalOnboarding.js` + `src/frontend/MasterDashboard.js` | Same paths. | Gravity Well: centered minimalist dropzone. Dynamic terminal feedback. Automated Unit Code Detection to create distinct Course Pillars. Academic Tier Detection in `BriefService.js`. | **Partially shipped.** The `Grounding` component (starts line 213 of UniversalOnboarding.js) IS the Gravity Well: light theme `#fafafa`, drag-and-drop, Siltbrand pulse on drag-over. `BriefService.detectAcademicTier` exists and returns Lab / Research / Practical / General. BUT the **four other onboarding components in the same file** (`StartIgnition` line 7, `IdentityGate` line 44, `TemporalBaseline` line 83, `CourseDefinition` line 113) remain on the legacy dark wrapper `bg-[#07080D] text-white` with nested `bg-zinc-900/50` cards. The student enters dark, then sees the light Gravity Well, then re-enters dark when MasterDashboard mounts. |
| **03 Pillar Gallery** | `src/frontend/MasterDashboard.js` (PillarGallery & CoursePillar components) | Same path. | High-contrast grid, max 6 items. Hover scales by 1.02. JetBrains Mono unit code, Inter course name. Biomorphic tier icons (Beaker/BookOpen/Layout). Zen Empty State. | **Code exists, theme drift.** `CoursePillar` defined at MasterDashboard line 51, `PillarGallery` at line 118. Mounted at line 878. The spec calls for the same Calm Dashboard light theme but the shell wrapping these components at MasterDashboard line 968 reads `bg-black text-zinc-200` so the pillars render on a dark background, contradicting the doc's light-theme primary. |
| **04 Authoring Cockpit** | `src/frontend/MasterDashboard.js` (AuthoringCockpit component) | Same path. | Center column only, left sidebar auto-collapses. Header has course name, task title, Weight Badge (e.g., 25%). Flat un-nested list of 5 Pareto Steps with emerald-circle active state. Primary "launch Canvas" button. | **Code exists.** `AuthoringCockpit` at MasterDashboard line 161, mounted line 893. Carries the named pieces. Same parent shell dark-theme drift as Stage 03. The 5 Pareto Steps are sourced from `paretoSteps` in extractionData, derived inside BriefService. |
| **05 AURA Layer** | `src/frontend/AuraLayer.js` | `src/frontend/AuraLayer.js` AND `src/frontend/AskAura.js` (legacy) | Minimalist overlay zinc-50 slides up from bottom. Neural Dot (Idle/Listening/Processing). Dispatch Bar. Citation Pills. | **Shipped, duplicated.** `AuraLayer.js` (217 LOC) ships the new design. BUT `AskAura.js` ALSO ships, AND both are imported in MasterDashboard (lines 9-10) AND both mount conditionally (lines 1213-1214). Student can see either depending on `showAuraLayer` state. **Two AURA surfaces coexist.** Doc table says Pending; reality is Shipped-with-duplicate. |

**Spec table accuracy:** `SIMPLIFII_ARCHITECTURE.md` section 6 currently claims:
```
01 Pending | 02 Shipped | 03 Pending | 04 Pending | 05 Pending
```
Reality after scan:
```
01 Shipped | 02 Partially Shipped (Grounding only) | 03 Shipped-with-theme-drift | 04 Shipped-with-theme-drift | 05 Shipped-but-duplicated
```

**The status table is the most out-of-date piece of the spec.**

---

## 2. Dark theme drift (spec says zinc-50 primary)

`src/frontend/MasterDashboard.js` shell at **line 968**:
```
<div className={`h-screen w-full bg-black text-zinc-200 flex flex-col font-sans ...`}>
```
The entire cockpit shell is dark. Every Stage 03/04 surface renders inside this dark wrapper, so the Pillar Gallery and Authoring Cockpit inherit a dark background despite Stage 01 + Stage 02 being light.

Per-file dark-theme occurrence count (`bg-zinc-950 | bg-zinc-900 | bg-black | bg-[#0xxxxxx] | text-white`):

| Count | File |
|---|---|
| 32 | `src/frontend/MasterDashboard.js` |
| 29 | `src/frontend/LinearCanvas.js` |
| 20 | `src/frontend/AccessibilityVault.js` |
| 16 | `src/frontend/UniversalOnboarding.js` |
| 10 | `src/frontend/MathsStepEditor.js` |
| 8  | `src/frontend/SmartIntake.js` |
| 7  | `src/frontend/SupportBridge.js` |
| 6  | `src/frontend/ZenTools.js` |
| 6  | `src/frontend/DevInsightsPanel.js` |
| 6  | `src/frontend/AskAura.js` |
| 5  | `src/frontend/EssayScorer.js` |
| 5  | `src/frontend/ConfirmDialog.js` |
| 4  | `src/frontend/Humaniser.js` |
| 4  | `src/frontend/GraphView.js` |
| 4  | `src/frontend/AIAvatar.js` |
| 3  | `src/frontend/ResourceIngestor.js` |
| 2  | `src/frontend/CourseTrack.js` |
| 2  | `src/frontend/AuraLayer.js` |
| 1  | `src/frontend/TaskCard.js` |
| 1  | `src/frontend/LandingPage.js` |
| 1  | `src/frontend/FloatingResourceCard.js` |

**Total: 172 dark-theme occurrences across 21 frontend files.**

Concrete drift sites worth flagging individually:

- `src/index.css:8-9` - root CSS sets `background-color: #07080D; color: white;` for the entire app. Page-level dark before any component renders.
- `src/App.js:17` - error boundary fallback uses `background: '#07080D'` so even crash recovery is dark.
- `src/frontend/UniversalOnboarding.js:10` - `StartIgnition` uses `bg-[#07080D] text-white`.
- `src/frontend/UniversalOnboarding.js:47, 86, 116` - `IdentityGate`, `TemporalBaseline`, `CourseDefinition` all use the same dark wrapper.
- `src/frontend/MasterDashboard.js:968` - the cockpit root.
- `src/frontend/AuraLayer.js:line containing 'bg-black'` - the Stage 05 spec says the overlay should be zinc-50 but AuraLayer contains 2 dark-theme references.

---

## 3. Em dashes in UI text

Scan of `src/**` for U+2014 (em) and U+2013 (en) dashes:

**`/src` result: 0 occurrences.** The pre-commit hook in `scripts/check-style.js` has held.

**Repo-root docs:** 5 em-dashes detected in `CLAUDE.md` lines 20-24:
```
CLAUDE.md:20: 1. **SovereignRouter** (`src/core/SovereignRouter.js`) — stream resolution...
CLAUDE.md:21: 2. **ExecutiveSpine** (`src/core/ExecutiveSpine.js`) — focus sessions...
CLAUDE.md:22: 3. **HistoryOfThought** (`src/core/HistoryOfThought.js`) — encrypted IndexedDB log...
CLAUDE.md:23: 4. **LiteralMode** (`src/core/LiteralMode.js`) — render-time vocab transformer...
CLAUDE.md:24: 5. **EventBus** (`src/core/EventBus.js`) — bridge from spine CustomEvents to HistoryOfThought.
```

**The constitution document itself violates rule 2 of the Sovereign Constraints it defines.** This is the highest-irony finding in the audit. Other markdown files (`SIMPLIFII_ARCHITECTURE.md`) are clean.

---

## 4. US spellings visible to the user

Tight filter excluding CSS property names (`color:`, `border-color:`, `transition-colors` Tailwind class) and HTTP header identifiers (`Authorization`):

**5 verbal violations in actual user-visible UI text:**

| File:line | Token | Context |
|---|---|---|
| `src/services/BriefService.js:9` | `analyzing` | Placeholder: *"What specific reaction or organism are you analyzing?"* (rendered in the Stage 04 cockpit Pareto step list) |
| `src/services/PersonaEngine.js:8` | `optimize` | AURA greeting: *"Systems online, {{name}}. Let's optimize this."* |
| `src/services/PersonaEngine.js:61` | `prioritize` | AURA narrative: *"I've adjusted your 'Friction Map' to prioritize high-impact drafting today."* |
| `src/frontend/UniversalOnboarding.js:18` | `initialize` | `StartIgnition` copy: *"Connect your digital brain to initialize the Neural-Docs linear editor."* |
| `src/frontend/ResourceIngestor.js:32` | `recognized` | Error message: *"Rejected: URL does not appear to be from a recognized primary research publisher..."* |

**Borderline (not user-visible but worth noting):**

- `src/frontend/BionicText.js:6` - the `analyze`, `synthesize` tokens are in an academic-vocab match list for bionic emphasis. Both AU and US spellings appear in scientific literature, so the list arguably needs both. Decision pending.
- `src/services/BriefService.js:373` - the string `'Critical Analysis'` is a proper-noun-style rubric criterion label. `Analysis` is identical in AU and US English; not a violation.

**Total in non-user-visible code paths (CSS property names, Tailwind utility classes, browser API parameter values like `behavior: 'smooth'`):** 32. These do not need fixing because the strings never reach the student.

---

## 5. Flat hierarchy violations (nested cards)

The doc rule reads: *"No nested tiers. Cards do not contain other cards. Lists do not contain sub-lists."*

A "card" is defined here as a div carrying `rounded-xl|2xl|3xl` AND `border` AND `bg-*`. Heuristic scan of card-like containers per file:

| File | Cards (rounded-xl/2xl/3xl) | With border | Status |
|---|---|---|---|
| `src/frontend/LinearCanvas.js` | 13 | 8 | **High risk** - 8 bordered cards in one component is a Russian-doll waiting to happen |
| `src/frontend/UniversalOnboarding.js` | 10 | 3 | Medium - the legacy onboarding components nest `bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl` inside the page wrapper, then inside they nest topic chips with their own rounded-xl + border |
| `src/frontend/MasterDashboard.js` | 8 | 0 | Low - rounded containers exist but most lack borders, so they read as soft groupings not cards |
| `src/frontend/SmartIntake.js` | 7 | 5 | Medium |
| `src/frontend/MathsStepEditor.js` | 6 | 2 | Low |
| `src/frontend/AccessibilityVault.js` | 6 | 4 | Medium |
| `src/frontend/EssayScorer.js` | 5 | 4 | Medium |
| `src/frontend/ResourceIngestor.js` | 4 | 1 | Low |
| `src/frontend/Humaniser.js` | 4 | 3 | Medium |
| `src/frontend/ConfirmDialog.js` | 4 | 1 | Low |

**Confirmed nested-card sites (manual inspection of grep hits):**

1. **`src/frontend/UniversalOnboarding.js:47`** - `IdentityGate`:
   ```
   <div className="bg-[#07080D]">                              <- page wrapper (outer)
     <div className="bg-zinc-900/50 border ... rounded-3xl">   <- card 1
       <div className="bg-black/50 border ... rounded-xl">     <- card 2 inside card 1
   ```
   Three nested rounded-bordered surfaces. Spec violation.

2. **`src/frontend/MasterDashboard.js:1101`** - Literal Mode toggle:
   ```
   <div className="bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
     <span className="w-10 h-5 rounded-full ...">
       <span className="w-3 h-3 ... rounded-full ...">
   ```
   Toggle is acceptable nesting (toggle thumbs need to live inside toggle tracks) but counts in the heuristic.

3. **`src/frontend/LinearCanvas.js`** - 8 bordered cards within one component; manual diff would surface the nesting depth. Not enumerated here because the file is 1700+ lines and out of scope for an audit-only scan.

---

## 6. Cross-cutting findings

These are not in the four flagged categories but surfaced during the scan and worth recording in the audit:

### A. Duplicate component surfaces

| Concern | Files | Issue |
|---|---|---|
| **AURA chat** | `AskAura.js` AND `AuraLayer.js` | Both imported and mounted in MasterDashboard. Two interfaces for the same task. |
| **Vault unlock** | `LandingPage.js` AND `HistoryVaultUnlock.js` | LandingPage handles boot-time unlock per Stage 01. HistoryVaultUnlock handles in-app re-unlock. Both call `unlockWithPassphrase`. Intentional separation or duplicate, undocumented. |
| **Cockpit / canvas** | `LinearCanvas.js` (1700+ LOC) + `SimplifiiStudio.js` + `MathsStepEditor.js` | Three implementations toggled by booleans inside MasterDashboard. Doc Stage 04 names a fourth: `AuthoringCockpit`. Four cockpits, one task. |
| **Avatars** | `AIAvatar.js` (3D @react-three/fiber) + `AvatarVault.js` (5 SVG primitives) | Two avatar systems. AIAvatar still imported into MasterDashboard line 1156. |

### B. State fragmentation - direct localStorage reads outside contexts

15+ `simplifii_*` keys plus 3 unprefixed keys (`mode`, `persona`, `gcp_access_token`). No single hydration module. Direct reads observed in:
- `App.js:42` reads `simplifii_onboarding_complete`
- `src/utils/GroundingLoader.js` writes nothing but the ingest button writes course state via context
- 5+ components call `localStorage.getItem` / `setItem` directly

### C. Branch sprawl on remote

16 `sovereign-*` branches plus `fix/cockpit-restoration` on origin. Canonical is `sovereign-refactor-handshake` per CLAUDE.md but most agents and sandboxes cut a fresh side branch per push due to historical sandbox 403 issues. Net: no clear answer to "which branch is the truth" without inspecting commit ages.

### D. Doc status drift

`SIMPLIFII_ARCHITECTURE.md` section 6 status table is **the most stale artefact in the repo**. Reality leads the doc by at least 2 stages (Stages 01, 03, 04, 05 all flipped from Pending to Shipped via the parallel-team commits `7efaa4a` and `0a75188`, but the table was not updated). Per the directive this audit does not fix; it flags.

---

## 7. Summary scorecard

| Drift type | Severity | Count | Highest-risk site |
|---|---|---|---|
| Stage handler missing | None | 0 | All 5 spec paths exist |
| Stage status mislabelled | Medium | 4 of 5 stages | Doc section 6 lags reality by 2+ commits |
| Dark theme where spec is light | **High** | 172 occurrences / 21 files | `MasterDashboard.js:968` shell + `UniversalOnboarding.js:10,47,86,116` early onboarding |
| Em dashes in `/src` | None | 0 | (pre-commit hook holding) |
| Em dashes in repo-root docs | Low | 5 | `CLAUDE.md:20-24` (constitution violates its own rule) |
| US spelling in user-visible text | Medium | 5 | `BriefService.js:9`, `PersonaEngine.js:8,61`, `UniversalOnboarding.js:18`, `ResourceIngestor.js:32` |
| Nested cards / Russian-doll surfaces | **High** | 60+ rounded-xl/2xl/3xl cards across 10 files | `LinearCanvas.js` 13 cards, `UniversalOnboarding.js` 10 cards including confirmed 3-deep nesting at `IdentityGate` |
| Duplicate component surfaces | **High** | 4 pairs | AURA chat (AskAura + AuraLayer), Vault unlock (LandingPage + HistoryVaultUnlock), Cockpit (LinearCanvas + SimplifiiStudio + MathsStepEditor + AuthoringCockpit), Avatars (AIAvatar + AvatarVault) |
| Direct `localStorage` outside contexts | Medium | 15+ keys, 5+ direct caller sites | No single hydration module |

**Single root cause:** the cockpit shell at `MasterDashboard.js:968` is the load-bearing dark-theme surface. While it stays `bg-black`, every Stage 03/04 component inherits a dark background even when individually styled correctly. Fixing this one line cascades: most of the 172 dark occurrences are downstream consequences.

---

## 8. Stopping here

Per directive: no fixes applied. AUDIT_REPORT.md generated and persisted at repo root.

Next decision is yours: prioritise (a) the doc status table sync, (b) the dark-theme shell flip at `MasterDashboard.js:968`, (c) the duplicate-component consolidation, or (d) all three in one focused refactor.
