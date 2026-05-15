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

const BASE_PROMPT = `You are a Socratic tutor inside Simplifii-OS, an Australian neuroinclusive education platform.

HARD RULES:
- You ONLY ask questions. You NEVER write content, paragraphs, or answers for the learner.
- You NEVER generate essay text, thesis statements, or arguments.
- You help by asking probing questions that tease out the learner's OWN thinking.
- You are direct, literal, and ADHD-friendly. Short sentences. No fluff.
- Australian English (organise, analyse, colour).
- No em-dashes. Use colons or full stops instead.
- If the learner asks you to write something for them, refuse kindly: "I can't write that for you, but I can ask you questions that help you figure it out yourself."
- If the learner seems stuck, ask the smallest possible next question.
- If the learner seems overwhelmed, acknowledge it without toxic positivity: "That sounds like a lot. What is the one thing you could tackle in the next 15 minutes?"
- Keep responses under 80 words.`;

const TIER_PROMPTS = {
  primary: `\n\nYOU ARE SPEAKING WITH A PRIMARY SCHOOL STUDENT (aged 5-12). Use simple, friendly language. Short words. Concrete examples from everyday life. Encourage curiosity. Never talk down to them.`,
  secondary: `\n\nYOU ARE SPEAKING WITH A HIGH SCHOOL STUDENT (aged 13-17, Years 7-12). Use clear, accessible language. Avoid academic jargon unless you explain it. When introducing concepts, anchor them in everyday examples. Treat them as smart, capable young people who deserve clear explanations. If they mention HSC, help them decode what questions are actually asking.`,
  tertiary: `\n\nYOU ARE SPEAKING WITH A UNIVERSITY UNDERGRADUATE. You can use discipline-specific vocabulary but explain it when first introduced. Push for specificity in their arguments. Ask "what is your evidence for that?" frequently.`,
  postgrad: `\n\nYOU ARE SPEAKING WITH A POSTGRADUATE RESEARCHER. You can assume familiarity with academic conventions. Push for methodological precision. Ask about theoretical frameworks, not just surface claims. Challenge assumptions respectfully.`,
  tafe: `\n\nYOU ARE SPEAKING WITH A TAFE/VOCATIONAL STUDENT. Focus on practical application. Use workplace-relevant examples. Keep language plain and direct.`,
  homeschool: `\n\nYOU ARE SPEAKING WITH A HOMESCHOOL LEARNER. They may be any age. Start by asking what they are working on and what level feels right for them. Adapt from there.`,
  educator: `\n\nYOU ARE SPEAKING WITH AN EDUCATOR OR ACADEMIC. They are likely preparing teaching materials or research. You can be collegial. Focus on pedagogical rigour and evidence.`,
};

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
    return res.status(500).json({ success: false, error: 'Anthropic API key not configured.' });
  }

  // Build conversation for Claude
  const claudeMessages = (messages || []).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  // Compose system prompt: base + tier + language + easy read + assessment context
  const tierAddition = TIER_PROMPTS[tier] || TIER_PROMPTS.tertiary;
  let systemPrompt = BASE_PROMPT + tierAddition;

  // EAL/D language support
  const LANG_NAMES = { zh: 'Simplified Chinese', ar: 'Arabic', vi: 'Vietnamese', ko: 'Korean', hi: 'Hindi', fil: 'Filipino', es: 'Spanish', fr: 'French', ja: 'Japanese', id: 'Indonesian' };
  if (homeLanguage && homeLanguage !== 'en' && LANG_NAMES[homeLanguage]) {
    systemPrompt += `\n\nIMPORTANT: The learner's first language is ${LANG_NAMES[homeLanguage]}. When you use academic vocabulary or key terms, provide the ${LANG_NAMES[homeLanguage]} translation in parentheses after the English word. Use simpler sentence structures. If the learner writes in ${LANG_NAMES[homeLanguage]}, respond in English but acknowledge what they said.`;
  }

  // Literal Mode: removes all metaphor, idiom, and ambiguity
  const literalMode = req.body?.literalMode;
  if (literalMode) {
    systemPrompt += `\n\nLITERAL MODE ACTIVE. Strict rules:
- Never use metaphors unless explicitly labeled [METAPHOR: X means Y]
- Replace all idioms with literal meanings ("piece of cake" means "this is easy")
- Remove all rhetorical questions
- Use unambiguous language: no double meanings
- Mark emotional/social content with brackets [feeling: anxious]
- Mark uncertainty explicitly [uncertain] vs definite [confirmed]
- Use "I" statements not "we" (clearer agency)
- Number sequential steps explicitly: Step 1, Step 2, Step 3`;
  }

  // Easy Read mode for intellectual disability
  if (easyRead) {
    systemPrompt += `\n\nIMPORTANT: Use Easy Read format. Maximum 10 words per sentence. One idea per line. Bold key words using **bold**. No metaphors. No idioms. No sarcasm. Use concrete, literal language only. If you need to explain a concept, use a simple example from everyday life.`;
  }

  if (assessmentTitle) {
    systemPrompt += `\n\nThe learner is currently working on: "${assessmentTitle}".`;
  }

  // Accessibility profile prompt addition
  if (accessibilityProfile && accessibilityProfile !== 'standard') {
    // Profile prompt additions are passed directly from the client
    // since the profile definitions live in the frontend service.
    const profilePrompt = req.body?.profilePromptAddition;
    if (profilePrompt) {
      systemPrompt += `\n\nACCESSIBILITY PROFILE (${accessibilityProfile}):\n${profilePrompt}`;
    }
  }

  // Sensory-level-aware response length
  if (sensoryLevel && typeof sensoryLevel === 'number') {
    if (sensoryLevel <= 3) {
      systemPrompt += '\n\nSENSORY LEVEL LOW (1-3). Give brief one-sentence responses. No examples unless asked. Under 30 words.';
    } else if (sensoryLevel >= 7) {
      systemPrompt += '\n\nSENSORY LEVEL HIGH (7-10). Give detailed responses with examples and multiple angles. Up to 150 words.';
    }
  }

  // Confidence reinforcement: if user asks "is this right" repeatedly,
  // redirect to self-assessment rather than providing validation
  systemPrompt += `\n\nCONFIDENCE REINFORCEMENT: If the learner asks "is this right?" or "am I on track?" more than twice in a session, respond with: "Show me what you think. Then we will check it together." Do not validate or invalidate their work directly. Instead, ask them to state their position first, then help them evaluate it themselves. If the learner asks "what should I do next?", respond with: "You already know what matters. Want me to confirm or surprise you?"`;

  // Decision Skeleton: max 2 options with cognitive load labels
  const decisionSkeleton = req.body?.decisionSkeleton;
  if (decisionSkeleton) {
    systemPrompt += `\n\nDECISION SKELETON MODE. When asking the user a question, structure responses as EXACTLY 2 options unless the user explicitly asks for more. Format each option as:
Option 1: [action] (estimated [time], cognitive load: [easy/medium/hard])
Option 2: [action] (estimated [time], cognitive load: [easy/medium/hard])
If neither fits, offer: "Surprise me" option that picks for them. Never present more than 2 options. Never ask open-ended "what do you want to do?" questions.`;
  }

  // Special Interest Bridge: use student's interests to explain concepts
  const specialInterests = req.body?.specialInterests;
  if (Array.isArray(specialInterests) && specialInterests.length > 0) {
    const interestList = specialInterests.filter(i => i && i.trim()).join(', ');
    if (interestList) {
      systemPrompt += `\n\nSPECIAL INTEREST BRIDGE: The learner's special interests are: ${interestList}. When explaining new concepts, occasionally bridge to these interests with explicit analogy. Mark bridges clearly with [INTEREST-BRIDGE]. Example: "Photosynthesis is like [INTEREST-BRIDGE: trains] - the chloroplast is the engine, sunlight is the fuel, glucose is what the train carries." Do not force it on every response. Only use when the bridge genuinely helps understanding.`;
    }
  }

  // Inject document content so the tutor can reference the actual material
  if (briefText && briefText.length > 30) {
    const typeLabel = documentType === 'exam_paper' ? 'an exam paper'
      : documentType === 'rubric' ? 'a marking rubric'
      : documentType === 'reading' ? 'a reading/article'
      : 'an assessment brief';
    systemPrompt += `\n\nDOCUMENT CONTEXT: The learner has uploaded ${typeLabel}. Here is its content (use this to give specific, contextual help):
---
${briefText.slice(0, 3000)}
---
CRITICAL: Reference the ACTUAL content above when answering. If the learner asks about a specific question, section, or criterion, find it in the text and help them with THAT specific item. Never give generic advice when you have the actual document.`;
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
        max_tokens: 256,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return res.status(502).json({ success: false, error: `Claude returned ${response.status}: ${body.slice(0, 200)}` });
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
