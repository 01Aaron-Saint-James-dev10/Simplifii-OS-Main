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

  const { messages, assessmentTitle, tier } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Anthropic API key not configured.' });
  }

  // Build conversation for Claude
  const claudeMessages = (messages || []).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  // Compose system prompt: base + tier-specific + assessment context
  const tierAddition = TIER_PROMPTS[tier] || TIER_PROMPTS.tertiary;
  let systemPrompt = BASE_PROMPT + tierAddition;
  if (assessmentTitle) {
    systemPrompt += `\n\nThe learner is currently working on: "${assessmentTitle}".`;
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
    const reply = data?.content?.[0]?.text || '';

    if (!reply) {
      return res.status(502).json({ success: false, error: 'Empty response from Claude.' });
    }

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Tutor request failed.' });
  }
}
