# BABS1201 Project Blueprint — Ground Truth State Re-Wire

**Version:** 1.0
**Built:** 8 May 2026
**Source documents (verbatim, no paraphrase):**
- `CO_BABS1201_1_2025_Term3_T3_InPerson_Standard_Kensington.pdf` (Course Outline, 15 pages, published 31 Aug 2025)
- `BABS1201 Literature Review Instructions T3.pdf` (6 pages)
- `BABS1201 Literature Review Rubric T3.pdf` (4 pages)

**Purpose:** This document is the canonical source of truth for any AI system providing feedback, grading guidance, or study support to a BABS1201 student. It exists to stop the system inventing a "5% Literature Review" weight and to guarantee the 25% Master Pillar is rendered correctly in every state read.

---

## 1. The Hallucination Diagnosis

The current system is showing Literature Reviews at 5% and dropping the 25% Master Pillar. Three plausible mechanisms, in order of likelihood:

1. **Cross-pillar weight contamination.** The Science Communication Project (a separate 25% pillar, due Week 9) breaks down internally as 10% visual abstract + 10% presentation + **5% question time** (Course Outline p.7). The system is bleeding that 5% into the Literature Review pillar.
2. **Sub-rubric weight confusion.** Inside the Lit Review rubric, the lowest-marked criteria are "Conclusion: 1.0" and "Choice of articles: 2.0" — and the rubric is split into two parts (10 marks + 15 marks). A naive parser collapsing the rubric to a single number would land somewhere in the 1–10 range, easily mistaking it for a percentage of the course.
3. **Part One / Part Two label inversion.** The Course Outline calls the search/process work "Part 1 (15%)" and the writeup "Part 2 (10%)". The Rubric calls them the opposite — "Part One: Mini literature review (10 marks)" and "Part Two: Research process (15 marks)". The numbers (10 + 15) are stable, but a system anchoring on the labels alone will get confused about what each part is.

The fix is structural, not a prompt patch. The state management has to enforce a strict hierarchy where the Course Outline assessment table is the only legal source of pillar weights, and sub-rubric scores can never escape their pillar's namespace.

---

## 2. The Strict Hierarchy

```
COURSE: BABS1201 — Molecules, Cells and Genes (UNSW, T3 2025, 6 UoC)
│
├── PILLAR 1 — Literature Review .................. 25%   [Master Pillar]
│   │   Due: 17 Oct 2025, 17:00 (Week 5) | Format: Individual | Short Extension: Yes (3 days)
│   │   GenAI: Assistance with Attribution | CLO: CLO1
│   │   Word limit: 2000 (excludes references, includes title, subheadings, research process, in-text citations)
│   │
│   ├── SUB-COMPONENT A — Mini Literature Review ........ 10 marks (40% of pillar, 10% of course)
│   │   ├── Introduce the topic .................... 2.0
│   │   ├── Content ................................ 2.0
│   │   ├── Conclusion ............................. 1.0
│   │   ├── Readability ............................ 2.0
│   │   └── References ............................. 3.0
│   │
│   └── SUB-COMPONENT B — Research Process .............. 15 marks (60% of pillar, 15% of course)
│       ├── Relation to course themes .............. 2.0
│       ├── Article selection and information ...... 3.0
│       ├── Choice of articles ..................... 2.0
│       ├── Primary and Secondary literature ....... 4.0
│       └── Documentation process .................. 4.0
│
├── PILLAR 2 — Test 1 ............................ 30%
│   Due: Week 7 (27 Oct - 2 Nov 2025) | Format: Individual, 45 min, MCQ, in lab time
│   GenAI: No Assistance | CLOs: CLO2, CLO3, CLO5
│   Coverage: course content from Weeks 1–5 inclusive
│
├── PILLAR 3 — Science Communication Project .... 25%
│   Due: Week 9 (10-16 Nov 2025) | Format: Individual, ~3 min presentation + visual abstract
│   GenAI: Assistance with Attribution | CLO: CLO1
│   Internal split: visual abstract 10% + presentation 10% + question time 5% = 25%
│   Note: presentation topic must match the Lit Review topic chosen for Pillar 1
│
└── PILLAR 4 — Test 2 ............................ 20%
    Due: Week 10 (17-23 Nov 2025) | Format: Individual, 45 min, MCQ, in lab time
    GenAI: No Assistance | CLOs: CLO4, CLO5
    Coverage: course content from Weeks 7–9 inclusive

PASS RULE: Composite mark ≥ 50 (Course Outline p.10).
LATE PENALTY: 5%/day, capped at 5 days (120hr). After 5 days, submission window closes.
```

**Two non-negotiable invariants:**

- The four pillar weights — **25, 30, 25, 20** — sum to 100. If a system ever reports a pillar weight that isn't one of these four numbers in this exact order, the state has been corrupted.
- A sub-rubric criterion score (anything labelled in marks like "2.0", "3.0", "4.0") is **never** a course-level percentage. Sub-rubric scores live inside their parent pillar's namespace and cannot escape it.

---

## 3. The Label Inversion Trap (lock this down explicitly)

The Course Outline and the Rubric disagree on which part is "Part 1". The system must hold both labels and use the work-content as the canonical key, not the label.

| Canonical key | Course Outline label | Rubric label | Marks | % of pillar | % of course |
|---|---|---|---|---|---|
| `mini_review_writeup` | Part 2 (10%) | Part One (10 marks) | 10 | 40% | 10% |
| `research_process_documentation` | Part 1 (15%) | Part Two (15 marks) | 15 | 60% | 15% |

Any state object referring to the writeup as "Part One" must carry both labels. Never use just "Part 1" or "Part 2" as a key — always use the canonical work-content key.

---

## 4. The State Schema (drop-in for Claude Code)

This is the JSON Claude Code should generate, persist, and read on every state load. It is the single source of truth. Nothing in the system may compute a pillar weight from anywhere else.

```json
{
  "course": {
    "code": "BABS1201",
    "title": "Molecules, Cells and Genes",
    "institution": "UNSW",
    "year": 2025,
    "term": "T3",
    "units_of_credit": 6,
    "pass_rule": "composite_mark >= 50",
    "late_penalty": { "per_day_pct": 5, "cap_days": 5, "after_cap": "submission_closed" },
    "source_doc": "CO_BABS1201_1_2025_Term3_T3_InPerson_Standard_Kensington.pdf",
    "source_doc_published": "2025-08-31"
  },
  "pillars": [
    {
      "id": "P1_literature_review",
      "ordinal": 1,
      "name": "Literature Review",
      "weight_pct": 25,
      "is_master_pillar": true,
      "due_iso": "2025-10-17T17:00:00+11:00",
      "due_label": "17/10/2025 05:00 PM",
      "week": 5,
      "format": "Individual",
      "short_extension_days": 3,
      "genai_policy": "Assistance with Attribution",
      "clos": ["CLO1"],
      "word_limit": 2000,
      "word_limit_excludes": ["reference_list"],
      "word_limit_includes": ["title", "subheadings", "research_process", "in_text_citations"],
      "citation_style": "Harvard",
      "article_requirements": {
        "total": 3,
        "primary": 2,
        "review": 1,
        "review_type": "narrative",
        "review_types_disallowed": ["systematic_review", "meta_analysis"]
      },
      "sub_components": [
        {
          "id": "mini_review_writeup",
          "course_outline_label": "Part 2",
          "rubric_label": "Part One",
          "marks_total": 10,
          "pct_of_pillar": 40,
          "pct_of_course": 10,
          "criteria": [
            { "id": "introduce_the_topic", "max": 2.0 },
            { "id": "content",             "max": 2.0 },
            { "id": "conclusion",          "max": 1.0 },
            { "id": "readability",         "max": 2.0 },
            { "id": "references",          "max": 3.0 }
          ]
        },
        {
          "id": "research_process_documentation",
          "course_outline_label": "Part 1",
          "rubric_label": "Part Two",
          "marks_total": 15,
          "pct_of_pillar": 60,
          "pct_of_course": 15,
          "criteria": [
            { "id": "relation_to_course_themes",       "max": 2.0 },
            { "id": "article_selection_and_information","max": 3.0 },
            { "id": "choice_of_articles",              "max": 2.0 },
            { "id": "primary_and_secondary_literature","max": 4.0 },
            { "id": "documentation_process",           "max": 4.0 }
          ]
        }
      ]
    },
    {
      "id": "P2_test_1",
      "ordinal": 2,
      "name": "Test 1",
      "weight_pct": 30,
      "due_window": { "week": 7, "from": "2025-10-27", "to": "2025-11-02" },
      "format": "Individual, 45 min, multiple-choice, in-class (lab)",
      "genai_policy": "No Assistance",
      "clos": ["CLO2", "CLO3", "CLO5"],
      "coverage": "Weeks 1–5 inclusive"
    },
    {
      "id": "P3_science_communication_project",
      "ordinal": 3,
      "name": "Science Communication Project",
      "weight_pct": 25,
      "due_window": { "week": 9, "from": "2025-11-10", "to": "2025-11-16" },
      "format": "Individual, ~3 min presentation + visual abstract",
      "genai_policy": "Assistance with Attribution",
      "clos": ["CLO1"],
      "topic_constraint": "must_match_pillar_P1_literature_review_topic",
      "internal_split": [
        { "id": "visual_abstract", "weight_pct_of_pillar": 40, "weight_pct_of_course": 10 },
        { "id": "presentation",    "weight_pct_of_pillar": 40, "weight_pct_of_course": 10 },
        { "id": "question_time",   "weight_pct_of_pillar": 20, "weight_pct_of_course":  5 }
      ]
    },
    {
      "id": "P4_test_2",
      "ordinal": 4,
      "name": "Test 2",
      "weight_pct": 20,
      "due_window": { "week": 10, "from": "2025-11-17", "to": "2025-11-23" },
      "format": "Individual, 45 min, multiple-choice, in-class (lab)",
      "genai_policy": "No Assistance",
      "clos": ["CLO4", "CLO5"],
      "coverage": "Weeks 7–9 inclusive"
    }
  ],
  "course_learning_outcomes": {
    "CLO1": { "text": "Communicate findings from scientific literature to different audiences using verbal and written formats.", "assessed_in": ["P1_literature_review", "P3_science_communication_project"] },
    "CLO2": { "text": "Identify and compare different cell types and their structures and functions.", "assessed_in": ["P2_test_1"] },
    "CLO3": { "text": "Describe the structures of the macromolecules proteins, fats and carbohydrates, and their metabolism including the processes for energy generation in cells.", "assessed_in": ["P2_test_1"] },
    "CLO4": { "text": "Describe the structures of genetic material, the processes involved in cell division and gene expression, and how this applies to genetic inheritance and evolution.", "assessed_in": ["P4_test_2"] },
    "CLO5": { "text": "Demonstrate a knowledge of the techniques and safe work practices required in a biological laboratory, including use of the light microscope, related calculations and basic molecular biology methods.", "assessed_in": ["P2_test_1", "P4_test_2"] }
  },
  "data_integrity_rules": {
    "valid_pillar_weights": [25, 30, 25, 20],
    "valid_pillar_weights_sum": 100,
    "rubric_criterion_scores_are_never_pillar_weights": true,
    "course_outline_wins_on_conflict": true,
    "no_pillar_weight_may_be_inferred_from_a_different_pillars_subcomponent": true
  }
}
```

**Filename:** save this object to `babs1201_assessment_schema.json` in the project root.

---

## 5. Anti-Hallucination Guardrails (state-management rules for Claude Code)

These run inside the read path. Any violation must throw, not silently coerce.

1. **Pillar weights are read-only.** They originate only from `course.pillars[*].weight_pct` and must equal one of `[25, 30, 25, 20]` in that exact order by `ordinal`. Any code path that recomputes, infers, or guesses a pillar weight from rubric data, sub-component marks, or LLM output is forbidden.
2. **No cross-pillar bleeding.** The 5% inside `P3_science_communication_project.internal_split.question_time` may never appear as the weight of `P1_literature_review` or any of its sub-components. The path separator (`P3.internal_split.*`) is the namespace boundary.
3. **No sub-rubric score can become a pillar weight.** If the rendered output ever shows the Lit Review pillar at 1, 2, 3, 4, 5, or 10 percent, the state has been corrupted by sub-rubric leakage. Reject and refuse to render.
4. **The Master Pillar render check.** Every page that lists assessments must render `P1_literature_review` at exactly **25%** with the label "Literature Review". A unit test should assert this on every state load.
5. **The label-inversion lock.** Sub-components are addressed by their canonical id (`mini_review_writeup`, `research_process_documentation`), never by "Part 1" / "Part 2". When displaying the label to the user, render both: e.g., "Mini Literature Review (Course Outline 'Part 2' / Rubric 'Part One') — 10 marks".
6. **GenAI attribution match.** The system must never tell a student that GenAI is forbidden in the Lit Review or that it is fully open. The exact policy is "Assistance with Attribution" — first iteration must be the student's own, then GenAI may be used to improve, with full referencing of any AI output included in the submission. Tests 1 and 2 are the opposite ("No Assistance"). Wrong policy advice is a high-severity failure.
7. **Narrative review only.** When discussing the review article requirement, the system must specify "narrative review" and explicitly disallow systematic reviews and meta-analyses. This is a frequently-asked clarification in the source instructions and getting it wrong has caused student rework.

---

## 6. The AU Karen Voice — Feedback Narration Layer

The narrator wraps rubric output. It does not generate rubric data. It cannot invent a criterion, a score, or a weight; it can only re-voice what the schema returned.

**Voice principles**

- Australian English spelling and rhythm. "Organised", "synthesise", "behaviour", "no worries", "right then", "look".
- Direct, warm, unflinching. Karen tells you the truth before she softens it. She doesn't bury the bad news in a sandwich.
- Specific over general. Always cite the rubric criterion by name and the score band before the commentary.
- No corporate hedge-words: avoid "leverage", "stakeholder", "value-add", "moving forward". No American academic register.
- No emoji, no exclamation point inflation. One exclamation max per response, and only if it lands.
- Reads at BABS1201 level — first-year undergrad biology. No PhD-level vocabulary unless the source content uses it.

**Mandatory output structure for any feedback render**

```
[Pillar context line]   "Right, this is your Literature Review — 25% of the course, the big one."
[Sub-component context]  "Looking at the Mini Review writeup (10 marks of the 25)…"
[Criterion + band]       "Introduce the topic — sitting in Satisfactory at 1.0 of 2.0."
[What's actually wrong]  Specific, evidence-based note tied to the criterion descriptor.
[The fix]                One actionable change, max two sentences.
[Encouragement floor]    Never optional. One line. Real, not chirpy.
```

**Worked example (using only schema data, no invention):**

> Right, the Lit Review is the Master Pillar — 25% of your course mark, so this one matters.
>
> On the Mini Review writeup (worth 10 of those 25 marks), here's where you're sitting:
>
> **Introduce the topic — Satisfactory, 1.0 / 2.0.** Your title's a bit general and the intro doesn't tell the marker how the review is going to be structured. Quick fix: rewrite the title so it names the specific angle you're taking, then add one sentence at the end of the intro that says "First I'll cover X, then Y, then Z." That'll lift you to Very Good.
>
> **References — Excellent, 3.0 / 3.0.** All three articles in, two primary and one narrative review, Harvard formatting holding up. Don't touch this section.
>
> One thing at a time — fix the intro structure first, the rest is already strong.

**Forbidden Karen patterns (do not generate):**

- "Great job!" with no specific evidence.
- "Consider thinking about…" — Karen tells, doesn't suggest from a distance.
- Any score, weight, or criterion not present in the schema.
- US English: "color", "behavior", "organize" — flag at lint time.
- "Per the rubric…" — Karen says "Looking at the rubric…" or "On [criterion]…".

---

## 7. Verification Suite (Claude Code must implement)

Run these on every build. Failing any one is a release-blocker.

```
TEST_01: assert pillars[0].weight_pct == 25 and pillars[0].name == "Literature Review"
TEST_02: assert sum(p.weight_pct for p in pillars) == 100
TEST_03: assert all(p.weight_pct in [25,30,25,20] for p in pillars)
TEST_04: assert "5" not in str(pillars[0].weight_pct)            # the headline hallucination
TEST_05: render_assessment_page() must contain literal string "Literature Review" and "25%" on the same line
TEST_06: feedback_for(P1, "introduce_the_topic", score=1.0) must cite criterion name + score band before commentary
TEST_07: au_karen_lint(any_feedback_string) must not contain ["color","behavior","organize","leverage","stakeholder"]
TEST_08: any pillar weight rendered as 5%, 10%, or 15% triggers a HIGH severity alert (these are sub-component values that have escaped namespace)
TEST_09: P1.article_requirements.review_type == "narrative" AND "systematic_review" in disallowed list
TEST_10: P1.genai_policy == "Assistance with Attribution" (not "No Assistance", not "Full assistance")
```

---

## 8. Handoff Prompt for Claude Code

Paste the block below into Claude Code, with this Blueprint and `babs1201_assessment_schema.json` in the working directory.

> **Mission:** Re-wire BABS1201 state management to eliminate Literature Review weight hallucination.
>
> **Source of truth:** `babs1201_assessment_schema.json`. Treat this file as immutable. Never compute a pillar weight from anywhere else.
>
> **What to build:**
> 1. A typed loader (`assessmentSchema.ts` or equivalent) that parses the schema, validates the data integrity rules in section `data_integrity_rules`, and exports read-only accessors. Mutation paths should not exist.
> 2. Replace any existing assessment-state computation with reads against this loader. Search the codebase for hard-coded weights (regex like `/\b(5|10|15|20|25|30)\s*%/`) and audit each match — most should be removed and replaced with `getPillarWeight(id)`.
> 3. Implement the 10 verification tests in section 7 as unit tests. Run them in CI.
> 4. Wrap any feedback-generation function in the AU Karen narrator layer (section 6). The narrator must take structured rubric output as input and render strings — it must never call out to an LLM to invent rubric data. The lint rules in TEST_07 must run on the narrator's output before it's returned.
> 5. Add a runtime assertion at the top of the assessment-page render: if `P1_literature_review.weight_pct !== 25`, throw and surface a "Source of truth corrupted — do not trust this view" banner instead of rendering.
>
> **What not to do:**
> - Do not fetch the schema from a network endpoint. It's a local file. Bundle it.
> - Do not let any LLM call return pillar weights, sub-component marks, due dates, or GenAI policies. The LLM's only job is voicing the AU Karen wrapper around already-fetched data.
> - Do not modify the schema's structure to fit existing code shapes — refactor the code to fit the schema.
>
> **Verification before you call this done:**
> - All 10 tests pass.
> - Manually open the assessment page and confirm Literature Review renders at 25% with the label "Literature Review".
> - Trigger a feedback render for `P1.mini_review_writeup.introduce_the_topic` at score 1.0 and confirm the AU Karen voice lands per section 6's worked example.

---

## 9. What this Blueprint deliberately does not do

- Does not list the topic options for the Lit Review — that's in the Moodle Assessment Hub (Course Outline p.5), not in any of the three uploaded PDFs.
- Does not specify staff email/phone/office — the Course Outline (p.13) has those columns blank.
- Does not include the popular-science articles tied to each topic — same reason.
- Does not extend the rubric beyond the 25-mark Lit Review pillar. Rubrics for Test 1, Sci Comm, Test 2 weren't uploaded. If the system needs them, those PDFs need to be sourced from the Moodle Assessment Hub and added as siblings to `babs1201_assessment_schema.json` before any Test 1, Sci Comm, or Test 2 feedback paths are wired.

---

*End of Blueprint. Single source. No paraphrase. No invention.*
