-- Autism-First Canvas schema additions
-- Supports 7 features: Predictability, Sensory Dial, Special Interest Bridge,
-- Literal Mode, Decision Skeleton, Stim-Friendly UI, Comprehension Receipt

-- Profile extensions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS special_interests JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sensory_level INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS literal_mode BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS predictability_announcements BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS comprehension_patterns JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ambient_preference TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS autism_first_enabled BOOLEAN DEFAULT false;

-- Comprehension log: tracks understanding after each tutor response
CREATE TABLE IF NOT EXISTS public.comprehension_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT,
  tutor_response_id TEXT,
  rating TEXT NOT NULL, -- 'got_it' | 'sort_of' | 'confused'
  explanation_style TEXT,
  follow_up_chosen TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.comprehension_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own comprehension') THEN
    CREATE POLICY "Users can read own comprehension" ON public.comprehension_log FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own comprehension') THEN
    CREATE POLICY "Users can insert own comprehension" ON public.comprehension_log FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comprehension_log_user ON public.comprehension_log(user_id);

-- Interaction announcements: predictability layer log
CREATE TABLE IF NOT EXISTS public.interaction_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'suggestion' | 'transition' | 'ai_response' | 'modal'
  announcement_text TEXT NOT NULL,
  user_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.interaction_announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own announcements') THEN
    CREATE POLICY "Users can read own announcements" ON public.interaction_announcements FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own announcements') THEN
    CREATE POLICY "Users can insert own announcements" ON public.interaction_announcements FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
