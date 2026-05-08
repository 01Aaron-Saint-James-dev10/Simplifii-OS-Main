/**
 * RewriteService.js
 *
 * Pluggable rewrite layer for the Academic Tools (Elevate Rigour, Synthesise,
 * Apply Logic Mode). Two providers behind one feature flag set in
 * localStorage.simplifii_rewrite_provider:
 *
 *   'local-mock' (default): deterministic level-aware transforms wrapped in
 *     a 2-second 'reasoning' delay so the cockpit feels like it is thinking.
 *
 *   'ollama': real local Ollama call against /api/chat. Endpoint and model
 *     are overridable via localStorage.simplifii_ollama_endpoint and
 *     localStorage.simplifii_ollama_model. No internet required.
 *
 * All providers dispatch simplifii:reasoning-start and simplifii:reasoning-end
 * events on window so the AURA Avatar can pulse faster while reasoning is in
 * flight. Per-section spinners live in the consumer (LinearCanvas).
 */

const PROVIDER_KEY = 'simplifii_rewrite_provider';
const OLLAMA_ENDPOINT_KEY = 'simplifii_ollama_endpoint';
const OLLAMA_MODEL_KEY = 'simplifii_ollama_model';
const DEFAULT_PROVIDER = 'local-mock';
const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';
const REASONING_MIN_MS = 2000;

export const REASONING_START_EVENT = 'simplifii:reasoning-start';
export const REASONING_END_EVENT = 'simplifii:reasoning-end';

// Level-tiered synonym sets. High-school prefers plain language; tertiary and
// up reach for academic register. Anything not in the tier keeps its original
// surface form.
const SYNONYMS_BASE = {
  'a lot of': 'many',
  'really': 'particularly',
  'big': 'significant',
  'shows': 'demonstrates',
  'gets': 'obtains',
  'uses': 'employs',
  'helps': 'supports',
  'looks at': 'examines',
  'finds': 'identifies',
  'thinks': 'argues',
  'so': 'therefore',
  'also': 'furthermore',
  'but': 'however'
};

const SYNONYMS_TERTIARY = {
  ...SYNONYMS_BASE,
  'a lot of': 'a substantial body of',
  'helps': 'facilitates',
  'big': 'considerable',
  'thinks': 'contends'
};

const SYNONYMS_BY_LEVEL = {
  highschool: SYNONYMS_BASE,
  university: SYNONYMS_TERTIARY,
  undergrad: SYNONYMS_TERTIARY,
  honours: SYNONYMS_TERTIARY,
  mres: SYNONYMS_TERTIARY,
  phd: SYNONYMS_TERTIARY
};

const swapByLevel = (text, level) => {
  const dict = SYNONYMS_BY_LEVEL[level] || SYNONYMS_TERTIARY;
  return Object.entries(dict).reduce(
    (acc, [from, to]) => acc.replace(new RegExp(`\\b${from}\\b`, 'gi'), to),
    text
  );
};

// Logic-mode prefixes for local-mock framing.
const LOGIC_FRAMES = {
  inst1: 'Comparing methodologies across the primary sources reviewed,',
  inst2: 'A critical gap remains in the literature, namely',
  inst3: 'Synthesising the evidence reviewed above,'
};

// Logic Block lens instructions sent to Ollama. These describe HOW to look at
// the existing material. They never instruct the model to add new content.
const LOGIC_LENSES = {
  inst1: 'Examine the passage for how methodological choices are described. Surface comparisons between methods, identify which method the passage privileges, and call out where methodology is implied but not stated. Do not invent methods the student did not mention.',
  inst2: 'Examine the passage for unanswered questions and unstated assumptions. Surface a clear statement of what remains unknown in the field according to the evidence the student has cited. Do not introduce new gaps the passage does not support.',
  inst3: 'Examine the passage for how separate findings can be combined into a single position. Draw the through-line. Do not add findings the student did not present.'
};

const localMock = {
  async elevateRigour(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    const opener = ctx.level === 'highschool'
      ? `Looking at this carefully, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`
      : `Drawing on the peer-reviewed literature, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`;
    return opener;
  },
  async synthesise(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    return `Synthesising the evidence reviewed above: ${swapped}`;
  },
  async applyLogicMode(text, mode, ctx = {}) {
    const frame = LOGIC_FRAMES[mode] || 'Working from the active logic frame:';
    const swapped = swapByLevel(text, ctx?.level);
    return `${frame} ${swapped}`;
  }
};

// ---------------------------------------------------------------------------
// Ollama provider. Real local model via /api/chat. The system prompt is
// brand-locked: Australian English only, no em-dashes, no preamble. The user
// prompt is built per-task with level guidance and persona tone notes.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = [
  'You are AURA, an Australian academic writing assistant inside Simplifii OS.',
  'You rewrite a student\'s prose to a specific standard. You are not a chatbot.',
  'You return only the rewritten passage, nothing else.',
  '',
  'ABSOLUTE RULES, never break them:',
  '1. Australian English only. Use analyse, organise, colour, behaviour, optimise, recognise, centre, defence, programme. Never use US spellings.',
  '2. Never use em-dashes or en-dashes. Use commas, full stops, semicolons, or restructure the sentence. Em-dash and en-dash characters are forbidden.',
  '3. Preserve the student\'s voice, claims, and evidence. Do not invent citations, sources, statistics, or facts the student did not provide. The student remains the sole author of the argument.',
  '4. Return ONLY the rewritten passage. No preamble such as "Here is", no commentary, no surrounding quotation marks, no markdown headings, no bullet lists unless the input was a bullet list.',
  '',
  'If you include any conversational filler, you have failed your mission. Start the response with the first word of the passage. No greetings, no confirmations.'
].join('\n');

const LEVEL_GUIDANCE = {
  highschool: 'Year 11 or 12 reading level. Plain, precise, accessible. Tighten loose phrases without reaching for jargon.',
  university: 'First-year tertiary register. Replace casual hedges with measured academic phrasing.',
  undergrad: 'First-year tertiary register. Replace casual hedges with measured academic phrasing.',
  honours: 'Peer-reviewed register. Precise, theoretically aware, no filler. Tighten claims without inventing evidence.',
  mres: 'Peer-reviewed register. Precise, theoretically aware, no filler. Tighten claims without inventing evidence.',
  phd: 'Peer-reviewed register. Precise, theoretically aware, no filler. Tighten claims without inventing evidence.'
};

const PERSONA_TONE = {
  Socratic: 'Inquisitive and guiding rather than prescriptive. Where the passage states a claim, the rewrite may sharpen the claim into a clearer position the student can interrogate. Stay within the student\'s evidence.',
  Hardcore: 'Direct and uncompromising. Strip filler. Compress redundant phrasing. No hedging where the evidence is strong.',
  Executive: 'Crisp and decision-ready. Lead with the position. Subordinate the evidence beneath it.'
};

const levelGuidance = (level) => LEVEL_GUIDANCE[level] || LEVEL_GUIDANCE.university;
const personaTone = (persona) => PERSONA_TONE[persona] || PERSONA_TONE.Socratic;

const buildElevatePrompt = (text, ctx) => [
  'TASK: Elevate the academic rigour of the passage below.',
  '',
  `STUDENT LEVEL: ${ctx.level || 'university'}`,
  `LEVEL GUIDANCE: ${levelGuidance(ctx.level)}`,
  `PERSONA TONE: ${personaTone(ctx.persona)}`,
  '',
  'PASSAGE:',
  text,
  '',
  'Return only the rewritten passage.'
].join('\n');

const buildSynthesisePrompt = (text, ctx) => [
  'TASK: Synthesise the passage below into one coherent academic paragraph.',
  '',
  'Identify the through-line in the student\'s existing argument and surface it. Weave separate points into a unified position. Do not add new claims, new evidence, or new citations. The student remains the author.',
  '',
  `STUDENT LEVEL: ${ctx.level || 'university'}`,
  `LEVEL GUIDANCE: ${levelGuidance(ctx.level)}`,
  `PERSONA TONE: ${personaTone(ctx.persona)}`,
  '',
  'PASSAGE:',
  text,
  '',
  'Return only the synthesised paragraph.'
].join('\n');

const buildLogicModePrompt = (text, mode, ctx) => {
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

// Strip leading conversational filler the model may slip in despite the
// system prompt. Then unwrap surrounding quotes. Then sweep stray dashes.
const cleanModelOutput = (raw) => {
  if (!raw) return '';
  let out = String(raw).trim();
  out = out.replace(/^(here(\s+is|'s)|sure[,!.]?|certainly[,!.]?|of course[,!.]?|absolutely[,!.]?)\s*[-:,.]?\s*/i, '');
  out = out.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith('“') && out.endsWith('”'))) {
    out = out.slice(1, -1).trim();
  }
  if (/[\u2014\u2013]/.test(out)) {
    if (typeof console !== 'undefined') console.warn('[RewriteService] Ollama returned dash characters. Replacing.');
    out = out.replace(/\s*[\u2014\u2013]\s*/g, ', ');
  }
  return out;
};

const getOllamaEndpoint = () => {
  if (typeof window === 'undefined') return DEFAULT_OLLAMA_ENDPOINT;
  return localStorage.getItem(OLLAMA_ENDPOINT_KEY) || DEFAULT_OLLAMA_ENDPOINT;
};

const getOllamaModel = () => {
  if (typeof window === 'undefined') return DEFAULT_OLLAMA_MODEL;
  return localStorage.getItem(OLLAMA_MODEL_KEY) || DEFAULT_OLLAMA_MODEL;
};

async function callOllama(userPrompt) {
  const endpoint = getOllamaEndpoint().replace(/\/$/, '');
  const model = getOllamaModel();
  let response;
  try {
    response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0.4, num_predict: 800 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      })
    });
  } catch (networkErr) {
    throw new Error(`Local AI not reachable at ${endpoint}. Run 'ollama serve' on this machine, or switch provider to local-mock.`);
  }

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

const ollama = {
  async elevateRigour(text, ctx = {}) {
    return callOllama(buildElevatePrompt(text, ctx));
  },
  async synthesise(text, ctx = {}) {
    return callOllama(buildSynthesisePrompt(text, ctx));
  },
  async applyLogicMode(text, mode, ctx = {}) {
    return callOllama(buildLogicModePrompt(text, mode, ctx));
  }
};

const PROVIDERS = { 'local-mock': localMock, ollama };

export const getProviderName = () => {
  if (typeof window === 'undefined') return DEFAULT_PROVIDER;
  return localStorage.getItem(PROVIDER_KEY) || DEFAULT_PROVIDER;
};

const getProvider = () => {
  const name = getProviderName();
  return PROVIDERS[name] || PROVIDERS[DEFAULT_PROVIDER];
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function reason(method, args) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
  }
  const start = Date.now();
  try {
    const provider = getProvider();
    const result = await provider[method](...args);
    const elapsed = Date.now() - start;
    if (elapsed < REASONING_MIN_MS) await sleep(REASONING_MIN_MS - elapsed);
    return result;
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
    }
  }
}

export const elevateRigour = (text, ctx) => reason('elevateRigour', [text, ctx]);
export const synthesise = (text, ctx) => reason('synthesise', [text, ctx]);
export const applyLogicMode = (text, mode, ctx) => reason('applyLogicMode', [text, mode, ctx]);

// Exported for unit tests and DevTools poking.
export const __internals = { SYSTEM_PROMPT, buildElevatePrompt, buildSynthesisePrompt, buildLogicModePrompt, cleanModelOutput, LOGIC_LENSES };
