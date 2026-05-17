# Reference Build Audit
**Date:** 2026-05-17
**Source:** ~/Simplifii-OS_Master/reference-builds/Emergent_AI_Simplifii-beta_MVP_Build-main/

---

## Tools Found

| Tool | File | Quality (1-5) |
|------|------|---------------|
| Brief Simplifier / Scaffolder | backend/routes/tools.py:748 | 5/5 |
| Rubric Simplifier | backend/routes/tools.py:253 | 5/5 |
| Essay Scorer | backend/routes/tools.py:341 | 4/5 |
| Humaniser | backend/routes/tools.py:588 | 4/5 |
| Concept Visualiser | backend/routes/tools.py:996 | 4/5 |
| Hidden Curriculum Decoder | frontend/src/pages/HiddenCurriculumDecoder.js | 3/5 (prompt in frontend) |
| AI Risk Score Calculator | backend/routes/tools.py:25 | 5/5 (unique feature) |

---

## Tool 1: Brief Simplifier / Assessment Scaffolder

**Location:** `backend/routes/tools.py:748`
**System prompt:** "You are Simplifii's Assessment Scaffolder. A student cannot start. The blank page is the problem..."

### What it produces (structured JSON):
- `suggestedStructure`: 5-8 sections with word counts, key questions, starter sentences, common mistakes, rubric criteria links, Bloom's critical thinking prompts
- `beforeYouStart`: 3 preparation steps
- `timeEstimate`: research/planning/writing/editing/buffer breakdown
- `higherOrderScaffolding`: 3 beyond-assessment questions
- `workforceReadiness`: workplace skills connection
- `normalisingMessage`: warm paragraph
- `hiddenExpectations`: implicit requirements
- `documentConnections`: cross-document insights (Call 2)
- `rubricAlignment`: criterion-to-section mapping with "what separates HD from P"
- `thinkingFramework`: Bloom's taxonomy breakdown per assessment

### Key differences from current OS (`api/simplify-brief.js`):
| Feature | Old Build | Current OS |
|---------|-----------|------------|
| Structure output | Full JSON with 5-8 sections, word counts, starter sentences | Free-text week-by-week plan |
| Rubric mapping | Explicit criterion → section mapping | Not present |
| Bloom's taxonomy | Per-section critical thinking prompts | Not present |
| Time estimate | Breakdown with neurodivergent buffer | Not present |
| Document cross-referencing | 2nd LLM call maps connections | Not present |
| Starter sentences | One per section | Not present |
| Hidden expectations | Explicit list | Separate tool |
| Normalising message | Built into output | Not present |

**Quality: Old 5/5, Current OS 2/5**

---

## Tool 2: Rubric Simplifier

**Location:** `backend/routes/tools.py:253`
**System prompt:** "You are a rubric translator. Your job is to read any university rubric and translate it into a clear action plan..."

### What it produces (structured JSON):
- `criteria[]`: every criterion with ALL grade bands using EXACT rubric labels
- Per criterion: `gradeBands[]` with what it looks like + specific evidence
- `microTaskChecklist`: 3-4 actions per criterion
- `selfAssessmentChecklist`: one checkbox per criterion
- `normalisingMessage`: encouraging
- Handles ANY grading scale (HD/D/C/P, Excellent/Good/Satisfactory, numeric, custom)

### Key differences from current OS (`api/decode-rubric.js`):
| Feature | Old Build | Current OS |
|---------|-----------|------------|
| Grade band handling | Reads EXACT labels from rubric, preserves them | Generic "what markers want" |
| Micro-task checklist | 3-4 specific actions per criterion | Not present |
| Self-assessment checklist | One checkbox per criterion | Not present |
| Scale detection | Auto-detects HD/D/C/P vs numeric vs custom | Not present |
| JSON output | Structured, parseable | Free text |

**Quality: Old 5/5, Current OS 3/5**

---

## Tool 3: Essay Scorer

**Location:** `backend/routes/tools.py:341`
**System prompt:** Located in same file (not fully read in this audit)

### What it produces:
- Score per rubric criterion with detected grading scale
- Specific evidence for each score
- What separates current level from next level up

**Quality: Old 4/5, Current OS 3/5**

---

## Tool 4: Humaniser

**Location:** `backend/routes/tools.py:588`
**What it does:** Takes AI-generated text and rewrites to sound like a specific student
**Unique feature:** AI Risk Score calculator (lines 25-100) that measures passive voice ratio, sentence uniformity, transition density, formal phrase density, hedging absence

**Not present in current OS at all.**

---

## Tool 5: AI Risk Score Calculator

**Location:** `backend/routes/tools.py:25`
**What it does:** Computes 0-100 "AI detection risk" from text features:
- Passive voice ratio
- Sentence length uniformity
- Transition word density
- Formal academic phrase density
- First-person absence
- Hedging/colloquial language presence
- Average sentence length

**Not present in current OS. This is a moat feature.**

---

## PRIORITY PORT LIST

| Priority | Tool | Effort | Impact |
|----------|------|--------|--------|
| 1 | **Assessment Scaffolder** (full structured output) | 3h | Transforms Brief Simplifier from generic plan to section-by-section blueprint |
| 2 | **Rubric Simplifier** (grade bands + micro-tasks) | 2h | Makes rubric decoder actually actionable |
| 3 | **AI Risk Score** | 1h | Unique moat feature, no competitor has this |
| 4 | **Humaniser** | 2h | New tool entirely |
| 5 | **Structured JSON output** for all tools | 2h | Enables richer UI rendering |

**Recommendation:** Port the Assessment Scaffolder prompt FIRST. It is the single highest-impact improvement. The structured JSON output with sections, starter sentences, rubric mapping, and Bloom's prompts is dramatically better than the current free-text week-by-week plan.

---

**End of audit. Do not build. Wait for instructions.**
