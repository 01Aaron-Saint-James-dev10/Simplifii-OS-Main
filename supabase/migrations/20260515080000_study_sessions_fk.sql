-- Migrate study_sessions.course_id and assessment_id from TEXT to UUID
-- with proper foreign key constraints for referential integrity.
--
-- Safe migration: only alters rows where the TEXT value is a valid UUID.
-- Rows with non-UUID values (legacy data) are set to NULL.

-- Step 1: Add temporary UUID columns
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS course_id_uuid UUID;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS assessment_id_uuid UUID;

-- Step 2: Copy valid UUID values
UPDATE public.study_sessions
SET course_id_uuid = course_id::UUID
WHERE course_id IS NOT NULL
  AND course_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.study_sessions
SET assessment_id_uuid = assessment_id::UUID
WHERE assessment_id IS NOT NULL
  AND assessment_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Drop old TEXT columns, rename new ones
ALTER TABLE public.study_sessions DROP COLUMN IF EXISTS course_id;
ALTER TABLE public.study_sessions DROP COLUMN IF EXISTS assessment_id;
ALTER TABLE public.study_sessions RENAME COLUMN course_id_uuid TO course_id;
ALTER TABLE public.study_sessions RENAME COLUMN assessment_id_uuid TO assessment_id;

-- Step 4: Add foreign key constraints (nullable, cascade on delete)
ALTER TABLE public.study_sessions
  ADD CONSTRAINT fk_study_sessions_course
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

ALTER TABLE public.study_sessions
  ADD CONSTRAINT fk_study_sessions_assessment
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE SET NULL;

-- Step 5: Add index for FK lookups
CREATE INDEX IF NOT EXISTS idx_study_sessions_course ON public.study_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_assessment ON public.study_sessions(assessment_id);
