-- Clean up duplicate RLS policies on courses.
-- Keep the new-style "Users can * own courses" policies.
-- Drop the old-style "courses_*_own" duplicates.

DROP POLICY IF EXISTS "courses_select_own" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_own" ON public.courses;
DROP POLICY IF EXISTS "courses_update_own" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_own" ON public.courses;
