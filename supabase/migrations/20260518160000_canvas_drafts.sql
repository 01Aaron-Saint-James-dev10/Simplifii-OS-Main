CREATE TABLE IF NOT EXISTS canvas_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  assessment_title TEXT NOT NULL DEFAULT '__default__',
  content TEXT,
  tiptap_doc JSONB,
  word_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id, assessment_title)
);

ALTER TABLE canvas_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own drafts" ON canvas_drafts
  FOR ALL USING (auth.uid() = user_id);
