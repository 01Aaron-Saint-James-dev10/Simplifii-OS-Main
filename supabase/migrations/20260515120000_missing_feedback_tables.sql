-- Missing feedback and representation tables
-- Referenced in: ResponseFeedback.jsx, SessionFeedbackModal.jsx,
--                RepresentationsPanel.jsx, ToolPanel.jsx

-- AI response feedback (thumbs up/down on tool outputs)
CREATE TABLE IF NOT EXISTS public.ai_response_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (1, 5)),
  reason_tag TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_response_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own ai_response_feedback') THEN
    CREATE POLICY "Users insert own ai_response_feedback"
      ON public.ai_response_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own ai_response_feedback') THEN
    CREATE POLICY "Users read own ai_response_feedback"
      ON public.ai_response_feedback FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_response_feedback(user_id);

-- Session feedback (emoji end-of-session rating)
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_rating TEXT NOT NULL,
  anything_else TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own session_feedback') THEN
    CREATE POLICY "Users insert own session_feedback"
      ON public.session_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own session_feedback') THEN
    CREATE POLICY "Users read own session_feedback"
      ON public.session_feedback FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Assessment representations (cached UDL outputs per assessment)
CREATE TABLE IF NOT EXISTS public.assessment_representations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assessment_id, course_id, user_id, type)
);

ALTER TABLE public.assessment_representations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own assessment_representations') THEN
    CREATE POLICY "Users insert own assessment_representations"
      ON public.assessment_representations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own assessment_representations') THEN
    CREATE POLICY "Users read own assessment_representations"
      ON public.assessment_representations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own assessment_representations') THEN
    CREATE POLICY "Users update own assessment_representations"
      ON public.assessment_representations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assess_repr_user ON public.assessment_representations(user_id, course_id);
