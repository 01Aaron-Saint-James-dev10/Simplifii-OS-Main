# Simplifii-Markdown (.sm) Specification v1.0

## What it is

Simplifii-Markdown is the sovereign document standard for neuro-inclusive coursework.
It is a superset of CommonMark Markdown with three structural additions:

1. **YAML front matter** - machine-readable metadata and friction coefficients
2. **Tier annotations** - three-tier canvas structure (Pre-Write, Socratic, Learner Work)
3. **UDL instruction blocks** - mode-specific rendering hints for AURA

A `.sm` file is a plain-text file. Any Markdown renderer shows readable content.
The Simplifii-OS parser unlocks the full adaptive layer.

---

## Design Principles

- **One file, one lesson.** A `.sm` file is the canonical unit of curriculum in Simplifii-OS.
- **Readable without the parser.** Strip the front matter and tier headers: it reads as a clean document.
- **Machine-readable at every level.** AURA, the Scaffolder, and the Authenticity Report all consume `.sm` natively.
- **Conversion, not destruction.** Converting a PDF or Euka lesson to `.sm` preserves every original sentence. Tier 1 wraps it. Nothing is deleted.
- **Friction coefficient as a first-class field.** Every `.sm` file carries a computed `friction_coefficient` (0.0-1.0). This is the raw signal for the Global Learning Index curriculum heatmap.

---

## File Structure

### 1. Front Matter (Required)

```yaml
---
sm_version: "1.0"
title: "Newton's Laws of Motion"
subject: "Physics"
year_level: "Year 9"
level: "secondary"
source_platform: "euka"
friction_coefficient: 0.62
udl_modes: ["visual", "literal"]
referencing_style: "Harvard"
tags: ["mechanics", "forces", "STEM"]
learning_objectives:
  - "Identify and describe each of Newton's three laws"
  - "Apply Newton's second law to calculate net force"
estimated_minutes: 45
created_at: "2026-05-12T00:00:00Z"
---
```

**Field reference:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sm_version` | string | yes | Spec version. Pin to "1.0" |
| `title` | string | yes | Lesson or unit title |
| `subject` | string | yes | Curriculum subject area |
| `year_level` | string | no | e.g. "Year 9", "First Year", "Cert III" |
| `level` | enum | yes | `primary`, `secondary`, `university`, `tafe`, `homeschool` |
| `source_platform` | enum | no | `euka`, `khan_academy`, `distance_ed`, `other`, `native` |
| `friction_coefficient` | float | no | 0.0 (effortless) to 1.0 (maximum friction). Computed, not authored |
| `udl_modes` | array | no | Subset of `visual`, `literal`, `deep_focus`, `standard` |
| `referencing_style` | string | no | Harvard, APA 7, MLA 9, Chicago, etc. |
| `tags` | array | no | Curriculum tags for search and heatmap grouping |
| `learning_objectives` | array | no | One sentence each. Anchors Tier 2 Socratic prompts |
| `estimated_minutes` | int | no | Honest time estimate including scaffolding |
| `created_at` | ISO 8601 | no | Generation timestamp |

---

### 2. Tier 1: Pre-Write

The AI scaffold. Provides summary, key concepts, and step-by-step scaffolding.
The learner sees this before they write. Nothing here is their work.

```markdown
# Tier 1: Summary

## Overview

[1-3 sentences summarising the core concept in plain language.
Written at the declared `level`. No jargon without definition.]

## Key Concepts

| Term | Plain-Language Definition |
|---|---|
| Newton's First Law | An object stays still or keeps moving unless a force acts on it |
| Net Force | The combined push or pull acting on an object |

## Step-by-Step Scaffolding

1. Read the overview above.
2. Look up one real-world example of each law.
3. Complete the Tier 2 reflection prompts before writing.
4. Draft your response in the Tier 3 Interaction Sandbox.
```

**Rules:**
- No more than 3 sections under Tier 1
- Key Concepts table must use the `| Term | Definition |` format so the parser can extract it
- Steps must be a numbered list (1-based)
- Content is generated from the source material. AURA does not invent facts

---

### 3. Tier 2: Socratic Layer

Prompts that draw out the learner's own thinking.
Questions derive from `learning_objectives` in the front matter.

```markdown
# Tier 2: Socratic Layer

## Reflection Prompts

1. In your own words, what does Newton's First Law mean? Give an example from your own life.
2. Why does a heavier shopping trolley need more force to start moving than an empty one?
3. What would happen to a moving ball in space where there is no gravity or air resistance?

## Check Your Understanding

- [ ] I can describe each of Newton's three laws without looking at my notes
- [ ] I can give a real-world example for each law
- [ ] I understand the difference between balanced and unbalanced forces
```

**Rules:**
- 3-5 reflection prompts per lesson
- At least one prompt must link to the learner's lived experience
- Check Your Understanding items use `- [ ]` syntax (GFM task list)
- No correct answers provided here. The Socratic layer creates the thinking

---

### 4. Tier 3: Learner Work

The student's actual output. This is the assessed tier.

```markdown
# Tier 3: Your Writing

## Interaction Sandbox

[Write your response here. You will be assessed on what appears in this section.]

## Notes

[Use this space for rough ideas, diagrams described in words, or anything you want to remember.]
```

**Rules:**
- Tier 3 is always present in a `.sm` file, even if blank
- `## Interaction Sandbox` is the canonical write zone. The Authenticity Report logs every edit here
- `## Notes` is unassessed scratch space
- The parser identifies these sections by heading text, not position

---

## Full Example

```markdown
---
sm_version: "1.0"
title: "Newton's Laws of Motion"
subject: "Physics"
year_level: "Year 9"
level: "secondary"
source_platform: "euka"
friction_coefficient: 0.55
udl_modes: ["visual", "literal"]
learning_objectives:
  - "Describe Newton's three laws in plain language"
  - "Apply F=ma to calculate net force"
estimated_minutes: 45
created_at: "2026-05-12T00:00:00Z"
---

# Tier 1: Summary

## Overview

Newton's Laws of Motion explain why objects move or stay still. There are three laws. Each one describes a different relationship between forces and movement.

## Key Concepts

| Term | Plain-Language Definition |
|---|---|
| Force | A push or pull on an object |
| Mass | How much matter is in an object |
| Acceleration | How quickly speed changes |
| Net Force | The total combined force acting on an object |

## Step-by-Step Scaffolding

1. Read the overview and key concepts.
2. Think of one example from your own life for each law.
3. Answer the reflection prompts in Tier 2 before you start writing.
4. Draft your response in the Tier 3 Sandbox.

# Tier 2: Socratic Layer

## Reflection Prompts

1. In your own words, what does "an object in motion stays in motion" mean?
2. If you push a heavier trolley and a lighter one with the same force, which speeds up faster? Why?
3. When you push against a wall, does the wall push back? How do you know?

## Check Your Understanding

- [ ] I can describe all three laws in my own words
- [ ] I can give a real-world example for each one
- [ ] I know how to use F = ma to calculate net force

# Tier 3: Your Writing

## Interaction Sandbox

[Write your response here.]

## Notes

[Scratch space for rough ideas.]
```

---

## Parser Behaviour

The Simplifii-OS parser identifies sections by:
- Front matter: YAML block between `---` delimiters at the start of the file
- Tier blocks: `# Tier N:` headings (case-insensitive, colon required)
- Interaction Sandbox: `## Interaction Sandbox` heading (exact match)
- Key Concepts: `| Term |` table under `## Key Concepts`
- Check Your Understanding: `- [ ]` items under `## Check Your Understanding`

Unrecognised headings pass through as standard Markdown. The parser never discards content.

---

## Conversion Rules (PDF to .sm)

When `convertToSovereignFormat` processes a PDF or raw text:

1. **Front matter generation:** title from first H1 or dominant line; level and platform from caller context; `friction_coefficient` from initial regex heuristics (heading density, list density, sentence length variance).
2. **Tier 1 population:** overview from first 3-5 sentences after the title; key concepts from bold/colon-defined terms; scaffolding from any numbered list in the source.
3. **Tier 2 generation:** reflection prompts derived from `learning_objectives` if present, else from section headings; check items from any assessment criteria or learning outcomes found.
4. **Tier 3:** always empty skeleton. Learner fills this in.
5. **Fidelity rule:** no sentence is invented. Every word in Tier 1 traces to the source text or is explicitly marked `[AI: generated from learning objectives]`.

---

## Versioning

| Version | Status | Notes |
|---|---|---|
| 1.0 | Active | Initial sovereign format release |

Breaking changes increment the major version. The parser supports the current major version and one prior.
