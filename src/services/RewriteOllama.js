/**
 * RewriteOllama.js
 *
 * Ollama provider: real local model via /api/chat. Handles elevateRigour,
 * synthesise, applyLogicMode, and nameCourse. Extracted from RewriteService.js.
 */

import { createLogger } from '../utils/logger';

const log = createLogger('RewriteService');

import {
  SYSTEM_PROMPT,
  LOGIC_LENSES,
  OLLAMA_REWRITE_TIMEOUT_MS,
  extractGroundingCitations,
  cleanModelOutput,
  getOllamaEndpoint,
  getOllamaModel,
  getProviderName,
  readSteering,
  gritToTemperature,
  buildRewriteSteeringBlock,
  levelGuidance,
  personaTone,
} from './RewriteConstants';

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const buildElevatePrompt = (text, ctx) => [
  'TASK: Elevate the academic rigour of the passage below.',
  '',
  `STUDENT LEVEL: ${ctx.level || 'university'}`,
  `LEVEL GUIDANCE: ${levelGuidance(ctx.level)}`,
  `PERSONA TONE: ${personaTone(ctx.persona)}`,
  ctx.selectedTopic ? `FOCUS TOPIC: ${ctx.selectedTopic}` : '',
  '',
  'PASSAGE:',
  text,
  '',
  'Return only the rewritten passage.'
].filter(l => l !== '').join('\n');

const buildSynthesisePrompt = (text, ctx) => [
  'TASK: Synthesise the passage below into one coherent academic paragraph.',
  '',
  'Identify the through-line in the student\'s existing argument and surface it. Weave separate points into a unified position. Do not add new claims, new evidence, or new citations. The student remains the author.',
  '',
  `STUDENT LEVEL: ${ctx.level || 'university'}`,
  `LEVEL GUIDANCE: ${levelGuidance(ctx.level)}`,
  `PERSONA TONE: ${personaTone(ctx.persona)}`,
  ctx.selectedTopic ? `FOCUS TOPIC: ${ctx.selectedTopic}` : '',
  '',
  'PASSAGE:',
  text,
  '',
  'Return only the synthesised paragraph.'
].filter(l => l !== '').join('\n');

const buildLogicModePrompt = (text, mode, ctx) => {
  if (mode === 'easy_read') {
    return [
      'TASK: Rewrite the passage below into Easy English.',
      '',
      LOGIC_LENSES.easy_read,
      '',
      'PASSAGE:',
      text,
      '',
      'Return only the rewritten passage. No preamble.'
    ].join('\n');
  }
  if (mode === 'faded_scaffold') {
    return [
      'TASK: Convert the passage below into a Faded Scaffold.',
      '',
      LOGIC_LENSES.faded_scaffold,
      '',
      'PASSAGE:',
      text,
      '',
      'Return only the scaffolded paragraph with stems. No preamble.'
    ].join('\n');
  }
  if (mode === 'align_to_rubric') {
    const criteriaBlock = (Array.isArray(ctx.hdCriteria) && ctx.hdCriteria.length > 0)
      ? ctx.hdCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : '1. Critical Analysis\n2. Evidence and Referencing\n3. Originality\n4. Argument Coherence\n5. Academic Register';
    const topicLine = ctx.selectedTopic ? `\nFOCUS TOPIC: ${ctx.selectedTopic}` : '';
    return [
      'TASK: Review the passage below against the High Distinction marking criteria.',
      '',
      `MARKING CRITERIA:${topicLine}`,
      criteriaBlock,
      '',
      LOGIC_LENSES.align_to_rubric,
      '',
      'PASSAGE:',
      text,
      '',
      'Return only the numbered review. No preamble.'
    ].join('\n');
  }
  if (mode === 'universal_view') {
    return [
      'TASK: Render the passage below in three cognitive registers.',
      '',
      LOGIC_LENSES.universal_view,
      '',
      'PASSAGE:',
      text,
      '',
      'Return the three labelled blocks (ACADEMIC, PLAIN, ACTIONS) with no preamble.'
    ].join('\n');
  }
  if (mode === 'easl_bridge') {
    return [
      'TASK: Translate the task instructions below into plain language.',
      '',
      LOGIC_LENSES.easl_bridge,
      '',
      'INSTRUCTIONS TO TRANSLATE:',
      text,
      '',
      'Return only the translated numbered instructions. No preamble.'
    ].join('\n');
  }
  if (mode === 'friction_to_action') {
    return [
      'TASK: Convert the passage below into a numbered action plan.',
      '',
      LOGIC_LENSES.friction_to_action,
      '',
      'PASSAGE:',
      text,
      '',
      'Return only the numbered plan and the Definition of Done line. No preamble.'
    ].join('\n');
  }
  const lens = LOGIC_LENSES[mode] || 'Examine the passage carefully and reframe it through the active analytical lens. Do not invent new content.';
  return [
    'TASK: Reframe the passage below through this analytical lens.',
    '',
    `LENS: ${lens}`,
    '',
    'The lens describes how to look at the existing material. It is not new content to add. Stay strictly within the student\'s evidence base.',
    '',
    `STUDENT LEVEL: ${ctx.level || 'university'}`,
    `LEVEL GUIDANCE: ${levelGuidance(ctx.level)}`,
    `PERSONA TONE: ${personaTone(ctx.persona)}`,
    '',
    'PASSAGE:',
    text,
    '',
    'Return only the reframed passage.'
  ].join('\n');
};

// ---------------------------------------------------------------------------
// Core Ollama call
// ---------------------------------------------------------------------------

async function callOllama(userPrompt, steering) {
  const { gritLevel } = steering || readSteering();
  const temperature = gritToTemperature[gritLevel] ?? 0.4;
  const steeringBlock = buildRewriteSteeringBlock(steering || readSteering());
  const systemPromptWithSteering = `${steeringBlock}\n\n${SYSTEM_PROMPT}`;

  const endpoint = getOllamaEndpoint().replace(/\/$/, '');
  const model = getOllamaModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_REWRITE_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature, num_predict: 800 },
        messages: [
          { role: 'system', content: systemPromptWithSteering },
          { role: 'user', content: userPrompt }
        ]
      })
    });
  } catch (networkErr) {
    clearTimeout(timer);
    const isTimeout = networkErr && networkErr.name === 'AbortError';
    throw new Error(
      isTimeout
        ? `Local AI timed out after ${OLLAMA_REWRITE_TIMEOUT_MS / 1000}s. The model may be loading or overloaded. Try again shortly.`
        : `Local AI not reachable at ${endpoint}. Run 'ollama serve' on this machine, or switch provider to local-mock.`
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 404 && /model/i.test(body)) {
      throw new Error(`Model '${model}' not found. Run 'ollama pull ${model}' or set localStorage.simplifii_ollama_model.`);
    }
    throw new Error(`Local AI returned ${response.status}. ${body.slice(0, 200)}`);
  }

  const data = await response.json().catch(() => ({}));
  const raw = data?.message?.content;
  const cleaned = cleanModelOutput(raw);
  if (!cleaned) {
    throw new Error('Local AI returned empty content. Check the model with \'ollama run ' + model + '\'.');
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Ollama provider object
// ---------------------------------------------------------------------------

const ollama = {
  async elevateRigour(text, ctx = {}) {
    const result = await callOllama(buildElevatePrompt(text, ctx), ctx.steering);
    return { text: result, groundingCitations: extractGroundingCitations(text, ctx.sourceName) };
  },
  async synthesise(text, ctx = {}) {
    const result = await callOllama(buildSynthesisePrompt(text, ctx), ctx.steering);
    return { text: result, groundingCitations: extractGroundingCitations(text, ctx.sourceName) };
  },
  async applyLogicMode(text, mode, ctx = {}) {
    return callOllama(buildLogicModePrompt(text, mode, ctx), ctx.steering);
  }
};

export default ollama;

// ---------------------------------------------------------------------------
// nameCourse: asks Ollama for the canonical course name from a syllabus excerpt
// ---------------------------------------------------------------------------

const NAME_SYSTEM_PROMPT = [
  'You are AURA, naming a course inside Simplifii-OS.',
  'You are given an excerpt from a course syllabus or assessment brief.',
  'You return a single line: the canonical course name.',
  '',
  'ABSOLUTE RULES, never break them:',
  '1. Australian English only. Never use US spellings.',
  '2. No em-dashes or en-dashes. Use a single space, full stop, or comma.',
  '3. Format: "<unit code> <Course Title>". Example: "BABS1201 Cell Biology and Biochemistry".',
  '4. If no unit code is present, return only the Course Title in title case.',
  '5. Maximum 80 characters.',
  '6. Return ONLY the name. No quotes, no preamble, no explanation.'
].join('\n');

const buildNameCoursePrompt = (text) => [
  'TASK: Read the excerpt below and return the canonical course name.',
  '',
  'EXCERPT:',
  text.slice(0, 4000),
  '',
  'Return only the course name on a single line.'
].join('\n');

export const fallbackCourseName = (text) => {
  if (!text) return 'New Course';
  const codeMatch = text.match(/\b([A-Z]{2,5}\d{3,5})\b/);
  const code = codeMatch ? codeMatch[1] : '';
  const titleMatch = text.match(/\b[A-Z]{2,5}\d{3,5}\s+([A-Z][A-Za-z][^\n]{4,80})/);
  let title = '';
  if (titleMatch) {
    title = titleMatch[1].split(/[\n\r,;:]/)[0].trim().replace(/\s+/g, ' ').slice(0, 70);
  } else {
    const heading = text.split(/\n+/).map(l => l.trim()).find(l => /^[A-Z][A-Za-z][A-Za-z\s]{4,80}$/.test(l));
    if (heading) title = heading.slice(0, 70);
  }
  if (code && title) return `${code} ${title}`.slice(0, 80);
  if (code) return code;
  if (title) return title;
  return 'New Course';
};

export const nameCourse = async (text) => {
  const fallback = fallbackCourseName(text);
  if (!text || !text.trim()) return fallback;
  if (getProviderName() !== 'ollama') return fallback;

  try {
    const endpoint = getOllamaEndpoint();
    const model = getOllamaModel();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0.2, num_predict: 60 },
        messages: [
          { role: 'system', content: NAME_SYSTEM_PROMPT },
          { role: 'user', content: buildNameCoursePrompt(text) }
        ]
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`status ${response.status}`);
    const data = await response.json().catch(() => ({}));
    const cleaned = cleanModelOutput(data?.message?.content || '');
    const oneLine = cleaned.split(/\n/)[0].trim().slice(0, 80);
    return oneLine || fallback;
  } catch (err) {
    log.warn(' nameCourse falling back:', err.message);
    return fallback;
  }
};

// Exported for unit tests
export const __ollamaInternals = { buildElevatePrompt, buildSynthesisePrompt, buildLogicModePrompt, buildNameCoursePrompt };
