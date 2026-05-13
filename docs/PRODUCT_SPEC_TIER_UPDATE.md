# Simplifii Product Spec — v2 (Tier-Aware Update)

**Updated:** 13 May 2026  
**This document replaces sections 7, 8, 9, 11, 12 of the original v2 spec.** Everything else stands.

The core insight: every education tier uses different language, different units of work, different assessment models, different cadences. The product is universal because it adapts at setup. The data pipeline is the same. The presentation, language, and structure shift by tier.

---

## Section 7 — First-time setup (revised)

**Purpose:** Collect what the system needs to personalise everything else. Each tier has its own setup path beyond the first two questions.

### 7.1 Universal questions (every tier sees these)

**Q1. What is your name?** Text field.

**Q2. What level are you studying at?** Single-select, tier picker:
- Primary school (F to Year 6)
- High school junior (Years 7 to 10)
- High school senior (Years 11 to 12)
- TAFE or vocational training
- University undergraduate
- University postgraduate
- Other (free text)

The answer to Q2 routes the rest of the setup. The next questions are tier-specific.

---

### 7.2 Primary school path (F-Year 6)

The student or their parent is filling this out. Language stays simple.

- **Q3.** What year are you in? *Single-select F, 1, 2, 3, 4, 5, 6*
- **Q4.** What school do you go to? *Text with autocomplete from AU primary schools*
- **Q5.** What term are you in? *Term 1 / 2 / 3 / 4*
- **Q6.** What subjects do you need help with? *Multi-select: English, Maths, Science, HASS, Health & PE, The Arts, Technologies, Languages*
- **Q7.** What helps you focus best? *Multi-select (same options as universal)*
- **Q8.** What feels hardest at school? *Multi-select tailored for primary: Reading / Writing / Spelling / Maths problems / Remembering instructions / Sitting still / Finishing things*

What the primary product calls a "task": **homework, reading, project**. Not "assessment".

---

### 7.3 High school junior path (Years 7-10)

- **Q3.** What year are you in? *Single-select 7, 8, 9, 10*
- **Q4.** What state or territory? *NSW / VIC / QLD / WA / SA / TAS / ACT / NT*
- **Q5.** What school do you go to? *Text with autocomplete*
- **Q6.** What term are you in? *Term 1 / 2 / 3 / 4*
- **Q7.** What subjects are you taking? *Multi-select from 8 learning areas + electives*
- **Q8.** What helps you focus best? *(same as universal)*
- **Q9.** What feels hardest? *Multi-select: Starting assignments / Finishing them / Staying organised / Reading long texts / Group work / Tests / Knowing what teachers want*

What this tier calls a "task": **assignment, test, homework, project**.

---

### 7.4 High school senior path (Years 11-12)

This is the high-stakes tier. State-specific.

- **Q3.** What year are you in? *Year 11 / Year 12*
- **Q4.** What state or territory? *Determines certificate: NSW=HSC, VIC=VCE, QLD=QCE, WA=WACE, SA=SACE, TAS=TCE, ACT=ACT SSC, NT=NTCET*
- **Q5.** What school do you go to? *Text with autocomplete*
- **Q6.** What term or semester are you in? *State-specific. VIC=Semester 1/2, NSW=Term 1-4, QLD=Unit 1/2 (Year 11) or Unit 3/4 (Year 12), etc.*
- **Q7.** What subjects are you taking? *Multi-select from state-specific subject list*
- **Q8.** Are you aiming for an ATAR? *Yes / No / Not sure*
- **Q9.** What helps you focus best? *(same as universal)*
- **Q10.** What feels hardest? *Multi-select: Internal assessments (SACs/IAs) / External exams / Trial exams / Long-form essays / Critical analysis / Time management / Saying what I mean*

What this tier calls a "task":
- VCE: **SAC (School-Assessed Coursework), SAT (School-Assessed Task), exam**
- HSC: **assessment task, trial exam, HSC exam**
- QCE: **IA1, IA2, IA3, EA (external assessment)**
- SACE: **Stage 1 or Stage 2 assessment**
- WACE: **course work, exam**

The system adapts terminology based on the state selected at Q4. Other states use their certificate's language.

---

### 7.5 TAFE / vocational path

Competency-based. No percentage weights. No "courses".

- **Q3.** What qualification are you working on? *Cert I, II, III, IV, Diploma, Advanced Diploma*
- **Q4.** Which TAFE or RTO? *Text with autocomplete*
- **Q5.** What's the qualification called? *Free text — e.g. "Certificate IV in Training and Assessment"*
- **Q6.** Roughly when did you start? *Date picker — TAFE is often self-paced, so no fixed term*
- **Q7.** What units are you currently working on? *Free text — students can add unit codes (e.g. TAEASS502) and titles*
- **Q8.** What helps you focus best? *(same as universal)*
- **Q9.** What feels hardest? *Multi-select tailored for VET: Practical demonstrations / Written reflections / Workplace evidence / RPL paperwork / Theory questions / Time management*

What this tier calls a "task": **unit of competency, assessment task, demonstration, workplace evidence**.

What this tier does **NOT** have: percentage weights, ATAR, exam weeks. Pareto filter is disabled. Replaced with "what's overdue?" filter.

---

### 7.6 University undergraduate path

- **Q3.** Which university? *Text with autocomplete from AU unis*
- **Q4.** What's your degree? *Free text — e.g. "Bachelor of Science (Molecular Biology)"*
- **Q5.** What year of the degree are you in? *Single-select Year 1 / 2 / 3 / 4 / 5+*
- **Q6.** Does your uni run trimesters or semesters? *Single-select Trimesters (UNSW, etc.) / Semesters (most AU unis)*
- **Q7.** Which trimester/semester are you in? *Single-select 1 / 2 / 3 (trimester) or 1 / 2 (semester)*
- **Q8.** How many courses are you enrolled in this term? *Number 1-8*
- **Q9.** What helps you focus best? *(same as universal)*
- **Q10.** What feels hardest? *Multi-select: Reading academic papers / Writing long essays / Citing sources / Lab reports / Group projects / Exams / Knowing what's actually being asked*

What this tier calls a "task": **course, assignment, exam, lab, presentation, thesis chapter**.

---

### 7.7 University postgraduate path

- **Q3.** Which university? *Text with autocomplete*
- **Q4.** What program? *Text — e.g. "MRes Education", "PhD Molecular Biology", "Masters of Public Health (coursework)"*
- **Q5.** Is your program coursework, research, or mixed? *Single-select*
- **Q6.** If coursework or mixed — what semester/trimester are you in? *Single-select*
- **Q7.** If research or mixed — what stage of your thesis are you in? *Single-select: Proposal / Literature review / Data collection / Analysis / Writing / Submitting / Revisions*
- **Q8.** Who is your supervisor? *Text (optional, helps with reminder cadence)*
- **Q9.** What helps you focus best? *(same as universal)*
- **Q10.** What feels hardest? *Multi-select postgrad-specific: Writing thesis chapters / Reading dense literature / Managing supervisor feedback / Research design / Ethics applications / Writing for publication / Defending my work*

What this tier calls a "task": **coursework assignment, thesis chapter, supervisor meeting, ethics application, conference paper**.

---

### 7.8 What changes after setup

The tier choice from Q2 sets these defaults across the product:

- **Home screen heading**: "Your courses" (uni) vs "Your subjects" (school) vs "Your units" (TAFE) vs "Your work" (primary)
- **Card title**: "Course" vs "Subject" vs "Unit of competency" vs "Subject"
- **Assessment language**: "Assignment", "Task", "Assessment", "SAC", "IA", "Unit task", etc.
- **Weight display**: Percentage shown for uni and senior secondary. Not shown for primary, secondary junior, or TAFE.
- **Pareto sort logic**:
  - Uni and senior secondary: sort by % weight (highest first)
  - Primary and secondary junior: sort by due date only
  - TAFE: sort by due date only, no weight
- **AI Tutor voice**: tier-aware. A Year 4 student gets simpler explanations than a postgrad. The tutor's prompt template changes per tier.
- **Authenticity Report tone**: tier-aware. A primary report is friendly and shows effort. A postgrad report is formal and detailed.
- **Vocabulary throughout**: no "assessment brief" for primary. No "course" for TAFE. No "rubric bands" for primary. Etc.

---

## Section 8 — Course list (renamed: home screen)

**Purpose:** Show every unit of study the student has uploaded. The label of "unit of study" depends on tier.

### 8.1 Heading by tier

- Primary: "Your subjects"
- Secondary junior: "Your subjects"
- Senior secondary: "Your subjects"
- TAFE: "Your units"
- Uni undergrad: "Your courses"
- Uni postgrad: "Your courses + thesis"

### 8.2 Card content by tier

Each card shows the same skeleton:
- Code or name
- Term / period
- Number of tasks
- Next due date
- Status (on track / due soon / overdue)

But the *labels* on the card change by tier:
- Uni: "Course code · Course name · Term 3 · 4 assessments · Next due: Lit Review (25%) Fri"
- Senior secondary VCE: "VCE Biology Unit 3 · Semester 1 · 3 SACs · Next due: SAC 2 Wed"
- TAFE: "TAEASS502 Design and develop assessment tools · 3 assessment tasks · Next due: Workplace demo Friday"
- Primary: "Year 4 English · Term 2 · 2 things due · Next: Reading log Friday"

### 8.3 The priority panel (right column)

Same as original spec. Always pinned. Shows next-due across all subjects.

Labels adapt per tier. A Year 4 student sees "Next thing: Reading log · Friday". A postgrad sees "Next deadline: Chapter 3 draft to supervisor · Friday".

---

## Section 9 — Writing canvas (revised)

The 4-panel canvas structure stays. The labels inside change per tier.

### 9.1 The four panels per tier

**Panel 1 — Brief (the assessment instructions panel)**

Label per tier:
- Primary: "What you need to do"
- Secondary junior: "The task"
- Senior secondary: "Assessment brief"
- TAFE: "Unit task requirements"
- Uni: "Assessment brief"
- Postgrad: "Brief" (coursework) or "Chapter requirements" (thesis)

**Panel 2 — Sources**

Label per tier:
- Primary: "Stuff I'm using" (books, worksheets, examples)
- Secondary: "My research"
- Senior secondary: "Sources" (with citation pre-check)
- TAFE: "Evidence" (workplace evidence, RPL, demonstrations)
- Uni: "Sources" (with citation manager)
- Postgrad: "Literature + data"

**Panel 3 — Tutor**

Same panel name across tiers. The voice and prompt template change:
- Primary: warm, encouraging, very short sentences, lots of "great work, what comes next?"
- Secondary junior: friendly, slightly more direct, scaffolding-heavy
- Senior secondary: respectful of stakes, exam-focused, rubric-aware
- TAFE: practical, asks "what would your assessor want to see?"
- Uni undergrad: academic but warm, Socratic
- Postgrad: peer-level, asks about argument, evidence, contribution to field

**Panel 4 — Preview**

Same across tiers. Format adapts:
- Primary: looks like a printable kid-friendly worksheet
- Secondary: looks like a typed assignment
- Senior secondary: looks like an exam booklet or SAC submission
- TAFE: looks like an evidence portfolio document
- Uni: looks like a formatted academic essay with citations
- Postgrad: looks like a chapter or article in submission format

### 9.2 First-time "Where are you stuck?" question

The four options change per tier.

**Primary:**
- I don't get what to do
- I don't know how to start
- I'm stuck in the middle
- I want someone to check my work

**Secondary junior:**
- I don't get the instructions
- I can't start
- I'm stuck mid-way
- I want feedback before I hand it in

**Senior secondary:**
- I don't get the rubric
- I can't structure this
- I'm stuck mid-draft
- I want a rubric-aligned check

**TAFE:**
- I don't get what evidence they want
- I can't start writing the reflection
- I'm stuck on the practical demonstration
- I want a check against the unit criteria

**Uni undergrad and postgrad:**
- I don't get the brief
- I can't start
- I'm stuck mid-draft
- I want feedback on what I've written

---

## Section 11 — Reminders (revised)

The escalation timing stays the same (7d → 3d → 24h → 2h → overdue). What changes per tier:

- **Primary**: Nudges are kind. "Hey, your reading log is due tomorrow. Want to do 5 minutes now?"
- **Secondary junior**: Direct but friendly. "Your science task is due Wednesday."
- **Senior secondary**: High-stakes language. "Your VCE Bio SAC is in 24 hours."
- **TAFE**: Practical framing. "Your workplace evidence for TAEASS502 is due Friday."
- **Uni**: Academic framing. "Your Literature Review (25%) is due 11:59pm Friday."

For TAFE specifically: since competencies are often self-paced, the reminder system uses self-set milestones rather than fixed dates. The student is asked at setup: "When do you want to finish each unit?" The system reminds against those self-set targets.

For postgrad research students: reminders include supervisor meetings, milestone reviews, and self-set chapter targets — not just assessment due dates.

---

## Section 12 — Extraction pipeline (revised)

The pipeline still extracts:
1. Code or identifier (course code for uni, unit code for TAFE, subject name for school)
2. Name / title
3. Term / period
4. Assessment / task titles
5. Due dates

What changes per tier:

| Field | Primary | Secondary | Senior | TAFE | Uni |
|------|---------|-----------|--------|------|-----|
| Weight % | Not extracted (not used) | Sometimes | Extracted | Not used | Extracted |
| Rubric criteria | Not shown | Plain language | Extracted + decoded | Performance criteria from unit doc | Extracted |
| Competency outcomes | — | — | — | **Extracted (replaces weights)** | — |
| Word limit | Not used | Extracted | Extracted | Sometimes | Extracted |
| Citation format | — | Basic | APA/MLA/Harvard | — | APA 7, Harvard, Vancouver, etc. |
| Submission method | School-specified | School-specified | NESA/VCAA/etc. | RTO portal | Moodle/Turnitin/etc. |

The student can correct any extraction. The system asks once to confirm.

---

## What the spec adds going forward

**Tier abstraction in code:**

There needs to be a `TierProfile` object stored in IndexedDB after setup. Every component reads from it:

```javascript
TierProfile = {
  tier: 'primary' | 'secondary_junior' | 'senior_secondary' | 'tafe' | 'uni_undergrad' | 'uni_postgrad',
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT', // null for tertiary
  certificate: 'HSC' | 'VCE' | 'QCE' | 'WACE' | 'SACE' | 'TCE' | 'ACT_SSC' | 'NTCET', // senior only
  period_type: 'term' | 'semester' | 'trimester' | 'self_paced',
  current_period: '1' | '2' | '3' | '4',
  year_level: 'F' | '1' | '2' | ... | 'postgrad',
  institution: string,
  uses_weights: boolean, // false for primary, secondary junior, TAFE
  uses_competencies: boolean, // true only for TAFE
  language_pack: 'primary' | 'secondary' | 'senior' | 'tafe' | 'uni',
  focus_preferences: string[],
  hardest_areas: string[]
}
```

Every label, prompt, sort order, and panel template reads from `language_pack` and the tier-aware flags. There are no hardcoded uni-shaped strings anywhere.

**Language packs:**

A `src/i18n/` folder with one file per tier. Every UI string is keyed and looked up by tier:

```
src/i18n/primary.js
src/i18n/secondary_junior.js
src/i18n/senior_secondary.js
src/i18n/tafe.js
src/i18n/uni.js
```

State-specific overrides for senior secondary (HSC vs VCE vs QCE vs SACE) live as sub-packs.

---

## What gets killed from the universal product

- The Pareto filter as a global feature (it only applies to uni and senior secondary). For primary, secondary junior, and TAFE, the sort is "earliest due first" with no weight filter.
- The word "course" as a universal label.
- The assumption that every student has a numbered term and a fixed number of subjects.
- The assumption that every assessment has a weight.

---

## Status

This update replaces the relevant sections of the v2 spec. Everything else from the original v2 spec stands: the 5 screens, the visual system, the reminder escalation, the Authenticity Report, the burn-and-rebuild plan, the killed features list.

CC prompt going forward must include:

> "This work must match `docs/PRODUCT_SPEC.md` AND `docs/PRODUCT_SPEC_TIER_UPDATE.md`. The product is tier-aware. Every label, sort order, and prompt template reads from `TierProfile.language_pack`. No hardcoded uni-shaped strings."
