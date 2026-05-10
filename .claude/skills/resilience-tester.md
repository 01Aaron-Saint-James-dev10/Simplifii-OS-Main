---
name: resilience-tester
description: TODO - awaiting spec. Stress-tests the Sovereign stack (Ollama down, vault locked, PDF garbage-in, stream switch mid-session) and reports which paths degrade gracefully vs throw.
---

# Resilience Tester (stub)

**Status:** spec not yet supplied. Do not invoke until the body of this file lists the steps and guardrails.

Likely shape (to be confirmed by Aaron):

1. Define failure scenarios: Ollama unreachable, IndexedDB quota exceeded, vault locked, PDF worker missing, stream switched mid focus session, network offline.
2. For each scenario, drive the cockpit through a representative student flow and assert the user-visible outcome (graceful fallback vs hard error).
3. Confirm the Shadow State path always lands a draft cockpit even when every LLM call fails.
4. Output a one-screen Resilience Report ranked by user impact, with the exact module + line where each degradation begins.
