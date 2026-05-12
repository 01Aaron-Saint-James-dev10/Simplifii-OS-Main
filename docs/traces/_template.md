# Stage XX — [Stage Name]

**Branch:** sovereign-refactor-handshake
**Journey reference:** docs/USER_JOURNEY.md, Stage XX
**Trace performed by:** @tracer subagent
**Status:** [DRAFT / VERIFIED / BROKEN / BLOCKED]
**Last updated:** YYYY-MM-DD

---

## What this stage is

One paragraph in plain language. What the user is doing. What the system is doing. Why this stage exists in the journey. Refer to USER_JOURNEY.md if more context is needed.

---

## The six links

### Link 1 — User action

**What the user does:** [click, drag-drop, type, scroll, wait, etc.]
**Where they do it:** [page, component, modal, etc.]
**What they expect to happen:** [user mental model]

### Link 2 — Frontend event

**Event fired:** [click handler name, custom event name, or "NONE"]
**File:** [path:line]
**Listener:** [what catches this event]

Status: [INTACT / BROKEN / MISSING]

### Link 3 — Service layer

**Service or function called:** [name]
**File:** [path:line]
**Input shape:** [type or example]
**Output shape:** [type or example]
**External dependencies:** [API, LLM, library, or "NONE"]

Status: [INTACT / BROKEN / MISSING]

### Link 4 — Persistence

**Where data is written:** [IndexedDB store name, Supabase table, or "NONE"]
**File:** [path:line]
**Schema version:** [number, or "NOT APPLICABLE"]
**Shape written:**

```json
{
  "id": "...",
  "...": "..."
}
```

Status: [INTACT / BROKEN / MISSING]

### Link 5 — Event emission

**Custom Event fired:** [event name, or "NONE"]
**File:** [path:line]
**Listeners that react:** [list components that listen]

Status: [INTACT / BROKEN / MISSING]

### Link 6 — Render update

**Component that re-renders:** [name]
**File:** [path:line]
**What the user sees:** [describe the visible change]
**Token compliance:** [PASS / FAIL — list any raw hex or raw font found]

Status: [INTACT / BROKEN / MISSING]

---

## Gaps and breaks

List anywhere this stage falls short. Each entry should be one or two sentences. No "should be" language. Describe what is, not what ought to be.

- Gap 1: [description] — sprint reference [if scoped]
- Gap 2: [description]

If there are no gaps, write "None detected at trace time."

---

## Error path

What happens if this stage fails. What the user sees. What state the system is left in.

- **Failure mode A:** [trigger, user experience, recovery path]
- **Failure mode B:** [...]

---

## Side effects

Anything this stage does beyond its main job. Logging, analytics, background writes, off-path event emissions.

- Side effect 1: [description]
- Side effect 2: [description]

---

## Verdict

One of:

- **ELITE** — all six links intact, no gaps, error paths handled
- **WORKING WITH GAPS** — all six links intact, gaps logged for later sprints
- **BROKEN** — one or more links missing or non-functional, blocks the journey
- **BLOCKED** — depends on a Node that has not started yet

**Recommended next action:** [fix in next sprint / defer to Node XX / no action needed / re-trace after dependency lands]

---

## Token compliance check

Did this trace surface any Obsidian Aesthetic violations? Log them here for the next style sweep. Do not fix them in this trace.

- [ ] Raw hex value found in: ___
- [ ] Raw font string found in: ___
- [ ] Em-dash found in: ___
- [ ] Linear easing found in: ___
- [ ] American spelling found in: ___
- [ ] Other: ___
