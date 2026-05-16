/**
 * /api/scrape
 *
 * Vercel serverless function. Proxies URL scraping via Firecrawl HTTP API.
 * Called by UrlIngestModal in the client to extract course outlines from
 * public handbook pages.
 *
 * Accepts POST { url: string }
 * Returns { success: true, content: string } or { success: false, error: string }
 *
 * Env var: FIRECRAWL_API_KEY (set in Vercel project settings)
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 10, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'Missing or invalid url in request body.' });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Firecrawl API key not configured.' });
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: 'Could not fetch the page. Check the URL and try again.' });
    }

    const data = await response.json();
    const content = data?.data?.markdown || data?.markdown || '';

    if (!content || content.length < 50) {
      return res.status(422).json({ success: false, error: 'The page did not contain enough text to extract a course outline.' });
    }

    return res.status(200).json({ success: true, content });
  } catch {
    return res.status(500).json({ success: false, error: 'Could not fetch the page. Try again.' });
  }
}
