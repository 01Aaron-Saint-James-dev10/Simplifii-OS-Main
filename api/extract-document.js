/**
 * /api/extract-document
 *
 * Claude-powered structured extraction from raw PDF text.
 * Replaces GCP Document AI. Takes pdfjs-extracted text and returns
 * structured JSON with course code, assessment details, rubric criteria.
 *
 * POST { text, filename }
 * Returns { success, extraction: { courseCode, courseName, documentType, ... } }
 *
 * Env: ANTHROPIC_API_KEY
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 20, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { text, filename } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!text || text.length < 20) return res.status(400).json({ success: false, error: 'text required (min 20 chars).' });

  const snippet = text.slice(0, 4000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a document classifier and extractor inside Simplifii-OS. Australian English. Return ONLY valid JSON. No explanation.`,
        messages: [{ role: 'user', content: `Analyse this document text and extract structured data.

Filename: ${filename || 'unknown.pdf'}

Text:
${snippet}

Return ONLY a JSON object:
{
  "courseCode": "e.g. BABS1201 or null if not found",
  "courseName": "e.g. Molecules Cells and Organisms or null",
  "documentType": "one of: brief, rubric, course_outline, exam_paper, reading",
  "assessmentTitle": "exact assessment name or null",
  "weight": null or number (e.g. 25 for 25%). Extract the weight for the specific assessment described in this brief only. If multiple assessments are listed, extract only the weight matching the title or task at the top of the document. Return only the number without the % symbol,
  "dueDate": "ISO date string or null",
  "wordCount": null or number,
  "rubricCriteria": ["criterion 1", "criterion 2"] or [],
  "questions": [] (only for exam papers: [{"number": 1, "marks": 5, "text": "..."}])
}

RULES:
- Extract ONLY what is explicitly stated. Never infer or guess.
- courseCode: 4 letters + 4 digits (e.g. BABS1201, MATH1131)
- documentType: pick the BEST match based on content
- If a field cannot be determined, use null
- rubricCriteria: only include if rubric criteria are actually present
- questions: only include if this is clearly an exam paper` }],
      }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable.' });
    const data = await response.json();
    await recordUsage(userId, 'extract-document', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });

    const rawText = data?.content?.[0]?.text || '';
    let extraction = null;
    try {
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) extraction = JSON.parse(m[0]);
    } catch { /* parse failed */ }

    if (extraction) {
      return res.status(200).json({ success: true, extraction });
    }
    return res.status(200).json({ success: false, error: 'Could not parse extraction.' });
  } catch {
    return res.status(500).json({ success: false, error: 'Extraction failed.' });
  }
}
