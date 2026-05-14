# Corpus Scoping Question

Status: Open (pending architectural decision)
Date raised: 2026-05-14
Sprint: Bug fix sprint (post-Sprint 6)

## The Problem

The citation corpus (source library) is currently scoped per course. Each
`activeCourseId` loads its own set of sources from IndexedDB via
`listSources(activeCourseId)` in `ProjectContext.js`.

This means:

- Sources ingested under one course are invisible to another course.
- Sources ingested under a Research project are invisible to Undergrad courses
  and vice versa.
- The 16 audit PDFs ingested during Sprint 3 were tied to a specific
  `courseId`. Any other course shows "0 sources" and flags every in-text
  citation as unverified (amber underline).

The amber underline behaviour is correct: `CitationHighlightExtension`
highlights any `(Author, Year)` pattern that fails `verifyFromSources()`
against the active course's corpus. An empty corpus means every citation
is flagged.

## Scoping Options

### Option A: Per-Course (current)

Each course owns its own corpus. Sources are isolated.

Pros:
- Clean separation. No cross-contamination between disciplines.
- Simple IndexedDB key structure.

Cons:
- Learner must re-add sources if they use the same reference across
  multiple courses (e.g. a methods textbook used in ANAT3121 and PHYS2111).
- Research project sources are invisible to coursework and vice versa.

### Option B: Per-Research-Project

Research projects get their own corpus, separate from coursework.
Coursework courses share a single corpus or remain per-course.

Pros:
- Separates research literature from coursework references.
- Research projects often have large, curated bibliographies that should
  not bleed into unrelated coursework.

Cons:
- Adds a second scoping dimension. More complex to reason about.
- Does not solve the cross-course reuse problem for coursework.

### Option C: Global Corpus (Single Library)

All sources live in one corpus. Every course and research project can see
every source.

Pros:
- Simplest mental model for the learner. "My sources" is one list.
- Cross-course references just work.

Cons:
- A learner with 8 courses and a research project sees a very large,
  noisy source list.
- Verification status becomes ambiguous (verified for which context?).
- Harder to scope the amber underline logic (flag against which subset?).

### Option D: Global Corpus with Course Tags

All sources live in one corpus but carry course tags. Each course view
filters to tagged sources. A source can be tagged to multiple courses.

Pros:
- Single source of truth. No duplication.
- Cross-course reuse without noise.
- Verification can be global or per-tag.

Cons:
- Most complex to implement.
- Tagging UX needs design work (auto-tag on ingest? manual? both?).

## Affected Files

| File | Role |
|---|---|
| `src/frontend/ProjectContext.js:188-219` | Loads and manages `projectSources` per `activeCourseId` |
| `src/frontend/CanvasScreen.jsx:75-95` | Scans draft text and flags unverified citations |
| `src/frontend/components/CitationManager.jsx` | UI for browsing and adding sources |
| `src/frontend/components/extensions/CitationHighlightExtension.js` | TipTap extension applying amber underlines |
| `src/services/CitationService.js:189` | `verifyFromSources()` checks citations against source list |
| `src/services/CitationStyleService.js:146` | `detectSuspectedCitations()` regex scanner |
| `src/services/IndexedDBService.js` | Storage layer for source records |

## Decision Needed

Which scoping model should Simplifii-OS adopt? This decision affects:

1. IndexedDB schema (key structure for source records)
2. `ProjectContext` loading logic
3. `CitationManager` UI (does it show a course filter? a tag picker?)
4. Amber underline logic (verify against which subset of sources?)
5. Research project ingest pipeline (where do ingested PDFs land?)

No code changes until this is resolved.
