/**
 * /api/ocr
 *
 * Accepts a base64-encoded image and extracts text using Claude Vision.
 * Returns { success: true, text: string } or { success: false, error: string }.
 *
 * POST { image: base64string, mimeType: "image/jpeg" | "image/png" | "image/webp" }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 10, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { image, mimeType } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!image) return res.status(400).json({ success: false, error: 'image (base64) required.' });

  const mediaType = mimeType || 'image/jpeg';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: 'Extract all text from this image exactly as written. Preserve the original structure, headings, numbering, and formatting. Return plain text only. If the image contains a table, reproduce it as aligned text. If handwritten, do your best to transcribe accurately and mark uncertain words with [unclear].',
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: 'OCR service unavailable. Try again.' });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    if (!text.trim()) {
      return res.status(200).json({ success: false, error: 'No text found in image.' });
    }

    return res.status(200).json({ success: true, text });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'OCR failed. Try again.' });
  }
}
