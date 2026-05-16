CREATE TABLE IF NOT EXISTS history_of_thought_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  course_id TEXT,
  assessment_title TEXT,
  tier_active TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  data_classification TEXT DEFAULT 'sensitive'
);

ALTER TABLE history_of_thought_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their events" ON history_of_thought_events
  FOR ALL USING (auth.uid() = user_id);
