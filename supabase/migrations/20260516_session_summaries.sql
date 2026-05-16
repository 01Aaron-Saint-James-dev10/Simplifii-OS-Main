-- Session summaries for AURA cross-session continuity
-- Stores what happened each session so AURA can reference it next time

CREATE TABLE IF NOT EXISTS session_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  course_id TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_touched TEXT[] DEFAULT '{}',
  blocks_completed INTEGER DEFAULT 0,
  pareto_steps_completed TEXT[] DEFAULT '{}',
  strongest_moment TEXT,
  growth_signals TEXT[] DEFAULT '{}',
  session_end_state TEXT DEFAULT 'normal',
  time_spent_minutes INTEGER DEFAULT 0,
  authenticity_split JSONB DEFAULT '{"human_percent": 100, "ai_percent": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only see their own session summaries
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON session_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sessions" ON session_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions" ON session_summaries
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for fast lookup of most recent session
CREATE INDEX idx_session_summaries_user_date
  ON session_summaries(user_id, session_date DESC);
