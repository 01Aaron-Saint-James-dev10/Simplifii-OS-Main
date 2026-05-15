/**
 * /api/scaffold-suggest
 *
 * Vercel serverless function. Takes an assessment brief and returns
 * similar HSC past questions from the past_questions table.
 *
 * Strategy: keyword extraction from the brief, then text search
 * against past question content. Falls back to most recent questions
 * if no keyword match.
 *
 * Accepts POST { assessmentBriefText: string, subject?: string, state?: string }
 * Returns { success: true, suggestedPastQuestions: [...], confidence: string }
 */

import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIdentifier } from './_rateLimit.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Log once at cold start; handler will return 401 per request
  if (typeof console !== 'undefined') console.error('[scaffold-suggest] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Extract key topic words from assessment text
function extractKeywords(text) {
  const lower = (text || '').toLowerCase();
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
    'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every',
    'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same',
    'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who',
    'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
    'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'students', 'student', 'must',
    'using', 'also', 'about', 'question', 'answer', 'response', 'mark', 'marks']);
  const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  // Count frequency, return top 8
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 20, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  if (!supabase) {
    return res.status(401).json({ success: false, error: 'Authentication required to use scaffold suggestions.' });
  }

  const { assessmentBriefText, subject, state } = req.body || {};

  if (!assessmentBriefText || assessmentBriefText.length < 10) {
    return res.status(400).json({ success: false, error: 'assessmentBriefText is required (min 10 chars).' });
  }

  try {
    const keywords = extractKeywords(assessmentBriefText);

    // Build a text search query: OR the keywords against question text + sample response
    let query = supabase
      .from('past_questions')
      .select('id, question_number, question_text, marks, question_type, sample_response_text, paper_id, past_papers!inner(year, syllabus_id, syllabi!inner(board, state, subject))')
      .order('paper_id', { ascending: false })
      .limit(20);

    const { data: allQuestions, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!allQuestions || allQuestions.length === 0) {
      return res.status(200).json({ success: true, suggestedPastQuestions: [], confidence: 'low' });
    }

    // Score each question by keyword overlap with its content
    const scored = allQuestions.map(q => {
      const content = `${q.question_text} ${q.sample_response_text || ''}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (content.includes(kw)) score += 1;
      }
      return { ...q, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);
    const confidence = top5[0]?.score >= 3 ? 'high' : top5[0]?.score >= 1 ? 'medium' : 'low';

    const results = top5.map(q => ({
      id: q.id,
      questionNumber: q.question_number,
      questionText: q.question_text,
      marks: q.marks,
      year: q.past_papers?.year,
      board: q.past_papers?.syllabi?.board,
      subject: q.past_papers?.syllabi?.subject,
      markerFeedback: (q.sample_response_text || '').slice(0, 500),
      score: q.score,
    }));

    return res.status(200).json({ success: true, suggestedPastQuestions: results, confidence });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Pattern match failed.' });
  }
}
