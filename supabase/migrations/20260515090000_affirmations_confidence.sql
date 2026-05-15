-- Affirmations table (if not already created manually)
CREATE TABLE IF NOT EXISTS public.affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL DEFAULT 'tertiary',
  trigger_event TEXT NOT NULL,
  copy TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;

-- Public read: affirmations are not user-specific content
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read affirmations') THEN
    CREATE POLICY "Public can read affirmations" ON public.affirmations FOR SELECT USING (true);
  END IF;
END $$;

-- Seed: Confidence Reinforcement Layer trigger types
-- decision_moment: shown when user asks "what should I do next?"
-- self_doubt_detected: shown when user asks "is this right?" repeatedly
-- save_event: shown on auto-save with substantial content
-- external_validation_seeking: shown when user seeks external approval

INSERT INTO public.affirmations (tier, trigger_event, copy) VALUES
  -- decision_moment
  ('tertiary', 'decision_moment', 'You already know what matters. Want me to confirm or surprise you?'),
  ('secondary', 'decision_moment', 'You already know the next step. Trust that.'),
  ('primary', 'decision_moment', 'What feels like the right thing to work on? Start there.'),
  ('postgrad', 'decision_moment', 'Your instinct about priority is informed by everything you have read. Trust it.'),

  -- self_doubt_detected
  ('tertiary', 'self_doubt_detected', 'Show me what you think. Then we will check it together.'),
  ('secondary', 'self_doubt_detected', 'Write it down first. We can fix it after.'),
  ('primary', 'self_doubt_detected', 'Have a go. There is no wrong answer at this stage.'),
  ('postgrad', 'self_doubt_detected', 'Your uncertainty is methodological rigour, not weakness. Write the claim, then we test it.'),

  -- save_event
  ('tertiary', 'save_event', 'Your thinking is showing up on the page. That is the work.'),
  ('secondary', 'save_event', 'Every sentence you write is progress. Keep going.'),
  ('primary', 'save_event', 'Look at that. You are doing it.'),
  ('postgrad', 'save_event', 'The draft is the thinking made visible. This is how it works.'),

  -- external_validation_seeking
  ('tertiary', 'external_validation_seeking', 'You do not need permission to be right. State your position.'),
  ('secondary', 'external_validation_seeking', 'Your answer does not need to be perfect. It needs to be yours.'),
  ('primary', 'external_validation_seeking', 'What do YOU think? That is what matters here.'),
  ('postgrad', 'external_validation_seeking', 'The literature supports multiple positions. Yours is one of them. Defend it.')
ON CONFLICT DO NOTHING;

-- Also seed the original trigger types if missing
INSERT INTO public.affirmations (tier, trigger_event, copy) VALUES
  ('tertiary', 'dashboard', 'You showed up. That is the hardest part.'),
  ('tertiary', 'dashboard', 'Progress is not always visible. But it is happening.'),
  ('tertiary', 'dashboard', 'The work you do here stays yours. Always.'),
  ('secondary', 'dashboard', 'You are here. That counts.'),
  ('secondary', 'dashboard', 'One step at a time. You have got this.'),
  ('primary', 'dashboard', 'Ready when you are. No rush.'),
  ('tertiary', 'section_complete', 'Section done. Nice work.'),
  ('secondary', 'section_complete', 'Another one done. Keep that momentum.'),
  ('tertiary', 'reentry', 'Welcome back. Your work is exactly where you left it.'),
  ('secondary', 'reentry', 'Good to see you again. Pick up where you left off.'),
  ('tertiary', 'streak', 'Three sections in a row. You are in the zone.'),
  ('secondary', 'streak', 'On a roll. Keep going.')
ON CONFLICT DO NOTHING;
