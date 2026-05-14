-- Y10-12 enhanced onboarding columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emotional_baseline JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS subject TEXT;
