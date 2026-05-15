# Autism-First Canvas

**Status:** In progress
**Branch:** feat/autism-first-canvas
**Architecture decisions by:** Aaron (2026-05-15)

---

## The 7 Features

| # | Feature | Purpose | Effort |
|---|---------|---------|--------|
| 1 | Predictability Layer | Every AI action announced before it happens. No surprises. | 8h |
| 2 | Sensory Dial | One slider adjusts entire sensory experience (1-10). | 10h |
| 3 | Special Interest Bridge | AI explains concepts via student's special interests. | 6h |
| 4 | Literal Mode | Removes all metaphor, idiom, and ambiguity from AI output. | 5h |
| 5 | Decision Skeleton | Max 2 options with cognitive load labels. Never overwhelm. | 6h |
| 6 | Stim-Friendly UI | Ambient sound, predictable motion, fidget zone. | 8h |
| 7 | Comprehension Receipt | Explicit understanding check after each tutor response. | 7h |

Total: ~56 hours across 4 days.

---

## Architecture Decisions (Aaron, 2026-05-15)

### Layout per question
Section tabs (Section I, II, III) with questions inside **plus** sidebar list of questions with main canvas showing selected question.

### UDL tiers display
Stacked vertically (all 4 visible at once) **plus** split view: original on left, accessible version on right.

### AI tutor
Inline contextual prompts within each tier.

---

## Schema Additions

```sql
-- profiles table extensions
special_interests    JSONB DEFAULT '[]'     -- up to 5 free-text interests
sensory_level        INTEGER DEFAULT 5      -- 1 (minimal) to 10 (maximal)
literal_mode         BOOLEAN DEFAULT false  -- removes metaphor/idiom from AI
predictability_announcements BOOLEAN DEFAULT true  -- announce before AI acts
comprehension_patterns JSONB DEFAULT '{}'   -- learned explanation preferences
ambient_preference   TEXT DEFAULT 'none'    -- 'none'|'brown_noise'|'rain'|etc
autism_first_enabled BOOLEAN DEFAULT false  -- master toggle for all 7 features

-- comprehension_log table
-- Tracks 'got_it' | 'sort_of' | 'confused' per tutor response

-- interaction_announcements table
-- Logs predictability announcements and acknowledgements
```

---

## System Prompt Additions

### Predictability (Feature 1)
No system prompt change. Handled by UI (AnnouncementBanner) before API calls.

### Sensory Level (Feature 2)
```
User's sensory_level is {level}. At 1-3: one-sentence responses. 
At 4-6: medium responses. At 7-10: detailed with examples.
```

### Special Interests (Feature 3)
```
User's special interests: {interests}. Occasionally bridge to these 
with explicit analogy. Mark bridges with [INTEREST-BRIDGE]. 
Don't force it on every response.
```

### Literal Mode (Feature 4)
```
LITERAL MODE ACTIVE. No metaphors unless labeled [METAPHOR: X means Y]. 
Replace idioms with literal meanings. No rhetorical questions. 
Mark emotions [feeling: X]. Mark uncertainty [uncertain] vs [confirmed].
```

### Decision Skeleton (Feature 5)
```
Structure responses as EXACTLY 2 options unless user asks for more:
Option 1: [action] (estimated [time], cognitive load: [easy/medium/hard])
Option 2: [action] (estimated [time], cognitive load: [easy/medium/hard])
```

### Comprehension Receipt (Feature 7)
```
User's preferred explanation style: {pattern}. Default to this style.
If user was confused by previous explanation, try: {alternative_style}.
```

---

## Principles

1. **Predictable:** No surprise actions, transitions, or content changes.
2. **Literal:** Say what you mean. Mean what you say. No double meanings.
3. **Adjustable:** Every feature has a dial, not just on/off.
4. **Interest-led:** Use what the student already cares about.
5. **Low-demand:** Maximum 2 choices at any decision point.
6. **Sensory-aware:** The student controls the intensity of the experience.
7. **Explicit:** Understanding is checked, not assumed.

---

## Testing Protocol

Each feature has a gate test (defined in the spec). All gates must pass
before the integration batch runs.

WCAG 2.2 AA compliance verified per feature.
prefers-reduced-motion always respected.
All 4 themes still work.
Mobile responsive (380px minimum).
