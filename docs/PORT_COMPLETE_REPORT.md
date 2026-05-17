# Port Complete Report
**Date:** 2026-05-17
**Source:** Emergent_AI_Simplifii-beta_MVP_Build-main/backend/routes/tools.py

---

## PORT 1: Assessment Scaffolder (api/simplify-brief.js)

| | Before | After |
|---|---|---|
| **Prompt** | Generic "week-by-week plan with checkboxes" | "You are Simplifii's Assessment Scaffolder. A student cannot start. The blank page is the problem." |
| **Output format** | Free-text markdown | Structured JSON |
| **Sections** | Generic weeks | 5-8 named sections with word counts |
| **Starter sentences** | None | One per section |
| **Rubric mapping** | None | Criterion → section with HD vs P difference |
| **Bloom's prompts** | None | One per section (Analyse/Evaluate/Create) |
| **Time estimate** | None | Research/planning/writing/editing/neurodivergent buffer |
| **Normalising message** | None | Warm paragraph acknowledging difficulty |
| **Hidden expectations** | None | Implicit requirements listed |
| **Commit** | `918b59c2` | |

---

## PORT 2: Rubric Simplifier (api/decode-rubric.js)

| | Before | After |
|---|---|---|
| **Prompt** | "Translate into what it means / top response / avoid" | "Read any rubric and translate into a clear action plan. Handle ANY grade scale." |
| **Output format** | Free-text markdown | Structured JSON |
| **Grade bands** | Not extracted | Every band with EXACT labels from rubric |
| **Scale detection** | None | Auto-detects HD/D/C/P vs numeric vs custom |
| **Micro-tasks** | None | 3-4 specific actions per criterion |
| **Self-assessment** | None | One question per criterion |
| **Normalising message** | None | Warm paragraph |
| **max_tokens** | 2000 | 2500 |
| **Commit** | `3e9047ac` | |

---

## PORT 3: AI Risk Score (api/score-essay.js)

| | Before | After |
|---|---|---|
| **AI detection** | Not present | 0-100 risk score computed from text analysis |
| **Metrics** | N/A | Passive voice, sentence uniformity, transition density, formal phrases, first-person absence |
| **Labels** | N/A | Low (0-30), Medium (31-60), High (61-100) |
| **Suggestions** | N/A | Specific humanising suggestions per flagged metric |
| **LLM cost** | N/A | Zero (pure server-side text analysis) |
| **Commit** | `02b0410e` | |

---

## PORT 4: Humaniser (api/humanise.js) - NEW ENDPOINT

| | Before | After |
|---|---|---|
| **Endpoint** | Did not exist | POST /api/humanise |
| **With voice sample** | N/A | Matches student's specific writing style |
| **Without sample** | N/A | Generic naturalisation (reduce AI markers) |
| **Changes** | N/A | Passive→active, vary lengths, add hedging, remove cliches, add first-person |
| **Output** | N/A | { humanisedText, changesExplained } |
| **Commit** | `7348c957` | |

---

## Summary

4 API endpoints upgraded. Zero UI changes. Zero CanvasScreen changes.
All structured JSON outputs are backwards-compatible (old `plan`/`decoded`/`feedback` fields preserved alongside new structured fields).

**What AURA can now surface contextually:**
- "Your scaffold is ready" → shows structured section blueprint
- "Your rubric decoded" → shows grade bands + micro-tasks
- "Your AI risk is 72%" → shows humanising suggestions
- "Want me to make this sound more like you?" → runs humaniser

**Next:** UI components to render the structured JSON beautifully. But that requires CanvasScreen refactor (deferred).
