/**
 * RewriteConstants.js
 *
 * Shared constants, config keys, localStorage helpers, synonym dictionaries,
 * logic frame labels, and Ollama lens instructions used across the rewrite
 * subsystem. Extracted from RewriteService.js to keep each file under 500 lines.
 */

import { createLogger } from '../utils/logger';

const log = createLogger('RewriteService');

export const PROVIDER_KEY = 'simplifii_rewrite_provider';
export const OLLAMA_ENDPOINT_KEY = 'simplifii_ollama_endpoint';
export const OLLAMA_MODEL_KEY = 'simplifii_ollama_model';
export const DEFAULT_PROVIDER = 'ollama';
export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'llama3.2';
export const REASONING_MIN_MS = 2000;

export const REASONING_START_EVENT = 'simplifii:reasoning-start';
export const REASONING_END_EVENT = 'simplifii:reasoning-end';

// Safe localStorage read. Some sandboxed iframes and browser security modes
// throw a SecurityError on any access, which previously killed the provider
// resolver and stranded the cockpit on the local-mock.
export const safeReadLocalStorage = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
};

// ---------------------------------------------------------------------------
// Synonym dictionaries: level-tiered word swaps
// ---------------------------------------------------------------------------

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

export const swapByLevel = (text, level) => {
  const dict = SYNONYMS_BY_LEVEL[level] || SYNONYMS_TERTIARY;
  return Object.entries(dict).reduce(
    (acc, [from, to]) => acc.replace(new RegExp(`\\b${from}\\b`, 'gi'), to),
    text
  );
};

// ---------------------------------------------------------------------------
// Logic frame labels (local-mock) and Ollama lens instructions
// ---------------------------------------------------------------------------

export const LOGIC_FRAMES = {
  inst1: 'Comparing methodologies across the primary sources reviewed,',
  inst2: 'A critical gap remains in the literature, namely',
  inst3: 'Synthesising the evidence reviewed above,',
  easy_read:        'Here is the key idea in plain English:',
  faded_scaffold:   'Working from the structure of the passage, here is a partially completed paragraph for you to finish:',
  align_to_rubric:  'Reviewing this passage against the High Distinction marking criteria:',
  universal_view:   'Viewing this passage through three lenses:',
  easl_bridge:      'Plain-language translation of the instructions:',
  friction_to_action: 'Step-by-step action plan:'
};

export const LOGIC_LENSES = {
  inst1: 'Examine the passage for how methodological choices are described. Surface comparisons between methods, identify which method the passage privileges, and call out where methodology is implied but not stated. Do not invent methods the student did not mention.',
  inst2: 'Examine the passage for unanswered questions and unstated assumptions. Surface a clear statement of what remains unknown in the field according to the evidence the student has cited. Do not introduce new gaps the passage does not support.',
  inst3: 'Examine the passage for how separate findings can be combined into a single position. Draw the through-line. Do not add findings the student did not present.',
  easy_read:      'EASY READ MODE. Rewrite for a user with a processing or intellectual disability. Rules: short sentences only (max 15 words each), active verbs, no jargon, no nested clauses, no academic hedging. Keep only the core action items from the passage. Use Australian English.',
  faded_scaffold: 'FADED SCAFFOLD MODE. Convert this passage into a partially completed academic paragraph. Rules: preserve the academic register and argument structure; reproduce the first two-thirds of the paragraph as polished, submission-ready prose; replace the final two sentences with clearly marked sentence-starting stems in the format [STEM: "..."] that give the student enough structure to complete the thought without telling them the answer. Never invent new claims or citations. Use Australian English. No em-dashes.',
  align_to_rubric: 'RUBRIC ALIGNMENT MODE. Review the passage against the High Distinction marking criteria. For each criterion, state: (a) whether the passage meets it, (b) what is missing or weak, and (c) one specific targeted improvement the student can make. Do NOT rewrite the passage. Return only the review as a short numbered list. Australian English. No em-dashes.',
  universal_view: 'UNIVERSAL VIEW MODE. Render the passage in three cognitive registers, each as a clearly labelled block. Block 1 (ACADEMIC): the passage restated in full academic register with signal phrases and hedging appropriate for submission. Block 2 (PLAIN): the same ideas in plain language (max 15 words per sentence, no jargon). Block 3 (ACTIONS): the content converted into a numbered action list of what the student still needs to do based on what is written. Do not add claims, citations, or content the student did not write. Australian English. No em-dashes.',
  easl_bridge: 'EASL BRIDGE MODE. Translate the task instructions below from institutional language into Easy and Accessible Service Language (EASL). Rules: (1) Replace every piece of academic or bureaucratic jargon with plain everyday words. (2) Keep every deadline, word count, and submission requirement exactly as stated. (3) Use short sentences (max 15 words). (4) Use the second person ("you"). (5) Number each requirement as a separate instruction. Return only the translated instructions. Australian English. No em-dashes.',
  friction_to_action: 'FRICTION TO ACTION MODE. Convert the passage below into a numbered action plan. Rules: (1) Each numbered step must open with a bolded action verb in the format **Verb** rest-of-step. (2) Steps must be ordered chronologically or by dependency. (3) Each step must be one sentence only. (4) End with a single line labelled "Definition of Done:" that describes what completion looks like. Do not add tasks the passage does not imply. Return only the numbered plan and the Definition of Done. Australian English. No em-dashes.'
};

// ---------------------------------------------------------------------------
// Grounding citations extractor
// ---------------------------------------------------------------------------

export const extractGroundingCitations = (inputText, sourceName = 'Course Material') => {
  const source = sourceName || 'Course Material';
  const sentences = inputText
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  return sentences.slice(0, 3).map(s => ({
    source,
    snippet: s.slice(0, 140)
  }));
};

// ---------------------------------------------------------------------------
// Ollama shared config helpers
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = [
  'You are AURA, an Australian academic writing assistant inside Simplifii-OS.',
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

export const LEVEL_GUIDANCE = {
  highschool: 'Year 11 or 12 reading level. Plain, precise, accessible. Tighten loose phrases without reaching for jargon.',
  university: 'First-year tertiary register. Replace casual hedges with measured academic phrasing.',
  undergrad: 'First-year tertiary register. Replace casual hedges with measured academic phrasing.',
  honours: 'Peer-reviewed register. Precise, theoretically aware, no filler. Tighten claims without inventing evidence.',
  mres: 'Peer-reviewed register. Precise, theoretically aware, no filler. Tighten claims without inventing evidence.',
  phd: 'Peer-reviewed register. Precise, theoretically aware, no filler. Tighten claims without inventing evidence.'
};

export const PERSONA_TONE = {
  Socratic: 'Inquisitive and guiding rather than prescriptive. Where the passage states a claim, the rewrite may sharpen the claim into a clearer position the student can interrogate. Stay within the student\'s evidence.',
  Hardcore: 'Direct and uncompromising. Strip filler. Compress redundant phrasing. No hedging where the evidence is strong.',
  Executive: 'Crisp and decision-ready. Lead with the position. Subordinate the evidence beneath it.'
};

export const levelGuidance = (level) => LEVEL_GUIDANCE[level] || LEVEL_GUIDANCE.university;
export const personaTone = (persona) => PERSONA_TONE[persona] || PERSONA_TONE.Socratic;

// Strip leading conversational filler the model may slip in despite the
// system prompt. Then unwrap surrounding quotes. Then sweep stray dashes.
export const cleanModelOutput = (raw) => {
  if (!raw) return '';
  let out = String(raw).trim();
  out = out.replace(/^(here(\s+is|'s)|sure[,!.]?|certainly[,!.]?|of course[,!.]?|absolutely[,!.]?)\s*[-:,.]?\s*/i, '');
  out = out.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith('\u201c') && out.endsWith('\u201d'))) {
    out = out.slice(1, -1).trim();
  }
  if (/[\u2014\u2013]/.test(out)) {
    log.warn(' Ollama returned dash characters. Replacing.');
    out = out.replace(/\s*[\u2014\u2013]\s*/g, ', ');
  }
  return out;
};

export const getOllamaEndpoint = () => safeReadLocalStorage(OLLAMA_ENDPOINT_KEY, DEFAULT_OLLAMA_ENDPOINT) || DEFAULT_OLLAMA_ENDPOINT;
export const getOllamaModel = () => safeReadLocalStorage(OLLAMA_MODEL_KEY, DEFAULT_OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL;

export const OLLAMA_REWRITE_TIMEOUT_MS = 60000;

// Steering dial helpers shared by Ollama callers
export const readSteering = () => ({
  isLiteralMode: safeReadLocalStorage('isLiteralMode') === 'true',
  scaffoldingLevel: safeReadLocalStorage('scaffoldingLevel') || 'balanced',
  gritLevel: safeReadLocalStorage('gritLevel') || 'balanced',
  lodLevel: safeReadLocalStorage('lodLevel') || 'compass'
});

export const gritToTemperature = { literal: 0.2, balanced: 0.4, socratic: 0.6 };

export const buildRewriteSteeringBlock = ({ isLiteralMode, scaffoldingLevel, gritLevel }) => {
  const personaLine = isLiteralMode
    ? 'PERSONA DIAL: Literal. Plain English only. Minimise jargon. Short sentences. Preserve the student\'s phrasing wherever possible.'
    : 'PERSONA DIAL: Academic. Discipline register intact. Elevate where appropriate.';
  const scaffoldLine = ({
    heavy:    'SCAFFOLDING DIAL: Heavy. Break any compound sentence into shorter units. Surface the sub-claim explicitly.',
    balanced: 'SCAFFOLDING DIAL: Balanced. Tighten the passage without over-fragmenting.',
    light:    'SCAFFOLDING DIAL: Light. Treat the student\'s structure as intentional. Only change diction and register.'
  })[scaffoldingLevel] || '';
  const gritLine = ({
    literal:  'GRIT DIAL: Direct. Apply the transformation straightforwardly. Do not probe or add questions.',
    balanced: 'GRIT DIAL: Balanced. Where the student\'s claim is underspecified, surface the gap in one brief parenthetical.',
    socratic: 'GRIT DIAL: Hard Socratic. If the passage lacks a clear position, surface that gap explicitly at the end of the rewrite. One sentence only.'
  })[gritLevel] || '';
  return [
    'STEERING DIALS (set by the student; respect them):',
    personaLine,
    scaffoldLine,
    gritLine
  ].filter(Boolean).join('\n');
};

export const getProviderName = () => {
  if (process.env.NODE_ENV === 'production') {
    log.info(' Ollama disabled in production, using rule-based extraction');
    return 'local-mock';
  }
  return safeReadLocalStorage(PROVIDER_KEY, DEFAULT_PROVIDER) || DEFAULT_PROVIDER;
};
