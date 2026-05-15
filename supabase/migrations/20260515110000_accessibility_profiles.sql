-- Accessibility Profiles: 4 research-aligned profiles + multimodal question support

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accessibility_profile TEXT DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_settings JSONB DEFAULT '{}';

-- Profile definitions: seed data for the 4 profiles
CREATE TABLE IF NOT EXISTS public.profile_definitions (
  profile_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  default_settings JSONB NOT NULL,
  system_prompt_addition TEXT NOT NULL,
  ui_defaults JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profile_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read profile definitions') THEN
    CREATE POLICY "Public can read profile definitions" ON public.profile_definitions FOR SELECT USING (true);
  END IF;
END $$;

INSERT INTO public.profile_definitions (profile_id, name, description, default_settings, system_prompt_addition, ui_defaults) VALUES
(
  'standard',
  'Standard',
  'Default Simplifii experience',
  '{}',
  '',
  '{}'
),
(
  'twice_exceptional',
  'Twice-exceptional (2e)',
  'Gifted intelligence combined with learning differences. Advanced cognition with specific accessibility needs.',
  '{"sensoryLevel": 6, "literalMode": false, "decisionSkeleton": false}',
  'User is twice-exceptional: gifted intelligence combined with learning differences. Respond with intellectual depth AND accessibility. Use sophisticated vocabulary. Offer multi-layer explanations: surface + deeper analysis. Acknowledge complexity rather than oversimplifying. Watch for perfectionism shutdown: validate effort. Reduce shame around easy steps: frame as thorough. Recognise masking: if user dismisses help, gently re-offer. Allow tangential interests as productive, not distraction.',
  '{"fontScale": "normal", "bionicReading": false, "sensoryLevel": 6}'
),
(
  'autism_level_3',
  'Autism (substantial support)',
  'Predictable, minimal stimulation, one-thing-at-a-time interactions.',
  '{"sensoryLevel": 2, "literalMode": true, "decisionSkeleton": true, "predictabilityAnnouncements": true}',
  'User has Autism Level 3: substantial support needs. Respond with maximum predictability and minimal cognitive load. One concept per response, never multiple. Use exact same opening phrase each session. Confirm understanding before adding new info. Visual scaffolds first, text second. Never use figurative language. Step-by-step with numbered list always. Stay with user chosen topic: do not redirect. Use first-person I (clearer agency). Mark all uncertainty: [I think] vs [confirmed]. Allow processing time: Take your time between exchanges.',
  '{"fontScale": "large", "lineSpacing": "loose", "bionicReading": false, "sensoryLevel": 2, "reducedMotion": true}'
),
(
  'adhd',
  'ADHD',
  'Attention regulation. Working memory challenges. Dopamine-driven motivation.',
  '{"sensoryLevel": 7, "literalMode": false, "decisionSkeleton": false}',
  'User has ADHD. Respond with stimulating engagement and external structure. Lead with the most interesting or important point. Use varied response lengths to maintain attention. Bold or highlight key actionable items. Provide explicit time estimates for every task. Break work into 5-15 min chunks max. Use novelty: vary phrasing, examples, formats. Add stakes or urgency where genuine. Celebrate transitions between tasks. Body doubling tone: Let us tackle this together. Externalise working memory: You said earlier you wanted X.',
  '{"fontScale": "normal", "bionicReading": true, "sensoryLevel": 7}'
),
(
  'dyslexic',
  'Dyslexic',
  'Reading and decoding difference. Strong oral and visual reasoning.',
  '{"sensoryLevel": 5, "literalMode": false}',
  'User has dyslexia. Respond with maximum text accessibility. Short sentences (max 15 words). Active voice always. Use bullet points not paragraphs. Avoid passive constructions. Repeat key terms with consistent spelling. Use words user has seen before in this session. Lead with the conclusion, then explain. Offer audio version of all responses. Use visual analogies and diagrams. Mark difficult words with definition tooltips. NEVER include unnecessary punctuation. Hyphenate complex words when introducing.',
  '{"fontScale": "large", "lineSpacing": "relaxed", "bionicReading": false, "sensoryLevel": 5, "editorFont": "opendyslexic"}'
)
ON CONFLICT (profile_id) DO NOTHING;

-- Question transformations: multimodal format cache
CREATE TABLE IF NOT EXISTS public.question_transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  format_type TEXT NOT NULL CHECK (format_type IN (
    'original', 'plain_english', 'visual', 'audio', 'step_by_step', 'worked_example'
  )),
  format_content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  cached BOOLEAN DEFAULT true,
  user_rating SMALLINT,
  UNIQUE(document_id, question_number, format_type)
);

ALTER TABLE public.question_transformations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read transformations') THEN
    CREATE POLICY "Public can read transformations" ON public.question_transformations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can insert transformations') THEN
    CREATE POLICY "Authenticated can insert transformations" ON public.question_transformations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qt_doc_q ON public.question_transformations(document_id, question_number);
