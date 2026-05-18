CREATE TABLE IF NOT EXISTS aura_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  assessment_title TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  last_commitment TEXT,
  last_confusion TEXT,
  session_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id, assessment_title)
);

ALTER TABLE aura_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own history" ON aura_history
  FOR ALL USING (auth.uid() = user_id);
