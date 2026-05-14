-- Add weight column to assessments for storing extracted percentage/marks.
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS weight TEXT;
COMMENT ON COLUMN public.assessments.weight IS 'Assessment weighting, e.g. 30% or 30 marks';
