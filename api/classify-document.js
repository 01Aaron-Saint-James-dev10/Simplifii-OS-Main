/**
 * /api/classify-document
 *
 * Classifies uploaded document text as: brief | exam_paper | rubric | reading | notes | unknown
 * Uses pattern matching first, falls back to Anthropic if uncertain.
 *
 * POST { textSnippet } (first 1000 chars of extracted text)
 * Returns { success, type, confidence, suggested_actions }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

const PATTERNS = {
  exam_paper: /\b(Question\s+\d|Section\s+[I|II|III|IV|A-D]|\(\d+\s*marks?\)|\bexam\b.*\bpaper\b|HSC|VCE|QCE|WACE|ATAR)\b/i,
  rubric: /\b(criteria|band\s+[1-6]|high\s+distinction|distinction|credit|pass|fail|marking\s+guide|rubric|expected\s+qualities)\b/i,
  brief: /\b(assessment\s+task|due\s+date|word\s+count|submission|weighting|learning\s+outcome|submit\s+via)\b/i,
  reading: /\b(abstract|doi:|journal|vol\.\s*\d|pp\.\s*\d|et\s+al|published\s+in|peer.review)\b/i,
};

const ACTIONS = {
  brief: ['Plan it out with Brief Simplifier', 'Decode the rubric', 'Open in editor'],
  exam_paper: ['Practice these questions', 'Match to past HSC papers', 'Open in editor'],
  rubric: ['Decode into plain language', 'Check your draft against it', 'Open in editor'],
  reading: ['Summarise with AI tutor', 'Extract key ideas', 'Open in editor'],
  notes: ['Review and study', 'Open in editor'],
  unknown: ['Open in editor'],
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = await rateLimit(getIdentifier(req), { maxRequests: 30, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { textSnippet } = req.body || {};
  if (!textSnippet) return res.status(400).json({ success: false, error: 'textSnippet required.' });

  // Pattern matching first
  for (const [type, regex] of Object.entries(PATTERNS)) {
    if (regex.test(textSnippet)) {
      return res.status(200).json({ success: true, type, confidence: 0.8, suggested_actions: ACTIONS[type] });
    }
  }

  // AI fallback
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 50,
          system: 'Classify this document snippet as ONE of: brief, exam_paper, rubric, reading, notes, unknown. Return ONLY the type word.',
          messages: [{ role: 'user', content: textSnippet.slice(0, 500) }],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        await recordUsage(userId, 'classify-document', {
          tokensIn: data?.usage?.input_tokens || 0,
          tokensOut: data?.usage?.output_tokens || 0,
        });
        const aiType = (data?.content?.[0]?.text || '').trim().toLowerCase().replace(/[^a-z_]/g, '');
        const validType = ACTIONS[aiType] ? aiType : 'unknown';
        return res.status(200).json({ success: true, type: validType, confidence: 0.6, suggested_actions: ACTIONS[validType] });
      }
    } catch {}
  }

  return res.status(200).json({ success: true, type: 'unknown', confidence: 0.3, suggested_actions: ACTIONS.unknown });
}
