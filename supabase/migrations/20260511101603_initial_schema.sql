-- SUPERSEDED by 20260514120000_baseline_live_schema.sql
-- This file does not reflect the live state. Manual changes were applied
-- to the live database after this migration ran. See the baseline migration
-- for the authoritative schema.
--
-- Original description:
-- Simplifii-OS initial schema
-- Creates core tables for cloud sync, profiles, and course storage.

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
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Courses (synced from local IndexedDB)
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

CREATE INDEX IF NOT EXISTS idx_hot_events_user_id ON public.history_of_thought_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hot_events_type ON public.history_of_thought_events(event_type);
CREATE INDEX IF NOT EXISTS idx_hot_events_timestamp ON public.history_of_thought_events(timestamp_iso DESC);
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_of_thought_events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Courses: users can CRUD their own
CREATE POLICY "courses_select_own"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "courses_insert_own"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses_update_own"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "courses_delete_own"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- History events: users can read/insert their own
CREATE POLICY "hot_select_own"
  ON public.history_of_thought_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "hot_insert_own"
  ON public.history_of_thought_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
