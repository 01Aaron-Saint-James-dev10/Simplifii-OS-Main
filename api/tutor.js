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
import { LMS_NAVIGATION, EXTENSION_SCAFFOLD, REFERRALS, detectLMS } from './_lms_navigator.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const limited = rateLimit(getIdentifier(req), { maxRequests: 30, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || req.body?.userId || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const { messages, assessmentTitle, tier, homeLanguage, easyRead, briefText, documentType, sensoryLevel, accessibilityProfile, systemOverride } = req.body || {};
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
  const voiceMode = req.body?.voiceMode || false;
  const steeringDials = req.body?.steeringDials || {};
  const lastSessionData = req.body?.lastSession || null;
  const learnerContext = sanitiseLearnerContext(req.body?.learnerContext);

  // Document context flags (from AuraChatOverlay)
  const documentCount = req.body?.documentCount || 0;
  const documentInventory = req.body?.documentInventory || '';
  const documentContextAvailable = req.body?.documentContextAvailable !== false && briefText && briefText.length >= 100;
  const documentContextPartial = req.body?.documentContextPartial === true;

  let systemPrompt = '';

  // Overwhelm signal: learner indicated they feel overwhelmed
  if (req.body?.overwhelmSignal) {
    systemPrompt += 'OVERWHELM SIGNAL: The learner has indicated they feel overwhelmed. Respond with warmth and calm first. Acknowledge their feeling in one sentence. Then gently ask what would help most right now. Do not immediately redirect to tasks. Do not minimise. Do not say "you have got this."\n\n';
  }

  // Structured assessment data (always inject if available, regardless of rawText)
  const assessmentSummary = req.body?.assessmentSummary || '';
  if (assessmentSummary) {
    systemPrompt += `STRUCTURED ASSESSMENT DATA (confirmed accurate):\n${assessmentSummary}\n\nUse this for weight, due date, and rubric criteria questions. This data is always reliable.\n\n`;
  }

  // Document context injection or hallucination prevention
  if (documentContextAvailable && briefText) {
    systemPrompt += `DOCUMENT CONTEXT:\n${documentInventory}\n\nASSESSMENT CONTENT (aggregated from ${documentCount} loaded document${documentCount === 1 ? '' : 's'}):\n${briefText.slice(0, 3200)}\n\nYou have access to ${documentCount} document(s) for this course. Answer questions using this content. Reference which document you are drawing from.\n\n`;
  } else if (!briefText || documentCount === 0) {
    systemPrompt += 'CONTEXT WARNING: No document has been ingested for this session. Do NOT describe, summarise, or reference any document. Do NOT hallucinate document content. If the learner asks about their document, respond: "I cannot see a document in this session. To get specific guidance, upload your brief through the Add Course flow so I can read it properly."\n\n';
  } else if (documentContextPartial) {
    systemPrompt += 'CONTEXT WARNING: Document context is partial. Only reference what is explicitly present. Do not infer or expand.\n\n';
  }

  // Inject last session context if available
  if (lastSessionData && lastSessionData.days_ago > 0) {
    const sessionNote = lastSessionData.growth_signals?.length > 0
      ? `LAST SESSION (${lastSessionData.days_ago} day${lastSessionData.days_ago === 1 ? '' : 's'} ago): Growth signal: "${lastSessionData.growth_signals[0]}". Tasks touched: ${(lastSessionData.tasks_touched || []).join(', ') || 'none'}. Blocks completed: ${lastSessionData.blocks_completed || 0}.`
      : `LAST SESSION (${lastSessionData.days_ago} day${lastSessionData.days_ago === 1 ? '' : 's'} ago): Tasks: ${(lastSessionData.tasks_touched || []).join(', ') || 'none'}. Blocks: ${lastSessionData.blocks_completed || 0}.`;
    systemPrompt += `${sessionNote}\nReference this when the learner asks "what was I doing?" or needs continuity.\n\n`;
  }

  systemPrompt += buildAuraPrompt({
    tier: tier || 'tertiary',
    activeTier: 'Tier2',
    persona: steeringDials.persona || (literalMode ? 'Literal' : 'Academic'),
    scaffolding: steeringDials.scaffolding || 'Heavy',
    grit: steeringDials.grit || 'Hard Socratic',
    lod: steeringDials.lod || 'Sprint',
    assessmentTitle: assessmentTitle || '',
    briefText: documentContextAvailable ? (briefText || '') : '',
    documentType: documentType || '',
    learnerContext,
    accessibilityProfile: accessibilityProfile || 'standard',
    literalMode,
    decisionSkeleton,
    specialInterests: Array.isArray(specialInterests) ? specialInterests : [],
    sensoryLevel: typeof sensoryLevel === 'number' ? sensoryLevel : 5,
    voiceMode,
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

  // Institutional Navigator: detect barriers in the latest user message
  const lastUserMsg = (messages || []).filter(m => m.role === 'user').pop();
  if (lastUserMsg?.text) {
    const msgLower = lastUserMsg.text.toLowerCase();
    const detectedLMS = detectLMS(lastUserMsg.text);

    // LMS navigation help
    if (detectedLMS && LMS_NAVIGATION[detectedLMS]) {
      const lms = LMS_NAVIGATION[detectedLMS];
      systemPrompt += `\n\nINSTITUTIONAL NAVIGATOR MODE (${lms.name}):\nThe learner needs help with their LMS. Here is the guidance for ${lms.name}:\n- Find assignment: ${lms.find_assignment}\n- Submit work: ${lms.submit_work}\n- Find grades: ${lms.find_grades}\n- Find rubric: ${lms.find_rubric}\n- Support: ${lms.contact_support}\n\nSurface the relevant steps. Ask which specific action they need if unclear. Do NOT pretend to have direct LMS access.`;
    }

    // Extension requests
    if (/extension|late|can't submit|not going to make it|deadline/i.test(msgLower)) {
      systemPrompt += `\n\nEXTENSION NAVIGATOR: The learner may need an extension. Ask these 3 questions in order:\n1. "${EXTENSION_SCAFFOLD.questions[0].prompt}"\n2. "${EXTENSION_SCAFFOLD.questions[1].prompt}" (options: ${EXTENSION_SCAFFOLD.questions[1].options.join(', ')})\n3. "${EXTENSION_SCAFFOLD.questions[2].prompt}" (options: ${EXTENSION_SCAFFOLD.questions[2].options.join(', ')})\nFrom their answers, generate a plain, factual, non-grovelling extension request email draft. No excessive apology. No medical detail. State what they need, why (one sentence), and a proposed new date.`;
    }

    // Disability support referral
    if (/disability|accessibility|adjustment|accommodat|special needs/i.test(msgLower)) {
      systemPrompt += `\n\nDISABILITY SUPPORT REFERRAL:\n${REFERRALS.disability_support}\nDo NOT give medical or legal advice. Do NOT speculate about specific institutional policies. Defer to their institution as the authority.`;
    }

    // Academic integrity questions
    if (/academic integrity|plagiarism|ai policy|cheating|turnitin score/i.test(msgLower)) {
      systemPrompt += `\n\nACADEMIC INTEGRITY REFERRAL:\n${REFERRALS.academic_integrity}\nDo NOT give legal advice. Do NOT say "it is fine to use AI." Always defer to the institution's policy.`;
    }

    // AI detection concern: suggest humaniser
    if (/sounds? (like )?ai|ai detect|turnitin|robotic|not human|too formal|sounds? weird|does this sound real/i.test(msgLower)) {
      systemPrompt += `\n\nAI DETECTION CONCERN: The learner is worried their writing sounds AI-generated. Acknowledge the concern without judgement. Suggest they can use the Humaniser tool to adjust their writing style. End your response with [TOOL:humanise]`;
    }
  }

  // Allow callers to bypass the full AURA prompt with a custom system prompt
  if (systemOverride) {
    systemPrompt = systemOverride;
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

    const data = await response.json().catch(() => null);
    if (!data || !data.content || !data.content[0]?.text) {
      return res.status(502).json({ success: false, error: 'AI service returned an invalid response. Try again.' });
    }

    await recordUsage(userId, 'tutor', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });

    const rawReply = data.content[0].text.trim();
    const toolTagMatch = rawReply.match(/\[TOOL:(\w+)\]/);
    const toolSuggestion = toolTagMatch ? toolTagMatch[1] : null;
    const reply = rawReply.replace(/\s*\[TOOL:\w+\]\s*/g, '').trim();
    if (!reply) {
      return res.status(502).json({ success: false, error: 'AI returned an empty response. Try again.' });
    }

    return res.status(200).json({ success: true, reply, toolSuggestion });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
