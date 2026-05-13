# Panel Audit: 14 May 2026

Audit of all 5 canvas panels (Brief, Tutor, Preview, Sources, Check).

## Summary

| Panel | Tab clickable | Renders on click | Data from ProjectContext | Close works | Issues |
|-------|:---:|:---:|:---:|:---:|--------|
| Brief | Yes | Yes | Yes (via CanvasScreen props) | Toggle only | Rubric self-assessment loses state on remount |
| Tutor | Yes | Yes | Partial (assessmentTitle only) | Toggle only | Chat history lost on every keystroke (remount bug) |
| Preview | Yes | Yes | Yes (draftText + wordCount) | Toggle only | None |
| Sources | Yes | Yes | Yes (sourceFiles) | Toggle only | None |
| Check | Yes | Yes | Yes (draftText + rubricCriteria) | Toggle only | Check result lost on every keystroke (remount bug) |

## Issues to fix

### 1. CRITICAL: useMemo remount bug (affects Tutor, Check, Brief)

`CanvasScreen.panelContent` is wrapped in `useMemo` with `draftText` in the dependency array. Every keystroke in CanvasEditor updates `draftText`, which recreates the active panel component. React remounts it, losing all local state:

- **TutorPanel:** chat messages array reset to initial greeting
- **CheckPanel:** rubric check result cleared, running state reset
- **BriefPanel:** rubric self-assessment radio selections cleared

**Fix:** remove `draftText` and `wordCount` from the `useMemo` deps. Use a ref for draftText so panels that need it (Preview, Check) can read the current value without triggering remount. Or split `panelContent` into separate conditionally-rendered components outside useMemo.

### 2. Tab buttons below 44px minimum target

PanelRail tab buttons are 36x36px. WCAG 2.5.8 and the product spec (P1 2.7) require minimum 44x44px touch targets. The gap is 8px.

**Fix:** increase button size to 44x44, or add padding to reach 44px effective target area.

### 3. No Escape key handler on panels

Panels have no keyboard close mechanism. ToolModal has Escape handling, but the side panels (Brief, Tutor, etc.) do not. Pressing Escape while a panel is open does nothing.

**Fix:** add a global keydown listener in PanelRail or CanvasScreen that calls `setActivePanel(null)` on Escape when a panel is open.

### 4. TutorPanel stub responses are context-free

Tutor receives `assessmentTitle` but stub responses do not reference the course, the brief, or the draft content. When LLM is wired, the tutor needs access to the full brief and the current draft. The prop interface should be expanded.

**Not a bug for v1** (stub is intentionally generic), but note for LLM wiring.

### 5. PreviewPanel is plain text only

PreviewPanel renders `draftText` in a `pre-wrap` container. No markdown parsing, no heading/bold rendering, no export buttons. Spec calls for "live submission-ready rendering" but v1 scope defers this.

**Not a bug for v1**, but noted for polish sprint.

## What works correctly

- All 5 tabs are clickable and render the correct panel
- Only one panel is open at a time
- Click same tab again closes the panel (toggle behaviour)
- BriefPanel pulls brief details (weight, wordCountGoal, dueDate) from ProjectContext via CanvasScreen
- BriefPanel shows rubric criteria checklist when extracted, "not parsed" message when rubricDetected but no criteria
- "Decode this brief" opens ToolModal with BriefSimplifier output
- SourcesPanel lists actual sourceFiles from extractionData
- CheckPanel word count bar reads real wordCount from editor
- CheckPanel "Compare against rubric" runs mock keyword analysis on real draftText
- PreviewPanel shows live editor text (when not remounting)
