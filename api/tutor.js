/**
 * /api/tutor
 *
 * Vercel serverless function. Socratic tutor powered by Claude.
 * ONLY asks questions. NEVER writes content for the learner.
 * This protects the authenticity moat.
 *
 * Accepts POST { messages: [{role, text}], assessmentTitle: string, tier: string }
 * Returns { success: true, reply: string } or { success: false, error: string }
 *
 * Env var: ANTHROPIC_API_KEY (set in Vercel project settings)
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';
import { sanitiseLearnerContext } from './_sanitize.js';
import { buildAuraPrompt } from './_aura-prompt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 30, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { messages, assessmentTitle, tier, homeLanguage, easyRead, briefText, documentType, sensoryLevel, accessibilityProfile } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'API key not configured.' });
  }

  // Build conversation for Claude
  const claudeMessages = (messages || []).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  // Build AURA system prompt with full runtime context
  const literalMode = req.body?.literalMode || false;
  const decisionSkeleton = req.body?.decisionSkeleton || false;
  const specialInterests = req.body?.specialInterests || [];
  const learnerContext = sanitiseLearnerContext(req.body?.learnerContext);

  let systemPrompt = buildAuraPrompt({
    tier: tier || 'tertiary',
    activeTier: 'Tier2', // Tutor panel is always Tier 2 (Socratic)
    persona: literalMode ? 'Literal' : 'Academic',
    scaffolding: 'Heavy', // default; overridden by learnerContext if present
    grit: 'Hard Socratic', // tutor default
    lod: 'Sprint',
    assessmentTitle: assessmentTitle || '',
    briefText: briefText || '',
    documentType: documentType || '',
    learnerContext,
    accessibilityProfile: accessibilityProfile || 'standard',
    literalMode,
    decisionSkeleton,
    specialInterests: Array.isArray(specialInterests) ? specialInterests : [],
    sensoryLevel: typeof sensoryLevel === 'number' ? sensoryLevel : 5,
  });

  // EAL/D language support (additive to AURA)
  const LANG_NAMES = { zh: 'Simplified Chinese', ar: 'Arabic', vi: 'Vietnamese', ko: 'Korean', hi: 'Hindi', fil: 'Filipino', es: 'Spanish', fr: 'French', ja: 'Japanese', id: 'Indonesian' };
  if (homeLanguage && homeLanguage !== 'en' && LANG_NAMES[homeLanguage]) {
    systemPrompt += `\n\nEAL/D SUPPORT: The learner's first language is ${LANG_NAMES[homeLanguage]}. Provide ${LANG_NAMES[homeLanguage]} translations for key terms in parentheses. Use simpler sentence structures.`;
  }

  // Easy Read mode (additive to AURA for intellectual disability support)
  if (easyRead) {
    systemPrompt += `\n\nEASY READ MODE: Maximum 10 words per sentence. One idea per line. Bold key words using **bold**. No metaphors. No idioms. No sarcasm. Concrete, literal language only.`;
  }

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
        max_tokens: 400,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });
    }

    const data = await response.json();
    await recordUsage(userId, 'tutor', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    const reply = data?.content?.[0]?.text || '';

    if (!reply) {
      return res.status(502).json({ success: false, error: 'Empty response from Claude.' });
    }

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Tutor request failed.' });
  }
}
