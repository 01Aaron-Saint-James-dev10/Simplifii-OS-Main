# Sovereign Architecture Blueprint — Multi-Stream OS

**Version:** 1.0
**Built:** 8 May 2026
**Cowork-as-Architect output for Claude Code execution**

---

## Mission

Re-architect Simplifii from single-user (tertiary research) build into a five-stream tenant-aware OS. One core engine, five hydrated profiles (Primary, Secondary, Tertiary, TAFE, Homeschool). Add an Executive Function controller that locks navigation during sprints. Track every edit as a History of Thought event for authenticity and predictive analytics.

---

## Three Hard Rules (engineered into every layer)

1. **Sovereign Data.** History of Thought events stored locally first (IndexedDB), encrypted with user-derived key. Cloud sync requires explicit opt-in. No exceptions.
2. **Literal Communication.** All student-facing text passes through a Literal Mode transformer when `stream_id ∈ {primary, secondary}`. The transformer is a render-time wrapper around schema-anchored rubric output — never a content generator.
3. **Executive Function Layer.** Simplifii's differentiator is helping students finish work, not delivering curriculum. Every feature must answer: does this help the student finish the next 10 minutes?

---

## Three engineering decisions to see before Claude Code runs

These diverge from the brief — flagging openly so you can override.

1. **EF Controller scoped to in-app focus.** "App blocking" as written does not work in a browser/web app. Browser extensions block web pages, not native apps; native app blocking requires entitled OS APIs (macOS Screen Time, iOS FamilyControls, Android UsageStats) which are Phase 4 native-wrapper builds. The spec below blocks navigation *within Simplifii*, locks distraction zones in the UI via CSS, dispatches AURA nudges on idle, and ships dopamine-loop honour gamification via Sovereign Credits. v1 ships this; native blocking is Phase 4.
2. **History of Thought is local-first.** Per Hard Rule 1. Cloud sync exists but is opt-in and double-encrypted. Also a strong patent-continuation candidate — work-evolution authenticity logging is genuinely novel architecture worth protecting before the March 2027 conversion deadline.
3. **Literal Mode is a render-layer transformer, not a generator.** It re-voices rubric-anchored output (the BABS1201 schema-feedback pattern, generalised). Never invents content. This is the architecture that stops the "5% Literature Review" hallucination class from re-emerging in primary/secondary streams.

---

## Layer 1 — SovereignRouter

**File:** `/core/SovereignRouter.ts` (new)

**Responsibility:** Resolve the user session's stream and hydrate the per-tenant profile.

**Interface:**

```ts
interface SovereignRouter {
  hydrate(session: Session): StreamProfile;       // call once on login
  getVocab(key: string): string;                   // e.g. "assignment" → "quest" if primary
  getTheme(token: string): string;                 // CSS variable lookup
  canAccess(moduleId: string): boolean;            // checks capability registry
  getDefaultLanding(): RouteId;                    // first screen post-login
}
```

**Stream profile structure:** `/streams/{stream_id}/`

```
profile.json       → meta, default landing, theme variant
vocab.json         → key→string map; missing keys fall back to tertiary defaults
theme.json         → CSS custom property values
capabilities.json  → array of moduleIds enabled for this stream
```

**Default fallback:** `tertiary` — the existing Studio V3 build IS the tertiary profile. No migration required for current users; they default to `stream_id = "tertiary"` and keep working.

**Mutability:** read-only after hydration. Stream switching forces full session restart.

**Capability registry pattern:** every module declares its supported streams in its own manifest.

```ts
export const moduleManifest = {
  id: "QuestEngine",
  enabledFor: ["primary"],
  defaultLanding: false,
};
```

This is the load-bearing piece. Every new feature has to declare which streams it serves. A module that claims all five must justify the maintenance cost. Without this, scope drift becomes inevitable.

---

## Layer 2 — Executive Function Controller

**File:** `/core/ExecutiveSpine.ts` (new)

### 2a. SectionHealth

- Per-section completion meter, 5 dots: `sparse → developing → solid → strong → mastery`
- Calculated from rubric criterion scores against schema-anchored data (BABS1201 schema is the prior art — same pattern, generalised per assessment)
- Persisted in `section_health` table

### 2b. FocusSession

- Sprint timer (default 25 min, per-stream override via stream profile)
- While active:
  - Non-current-task modules in the UI receive `data-focus-locked="true"` attribute
  - Global CSS rule: `[data-focus-locked="true"] { pointer-events: none; opacity: 0.3; }`
  - Navigation guard: route change attempts to non-current-task modules trigger an AURA prompt: *"Sprint active. Park this thought, or end sprint to switch?"*
- **What this does NOT do, stated verbatim for the spec:** does not block external apps, does not block other browser tabs, does not block anything outside Simplifii. User-facing copy must reflect this — promising "TikTok blocking" the architecture cannot deliver is a churn driver the moment a parent tests it.

### 2c. IdleDetection

- Hook listens to `keydown`, `mousedown`, `touchstart` events on the active workspace
- If `Date.now() - lastInputTimestamp > 180_000`, dispatch `aura.nudge` event with the current sub-task as payload
- Nudge content: a single, literal, one-step instruction (e.g. *"Find the DOI for the Smith paper"*)
- For primary/secondary streams the nudge string passes through Literal Mode (Layer 4) before render

### 2d. PlayTime unlock

- When `SectionHealth.dots >= 4` for the active section, dispatch `grant_playtime` event
- Removes `data-focus-locked` attribute from designated "play" modules — configurable per stream (e.g. avatar customisation, badge gallery)
- Default duration: 7 minutes
- After expiry: locks reapply automatically; sprint can be restarted

### 2e. Sovereign Credits

- Currency earned per completed micro-task
- Spent on avatar/theme customisation
- No monetary value, no redemption outside the app — avoids gambling regulation under Australian Interactive Gambling Act 2001
- Stored in `users.sovereign_credit_balance`

---

## Layer 3 — Data Isolation & History of Thought

**File:** `/core/HistoryOfThought.ts` (new)

### Event types

```
text_edit              { sectionId, diff, debounceWindowMs }
citation_added         { source, articleType, citationFormat }
citation_removed       { sourceId }
ai_assist_invoked      { promptHash, mode, outputTokenCount }
focus_session_start    { plannedDurationMs, taskId }
focus_session_end      { actualDurationMs, completedSubtasks }
nudge_triggered        { reason, taskId }
section_health_change  { sectionId, fromDots, toDots }
playtime_granted       { durationMs }
playtime_expired       { }
```

### Event envelope

Every event stamped with: `user_id`, `stream_id`, `timestamp_iso`, `device_signature_sha256`, `schema_version`.

### Storage

- **Primary:** IndexedDB object store `history_of_thought_events`
- **Encryption:** AES-GCM, key derived via PBKDF2 from user passphrase + per-user salt
- **Cloud sync:** opt-in only. When opt-in is on, batches sync to cloud every 60s. Payloads stay encrypted at rest in the cloud — Simplifii cannot read user content; only the user's device with the passphrase can.

### Authenticity Report

- Generated on demand, never auto-shared
- Renders edit timeline, source addition timeline, AI assist invocation count, focus session record
- Genuinely novel architecture. Worth filing as a continuation of patent 2026902550 before the 24 March 2027 deadline.

### Predictive Analytics

- Schema supports it; models are Phase 3
- Same event stream becomes training data for stream-specific completion-pattern models
- Not built in v1 — but the schema below allows for it without rework later

---

## Layer 4 — Literal Mode Filter (render layer)

**File:** `/core/LiteralMode.ts` (new)

**Function signature:**

```ts
literalise(rubricOutput: SchemaAnchoredFeedback, stream: StreamId): string
```

**Transformations applied for primary/secondary streams (and optional toggle for others):**

| Pattern matched | Transformation |
|---|---|
| "Consider revising" | "Change [X] to [Y]" |
| "Synthesise" | "Combine ideas from" |
| Passive voice ("should be revised") | Imperative ("rewrite this") |
| Multi-clause sentence | Split into one instruction per sentence |
| "Demonstrates" | "Shows" |
| "Articulate" | "Say" or "Write" |
| "Engage with" | "Read" or "Use" |
| "Going forward" | (delete) |
| "It is recommended that" | "Do this:" |

**Hard constraint:** the transformer NEVER receives or generates rubric data. It only re-voices content that already came from the schema (same pattern as the AU Karen Voice in BABS1201). This is intentional and load-bearing — it's the architectural defence against the "5% Lit Review" hallucination class.

---

## Schema update reference

Full additive schema diff in `sovereign_schema_update.json` (same folder). Highlights:

- `users.stream_id` added (enum, required, default `tertiary`)
- `users.literal_mode_enabled` added (boolean, computed default per stream)
- `users.sovereign_credit_balance` added (int, default 0)
- New table: `streams` (config + capability flags per stream)
- New table: `section_health` (per user × section dot count)
- New table: `focus_sessions` (sprint records)
- New table: `history_of_thought_events` (the encrypted event store)

No destructive changes. Migration is forward-only and additive.

---

## Out of scope (deliberate, with reasons)

- **Native app blocking** — needs platform-specific entitled OS APIs; Phase 4 native-wrapper build, not v1.
- **Notion bi-directional sync** — Notion API rate limit (3 req/s) makes real-time sync brittle; defer until clear demand and rate-limit-aware queue design.
- **Body doubling video feed** — privacy + camera permissions complexity; ships as static animated AURA avatar in v1, real video in Phase 3.
- **Australian Curriculum mapping for Homeschool** — requires sourcing and structuring the full ACARA curriculum; multi-month data engineering project, identical effort to the BABS1201 ground-truth move. Do not promise to parents until built.
- **Predictive Analytics models** — schema supports it, models are Phase 3.

---

## Claude Code handoff

Paste the block below into Claude Code with this Blueprint and `sovereign_schema_update.json` in the working directory.

> **Mission:** Implement the Sovereign multi-stream architecture per `Sovereign_Architecture_Blueprint.md`.
>
> **Order of operations:**
>
> 1. Apply `sovereign_schema_update.json` as additive migration. Verify no destructive changes; existing users default to `stream_id = "tertiary"`.
> 2. Create `/streams/tertiary/` with the existing app's vocab/theme/capabilities extracted into the three JSON files. Confirm the existing build still works pointing at this profile.
> 3. Build `/core/SovereignRouter.ts` per Layer 1. Wire it into the session hydration path.
> 4. Build `/core/ExecutiveSpine.ts` per Layer 2. Implement SectionHealth, FocusSession, IdleDetection in that order. CRITICAL: ensure FocusSession only locks in-app navigation, not external. Add a unit test that asserts no native-app-blocking code paths exist.
> 5. Build `/core/HistoryOfThought.ts` per Layer 3. Local IndexedDB store, AES-GCM encrypted, opt-in cloud sync.
> 6. Build `/core/LiteralMode.ts` per Layer 4. Wire as render-time transformer. Reuse the schema-anchoring pattern from the BABS1201 AU Karen Voice layer — feedback is already rubric-anchored from upstream, the transformer only re-voices it.
> 7. Create `/streams/primary/`, `/streams/secondary/`, `/streams/tafe/`, `/streams/homeschool/` with starter vocab/theme/capabilities files. Ship empty capability arrays for now; populate as modules are migrated.
>
> **What not to do:**
>
> - Do not build native app-blocking. Anything that claims to block external apps in a browser context is a CSS gimmick that will burn the first user who tests it.
> - Do not let LLM calls return stream profile data, capability flags, or rubric criteria. Those come from disk, not from inference.
> - Do not create new tables outside the `sovereign_schema_update.json` spec without an explicit Blueprint amendment.
>
> **Verification before done:**
>
> - Existing tertiary build still works.
> - New user can be created with `stream_id = "primary"` and lands on the QuestEngine route.
> - FocusSession active state actually disables clicks on `data-focus-locked` modules.
> - IdleDetection fires `aura.nudge` after 180s of input silence (test with a shortened threshold first).
> - History of Thought event written to IndexedDB on every text_edit, encrypted at rest, decrypts only with the correct user key.
> - Literal Mode transformer changes "Consider revising" → "Change X to Y" on a primary stream session.
> - Switching `stream_id` mid-session is rejected with a forced re-login flow.

---

*End of Blueprint. Schema-anchored. No invention.*
