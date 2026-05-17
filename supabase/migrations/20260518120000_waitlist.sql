-- Waitlist: email capture for pre-launch interest
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'organic'
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup)
CREATE POLICY "waitlist_insert_public"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin export only)
CREATE POLICY "waitlist_select_service"
  ON public.waitlist FOR SELECT
  USING (auth.role() = 'service_role');
