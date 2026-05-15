/**
 * QuestionTransformer.js
 *
 * Transforms exam questions into 6 cognitive formats via AI.
 * Caches results in Supabase question_transformations table.
 * Cost-aware: uses Haiku for simple transforms, Sonnet for complex.
 */

import { supabase } from '../../lib/supabaseClient';

const FORMAT_PROMPTS = {
  plain_english: {
    system: `Translate this exam question into Plain English. Rules:
- Replace academic vocabulary with everyday words
- Break long sentences into short ones (max 15 words)
- Remove ambiguity
- Preserve all factual content: do not change what is being asked
- Australian English
Return JSON: { "plain_text": "...", "words_simplified": [{"original": "...", "simple": "...", "why": "..."}] }`,
  },
  visual: {
    system: `Describe a visual diagram for this exam question. Include:
- What the question is asking (highlighted)
- Key concepts as labeled boxes
- Relationships as arrows with labels
- Any spatial or temporal information
Return JSON: { "diagram_description": "...", "key_concepts": ["..."], "relationships": [{"from": "...", "to": "...", "label": "..."}] }`,
  },
  audio: {
    system: `Create a conversational audio script for this exam question. Should sound like a friend explaining it. Rules:
- Use "you" not "one"
- Include natural pauses marked with [pause]
- Vary sentence rhythm
- Include emphasis markers [emphasise]
- 60-90 seconds when read aloud
- Start with "Okay so this question is about..."
- Australian English
Return JSON: { "script": "...", "estimated_seconds": 60 }`,
  },
  step_by_step: {
    system: `Break this exam question into numbered actionable steps. Rules:
- Each step starts with a verb (Read, Find, Calculate, Identify, Write)
- Each step under 15 words
- Each step under 5 min cognitive load
- Number them 1 to N
- Last step is "Write your answer"
- Include estimated time per step
Return JSON: { "steps": [{"number": 1, "verb": "Read", "action": "...", "estimated_minutes": 2, "cognitive_load": "easy"}] }`,
  },
  worked_example: {
    system: `Create a SIMILAR exam question (different content, same difficulty) with a fully worked solution. Rules:
- Different specific content so it is practice, not copying
- Show ALL working
- Mark thinking moments with [thinking: ...]
- Include common mistakes with [common mistake: ...]
- End with: "A marker would award X marks because Y"
- Australian English
Return JSON: { "similar_question": "...", "worked_solution": "...", "thinking_points": ["..."], "common_mistakes": ["..."], "marker_logic": "..." }`,
  },
};

/**
 * Transform a question into a specific format.
 * Checks cache first, generates via API if not cached.
 *
 * @param {object} opts
 * @param {string} opts.questionText - the original question
 * @param {number} opts.questionNumber - question number
 * @param {string} opts.formatType - 'plain_english' | 'visual' | 'audio' | 'step_by_step' | 'worked_example'
 * @param {string} opts.documentId - document identifier for caching
 * @param {string} [opts.tier] - student tier
 * @param {string} [opts.accessibilityProfile] - profile for personalisation
 * @returns {Promise<object>} format-specific content
 */
export const transformQuestion = async ({ questionText, questionNumber, formatType, documentId, tier, accessibilityProfile }) => {
  if (formatType === 'original') {
    return { original: true, text: questionText };
  }

  // Check cache
  if (documentId) {
    try {
      const { data } = await supabase
        .from('question_transformations')
        .select('format_content')
        .eq('document_id', documentId)
        .eq('question_number', questionNumber)
        .eq('format_type', formatType)
        .maybeSingle();
      if (data?.format_content) return data.format_content;
    } catch { /* cache miss, proceed to generate */ }
  }

  // Generate via API
  const prompt = FORMAT_PROMPTS[formatType];
  if (!prompt) throw new Error(`Unknown format: ${formatType}`);

  const profileNote = accessibilityProfile && accessibilityProfile !== 'standard'
    ? `\nAdapt for ${accessibilityProfile} profile.`
    : '';

  const response = await fetch('/api/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', text: `Question ${questionNumber}: ${questionText}` }],
      assessmentTitle: `Question ${questionNumber}`,
      tier: tier || 'tertiary',
      // Override system prompt for transformation
      systemOverride: prompt.system + profileNote,
    }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Transform failed');

  // Try to parse JSON from the response
  let content;
  try {
    const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
    content = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: data.reply };
  } catch {
    content = { text: data.reply };
  }

  // Cache result (fire-and-forget; table may not exist yet)
  if (documentId) {
    (async () => {
      try {
        await supabase.from('question_transformations').upsert({
          document_id: documentId,
          question_number: questionNumber,
          format_type: formatType,
          question_text: questionText,
          format_content: content,
        }, { onConflict: 'document_id,question_number,format_type' });
      } catch { /* ignore cache write failures */ }
    })();
  }

  return content;
};

/**
 * Get all cached transformations for a document.
 */
export const getCachedTransformations = async (documentId) => {
  try {
    const { data } = await supabase
      .from('question_transformations')
      .select('question_number, format_type, format_content')
      .eq('document_id', documentId);
    return data || [];
  } catch {
    return [];
  }
};

export const FORMAT_TYPES = [
  { id: 'original', label: 'Original', icon: '\u2709' },
  { id: 'plain_english', label: 'Plain English', icon: 'Aa' },
  { id: 'visual', label: 'Visual', icon: '\u25A1' },
  { id: 'audio', label: 'Audio', icon: '\u266B' },
  { id: 'step_by_step', label: 'Steps', icon: '\u2610' },
  { id: 'worked_example', label: 'Example', icon: '\u270E' },
];
