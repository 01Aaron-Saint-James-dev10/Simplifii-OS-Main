/**
 * /api/embed-chunks
 *
 * Chunks document text and stores in document_chunks table.
 * If VOYAGE_API_KEY is set, generates vector embeddings via Voyage AI.
 * Otherwise stores chunks with tsvector only (keyword search fallback).
 *
 * POST { text, userId, courseId, assessmentTitle, filename, documentType }
 * Returns { success: true, chunksStored: number }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { createClient } from '@supabase/supabase-js';

const CHUNK_SIZE = 600; // tokens (approx 4 chars per token)
const CHUNK_OVERLAP = 100;
const MAX_CHUNKS = 50;

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text || text.length < 20) return [];
  const charSize = chunkSize * 4;
  const charOverlap = overlap * 4;
  const chunks = [];
  let start = 0;

  while (start < text.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + charSize, text.length);

    // Try to break at sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPeriod = slice.lastIndexOf('. ');
      const lastNewline = slice.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > charSize * 0.5) {
        end = start + breakPoint + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start = end - charOverlap;
    if (start >= text.length) break;
  }

  return chunks;
}

async function getVoyageEmbeddings(texts) {
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
        input: texts,
        input_type: 'document',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.map(d => d.embedding) || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 10, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { text, userId, courseId, assessmentTitle, filename, documentType } = req.body || {};

  if (!text || !userId || !courseId) {
    return res.status(400).json({ success: false, error: 'text, userId, and courseId required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Database not configured.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Delete existing chunks for this document (re-embed on re-upload)
    await supabase
      .from('document_chunks')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('assessment_title', assessmentTitle || '__global__')
      .eq('document_filename', filename || '__unnamed__');

    // Chunk the text
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return res.status(200).json({ success: true, chunksStored: 0 });
    }

    // Try to get embeddings (returns null if no VOYAGE_API_KEY)
    const embeddings = await getVoyageEmbeddings(chunks);

    // Build rows
    const rows = chunks.map((chunk, i) => ({
      user_id: userId,
      course_id: courseId,
      assessment_title: assessmentTitle || '__global__',
      document_filename: filename || '__unnamed__',
      document_type: documentType || 'unknown',
      chunk_index: i,
      chunk_text: chunk,
      embedding: embeddings ? embeddings[i] : null,
    }));

    // Insert in batches of 20
    for (let i = 0; i < rows.length; i += 20) {
      const batch = rows.slice(i, i + 20);
      const { error } = await supabase.from('document_chunks').insert(batch);
      if (error) {
        return res.status(500).json({ success: false, error: 'Failed to store chunks.' });
      }
    }

    return res.status(200).json({
      success: true,
      chunksStored: rows.length,
      hasEmbeddings: !!embeddings,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Chunking failed.' });
  }
}
