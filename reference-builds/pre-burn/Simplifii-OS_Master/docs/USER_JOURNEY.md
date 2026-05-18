# Sovereign OS — User Journey Spine

**Branch:** sovereign-refactor-handshake
**Status:** Draft. Refine with CC before Sprint 3.4.
**Purpose:** Single source of truth for every stage the user passes through, from landing the first time to authoring against a real syllabus. Each stage is independently traceable. No stage is "done" until its trace document exists and the six links are verified.

---

## What this document is

This is the spine. It is a numbered list of every stage in the user journey. It is not a wireframe. It is not a feature list. It is the sequence of states the system must pass through to deliver the core value: a student goes from "I have a messy syllabus PDF" to "I have a working cognitive exoskeleton built around my actual course."

Each stage will have its own trace document in `docs/traces/`. The trace document verifies six links per stage:

1. **User action** — what the user does
2. **Frontend event** — what UI event fires
3. **Service layer** — what backend or logic processes it
4. **Persistence** — what gets written to IndexedDB or Supabase
5. **Event emission** — what Custom Event signals completion
6. **Render update** — what the user sees afterwards

If any of the six is broken or missing, the stage is logged as broken. Fixes are scoped into their own micro-sprints.

---

## The journey

### Stage 01 — Obsidian Gate (landing)
The user arrives at the Sovereign OS for the first time. The Obsidian Gate renders. They see the brand mark, the value proposition, and an authentication entry point. No data is loaded yet.

### Stage 02 — Authentication
The user clicks to sign in. OAuth flow completes without COOP errors. A session is established. The user is routed to the next stage.

### Stage 03 — Sovereign Handshake (first-run Neuro-Profiler)
On first login only, the user passes through the Neuro-Profiler. This maps cognitive style preferences (not administrative fluff). Profile is persisted. On subsequent logins, this stage is skipped.

### Stage 04 — Semester Command Map (empty state)
The user lands on the Bento Grid. No courses yet. The empty state is welcoming, not punishing. A clear call to action invites the user to add their first course.

### Stage 05 — Course PDF upload
The user uploads a course outline PDF. The upload control accepts the file. The file is held in memory or briefly staged. The user sees that the upload has been received.

### Stage 06 — Ingestion (regex extraction)
The PDF is parsed by pdfjs. The text is run through the regex extractor. Course code, course name, assessment titles, assessment dates, and UDL principles are pulled out.

### Stage 07 — Ingestion (deep extraction)
If Ollama or the LLM extraction layer is available, deeper structured extraction runs. The reconciler merges regex output and LLM output into a single extraction record.

### Stage 08 — UDL score computation
The udlScore is computed from the extraction record. Score is bounded 0 to 100. The score is attached to the course record.

### Stage 09 — Persistence to IndexedDB
The course record (including udlScore, assessments, UDL principles, and metadata) is written to the courses object store. The schema version is honoured.

### Stage 10 — INGEST_COMPLETE event
A Custom Event fires. The Bento Grid listens for it. Stale state is invalidated. SOVEREIGN_DATA_READY wired in Sprint 3.3a (commit 0ed6bbf4).

### Stage 11 — SovereignCell render
A new SovereignCell appears in the Bento Grid. It renders course code, course name, tier chip, next task, and the UdlBar with a real score.

### Stage 12 — Cell click into Cockpit (Node 05 territory)
The user clicks a SovereignCell. The Authoring Cockpit opens for that course. The course context is loaded. UNKNOWN until Node 05 starts.

### Stage 13 — Reload persistence
The user closes the browser. The user reopens it. The session resumes. All courses are still in the Bento Grid. No data loss.

### Stage 14 — Second-course flow
The user uploads a second course PDF. The same ingestion path runs without conflict. Two SovereignCells exist in the Bento Grid. The UdlBar on each shows a distinct score.

### Stage 15 — Error states
What the user sees if the PDF is corrupted, if Ollama is unreachable, if IndexedDB write fails, if the LLM returns malformed JSON. Each error state needs its own trace. Currently most of these fail silently. See Sprint 3.1 audit Section 5.4.

---

## Stages out of scope (pinned for later Nodes)

The following stages belong to future-state moat components in the Sovereign OS Architect skill. They are not part of the current journey trace.

- Authenticity Report generation (History of Thought, Node 06+)
- Cross-Course concept linking (Node 06+)
- Grounding Shield overlay (Node 04 deepening)
- Vibe Steerage dials (Node 05)
- Zen Mode auto-trigger (Node 05)

These will get their own stages added to the spine when their Node arrives.

---

## How to use this document

**When you start a new sprint:** pick a stage. Invoke the tracer subagent on it. Generate the trace document in `docs/traces/`.

**When you find a bug:** check which stage it lives in. The trace document for that stage either already shows the gap or needs to be updated.

**When you pitch the product:** walk the spine. Stage 01 through Stage 15. That is the demo.

**When a new contributor joins:** they read this file first, then read the trace for the stage they are working on. They are productive in under thirty minutes.

---

## Definition of Done for the journey

The journey is considered "Elite" when:

- Every stage 01 through 11 has a committed trace document in `docs/traces/`
- Every trace document confirms all six links are intact, or has a logged gap with a sprint number for the fix
- Stages 12 through 15 have trace documents marked UNKNOWN or BLOCKED with the reason

This is not "every bug is fixed." This is "every gap is known."
