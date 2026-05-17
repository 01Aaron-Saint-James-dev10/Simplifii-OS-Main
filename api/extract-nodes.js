/**
 * /api/extract-nodes
 *
 * Typed document node extraction via Claude. Receives classified
 * document text and returns structured nodes (Z, XN, YN schema).
 *
 * POST { text, documentType, filename, user_id }
 * Returns { success, nodes: [{nodeType, nodeId, content, confidence}], extractionError }
 *
 * Env: ANTHROPIC_API_KEY
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

const SYSTEM_PROMPT = `You are a document node extractor inside Simplifii-OS. Your job is to read a classified academic document and extract typed sections as structured nodes. Each node is a self-contained piece of information that downstream tools (scaffolder, rubric decoder, AURA tutor) can address individually.

Australian English. No em-dashes. No markdown. Return ONLY valid JSON.`;

function buildUserMessage(documentType, text, filename) {
  const snippet = text.slice(0, 4000);

  if (documentType === 'rubric') {
    return `Extract typed nodes from this MARKING RUBRIC.

Filename: ${filename || 'unknown'}

Document:
${snippet}

Return ONLY a JSON object:
{
  "nodes": [
    { "nodeType": "YN1", "nodeId": "YN1", "content": "criteria list with weightings. Format as a JSON array: [{${'"'}criterion${'"'}: ${'"'}name${'"'}, ${'"'}weighting${'"'}: ${'"'}25%${'"'}}]. Use JSON.stringify format with escaped quotes.", "confidence": 0.9 },
    { "nodeType": "YN2", "nodeId": "YN2", "content": "grade band descriptors per criterion using EXACT labels from rubric. Format as a JSON array: [{${'"'}criterion${'"'}: ${'"'}name${'"'}, ${'"'}bands${'"'}: [{${'"'}label${'"'}: ${'"'}HD${'"'}, ${'"'}descriptor${'"'}: ${'"'}what this level looks like${'"'}}]}]. Use JSON.stringify format.", "confidence": 0.9 },
    { "nodeType": "YN3", "nodeId": "YN3", "content": "scale detected: the grading scale used (e.g. HD/D/C/P, Excellent/Good/Satisfactory, 1-7 numeric, percentage)", "confidence": 0.9 },
    { "nodeType": "YN4", "nodeId": "YN4", "content": "hidden curriculum in rubric language: what markers actually reward that the rubric implies but does not state plainly", "confidence": 0.9 }
  ]
}

RULES:
- Use EXACT grade band labels from the rubric. Do NOT rename them.
- YN1 and YN2 content: format as valid JSON array strings so downstream tools can JSON.parse() them.
- For YN4 (hidden curriculum): infer from rubric language. This is the only node where inference is allowed.
- Each content field: max 2000 characters.
- confidence: 0.9 if clearly present, 0.5 if partial, 0.2 if inferred.
- If a node cannot be extracted, include it with content: null and confidence: 0.
- Return ALL four nodes.
- Australian English. Return ONLY the JSON.`;
  }

  if (documentType === 'course_outline' || documentType === 'outline') {
    return `Extract typed nodes from this COURSE OUTLINE.

Filename: ${filename || 'unknown'}

Document:
${snippet}

Return ONLY a JSON object:
{
  "nodes": [
    { "nodeType": "Z1", "nodeId": "Z1", "content": "unit metadata: course code, course name, credit points, faculty, convenor name if stated", "confidence": 0.9 },
    { "nodeType": "Z2", "nodeId": "Z2", "content": "learning outcomes list: each LO verbatim from the document", "confidence": 0.9 },
    { "nodeType": "Z3", "nodeId": "Z3", "content": "weekly schedule or topic list: week number and topic for each teaching week", "confidence": 0.9 },
    { "nodeType": "Z4", "nodeId": "Z4", "content": "assessment overview: each assessment name, weighting, due date, and brief description", "confidence": 0.9 },
    { "nodeType": "Z5", "nodeId": "Z5", "content": "policies: late submission penalty, AI use policy, extension process, special consideration", "confidence": 0.9 }
  ]
}

RULES:
- Extract ONLY what is explicitly stated. Never invent content.
- Each content field: max 2000 characters.
- confidence: 0.9 if clearly present, 0.5 if partial, 0.2 if inferred.
- If a node cannot be extracted, include it with content: null and confidence: 0.
- Return ALL five nodes.
- Australian English. Return ONLY the JSON.`;
  }

  // Default: brief (also handles 'unknown' type as brief extraction)
  return `Extract typed nodes from this ASSESSMENT BRIEF.

Filename: ${filename || 'unknown'}

Document:
${snippet}

Return ONLY a JSON object:
{
  "nodes": [
    { "nodeType": "XN1", "nodeId": "XN1", "content": "what the student must produce: the core task description in plain language (max 2000 chars)", "confidence": 0.9 },
    { "nodeType": "XN2", "nodeId": "XN2", "content": "format requirements: word count, file type, referencing style, submission method", "confidence": 0.9 },
    { "nodeType": "XN3", "nodeId": "XN3", "content": "due date as ISO string (e.g. 2025-06-15) or the exact date text if ambiguous", "confidence": 0.9 },
    { "nodeType": "XN4", "nodeId": "XN4", "content": "learning outcomes this task maps to: list each LO verbatim from the document", "confidence": 0.9 },
    { "nodeType": "XN5", "nodeId": "XN5", "content": "hidden curriculum: implicit expectations the brief does not state but markers reward", "confidence": 0.9 }
  ]
}

RULES:
- Extract ONLY what is explicitly stated for XN1-XN4. Never invent content.
- For XN5 (hidden curriculum): infer from the language, structure, and context of the brief. This is the only node where inference is allowed.
- Each content field: max 2000 characters.
- confidence: 0.9 if clearly present in document, 0.5 if partially present, 0.2 if inferred.
- If a node cannot be extracted at all, include it with content: null and confidence: 0.
- Return ALL five nodes, even if some are null.
- Australian English. Return ONLY the JSON.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 15, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { text, documentType, filename } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!text || text.length < 20) return res.status(400).json({ success: false, error: 'text required (min 20 chars).' });

  const userMsg = buildUserMessage(documentType || 'brief', text, filename);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!response.ok) return res.status(502).json({ success: false, nodes: [], extractionError: true, error: 'AI service unavailable.' });

    const data = await response.json();
    await recordUsage(userId, 'extract-nodes', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });

    const rawText = data?.content?.[0]?.text || '';
    let parsed = null;
    try {
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch { /* parse failed */ }

    if (!parsed || !Array.isArray(parsed.nodes)) {
      return res.status(200).json({ success: false, nodes: [], extractionError: true, error: 'Could not parse node extraction.' });
    }

    // Validate YN1 and YN2 content fields: must be parseable JSON arrays
    const validated = parsed.nodes.map(node => {
      if ((node.nodeType === 'YN1' || node.nodeType === 'YN2') && node.content) {
        try {
          const inner = JSON.parse(node.content);
          if (!Array.isArray(inner)) throw new Error('not array');
        } catch {
          console.warn(`[extract-nodes] ${node.nodeType} content is not a valid JSON array, downgrading confidence`);
          return { ...node, confidence: 0.1 };
        }
      }
      // Cap content at 2000 chars
      if (node.content && node.content.length > 2000) {
        return { ...node, content: node.content.slice(0, 2000) };
      }
      return node;
    });

    return res.status(200).json({ success: true, nodes: validated, extractionError: false });
  } catch {
    return res.status(500).json({ success: false, nodes: [], extractionError: true, error: 'Node extraction failed.' });
  }
}
