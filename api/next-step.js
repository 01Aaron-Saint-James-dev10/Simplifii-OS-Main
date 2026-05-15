/**
 * /api/next-step
 *
 * AI orchestrator: looks at what the user has done so far and suggests
 * the next tool to use + what to do with it. Context-aware.
 *
 * POST { briefText, rubricText, draftText, wordCount, targetWords,
 *        assessmentTitle, tier, toolsUsed, currentPanel }
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

  const { briefText, rubricText, draftText, wordCount, targetWords,
          assessmentTitle, tier, toolsUsed, currentPanel } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });

  const systemPrompt = `You are the AI assistant inside Simplifii-OS. Australian English. No em-dashes.

You have access to these tools (the student can click each one):
- Brief Simplifier: creates a week-by-week action plan
- Rubric Decoder: translates rubric into plain language
- UDL Representations: shows the brief in 4 formats (plain English, flowchart, audio script, chunked tasks)
- Socratic Tutor: asks questions to help the student think
- Essay Scorer: gives formative feedback on draft text
- Hidden Curriculum Decoder: decodes what markers actually want
- Past Questions: shows similar HSC past exam questions
- Voice Input: student can speak instead of type

Based on the student's current context, suggest THE ONE next thing they should do. Be specific. Name the tool. Explain why.

Format:
NEXT: [tool name]
WHY: [one sentence why this is the best next step]
DO: [specific instruction, max 2 sentences]

RULES:
- If no brief uploaded: suggest uploading a brief first
- If brief uploaded but no rubric decoded: suggest Rubric Decoder
- If brief + rubric done but no writing started: suggest Brief Simplifier for an action plan
- If writing started but under 30% of word count: suggest Socratic Tutor to develop arguments
- If writing over 50%: suggest Essay Scorer for mid-draft feedback
- If near completion: suggest Hidden Curriculum Decoder for final polish
- Keep it to 3 lines maximum. Students with ADHD need brevity.`;

  const context = `Assessment: "${assessmentTitle || 'Untitled'}"
Tier: ${tier || 'secondary'}
Brief uploaded: ${briefText ? 'yes (' + briefText.length + ' chars)' : 'no'}
Rubric available: ${rubricText ? 'yes' : 'no'}
Draft progress: ${wordCount || 0}${targetWords ? ' / ' + targetWords : ''} words
Tools already used: ${toolsUsed?.join(', ') || 'none'}
Current panel: ${currentPanel || 'none'}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 200, system: systemPrompt, messages: [{ role: 'user', content: context }] }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    const data = await response.json();
    await recordUsage(userId, 'next-step', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });
    return res.status(200).json({ success: true, suggestion: data?.content?.[0]?.text || '' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
