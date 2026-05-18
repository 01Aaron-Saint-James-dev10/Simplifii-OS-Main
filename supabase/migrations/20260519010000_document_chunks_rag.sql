-- Enable pgvector for semantic search over student documents
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Document chunks: stores chunked text with embeddings for RAG
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assessment_title TEXT NOT NULL DEFAULT '__global__',
  document_filename TEXT,
  document_type TEXT,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding extensions.vector(1024),
  tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_chunks_user_course ON public.document_chunks(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_chunks_assessment ON public.document_chunks(user_id, course_id, assessment_title);
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON public.document_chunks USING GIN(tsv);

-- HNSW index for vector similarity (cosine distance, used by Voyage AI embeddings)
-- Only effective after embeddings are populated; safe to create on empty table
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- RLS: user can only access own chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chunks_select_own' AND tablename = 'document_chunks') THEN
    CREATE POLICY "chunks_select_own" ON public.document_chunks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chunks_insert_own' AND tablename = 'document_chunks') THEN
    CREATE POLICY "chunks_insert_own" ON public.document_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chunks_delete_own' AND tablename = 'document_chunks') THEN
    CREATE POLICY "chunks_delete_own" ON public.document_chunks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Semantic search function: vector similarity with tsvector fallback
CREATE OR REPLACE FUNCTION public.search_document_chunks(
  p_user_id UUID,
  p_course_id UUID,
  p_assessment_title TEXT DEFAULT NULL,
  p_query_embedding extensions.vector DEFAULT NULL,
  p_query_text TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  document_filename TEXT,
  document_type TEXT,
  chunk_index INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Vector search path (when embedding is provided)
  IF p_query_embedding IS NOT NULL THEN
    RETURN QUERY
      SELECT
        dc.id,
        dc.chunk_text,
        dc.document_filename,
        dc.document_type,
        dc.chunk_index,
        1 - (dc.embedding <=> p_query_embedding) AS similarity
      FROM public.document_chunks dc
      WHERE dc.user_id = p_user_id
        AND dc.course_id = p_course_id
        AND (p_assessment_title IS NULL OR dc.assessment_title = p_assessment_title)
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> p_query_embedding
      LIMIT p_limit;
  -- Keyword fallback (when only text query is provided)
  ELSIF p_query_text IS NOT NULL AND p_query_text != '' THEN
    RETURN QUERY
      SELECT
        dc.id,
        dc.chunk_text,
        dc.document_filename,
        dc.document_type,
        dc.chunk_index,
        ts_rank(dc.tsv, websearch_to_tsquery('english', p_query_text))::FLOAT AS similarity
      FROM public.document_chunks dc
      WHERE dc.user_id = p_user_id
        AND dc.course_id = p_course_id
        AND (p_assessment_title IS NULL OR dc.assessment_title = p_assessment_title)
        AND dc.tsv @@ websearch_to_tsquery('english', p_query_text)
      ORDER BY similarity DESC
      LIMIT p_limit;
  END IF;
END;
$$;
