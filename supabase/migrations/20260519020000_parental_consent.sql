-- Add parental consent timestamp for secondary tier users (Australian Privacy Act)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_at TIMESTAMPTZ;
