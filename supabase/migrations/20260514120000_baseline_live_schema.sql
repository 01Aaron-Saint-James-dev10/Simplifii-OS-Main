-- Baseline: captured from live state on 2026-05-14.
-- Pre-existing manual changes (profiles.onboarding_completed, profiles.acknowledged_disclaimers,
-- assessments table, updated handle_new_user trigger, RLS policies) now documented.
--
-- This migration is reference-only for the current live database (already applied).
-- It ensures fresh deploys recreate the live state.

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'university',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_disclaimers BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- Courses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  local_id TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brief_text TEXT,
  brief_file_url TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- History of Thought events (encrypted cloud sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.history_of_thought_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  stream_id TEXT,
  payload_encrypted TEXT,
  device_signature_sha256 TEXT,
  schema_version TEXT,
  timestamp_iso TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hot_events_user_id ON public.history_of_thought_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hot_events_type ON public.history_of_thought_events(event_type);
CREATE INDEX IF NOT EXISTS idx_hot_events_timestamp ON public.history_of_thought_events(timestamp_iso DESC);
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_of_thought_events ENABLE ROW LEVEL SECURITY;

-- Profiles: own rows only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_insert_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Courses: own rows only (new-style names)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own courses' AND tablename = 'courses') THEN
    CREATE POLICY "Users can view own courses" ON public.courses FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own courses' AND tablename = 'courses') THEN
    CREATE POLICY "Users can insert own courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own courses' AND tablename = 'courses') THEN
    CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own courses' AND tablename = 'courses') THEN
    CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Courses: old-style duplicate policies (present on live, will be cleaned up in next migration)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'courses_select_own' AND tablename = 'courses') THEN
    CREATE POLICY "courses_select_own" ON public.courses FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'courses_insert_own' AND tablename = 'courses') THEN
    CREATE POLICY "courses_insert_own" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'courses_update_own' AND tablename = 'courses') THEN
    CREATE POLICY "courses_update_own" ON public.courses FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'courses_delete_own' AND tablename = 'courses') THEN
    CREATE POLICY "courses_delete_own" ON public.courses FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Assessments: gated via course FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own assessments' AND tablename = 'assessments') THEN
    CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT
      USING (course_id IN (SELECT id FROM courses WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own assessments' AND tablename = 'assessments') THEN
    CREATE POLICY "Users can insert own assessments" ON public.assessments FOR INSERT
      WITH CHECK (course_id IN (SELECT id FROM courses WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own assessments' AND tablename = 'assessments') THEN
    CREATE POLICY "Users can update own assessments" ON public.assessments FOR UPDATE
      USING (course_id IN (SELECT id FROM courses WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own assessments' AND tablename = 'assessments') THEN
    CREATE POLICY "Users can delete own assessments" ON public.assessments FOR DELETE
      USING (course_id IN (SELECT id FROM courses WHERE user_id = auth.uid()));
  END IF;
END $$;

-- History of Thought: own rows only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hot_select_own' AND tablename = 'history_of_thought_events') THEN
    CREATE POLICY "hot_select_own" ON public.history_of_thought_events FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hot_insert_own' AND tablename = 'history_of_thought_events') THEN
    CREATE POLICY "hot_insert_own" ON public.history_of_thought_events FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- Auto-create profile on user signup (live version)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, display_name, onboarding_completed, acknowledged_disclaimers)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'tier', 'university'),
    NEW.raw_user_meta_data->>'display_name',
    false,
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Storage buckets (reference only; buckets are created via Dashboard/API)
-- ============================================================
-- Bucket: briefs (private, user-scoped RLS by folder = auth.uid())
-- Bucket: documents (public, open read/insert)
--
-- Storage RLS policies on storage.objects:
--   "Users can view own briefs"    SELECT WHERE bucket_id='briefs' AND foldername[1]=auth.uid()
--   "Users can upload own briefs"  INSERT WHERE bucket_id='briefs' AND foldername[1]=auth.uid()
--   "Users can delete own briefs"  DELETE WHERE bucket_id='briefs' AND foldername[1]=auth.uid()
--   "block3_temp_read_documents"   SELECT WHERE bucket_id='documents'
--   "block3_temp_insert_documents" INSERT WHERE bucket_id='documents'
