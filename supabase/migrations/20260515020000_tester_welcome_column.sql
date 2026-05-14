ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_tester_welcome BOOLEAN NOT NULL DEFAULT false;
