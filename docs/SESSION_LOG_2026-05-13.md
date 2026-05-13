# Session Log: 13-14 May 2026

**Branch:** v2-rebuild-canvas-first
**Pushed:** f805a53e (confirmed on origin)

## Commits (8)

| Hash | Summary |
|------|---------|
| 4c0ec6de | feat: build Screen 3 (Home) with status pills, timeline, course grid |
| f6b91372 | style: apply full Obsidian Aesthetic to Screen 3 Home |
| 5e02d5ce | fix: wire AddCourseButton through PDF extraction pipeline |
| be15f763 | fix: close 4 extraction gaps (dates, rubric, referencing, date marriage) |
| 14d409ac | feat: add term grouping (detection, filtering, switcher, CourseCard label) |
| 2b6cfe1a | fix: dedup courses by unitCode, reject term metadata and noise titles |
| 74aaf45f | feat: build Screen 4 canvas (editor, rails, 5 panels, tools, router) |
| f805a53e | feat: add BottomStrip and ReentryOverlay to canvas (Step 4) |

## Features shipped

- **Screen 3 (Home):** StatusService + StatusPill (3-state), TimelineStrip (7-day), UpNextCard (hero), CourseCard (standard/compact), DecisionButton, BodyDoublingLine, TalkToSomeoneLink (P0 safety), AddCourseButton wired to full PDF extraction pipeline, term grouping with switcher, display preferences (5 toggles)
- **Screen 4 (Canvas):** CanvasEditor with 2s autosave to IndexedDB + HistoryOfThought logging, CanvasNav with save status, SectionRail with expandable sub-tasks (ADHD micro-task scaffolding), PanelRail with 5 panels (Brief, Tutor, Preview, Sources, Check), ToolModal generic shell, BriefSimplifier and RubricTranslator tool stubs, CheckPanel with rubric gap analysis and word count bar, BottomStrip with body doubling pulse and tier-aware word count, ReentryOverlay (3-day dormancy threshold)
- **RouterContext:** simple view state (home/canvas) wiring both screens
- **Extraction fixes:** date regex handles ordinals + pdfjs whitespace, rubric detects AU grade bands, referencing detects 8 styles, dates married to assessment briefs by proximity
- **TOOLS_SPEC.md:** 17-tool roadmap across 4 tiers with event vocabulary and service contracts

## Known issues for tomorrow

1. **Extraction depth still partial:** date marriage works for BABS1201 but untested on LAWS3445 and ANAT3121. Some PDFs have dates in table cells that pdfjs extracts without spatial context, so proximity matching may misfire.
2. **HistoryOfThought version conflict warning:** the vault occasionally logs "Cannot read property 'getAll' of undefined" on first load when IndexedDB has not initialised yet. Non-blocking but noisy in console.
3. **Chrome extension noise in console:** React DevTools and other extensions inject warnings that pollute the dev console. Not a code issue but makes debugging harder.
4. **Tool services are stubs:** BriefSimplifier, RubricTranslator, CheckAgainstRubric, and ScaffolderTool return mock data. API wiring is next.
5. **Tutor panel is stub-only:** Socratic responses are random selections from a fixed list. LLM integration not started.
6. **No visual polish pass on Canvas yet:** functional but flat compared to wireframes. Same treatment as the Home screen Obsidian pass needed.
7. **PreviewPanel is raw text only:** no markdown rendering, no export buttons.
