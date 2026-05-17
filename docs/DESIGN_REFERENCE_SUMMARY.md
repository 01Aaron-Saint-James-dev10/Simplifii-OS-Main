# Design Reference Summary
**Source:** pre-burn/Simplifii-OS_Master_CoWork/design-bundle/project/simplifii-studio/
**Date:** 2026-05-17

---

## cockpit.jsx: Key Visual Patterns

The cockpit design is dramatically more minimal than the current canvas:
- **Context strip at top:** Course code, Pillar number, due date, weight, word target, marks
- **Word count + Progress + Integrity** as three small stat blocks
- **Block-based editor:** student writes in defined blocks (intro, body 1, etc.)
- **No visible toolbar:** only a MasteryBar at very top (single row of contextual actions)
- **Roadmap component:** horizontal stop indicators showing all Pillars with status (DONE / IN SPRINT / QUEUED)

**Key difference from current:** The current canvas has 14+ panel rail tabs visible at all times. The design prototype has NO visible panel rail. Tools are contextual.

---

## panels.jsx: Minimal Tool Design

- **Roadmap** (top): horizontal pipeline of assessment milestones
- **SourcesPanel** (left): clustered by theme (methodology, evidence), not by document name
- **Sources are grouped into 2-3 meaningful clusters**, not listed as individual PDFs
- **No tool tabs.** Each panel is a discrete view accessed via context, not a permanent sidebar tab.

**Key principle:** Panels exist but are NOT simultaneously visible. One panel at a time, triggered by user action or AURA suggestion.

---

## scaffolder.jsx: Structured Output UI

- **Tier-aware rendering:** Primary gets gamified quests, Secondary gets checklists, Tertiary gets structured skeleton
- **Primary tier:** Quest grid (Level 1/2/3), XP bar, visual rewards, 8-minute sessions, timer hidden
- **Secondary tier:** Body-doubled checklist with executive function support
- **Tertiary tier:** Backwards-mapped skeleton with rubric alignment

**Key principle:** The SAME data renders DIFFERENTLY per tier. Not one-size-fits-all. The scaffolder output adapts its visual form to the learner's level.

---

## BABS1201 Assessment Schema

The `babs1201_assessment_schema.json` contains:
- Structured assessment data (title, weight, due date, word count)
- Rubric criteria with marks per criterion
- Topic list with approved subjects
- Course structure (weeks, lectures)

This is the **target data model** for ingested courses. Every uploaded brief should produce this structure.

---

## Sovereign Architecture Blueprint

First 100 lines describe:
- 5-layer system: SovereignRouter > ExecutiveSpine > HistoryOfThought > EventBus > LiteralMode
- Minimal UI philosophy: "The learner brings their intelligence. The system brings the structure."
- Three-tier canvas: AI Assist (hidden by default) > Socratic (prompted) > Learner Writing (visible)
- Cockpit metaphor: GPS-like (shows position + next turn, not the full map)

**Key architectural rule:** "Hide the gut. Do not surface raw probability scores, parser internals, or 'Thinking...' latency logs. Use calm, schema-anchored progress signals."

---

## Summary: How Design Differs from Current Build

| Aspect | Design Prototype | Current Build |
|--------|-----------------|---------------|
| Panel visibility | Hidden by default | 14 tabs always visible |
| Tool access | AURA-triggered contextual | Manual tab selection |
| Writing focus | Editor is 80% of screen | Editor shares space with panels |
| Tier adaptation | Entirely different UI per tier | Same UI, different text |
| Information density | Minimal, progressive | Dense, all-at-once |
| Navigation | Roadmap (horizontal pipeline) | Panel rail (vertical tabs) |
| Metaphor | GPS cockpit | IDE/editor |

**Conclusion:** The current build is too dense. The design prototype is radically minimal. The path forward is AURA surfacing tools contextually, not showing them all simultaneously.
