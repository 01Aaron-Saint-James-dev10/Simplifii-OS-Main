# TOOLS_SPEC — 17-Tool Roadmap

**Branch:** v2-rebuild-canvas-first
**Created:** 14 May 2026
**Status:** Source of truth for all canvas tools. Implementation order is binding.

---

## 1. Tool Tiers

### Tier 1 (v1: stubbed in Screen 4 Tools panel)

| # | Tool | Description | Input | Output | Service file | Order |
|---|------|-------------|-------|--------|-------------|-------|
| 1 | Brief Simplifier | **SHIPPED, backend wired.** Decodes assessment brief into weekly plan, jargon glossary, and hidden curriculum. Anthropic API (claude-sonnet-4-6) with mock fallback. | `{ assessmentBrief, courseContext }` | `{ weeklyTasks, rubricAlignment, jargonDecoded, hiddenCurriculum }` | `BriefSimplifierService.js` | 1 |
| 2 | Rubric Translator | **SHIPPED, backend wired.** Translates rubric criteria into plain language with "what the marker wants". Anthropic API (claude-sonnet-4-6) with mock fallback. | `{ rubricCriteria, rubricBands }` | `{ plainCriteria: [{ original, simplified, whatMarkerWants }] }` | `RubricTranslatorService.js` | 2 |
| 3 | Scaffolder | Generates micro-tasks (15-30 min) per assessment section via backwards planning | `{ sectionType, brief }` | `Array<{ id, label, estimatedMinutes, status }>` | `ScaffolderToolService.js` | 3 |
| 4 | Check against rubric | Compares draft text against rubric criteria, identifies gaps and suggestions | `{ draftText, rubricCriteria, targetWords }` | `{ overallScore, criteriaResults: [{ criterion, found, missing, suggestion }], wordAnalysis }` | `CheckAgainstRubricService.js` | 4 |

### Tier 2 (next nodes: backend one at a time)

| # | Tool | Description | Input | Output | Service file | Order |
|---|------|-------------|-------|--------|-------------|-------|
| 5 | Essay Scorer | Scores draft against rubric, identifies specific gaps per criterion | `{ draftText, rubricCriteria, assessmentBrief }` | `{ overallBand, criterionScores: [{ criterion, band, feedback }], gaps }` | `EssayScorerService.js` | 5 |
| 6 | Humaniser | Protects neurodivergent writing from AI false-positives in detection tools | `{ draftText, writingProfile }` | `{ flaggedPhrases, rewriteSuggestions, ndPatternNotes }` | `HumaniserService.js` | 6 |
| 7 | Authenticity Report | Per-submission AI risk score with ND writing pattern flags. Flagship moat. | `{ courseId, assessmentTitle, draftText }` | `{ humanPercent, aiAssistedPercent, timeline, ndFlags, hash }` | `AuthenticityReportService.js` | 7 |

### Tier 3 (productivity)

| # | Tool | Description | Input | Output | Service file | Order |
|---|------|-------------|-------|--------|-------------|-------|
| 8 | Focus Planner | Pomodoro-based daily schedule, weekly load 1-10, breathing room (green/amber/red) | `{ courses, preferences }` | `{ dailyPlan, weeklyLoad, breathingRoom }` | `FocusPlannerService.js` | 8 |
| 9 | Bibliography Organiser | Manages references with detected citation style | `{ sources, referencingStyle }` | `{ formattedRefs, inTextCitations, missingFields }` | `BibliographyService.js` | 9 |
| 10 | Concept Visualiser | Visual learning aid: concept maps from text | `{ text, sectionType }` | `{ nodes, edges, clusters }` | `ConceptVisualiserService.js` | 10 |

### Tier 4 (collaboration and semester-wide)

| # | Tool | Description | Input | Output | Service file | Order |
|---|------|-------------|-------|--------|-------------|-------|
| 11 | Collaborative Workspace | Body doubling with invited friends | `{ sessionId, participants }` | `{ activeUsers, sharedTimer, chatMessages }` | `CollaborativeService.js` | 11 |
| 12 | Lecture Slides Mapper | Connects lecture content to assignment sections | `{ lectureText, assessmentBrief }` | `{ mappings: [{ slide, relevantSection }] }` | `LectureMapperService.js` | 12 |
| 13 | Presentation Script Generator | Generates spoken script from slides or notes | `{ slides, targetMinutes }` | `{ script, timingNotes, speakerCues }` | `PresentationScriptService.js` | 13 |
| 14 | Course Planner | Full semester schedule with Life Balance inputs | `{ courses, workHours, commute, sleepGoal, personalCommitments }` | `{ weeklySchedule, conflictWarnings, balanceScore }` | `CoursePlannerService.js` | 14 |
| 15 | My Analytics | Personal study patterns across courses | `{ userId, dateRange }` | `{ dailyMinutes, peakHours, streakDays, focusScore }` | `AnalyticsService.js` | 15 |
| 16 | Learning Journey | History of authentic work across semesters | `{ userId }` | `{ timeline, milestones, growthAreas }` | `LearningJourneyService.js` | 16 |
| 17 | Neurotype Dashboard | Strengths/challenges profile for self-understanding | `{ profile, historyEvents }` | `{ strengths, challenges, strategies, accommodations }` | `NeurotypeDashboardService.js` | 17 |

---

## 2. HistoryOfThought Event Vocabulary

All events share the base shape: `{ event_type, user_id, stream_id, payload }`.

Payload always includes `{ courseId, assessmentTitle, timestamp }` plus tool-specific fields.

| Event type | Fires when | Payload extras |
|-----------|------------|----------------|
| `text_edit` | Autosave in CanvasEditor | `{ wordCount }` |
| `brief_simplifier_run` | Brief Simplifier completes | `{ weekCount, jargonCount }` |
| `rubric_check` | Student self-assesses against a rubric criterion | `{ criterionIndex, selectedBand }` |
| `rubric_check_complete` | All criteria self-assessed | `{ criteriaCount, avgBand }` |
| `subtask_complete` | Sub-task checked off in SectionRail | `{ subtaskId, sectionType }` |
| `subtask_uncomplete` | Sub-task unchecked in SectionRail | `{ subtaskId, sectionType }` |
| `check_against_rubric_run` | Check panel analysis completes | `{ overallScore, gapCount }` |

---

## 3. Architecture Notes

### ToolModal pattern

All tools render inside a shared `ToolModal.jsx` shell:
- Props: `title`, `statusBadge` ('alpha'|'beta'), `description`, `children`, `onClose`
- Focus trap, Escape closes, `role="dialog"`, `aria-modal="true"`
- Reused by all 17 tools as they come online

### Service contract pattern

Every service stub defines:
1. The async function signature with typed input
2. The exact return shape (mock matches real)
3. A `// TODO: wire to /api/tools/<name>` comment with the API endpoint
4. A mock implementation that returns realistic data
5. HistoryOfThought event logging where applicable

When backend lands, only the function body changes. UI stays untouched.
