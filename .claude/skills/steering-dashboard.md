---
name: steering-dashboard
description: TODO - awaiting spec. Surfaces high-level signal (mark density, focus health, vault integrity) for the student or a parent / supervisor view.
---

# Steering Dashboard (stub)

**Status:** spec not yet supplied. Do not invoke until the body of this file lists the steps and guardrails.

Likely shape (to be confirmed by Aaron):

1. Aggregate ExecutiveSpine telemetry (focus session count, idle nudge count, section health distribution) over a configurable window (today / week / sprint).
2. Compute Mark Density per active assessment from the reconciled `assessmentBriefs`.
3. Render a single-screen view ranked by "what to touch next": highest-weight task with lowest section health.
4. Per-stream variant: Primary uses XP / quest framing; Tertiary uses pillar / rubric framing. Never invent metrics; surface only what HoT and Spine recorded.
