/**
 * /api/generate-practice
 *
 * Generates practice questions from a learner's uploaded brief/rubric.
 * AURA uses these to guide the learner through exam-style practice
 * without needing external past paper data.
 *
 * Also serves as the entry point for past paper questions from the database
 * when they are available.
 *
 * POST { briefText, rubricCriteria, assessmentTitle, tier, subject, questionCount, format }
 * Returns { success, questions: [{ id, text, marks, criterion, difficulty, hint }] }
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';
import { checkQuota, recordUsage } from './_quota.js';
import { sanitiseLearnerContext } from './_sanitize.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = await rateLimit(getIdentifier(req), { maxRequests: 10, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const userId = req.body?.user_id || null;
  const quota = await checkQuota(userId);
  if (quota.exceeded) return res.status(402).json({ success: false, error: quota.error });

  const {
    briefText, rubricCriteria, assessmentTitle, tier, subject,
    questionCount = 5, format = 'mixed', state: learnerState,
    literalMode, accessibilityProfile, learnerContext,
  } = req.body || {};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });

  // Strategy 1: Check database for existing past paper questions
  if (subject && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: pastQs } = await supabase
        .from('past_questions')
        .select('*')
        .ilike('subject', `%${subject}%`)
        .limit(questionCount);

      if (pastQs && pastQs.length >= 3) {
        // We have real past paper questions - return those
        const questions = pastQs.map((q, i) => ({
          id: q.id || `past_${i}`,
          text: q.question_text,
          marks: q.marks || 0,
          criterion: q.rubric_criterion || '',
          difficulty: q.difficulty || 'medium',
          hint: q.sample_response_text ? 'Hint available' : '',
          source: `${q.exam_year || ''} ${q.state || ''} ${q.subject || ''}`.trim(),
          type: 'past_paper',
        }));
        return res.status(200).json({ success: true, questions, source: 'database' });
      }
    } catch { /* fall through to AI generation */ }
  }

  // Strategy 2: Generate practice questions from the learner's brief/rubric
  if (!briefText && !rubricCriteria) {
    return res.status(400).json({ success: false, error: 'Provide briefText or rubricCriteria to generate practice questions.' });
  }

  const formatInstruction = format === 'short_answer' ? 'short answer questions (2-4 sentence responses expected)'
    : format === 'multiple_choice' ? 'multiple choice questions with 4 options (A-D) and the correct answer marked'
    : format === 'extended_response' ? 'extended response questions (paragraph-length answers expected)'
    : 'a mix of short answer, extended response, and analysis questions';

  const tierNote = tier === 'secondary' ? 'Year 10-12 HSC level' : tier === 'primary' ? 'primary school level' : 'university undergraduate level';
  const safeContext = sanitiseLearnerContext(learnerContext);

  const accessNote = literalMode ? '\nUse plain, literal language. No idioms.' : '';
  const profileNote = accessibilityProfile && accessibilityProfile !== 'standard'
    ? `\nAdapt for ${accessibilityProfile} profile.` : '';

  const systemPrompt = `You are a practice question generator for Australian students. Generate exactly ${questionCount} practice questions.

RULES:
- Questions must be directly relevant to the rubric criteria and assessment brief provided.
- Each question targets a specific rubric criterion (name it).
- Difficulty: mix easy, medium, hard unless specified.
- Format: ${formatInstruction}.
- Level: ${tierNote}.
- Australian English. No em-dashes.
- Each question includes a one-line hint (what the marker is looking for).${accessNote}${profileNote}
${safeContext ? `\n${safeContext}` : ''}

OUTPUT FORMAT (strict JSON array):
[
  {
    "text": "the question text",
    "marks": 4,
    "criterion": "which rubric criterion this targets",
    "difficulty": "easy|medium|hard",
    "hint": "one line: what the marker is looking for"
  }
]

Return ONLY the JSON array. No markdown. No explanation.`;

  const userContent = `Assessment: "${assessmentTitle || 'Untitled'}"
${rubricCriteria ? `Rubric criteria: ${Array.isArray(rubricCriteria) ? rubricCriteria.join('; ') : rubricCriteria}` : ''}
${briefText ? `Brief content:\n${briefText.slice(0, 3000)}` : ''}
${learnerState ? `State: ${learnerState}` : ''}

Generate ${questionCount} practice questions.`;

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: 'AI service unavailable. Try again.' });

    const data = await response.json().catch(() => null);
    if (!data?.content?.[0]?.text) return res.status(502).json({ success: false, error: 'Empty response. Try again.' });

    await recordUsage(userId, 'generate-practice', {
      tokensIn: data?.usage?.input_tokens || 0,
      tokensOut: data?.usage?.output_tokens || 0,
    });

    // Parse the JSON response
    const raw = data.content[0].text.trim();
    let questions;
    try {
      questions = JSON.parse(raw);
    } catch {
      // Try extracting JSON from markdown code block
      const match = raw.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(502).json({ success: false, error: 'Could not generate questions. Try again.' });
    }

    // Normalise and add IDs
    const normalised = questions.slice(0, questionCount).map((q, i) => ({
      id: `gen_${Date.now()}_${i}`,
      text: q.text || '',
      marks: q.marks || 0,
      criterion: q.criterion || '',
      difficulty: q.difficulty || 'medium',
      hint: q.hint || '',
      source: 'AI-generated from your brief',
      type: 'generated',
    }));

    return res.status(200).json({ success: true, questions: normalised, source: 'generated' });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Try again.' });
  }
}
