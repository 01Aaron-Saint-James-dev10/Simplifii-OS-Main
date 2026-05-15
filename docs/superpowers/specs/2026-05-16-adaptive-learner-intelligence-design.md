# Adaptive Learner Intelligence System (ALIS)

Spec date: 2026-05-16
Status: Design approved, pending implementation plan

## Purpose

Make Simplifii-OS predictive: learn from every interaction, refine the learner model continuously, and pre-empt what a student needs before they know they need it.

## Scope

**Phase 1 (build now, 20 hours):**
- Session check-in modal (energy, mood, goal)
- Implicit behavioural observation pipeline (tool usage, session patterns, scaffold acceptance)
- Learner model (profiles.learner_model JSONB)
- Prediction engine: inject learner context into every AI system prompt
- "Your patterns" view in Settings (read-only, transparent)

**Phase 2 (build after tester data, 15 hours):**
- 14-day pattern recognition ("Your best days are Tuesdays")
- Proactive nudges ("You usually use the scorer at this point")
- Topic confidence tracking per assessment
- Post-session reflection prompt

**Phase 3 (build after 100+ users, 25 hours):**
- Apple HealthKit integration (HRV, sleep, heart rate)
- Fitbit Web API integration (stress score, sleep score)
- Google Fit REST API integration (heart rate, activity)
- Biometric-to-energy mapping (stress proxy feeds learner model)
- Additional consent gates per biometric source

## Architecture

### Three Signal Layers

**Layer 1: Explicit Signals (user tells us)**
- Onboarding profiler (tier, pain points, learning style, accessibility)
- Session check-in (energy 1-7, mood, session goal)
- Post-session reflection (what worked, what didn't)
- Settings changes (profile, sensory level, literal mode)

**Layer 2: Implicit Signals (system observes)**
- Time-of-day patterns (when they study)
- Session duration + idle detection
- Tool usage frequency (which tools they rely on)
- Tutor interaction patterns (questions asked, response length)
- Scaffold acceptance rate (Pre-Write inserts vs discards)
- Section completion velocity (words per minute)
- Error/retry patterns

**Layer 3: Biometric Signals (future, hardware required)**
- Heart rate variability (stress proxy)
- Sleep quality (previous night, affects today's capacity)
- Activity level (sedentary vs active day)
- Skin conductance (arousal/anxiety, if supported)

### Learner Model Schema

Stored as `profiles.learner_model` JSONB column:

```json
{
  "energy_pattern": { "morning": 5, "afternoon": 4, "evening": 7, "night": 6 },
  "topic_confidence": { "essay_writing": 7, "exam_practice": 3, "rubric_decoding": 5 },
  "tool_preferences": { "tutor": 12, "simplify": 8, "scorer": 1, "hidden": 3 },
  "scaffold_reliance": 0.4,
  "optimal_session_length": 25,
  "peak_hours": [14, 15, 21, 22],
  "stress_triggers": ["deadline_proximity", "rubric_complexity"],
  "mood_baseline": "focused",
  "sessions_completed": 14,
  "last_updated": "2026-05-16T10:00:00Z"
}
```

### Database Tables

```sql
-- Session check-ins
CREATE TABLE session_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 7),
  mood TEXT CHECK (mood IN ('focused','scattered','anxious','calm','tired','energised')),
  goal TEXT,
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily behavioural observations (aggregated from HistoryOfThought)
CREATE TABLE learner_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  words_written INTEGER DEFAULT 0,
  tools_used JSONB DEFAULT '{}',
  scaffold_accepts INTEGER DEFAULT 0,
  scaffold_rejects INTEGER DEFAULT 0,
  tutor_messages_sent INTEGER DEFAULT 0,
  idle_periods INTEGER DEFAULT 0,
  peak_hour SMALLINT,
  avg_energy REAL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, observation_date)
);

-- Biometric signals (Phase 3, schema created now)
CREATE TABLE biometric_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMP NOT NULL,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

All tables: RLS enabled, user can only read/write own rows.

### AI Prompt Integration

On every session, before first AI call, build a LEARNER CONTEXT block:

```
LEARNER CONTEXT (adapt your responses accordingly):
- Current energy: {energy}/7 ({label})
- Mood: {mood}
- Session goal: "{goal}"
- Pattern: studies best {peak_hours}, currently {current_hour}
- Tool preference: {top_tools}
- Scaffold reliance: {rate}% (accepts {n} in 10 AI suggestions)
- Stress signals: {triggers}

ADAPT: {computed_instructions}
```

This block is appended to EVERY AI system prompt (tutor, tools, pre-write, next-step). The `computed_instructions` are generated from rules:
- energy <= 3: "Keep responses brief. Suggest breaks."
- energy >= 6: "Can offer complex challenges."
- mood === 'anxious': "Gentle tone. Offer one step at a time."
- mood === 'scattered': "Number every point. Short sentences."
- deadline within 48h: "Focus on completion, not perfection."

### Session Check-in UX

Modal appears 5 seconds after canvas load, max once per session:
- 3 questions: energy (1-7 scale), mood (6 options), goal (4 options)
- Skip always available
- Takes under 10 seconds
- Data stored to session_checkins + used immediately for that session
- Dragon Ball visual for energy (per Sprint Y: orange, 7 balls)

### Privacy Compliance

- Australian Privacy Act 1988 APP 3, 5, 11, 12, 13
- Explicit consent screen before any data collection
- User can view their learner model in Settings
- One-click delete of all intelligence data
- Biometric data requires separate consent gate
- Institutional tier: aggregated + anonymised only, never individual models

### Integration Points

- HistoryOfThought: emits events that feed Layer 2 observations
- SettingsContext: reads learner_model for UI adaptation
- All API endpoints: receive learner context in system prompts
- HomeScreen: greeting adapts to energy + peak hours
- NextStepBanner: suggestions informed by learner model
- ReentryOverlay: adapts to mood + last session state

### Success Criteria

After 14 days of data from a single learner:
1. System can predict their peak study hours within 1 hour
2. System knows which tools they prefer and which they avoid
3. System adapts AI response length to their current energy
4. System suggests the right next tool 70%+ of the time
5. Learner reports feeling "understood" by the system (qualitative)

### What This Does NOT Include

- Video/image generation
- Social features or peer comparison
- Gamification (separate Sprint Y)
- External content recommendations
- Any data sharing with third parties
