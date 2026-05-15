# HSC Exam Structural Patterns (2023-2024)

Analysis of NESA HSC past papers and marking feedback across 8 subjects for the 2023-2024 examination years. Patterns derived from official NESA exam pack pages hosted on nsw.gov.au.

## Data Source

All data scraped from the NSW Government NESA curriculum portal:
`https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/{subject}/{year}`

The original NESA URL (`educationstandards.nsw.edu.au`) now redirects to the NSW Government site.

---

## 1. Document Architecture Per Subject

Every HSC exam pack consistently provides three document types:

| Document | Format | Purpose |
|----------|--------|---------|
| Exam paper | PDF | The actual examination |
| Marking guidelines | PDF | Criteria tables with mark ranges; sample answers |
| Marking feedback | Inline HTML or PDF | Per-question "better responses" and "areas to improve" |

### Paper Count by Subject Category

| Category | Papers per year | Notes |
|----------|----------------|-------|
| English Advanced | 2 (Paper 1 + Paper 2) | Split by module focus |
| Sciences (Biology, Chemistry, Physics) | 1 | Single combined paper |
| Mathematics Advanced | 1 | Single paper, Section I (MC) + Section II (extended) |
| Humanities (Modern History, Economics, Legal Studies) | 1 | Single paper, multiple sections |

---

## 2. Common Section Structures

### Sciences (Biology, Chemistry, Physics)

- **Section I**: Multiple choice (typically 20 questions, 20 marks)
- **Section II**: Short answer and extended response (typically questions 21-35, 60 marks)
- Total: 80 marks
- Question numbering in Section II is sequential from 21 upward
- Questions escalate in difficulty and mark value through the section
- Biology 2024 Section II ranged from Q21 (simple identification, 2-4 marks) through Q35 (extended response requiring data interpretation)

### Mathematics Advanced

- **Section I**: Multiple choice (objective response)
- **Section II**: Free response / extended working (feedback provided separately as PDF)
- Marking feedback is provided as a separate PDF specifically for Section II
- Emphasis on "showing all working" and correct units

### English Advanced

- **Paper 1**: Texts and Human Experiences
  - Section I: Unseen texts (short response questions Q1-Q5, escalating from single-text to comparative analysis)
  - Section II: Extended response on prescribed text
- **Paper 2**: Three modules
  - Section I: Textual Conversations (Module A) - essay
  - Section II: Critical Study of Literature (Module B) - essay with prescribed text options (prose, poetry, drama, nonfiction, film, media, Shakespeare)
  - Section III: The Craft of Writing (Module C) - creative/discursive writing from stimulus

### Modern History

- **Section I**: Power and Authority in the Modern World 1919-1946 (source-based questions Q1-Q3, escalating marks)
- **Section II**: National Studies (choice of countries, two-part questions with evaluation/judgement)
- **Section III**: Peace and Conflict (choice of conflicts, two-part questions)
- **Section IV**: Change in the Modern World (three-part questions: (a) describe, (b) discuss with source, (c) evaluate/judge)

### Economics

- **Section II**: Short answer (Q21-Q24, multi-part questions with sub-parts a/b/c)
- **Section III**: Extended response (Q25-Q26, single-question essays)
- **Section IV**: Extended response (Q27-Q28, single-question essays)
- Strong emphasis on diagrams, data, and economic terminology

### Legal Studies

- **Section II**: Short answer (Q21-Q25, escalating from definition to evaluation)
- **Section III**: Extended response (Q25-Q31, paired questions (a) and (b) per topic option)
- Heavy emphasis on legislation, case law, and legal terminology

---

## 3. Mark Allocation Patterns

### Escalation Pattern (Sciences)

Questions within Section II follow a consistent escalation:
- Early questions (Q21-Q23): 2-4 marks each, testing recall and basic application
- Middle questions (Q24-Q29): 4-6 marks, requiring explanation and data interpretation
- Late questions (Q30-Q35): 6-9 marks, demanding synthesis, evaluation, and extended writing

### Multi-Part Pattern (Humanities)

Humanities subjects use a consistent multi-part structure within questions:
- Part (a): Lower marks (3-5), typically "describe", "outline", or "explain"
- Part (b): Higher marks (6-8), typically "discuss", "evaluate", or "assess"
- Part (c): Where present, highest marks (8-10), requiring sustained judgement

### Essay-Based Pattern (English, History)

Extended responses typically worth 15-20 marks each, assessed holistically against criteria bands rather than point-by-point.

---

## 4. Question Type Taxonomy

Based on marking feedback keywords, the following question types recur across subjects:

| Directive Verb | Frequency | Subjects Using | Expected Response |
|---------------|-----------|----------------|-------------------|
| Describe | High | All | Characteristics and features |
| Explain | High | All | Cause-effect relationships |
| Outline | High | Sciences, History | Brief account of main points |
| Discuss | High | Humanities | Arguments for/against with evidence |
| Evaluate | High | History, Legal, Economics | Judgement with criteria and evidence |
| Assess | Medium | English, Legal | Weigh up and make judgement |
| Analyse | Medium | English, Economics | Break down and examine components |
| Compare | Medium | English, Sciences | Similarities and differences |
| Calculate | Sciences/Maths only | Sciences, Maths | Numerical answer with working |
| Account for | Low | History, Economics | Explain reasons for |

---

## 5. Marking Feedback Patterns

### Universal Feedback Themes

These themes appear in marking feedback across virtually every subject:

1. **Read the question carefully** - appears in general feedback for all subjects
2. **Use appropriate terminology** - subject-specific vocabulary is consistently rewarded
3. **Support with evidence** - textual references, data, examples, case law
4. **Sustain judgement/argument** - not just stating a position but maintaining it throughout
5. **Address all parts** - multi-part questions require coverage of every component
6. **Avoid pre-prepared responses** - explicit warning in History, English, Economics
7. **Plan extended responses** - using the planning page in the answer booklet

### Subject-Specific Feedback Patterns

**Sciences**: Markers consistently flag:
- Confusion between similar concepts (reliability vs validity vs accuracy)
- Failure to reference stimulus material
- Not showing working in calculations or including units
- Describing rather than explaining processes

**English Advanced**: Markers consistently flag:
- Technique-spotting without linking to meaning
- Plot-driven responses rather than conceptual arguments
- Failure to sustain a personal voice
- Imbalanced treatment of paired texts

**Modern History**: Markers consistently flag:
- Narrative recounting instead of analytical argument
- Responses driven by events rather than cause/consequence
- Failing to cover the full time period specified
- Not integrating source material

**Economics**: Markers consistently flag:
- Lack of cause-and-effect chains
- Missing diagrams or incorrectly labelled diagrams
- Confusing similar concepts (e.g., bilateral vs multilateral agreements)
- Not using contemporary data/examples

**Legal Studies**: Markers consistently flag:
- Vague descriptions instead of specific legal responses
- Missing legislation references and case law
- Confusing state and federal jurisdiction
- Issues-based narratives without legal analysis

---

## 6. Structural Consistency Observations

### Consistent Across All Subjects (2023-2024)

- Every exam pack includes paper + marking guidelines as a minimum
- Marking guidelines use criteria tables with mark ranges (not point-per-point)
- Sample answers are described as "not intended to be exemplary or complete"
- Marking feedback is structured as "In better responses, students were able to" followed by "Areas for students to improve include"
- Each exam pack page links to the relevant syllabus document

### PDF Naming Convention

NESA uses a consistent PDF naming pattern:
```
{year}-hsc-{subject-slug}[-paper-N][-mg][-cc].pdf
```
- `-mg` suffix = marking guidelines
- `-cc` suffix = copyright-cleared version (used for some 2024 papers)
- Paper numbers only for English (Paper 1, Paper 2)

### URL Pattern

All exam pack pages follow:
```
https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/{subject-slug}/{year}
```

Subject slugs: `biology`, `mathematics-advanced`, `english-advanced`, `modern-history`, `chemistry`, `physics`, `economics`, `legal-studies`

---

## 7. Implications for Test Corpus Design

1. **Question generation** should follow the escalation pattern: start with recall/identification, progress to explanation, end with synthesis/evaluation
2. **Mark allocation** should mirror NESA bands: 2-4 for short answer, 5-8 for structured response, 8-20 for extended response
3. **Marking criteria** should use the band descriptor model rather than checklist marking
4. **Stimulus materials** (sources, data, diagrams) are integral to most questions beyond basic recall
5. **Subject-specific vocabulary** is a key discriminator in marking -- terminology lists per subject would enhance test quality
6. **The "better responses" / "areas to improve" structure** from marking feedback provides a ready-made rubric template for any generated assessment
