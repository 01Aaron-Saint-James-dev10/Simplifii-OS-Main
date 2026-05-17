# Session Log — Sprint 10 Explicit Nav
Date: 2026-05-17

## Completed This Session

### B11 Fixed
`onOverride` in CanvasScreen now calls `upgradeCourseExtraction` to persist the overridden `documentType` back to the course record in Supabase. Previously the override lived only in local state and was lost on reload. Full re-extraction will be wired in Sprint 10 DocLibrary.

### Tier 2 Fixed
SocraticPanel now generates questions from `assessmentTitle` as a fallback when the `nodes` array is empty. This covers all courses created before Sprint 4 that have no structured nodes — previously showed a blank question panel.

### Tab Layout
Canvas writing area uses a horizontal tab row: **1. THINK FIRST** | **2. GET IDEAS** | **3. WRITE**. Tabs are full-width. Think First and Get Ideas tabs now show a green content-ready dot (5px, #10b981) when their respective panels have loaded content. Write tab never shows a dot.

### Explicit Nav
- **AURA label** — "Ask AURA for help" label rendered below the orb in both static (idle) and animated (active) states. Font size 8px, weight 700, letter-spacing 0.06em, system font, sov-line green.
- **Tutor description** — Panel rail tooltip for Tutor panel updated to: "Ask questions about your work. Type a question about your assessment. AURA responds here." (replaces generic "AI tutor" copy)
- **Content dots** — `onContentReady` callback wired from SocraticPanel → `hasThinkContent` and PreWritePanel → `hasIdeasContent` in CanvasScreen. Dots appear as inline `<span>` elements with `aria-label="Content ready"`.
- **Empty states** — existing empty states unchanged; dots serve as the inverse positive signal.

## Logged to BACKLOG

- **CRAFT-T3** — (previously logged; confirmed carried over)
- **CRAFT-T4** — Progress % correct formula but wrong default target for Secondary tier (targetWords=1500 is university scale, secondary needs 400)
- **CRAFT-T5** — Progress only measures words, not thinking (Tier 2 answers + scaffold acceptance should contribute to composite progress)
- **B13** — Course names with underscores still dirty in Supabase for pre-fix records; sanitise on write
- **Sprint 11** — Secondary tier: HSC and homework support
- **Sprint 12** — Firecrawl HSC corpus pipeline

## Progress % Investigation
Formula `(wordCount / targetWords) * 100` in BottomStrip.jsx:34 and CheckPanel.jsx:39 is arithmetically correct. Root cause: `targetWords` defaults to 1500 (university scale). Year 10-12 students writing 300-word responses always show <20%. Fix deferred to Sprint 11 Secondary tier build — targetWords will read from XN1 node word count requirement when available, with tier-appropriate defaults (Secondary=400, University=1500, Postgrad=3000).

## Commit SHAs

| SHA | Description |
|-----|-------------|
| `3ef58d44` | ux: AURA label + tutor description + content dots on tabs + CRAFT-T3/T4/T5/B13 logged to BACKLOG |
| `6738ad72` | feat(canvas): horizontal tab layout — 1. THINK FIRST 2. GET IDEAS 3. WRITE |
| `649d8b2e` | fix(canvas): Tier 2 Socratic questions now generate from assessmentTitle when nodes empty |
| `b329c8fc` | fix(canvas): B11 — onOverride now updates documentType via upgradeCourseExtraction |
| `10f37d32` | docs: update BACKLOG — B10 resolved, B11 root cause confirmed, B12 resolved + Sprint 10 logged |
| `1082ba64` | docs: Sprint 9 session log + B10/B11/B12/CRAFT-T1/T2 backlog entries |

## Tests
- Smoke: 2/2 passed (landing page loads, CTA buttons present)
- Regression: 12/12 passed (6 suites; auth-gated tests skipped correctly)
- Build: clean (18 rgba() token warnings, non-blocking, legacy migration pending)

## Next Session
**Sprint 10 — DocLibrary + mid-session ingestion**
- New `DocLibrary.jsx` component
- `useIngestion.js` extended for mid-session document adds
- AURA prompt awareness block for mid-session docs
- Closes Loop 1 permanently (ingestion becomes ongoing, not one-time)
- Depends on: B10/B11/B12 fixes (all resolved)
