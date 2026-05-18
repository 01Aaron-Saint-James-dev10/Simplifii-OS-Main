-- Block 3: PDF upload scaffold. One-off paste into Supabase SQL editor.
-- Dashboard: https://supabase.com/dashboard/project/aqcreatryuvuuynwvnqy/sql/new
--
-- WARNING: These policies are TEMPORARY scaffolding for Block 3 (no auth).
-- They allow ANY visitor to read or write the documents bucket.
-- Block 4 replaces them with auth-aware RLS tied to user IDs.

-- 1. Create the 'documents' bucket as public.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Drop any prior Block 3 policies so this script is idempotent.
DROP POLICY IF EXISTS "block3_temp_read_documents"   ON storage.objects;
DROP POLICY IF EXISTS "block3_temp_insert_documents" ON storage.objects;

-- 3. Permissive INSERT policy: anyone (anon or authenticated) may upload.
CREATE POLICY "block3_temp_insert_documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'documents');

-- 4. Permissive SELECT policy: anyone may read objects in this bucket.
-- Public buckets technically expose objects over the public URL regardless,
-- but the SELECT policy is what the storage API checks for list/get calls.
CREATE POLICY "block3_temp_read_documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'documents');
