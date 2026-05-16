# AURA Context Contract
# This is the exact JSON object that must be passed to every AURA API call.
# If any field is missing, apply the fallback rules in AURA_SYSTEM_PROMPT_V3.md.
# CC must never build an AURA API call without populating this contract.

The full contract is defined in AURA_SYSTEM_PROMPT_V3.md Section 1.

Key fields CC must always wire:
- learner_profile (from Supabase profiles table)
- steering_dials (from SettingsContext)
- active_task (from IndexedDB + ingestion pipeline)
- active_task.rubric_confidence (float 0-1, required)
- active_task.pareto_step_confidence (array, one float per step)
- cockpit_state.active_tier (Tier1 | Tier2 | Tier3)
- cockpit_state.authenticity_split (human_percent, ai_percent)
- last_session (from Supabase session_summaries table)

CRITICAL: If briefText is empty string or documentContextAvailable is false,
prepend the hallucination-prevention header to the system prompt before sending.
See AuraChatOverlay.jsx for implementation.
