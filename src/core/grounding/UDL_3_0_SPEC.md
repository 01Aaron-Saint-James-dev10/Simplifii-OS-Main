# UDL 3.0 Grounding Specification

**Authority:** CAST Universal Design for Learning Guidelines 3.0 (2024) + AHEAD Ireland
UDL Curriculum Design Framework (2022).

**Status:** Operative : consumed by `BiasAuditService.js` and `convertToSovereignFormat`.

**Purpose:** This file is both the human-readable specification and the canonical
reference for every barrier ID used in the audit engine. Each barrier maps to a CAST
checkpoint and an AHEAD Ireland implementation note where one exists.

---

## Part 1: The Three Principles

UDL 3.0 reframes the three principles around the Expert Learner outcome. The goal
is not to remove difficulty, but to remove barriers that prevent students from engaging
with the difficulty that belongs in the curriculum.

```
Principle I:  Multiple Means of Engagement        → Purposeful and Motivated Learners
Principle II: Multiple Means of Representation    → Resourceful and Knowledgeable Learners
Principle III: Multiple Means of Action and Expression → Strategic and Goal-Directed Learners
```

---

## Part 2: Principle I : Engagement (Identity and Agency)

Engagement addresses the "why" of learning. Barriers here attack motivation, identity,
and the sense that the learner belongs in the learning environment.

### 2.1 Guideline 1: Recruiting Interest (Checkpoint 1.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 1.1 | Provide choice and autonomy | Fixed single topic/approach, no alternatives offered | HIGH |
| 1.2 | Optimise relevance and authenticity | Decontextualised tasks with no real-world anchor | MEDIUM |
| 1.3 | Minimise threats and distractions | Competitive framing, peer comparison, or shame language | CRITICAL |

**AHEAD Ireland note (1.1):** Curriculum should offer at least one dimension of learner
choice: topic, format, timeline, or audience. Even constrained assessments can offer
structured choice within the brief.

### 2.2 Guideline 2: Sustaining Effort and Persistence (Checkpoint 2.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 2.1 | Make goals salient | No explicit learning objectives stated | HIGH |
| 2.2 | Vary demands to optimise challenge | Single difficulty level, no scaffolded entry point | MEDIUM |
| 2.3 | Foster collaboration | Purely individual tasks with no collaborative option noted | LOW |
| 2.4 | Mastery-oriented feedback | Grade-only feedback without process commentary | HIGH |

### 2.3 Guideline 3: Self-Regulation (Checkpoint 3.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 3.1 | Optimise motivation beliefs | Deficit framing ("students who struggle", "weak students") | CRITICAL |
| 3.2 | Coping strategies | No provision for students to signal distress or adjust pace | HIGH |
| 3.3 | Self-assessment and reflection | No self-rating or reflection prompt in the task | MEDIUM |

**AHEAD Ireland note (3.1):** Deficit framing is the single most documented harm in
inclusive education literature. Replace with functional language: "students who are
developing X" or "this section supports learners who are still building familiarity with X."

---

## Part 3: Principle II : Representation (Variable Perception)

Representation addresses the "what" of learning. Barriers here prevent access to
the content itself, irrespective of the learner's capability to engage with it.

### 3.1 Guideline 4: Perception (Checkpoint 4.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 4.1 | Customisable display | Fixed-format document with no resize or contrast option | MEDIUM |
| 4.2 | Auditory alternatives | Audio-only instructions with no text equivalent | HIGH |
| 4.3 | Visual alternatives | "Look at the diagram" without text description | HIGH |

### 3.2 Guideline 5: Language and Symbols (Checkpoint 5.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 5.1 | Clarify vocabulary | Undefined discipline-specific jargon | HIGH |
| 5.2 | Clarify syntax | Passive voice overuse, embedded clauses exceeding 3 levels | MEDIUM |
| 5.3 | Decode text and notation | Mathematical notation without plain-language explanation | HIGH |
| 5.5 | Multiple media | Text-only with no visual, audio, or diagram alternative referenced | MEDIUM |

**AHEAD Ireland note (5.1):** Jargon is defined as any term that a student entering
the course would not have encountered in secondary education. Every such term must be
defined at first use or linked to a glossary. The audit engine flags jargon density
above 8 undefined terms per 500 words.

### 3.3 Guideline 6: Comprehension (Checkpoint 6.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 6.1 | Activate background knowledge | "As you know...", "You will recall...", assumed knowledge | HIGH |
| 6.2 | Highlight big ideas | No summary, overview, or main idea explicitly stated | MEDIUM |
| 6.3 | Guide information processing | Wall of text without chunking, headers, or signposting | HIGH |
| 6.4 | Transfer and generalisation | No real-world application prompt | MEDIUM |

---

## Part 4: Principle III : Action and Expression (Strategy and Executive Function)

Action and Expression addresses the "how" of learning. This is the principle most
directly linked to ADHD, dyspraxia, and executive function variability.

### 4.1 Guideline 7: Physical Action (Checkpoint 7.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 7.1 | Multiple response methods | "Handwrite your response" or "complete on paper" only | HIGH |
| 7.2 | Assistive technology access | No mention of AT compatibility or screen reader support | MEDIUM |

### 4.2 Guideline 8: Expression and Communication (Checkpoint 8.x)

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 8.1 | Multiple media for communication | Single mandated format (essay-only, spoken-only) | CRITICAL |
| 8.2 | Multiple construction tools | No tools or scaffolds provided for the task | HIGH |
| 8.3 | Graduated support | No worked example, model, or sample provided | HIGH |

**AHEAD Ireland note (8.1):** "Multiple means of expression" requires at minimum two
distinct output modalities. For written assessment, this means offering at least one
non-prose alternative: annotated diagram, structured bullet response, concept map,
recorded explanation, or oral examination equivalent.

### 4.3 Guideline 9: Executive Functions (Checkpoint 9.x) : AHEAD Priority

This guideline receives the greatest weight in AHEAD Ireland guidance because executive
function variability (ADHD, ASD, dyspraxia, anxiety) is the most prevalent access need
in Irish and Australian tertiary education.

| Checkpoint | Rule | Barrier Pattern | Severity |
|---|---|---|---|
| 9.1 | Goal-setting support | No explicit success criteria or rubric reference | CRITICAL |
| 9.2 | Planning and strategy | Task given without step-by-step breakdown | HIGH |
| 9.3 | Information management | No guidance on organising sources or notes | MEDIUM |
| 9.4 | Progress monitoring | No self-check or milestone points in the task | HIGH |

**AHEAD Ireland Action and Expression Scaffold (post-grad level):**

Every task at university or postgrad level should include a four-part executive
function scaffold, in this order:

```
1. PLAN:    "Before you begin, list the steps you intend to take."
2. DO:      [The task itself, broken into discrete sub-tasks]
3. MONITOR: "Pause at the halfway point. Are you on track? What do you need to adjust?"
4. REFLECT: "After submission: what worked? What would you change? Rate your confidence (1-5)."
```

This "Plan-Do-Monitor-Reflect" structure maps directly to Checkpoints 9.1, 9.2, and 9.4.

---

## Part 5: Barrier Registry (Machine-Readable)

This registry is the source of truth for `BiasAuditService.js`. Each entry maps
to the table rows above. The `id` field is the canonical barrier identifier.

```
BARRIER_IDS = [
  'fixed_time',           // 9.2 CRITICAL
  'single_expression',    // 8.1 CRITICAL
  'competitive_framing',  // 1.3 CRITICAL
  'deficit_framing',      // 3.1 CRITICAL
  'no_success_criteria',  // 9.1 CRITICAL
  'assumed_knowledge',    // 6.1 HIGH
  'no_objectives',        // 2.1 HIGH
  'undefined_jargon',     // 5.1 HIGH
  'wall_of_text',         // 6.3 HIGH
  'no_step_breakdown',    // 9.2 HIGH
  'grade_only_feedback',  // 2.4 HIGH
  'no_plan_prompt',       // 9.2 HIGH
  'no_monitor_prompt',    // 9.4 HIGH
  'sensory_specific',     // 4.2/4.3 HIGH
  'no_choice',            // 1.1 HIGH
  'no_transfer_prompt',   // 6.4 MEDIUM
  'no_self_regulation',   // 3.3 MEDIUM
  'text_only',            // 5.5 MEDIUM
  'no_glossary',          // 5.1 MEDIUM
  'passive_voice_excess', // 5.2 MEDIUM
]
```

---

## Part 6: Remediation Templates

For each CRITICAL barrier, a drop-in remediation sentence is specified. These are
inserted by `convertToSovereignFormat` into the `.sm` Tier 1 scaffolding block.

| Barrier | Remediation Insert |
|---|---|
| `fixed_time` | "Note: If you need additional time, this is a reasonable adjustment you can request from your educator before the task begins." |
| `single_expression` | "You can respond to this task as: a written explanation, an annotated diagram, a concept map, a recorded walkthrough, or a structured bullet list. Choose the format that best suits how you think." |
| `competitive_framing` | "[Reframed as mastery language: 'The goal is to demonstrate your understanding, not to compare with others.']" |
| `deficit_framing` | "[Replace with: 'Students who are still developing familiarity with this concept will find the Tier 1 scaffold helpful.']" |
| `no_success_criteria` | "Success looks like: [Add explicit success criteria here, tied to the marking rubric.]" |

---

## Part 7: AHEAD Ireland Compliance Checklist

A curriculum document achieves AHEAD UDL compliance when it satisfies:

- [ ] At least one explicit learning objective
- [ ] At least two expression format options
- [ ] No deficit framing language
- [ ] No fixed-time constraint without accommodation note
- [ ] At least one self-regulation or reflection checkpoint
- [ ] All discipline jargon defined at first use
- [ ] Task broken into numbered steps (minimum 3)
- [ ] A "what success looks like" statement
- [ ] The AHEAD Plan-Do-Monitor-Reflect scaffold present or referenced

A document scoring 0 barriers on CRITICAL severity achieves baseline compliance.
A document scoring 0 barriers on CRITICAL + HIGH achieves full AHEAD UDL compliance.

---

## Part 8: UDL 3.0 New Principles (2024 Update)

The 2024 CAST revision introduced four structural shifts not present in earlier versions.
These are explicitly grounded in evidence from social psychology, neurodiversity research,
and disability justice scholarship. They are not "soft" additions : they are tested
interventions with effect-size data.

### 8.1 Belonging and Identity (new Engagement checkpoint)

**What changed:** UDL 3.0 explicitly names "Belonging" as a prerequisite for learning.
A learner who does not see themselves as a legitimate member of the learning community
cannot sustain engagement regardless of scaffolding quality.

**Implementation rule:** Curriculum must include at least one of:
- A representation of people "like the learner" doing the discipline (name, background,
  country, neurodivergent identity)
- A prompt asking the learner to connect the content to their own experience or community
- Language that positions the learner as a future practitioner, not a passive recipient

**Barrier flag:** Curriculum that references only a single cultural, national, or
demographic context in its examples without acknowledgement of other contexts.

**AHEAD Ireland note:** "Authentic Diversity" in representation means examples are not
drawn exclusively from the dominant culture of the institution. Irish and Australian
curricula frequently cite only Western European or Anglo-American exemplars.

### 8.2 Joy and Play as Rigour (new Engagement framing)

**What changed:** UDL 3.0 explicitly rehabilitates Joy and Play as mechanisms for
sustained learning, not as rewards for completing serious work. This is evidence-based:
playful framing improves working memory load, reduces anxiety, and increases transfer.

**Implementation rule:** At least one task element should invite exploration, curiosity,
or low-stakes experimentation. This is not gamification : it is removing the implicit
message that learning must be effortful and unpleasant to be valid.

**Barrier flag:** Task framing that uses exclusively high-stakes or evaluative language
with no space for provisional, exploratory thinking.

**Audit signal:** Absence of exploratory language: "What if...", "Try...", "Explore...",
"What surprises you...", "Without worrying about being right yet...".

### 8.3 Empathy and Perspective-Taking (new Socratic frame)

**What changed:** UDL 3.0 explicitly names empathy-based questioning as an
evidence-backed engagement strategy, particularly for subjects with ethical dimensions
(law, medicine, social sciences, humanities). The Socratic layer should include at
least one perspective-shift prompt: "How would this look from the point of view of X?"

**AHEAD Ireland Action and Expression note:** For postgraduate work, Checkpoint 9.1
(goal-setting) should include an explicit statement of whose interests the work serves
and who it might exclude.

### 8.4 Challenging Exclusionary Practices (structural goal)

**What changed:** UDL 3.0 is explicit that the goal is not individual accommodation
but the redesign of the environment. This is the critical shift from the medical model
("fix the student") to the social model ("fix the curriculum").

**Audit engine implication:** The Simplifii Audit Engine does not report "this student
needs support." It reports "this curriculum has a barrier." The language of every
output from `UDLAuditService.js` must follow this framing.

---

## References

- CAST (2024). *Universal Design for Learning Guidelines 3.0*. Wakefield, MA: CAST.
  Retrieved from https://udlguidelines.cast.org
- AHEAD (2022). *Universal Design for Learning: A Curriculum Guide for Irish Higher
  Education*. Dublin: AHEAD Press.
- Australian Disability Discrimination Act 1992 (Cth), s.22 (education).
- Australian Privacy Act 1988 (Cth), APP 5 (notification of collection).
- Disability (Access to Premises) Standards 2010 : Education context.
