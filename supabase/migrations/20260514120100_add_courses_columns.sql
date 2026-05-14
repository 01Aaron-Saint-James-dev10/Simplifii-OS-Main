-- Add missing columns to courses table.
-- AddCourseModal inserts code, tier, term but these columns did not exist on live.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS term TEXT;

COMMENT ON COLUMN public.courses.code IS 'Course code, e.g. ANAT3121';
COMMENT ON COLUMN public.courses.tier IS 'Education tier: primary, secondary, tertiary, postgrad, homeschool, educator, institution, tafe';
COMMENT ON COLUMN public.courses.term IS 'Term or semester: Term 1-4, Semester 1-2, Year-long, Not applicable';
