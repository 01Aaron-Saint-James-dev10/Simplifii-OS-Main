-- Syllabus database foundation: syllabi, outcomes, past papers, past questions.
-- Public READ on all tables (educational content). Admin-only WRITE.

CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board TEXT NOT NULL,
  state TEXT NOT NULL,
  subject TEXT NOT NULL,
  year_level TEXT,
  syllabus_code TEXT,
  current_year INTEGER,
  source_url TEXT,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board, state, subject)
);

CREATE TABLE IF NOT EXISTS public.syllabus_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabi(id) ON DELETE CASCADE,
  outcome_code TEXT NOT NULL,
  outcome_text TEXT NOT NULL,
  stage TEXT,
  band_descriptors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.past_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabi(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  paper_type TEXT,
  source_url TEXT,
  raw_text TEXT,
  parsed_questions JSONB DEFAULT '[]',
  marker_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(syllabus_id, year, paper_type)
);

CREATE TABLE IF NOT EXISTS public.past_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.past_papers(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  marks INTEGER,
  syllabus_outcomes_referenced TEXT[] DEFAULT '{}',
  question_type TEXT,
  sample_response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read syllabi') THEN
    CREATE POLICY "Public read syllabi" ON public.syllabi FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read outcomes') THEN
    CREATE POLICY "Public read outcomes" ON public.syllabus_outcomes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read papers') THEN
    CREATE POLICY "Public read papers" ON public.past_papers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read questions') THEN
    CREATE POLICY "Public read questions" ON public.past_questions FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_syllabus_outcomes_syllabus ON public.syllabus_outcomes(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_syllabus ON public.past_papers(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_past_questions_paper ON public.past_questions(paper_id);

-- Seed 4 syllabi (NSW active, VIC/QLD/WA stubs)
INSERT INTO public.syllabi (board, state, subject, year_level, syllabus_code, current_year, source_url) VALUES
  ('NESA', 'NSW', 'English Standard', 'Year 11-12', 'EN-STD-11-12', 2026, 'https://educationstandards.nsw.edu.au/wps/portal/nesa/11-12/stage-6-learning-areas/stage-6-english/english-standard-2017'),
  ('VCAA', 'VIC', 'English', 'Year 11-12', 'VCE-ENG', 2026, 'https://www.vcaa.vic.edu.au/curriculum/vce/vce-study-designs/english/Pages/Index.aspx'),
  ('QCAA', 'QLD', 'English', 'Year 11-12', 'QCE-ENG', 2026, 'https://www.qcaa.qld.edu.au/senior/senior-subjects/english/english'),
  ('SCSA', 'WA', 'English', 'Year 11-12', 'WACE-ENG', 2026, 'https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/english/english')
ON CONFLICT (board, state, subject) DO NOTHING;
