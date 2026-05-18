/**
 * /api/transform-question
 *
 * Vercel serverless function. Transforms an exam question into four UDL variants
 * in parallel: plain language, visual breakdown, worked example, audio-ready.
 *
 * Accepts POST { question, subject, marks, questionType }
 * Returns { plainLanguage, visualBreakdown, workedExample, audioReady }
 *
 * Env var: ANTHROPIC_API_KEY
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';

const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude(apiKey, systemPrompt, userMessage) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text?.trim() ?? '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 5, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { question, subject, marks, questionType } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'API key not configured.' });
  }
  if (!question || typeof question !== 'string' || question.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'A question is required.' });
  }

  const userMessage = [
    `Question: ${question.trim()}`,
    subject ? `Subject: ${subject}` : null,
    marks != null ? `Marks: ${marks}` : null,
    questionType ? `Question type: ${questionType}` : null,
  ].filter(Boolean).join('\n');

  const SYSTEM_PLAIN = 'Rewrite this question at Year 8 reading level. Make every implicit instruction explicit. Define every technical term inline. Return only the rewritten question.';
  const SYSTEM_STEPS = 'Break this question into numbered steps. Show mark allocation per step based on total marks available. Return only the numbered steps.';
  const SYSTEM_EXAMPLE = 'Write a parallel question from a different topic that demonstrates the same thinking process. Do not answer the original question. Return only the parallel example.';
  const SYSTEM_AUDIO = 'Rewrite this question for listening not reading. Use short sentences. Active voice only. Add [PAUSE] markers where a listener needs processing time. Return only the audio version.';

  try {
    const [plainLanguage, visualBreakdown, workedExample, audioReady] = await Promise.all([
      callClaude(apiKey, SYSTEM_PLAIN, userMessage),
      callClaude(apiKey, SYSTEM_STEPS, userMessage),
      callClaude(apiKey, SYSTEM_EXAMPLE, userMessage),
      callClaude(apiKey, SYSTEM_AUDIO, userMessage),
    ]);

    await recordUsage(userId, 'transform-question', { tokensIn: 0, tokensOut: 0 });

    return res.status(200).json({ success: true, plainLanguage, visualBreakdown, workedExample, audioReady });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
