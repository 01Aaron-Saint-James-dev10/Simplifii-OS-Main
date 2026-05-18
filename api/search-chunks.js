/**
 * /api/search-chunks
 *
 * Retrieves relevant document chunks for AURA context grounding.
 * Uses vector similarity search when embeddings exist, falls back to keyword search.
 *
 * POST { query, userId, courseId, assessmentTitle, limit }
 * Returns { success: true, chunks: [{ chunk_text, document_filename, similarity }] }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { createClient } from '@supabase/supabase-js';

async function getQueryEmbedding(text) {
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey) return null;

  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voyageKey}`,
      },
      body: JSON.stringify({
        model: 'voyage-3-lite',
        input: [text],
        input_type: 'query',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 60, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { query, userId, courseId, assessmentTitle, limit } = req.body || {};

  if (!query || !userId || !courseId) {
    return res.status(400).json({ success: false, error: 'query, userId, and courseId required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Database not configured.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Try vector search first
    const queryEmbedding = await getQueryEmbedding(query);

    const { data, error } = await supabase.rpc('search_document_chunks', {
      p_user_id: userId,
      p_course_id: courseId,
      p_assessment_title: assessmentTitle || null,
      p_query_embedding: queryEmbedding ? JSON.stringify(queryEmbedding) : null,
      p_query_text: queryEmbedding ? null : query,
      p_limit: Math.min(limit || 5, 10),
    });

    if (error) {
      return res.status(500).json({ success: false, error: 'Search failed.', detail: error.message });
    }

    return res.status(200).json({
      success: true,
      chunks: (data || []).map(c => ({
        text: c.chunk_text,
        filename: c.document_filename,
        type: c.document_type,
        similarity: c.similarity,
      })),
      searchType: queryEmbedding ? 'vector' : 'keyword',
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Search failed.' });
  }
}
