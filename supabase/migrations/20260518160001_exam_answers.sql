CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  answer_text TEXT,
  reading_note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, document_id, question_number)
);

ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own answers" ON exam_answers
  FOR ALL USING (auth.uid() = user_id);
