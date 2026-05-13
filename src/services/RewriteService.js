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
// Hardwired Neural Link. Ollama is the default brain; local-mock is now an
// opt-in fallback selected explicitly via localStorage. The student gets the
// real brain on boot, no console toggling required.
const DEFAULT_PROVIDER = 'ollama';
const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';
const REASONING_MIN_MS = 2000;

// Safe localStorage read. Some sandboxed iframes and browser security modes
// throw a SecurityError on any access, which previously killed the provider
// resolver and stranded the cockpit on the local-mock. We swallow the throw
// and return the fallback so the brain stays connected regardless of where
// the page is rendered.
const safeReadLocalStorage = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
};

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
  inst3: 'Synthesising the evidence reviewed above,',
  easy_read:        'Here is the key idea in plain English:',
  faded_scaffold:   'Working from the structure of the passage, here is a partially completed paragraph for you to finish:',
  align_to_rubric:  'Reviewing this passage against the High Distinction marking criteria:',
  // Sprint 8.2: Universal View. Renders the full cognitive map of the passage
  // across three registers simultaneously (academic, plain, action) so the
  // learner can choose the framing that fits their processing style.
  universal_view:   'Viewing this passage through three lenses:',
  // Sprint 8.1 Sovereign Translator. EASL = Easy and Accessible Service Language.
  // Strips institutional jargon from task instructions and rebuilds them as
  // learner-actionable, clear-language directives.
  easl_bridge:      'Plain-language translation of the instructions:',
  // Friction-to-Action. Converts bureaucratic or dense task descriptions into
  // numbered steps with bolded verbs and a Definition of Done checklist.
  friction_to_action: 'Step-by-step action plan:'
};

// Logic Block lens instructions sent to Ollama. These describe HOW to look at
// the existing material. They never instruct the model to add new content.
const LOGIC_LENSES = {
  inst1: 'Examine the passage for how methodological choices are described. Surface comparisons between methods, identify which method the passage privileges, and call out where methodology is implied but not stated. Do not invent methods the student did not mention.',
  inst2: 'Examine the passage for unanswered questions and unstated assumptions. Surface a clear statement of what remains unknown in the field according to the evidence the student has cited. Do not introduce new gaps the passage does not support.',
  inst3: 'Examine the passage for how separate findings can be combined into a single position. Draw the through-line. Do not add findings the student did not present.',
  easy_read:      'EASY READ MODE. Rewrite for a user with a processing or intellectual disability. Rules: short sentences only (max 15 words each), active verbs, no jargon, no nested clauses, no academic hedging. Keep only the core action items from the passage. Use Australian English.',
  faded_scaffold: 'FADED SCAFFOLD MODE. Convert this passage into a partially completed academic paragraph. Rules: preserve the academic register and argument structure; reproduce the first two-thirds of the paragraph as polished, submission-ready prose; replace the final two sentences with clearly marked sentence-starting stems in the format [STEM: "..."] that give the student enough structure to complete the thought without telling them the answer. Never invent new claims or citations. Use Australian English. No em-dashes.',
  align_to_rubric: 'RUBRIC ALIGNMENT MODE. Review the passage against the High Distinction marking criteria. For each criterion, state: (a) whether the passage meets it, (b) what is missing or weak, and (c) one specific targeted improvement the student can make. Do NOT rewrite the passage. Return only the review as a short numbered list. Australian English. No em-dashes.',
  // Sprint 8.2: Universal View. Returns three parallel renderings of the same
  // passage. Each section is labelled. The model must not add new content to
  // any register; it only reframes what the student already wrote.
  universal_view: 'UNIVERSAL VIEW MODE. Render the passage in three cognitive registers, each as a clearly labelled block. Block 1 (ACADEMIC): the passage restated in full academic register with signal phrases and hedging appropriate for submission. Block 2 (PLAIN): the same ideas in plain language (max 15 words per sentence, no jargon). Block 3 (ACTIONS): the content converted into a numbered action list of what the student still needs to do based on what is written. Do not add claims, citations, or content the student did not write. Australian English. No em-dashes.',
  // Sprint 8.1 Sovereign Translator. EASL Bridge: translates institutional
  // task instructions into plain, clear-language directives. The model must
  // strip jargon but preserve every requirement and deadline exactly.
  easl_bridge: 'EASL BRIDGE MODE. Translate the task instructions below from institutional language into Easy and Accessible Service Language (EASL). Rules: (1) Replace every piece of academic or bureaucratic jargon with plain everyday words. (2) Keep every deadline, word count, and submission requirement exactly as stated. (3) Use short sentences (max 15 words). (4) Use the second person ("you"). (5) Number each requirement as a separate instruction. Return only the translated instructions. Australian English. No em-dashes.',
  // Friction-to-Action. Converts dense bureaucratic text into numbered steps.
  // Each step must have a bolded action verb. Final line is the Definition of Done.
  friction_to_action: 'FRICTION TO ACTION MODE. Convert the passage below into a numbered action plan. Rules: (1) Each numbered step must open with a bolded action verb in the format **Verb** rest-of-step. (2) Steps must be ordered chronologically or by dependency. (3) Each step must be one sentence only. (4) End with a single line labelled "Definition of Done:" that describes what completion looks like. Do not add tasks the passage does not imply. Return only the numbered plan and the Definition of Done. Australian English. No em-dashes.'
};

// Sprint 7.2: Grounding Audit. Extracts up to 3 source sentences from the
// student's input and returns them as citation anchors for the [G] pins.
// Citations are always verbatim subsets of what the student wrote; no content
// is invented. The source label comes from ctx.sourceName (course name / PDF
// filename) passed in from the cockpit.
const extractGroundingCitations = (inputText, sourceName = 'Course Material') => {
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

const localMock = {
  async elevateRigour(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    const opener = ctx.level === 'highschool'
      ? `Looking at this carefully, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`
      : `Drawing on the peer-reviewed literature, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`;
    return { text: opener, groundingCitations: extractGroundingCitations(text, ctx.sourceName) };
  },
  async synthesise(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    return {
      text: `Synthesising the evidence reviewed above: ${swapped}`,
      groundingCitations: extractGroundingCitations(text, ctx.sourceName)
    };
  },
  async applyLogicMode(text, mode, ctx = {}) {
    if (mode === 'easy_read') {
      // Strip academic vocabulary swaps: Easy Read uses plain, everyday words.
      const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 5);
      return `Here is the key idea in plain English:\n${sentences.join(' ')}`;
    }
    if (mode === 'faded_scaffold') {
      // Split into sentences; return first two-thirds polished, last two as stems.
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const splitAt = Math.max(1, Math.ceil(sentences.length * 0.67));
      const polished = sentences.slice(0, splitAt).join(' ');
      const stems = sentences.slice(splitAt).map((s, i) =>
        `[STEM ${i + 1}: "${s.split(' ').slice(0, 4).join(' ')}..."]`
      ).join(' ');
      return `${polished} ${stems || '[STEM 1: "Building on this argument..."] [STEM 2: "This suggests that..."]'}`;
    }
    if (mode === 'align_to_rubric') {
      const criteria = (Array.isArray(ctx.hdCriteria) && ctx.hdCriteria.length > 0)
        ? ctx.hdCriteria
        : ['Critical Analysis', 'Evidence and Referencing', 'Originality', 'Argument Coherence'];
      const review = criteria.map((c, i) => `${i + 1}. ${c}: Review your passage to ensure this criterion is addressed.`).join('\n');
      return `Reviewing against HD criteria:\n${review}`;
    }
    if (mode === 'universal_view') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const academic = sentences.map(s => swapByLevel(s, ctx?.level || 'university')).join(' ');
      const plain = sentences.map(s => s.replace(/\b(\w{10,})\b/g, w => w)).join(' ');
      const actions = sentences.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `ACADEMIC:\n${academic}\n\nPLAIN:\n${plain}\n\nACTIONS:\n${actions}`;
    }
    if (mode === 'easl_bridge') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const instructions = sentences.map((s, i) => `${i + 1}. ${s.replace(/\b(utilise|leverage|endeavour|facilitate|commence|henceforth|pursuant|thereof)\b/gi, (m) => ({ utilise: 'use', leverage: 'use', endeavour: 'try', facilitate: 'help', commence: 'start', henceforth: 'from now on', pursuant: 'following', thereof: 'of it' }[m.toLowerCase()] || m))}`).join('\n');
      return `Plain-language version of the instructions:\n\n${instructions}`;
    }
    if (mode === 'friction_to_action') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 8);
      const verbs = ['Read', 'Write', 'Review', 'Submit', 'Check', 'Identify', 'Draft', 'Finalise'];
      const steps = sentences.map((s, i) => `${i + 1}. **${verbs[i] || 'Complete'}** ${s.charAt(0).toLowerCase()}${s.slice(1)}`).join('\n');
      return `${steps}\n\nDefinition of Done: All steps above are complete and the section is ready to submit.`;
    }
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
  // Easy Read is a completely different register. Academic level guidance and
  // persona tone are irrelevant and counterproductive here; strip them out so
  // the model does not get mixed signals between "be academic" and "be plain".
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
    // Faded Scaffold bypasses persona/level: the academic structure is held fixed;
    // only the final two sentences become student-completion stems.
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
    // Rubric Alignment bypasses persona/level tone so the feedback reads as
    // neutral, criterion-anchored marking commentary rather than AI voice.
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

const getOllamaEndpoint = () => safeReadLocalStorage(OLLAMA_ENDPOINT_KEY, DEFAULT_OLLAMA_ENDPOINT) || DEFAULT_OLLAMA_ENDPOINT;

const getOllamaModel = () => safeReadLocalStorage(OLLAMA_MODEL_KEY, DEFAULT_OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL;

// Read the four steering dials from localStorage each call so that a
// dial flip mid-session takes effect on the next rewrite without a
// page reload. Mirrors the pattern in ChatService.js.
const readSteering = () => ({
  isLiteralMode: safeReadLocalStorage('isLiteralMode') === 'true',
  scaffoldingLevel: safeReadLocalStorage('scaffoldingLevel') || 'balanced',
  gritLevel: safeReadLocalStorage('gritLevel') || 'balanced',
  lodLevel: safeReadLocalStorage('lodLevel') || 'compass'
});

// Map grit dial to Ollama temperature. Direct mode produces tight,
// predictable rewrites; Socratic mode allows more interpretive range.
const gritToTemperature = { literal: 0.2, balanced: 0.4, socratic: 0.6 };

// Build the steering block injected at the top of the rewrite system
// prompt. Tells the model how assertively to transform the prose.
const buildRewriteSteeringBlock = ({ isLiteralMode, scaffoldingLevel, gritLevel }) => {
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

// Sprint 8.3: Data Quality. Default timeout for rewrite calls (elevateRigour,
// synthesise, applyLogicMode). Longer than nameCourse (20s) because rewrites
// produce more tokens (num_predict: 800). Shorter than extractAssessmentBriefs
// (45s) because rewrites are single-paragraph operations.
const OLLAMA_REWRITE_TIMEOUT_MS = 60000;

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

const PROVIDERS = { 'local-mock': localMock, ollama };

export const getProviderName = () => safeReadLocalStorage(PROVIDER_KEY, DEFAULT_PROVIDER) || DEFAULT_PROVIDER;

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

// ---------------------------------------------------------------------------
// nameCourse(): asks Ollama for the canonical course name from a syllabus
// excerpt. This is the Smart Handshake: the cockpit derives the course name
// itself instead of popping a 'Name this course' prompt at the student.
//
// Falls through to a regex-based name when Ollama is unreachable or the
// active provider is local-mock. Always returns a non-empty string.
//
// Bypasses the reason() wrapper because we do not want a 2-second floor on
// course creation, and we do not want to dispatch the reasoning pulse for a
// background metadata call.
// ---------------------------------------------------------------------------

const NAME_SYSTEM_PROMPT = [
  'You are AURA, naming a course inside Simplifii OS.',
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

const fallbackCourseName = (text) => {
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
    // 20s ceiling. Naming is a one-shot warm-up call against a possibly
    // cold model; 8s was clipping the response before llama3.2 finished
    // generating even 60 tokens, leaving the regex fallback to ship the
    // bare unit code (e.g. 'BABS1201') without the title that follows.
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
    if (typeof console !== 'undefined') console.warn('[RewriteService] nameCourse falling back:', err.message);
    return fallback;
  }
};

// extractAssessmentsWithOllama: fallback assessment extractor for syllabi
// the regex misses. Sends a tight JSON-only prompt with a chunk of the
// rawText and asks the model to return an array of {title, weight}.
// Used by BriefService when the regex finds fewer than 2 assessments.
//
// Returns [] on any failure (network, parse, empty). Caller falls through
// to whatever the regex produced. Bypasses the reason() wrapper because
// this is a quiet metadata pass, not a writing aid.
const ASSESSMENT_SYSTEM_PROMPT = [
  'You are an extraction tool. Read course syllabus material and return ONLY the graded assessments.',
  '',
  'CRITICAL CONTEXT: The input may be MULTIPLE documents concatenated together (Course Outline, Assessment Brief, Marking Rubric). You must look at ALL the text, not just the start. Course Outlines often list every assessment in a table or schedule; individual Assessment Briefs zoom in on one task. Combine the views: the canonical assessment list lives in the Course Outline. Your job is to surface EVERY graded assessment across all documents, not just the one that has the most prose.',
  '',
  'OUTPUT FORMAT: A JSON array of objects. Each object MUST use these EXACT lowercase keys:',
  '  "title"            (string, required, 3 to 60 chars, capital first letter)',
  '  "weight"           (string like "30%", or "" if not specified)',
  '  "wordCountGoal"    (integer like 1500, or 0 if not specified)',
  '  "dueDate"          (string like "Friday Week 5", or "" if not specified)',
  '  "availableTopics"  (array of strings: the specific topics, questions, or prompts the student may choose from for this assessment. Each string is one option. Use [] if no topic menu is listed.)',
  '  "hdCriteria"       (array of strings: the specific marking criteria required for a High Distinction grade, extracted verbatim from the rubric table. Each string is one criterion or descriptor. Use [] if no rubric is present.)',
  '',
  'DO NOT use alternate keys. The keys must be exactly title, weight, wordCountGoal, dueDate, availableTopics, hdCriteria.',
  '',
  'Example output:',
  '  [{"title":"Literature Review","weight":"25%","wordCountGoal":2000,"dueDate":"Friday Week 5",',
  '    "availableTopics":["Climate change mitigation","Urban food systems","Ocean acidification"],',
  '    "hdCriteria":["Demonstrates critical synthesis of 8+ peer-reviewed sources","Original argument clearly stated and defended","APA 7 referencing with zero errors"]},',
  '   {"title":"Final Exam","weight":"20%","wordCountGoal":0,"dueDate":"Exam Period","availableTopics":[],"hdCriteria":[]}]',
  '',
  'ABSOLUTE RULES:',
  '1. Australian English only.',
  '2. Never use em-dashes or en-dashes.',
  '3. Return ONLY the JSON array. No preamble, no markdown fence, no commentary.',
  '4. EXCLUDE all of the following, even when they appear in tables: lecture titles, lecture topics, tutorial topics, weekly schedule entries, learning outcomes, course themes, week numbers, dates without an associated graded task, rubric column headers (Item / Weight / Length / Information), navigation copy (Moodle, Hub), and word fragments (cation, p 2). A row whose "type" is Lecture, Tutorial, Workshop, Topic, or Theme is NOT an assessment and must be excluded.',
  '5. INCLUDE only items that are explicitly graded (have a percentage weighting OR are listed in an Assessment Tasks / Assessments section).',
  '6. Each title must appear ONLY ONCE. Deduplicate aggressively across documents.',
  '7. The weightings of the returned assessments should sum to approximately 100% if the syllabus is complete. If your output sums to far less than 100%, scan the input again for assessments you missed (but do not invent ones that are not there).',
  '8. Keep the output compact. Brief titles. Short due dates. Do not pad strings. The whole array should fit in 1500 tokens.',
  '9. If the syllabus genuinely lists no assessments, return [].'
].join('\n');

// Internal: send the prompt and parse the JSON response. Returns an array
// of normalised brief objects on success (possibly empty). THROWS on
// hard failures (network unreachable, non-2xx HTTP, abort) so the
// caller can decide whether to fall back to regex.
//
// Logs every early exit so a silent zero is diagnosable. Set
// localStorage.simplifii_extract_debug = 'true' to also dump the raw
// model output to console.
const __callAssessmentExtractor = async (rawText) => {
  if (!rawText || rawText.trim().length < 200) {
    if (typeof console !== 'undefined') console.info('[RewriteService] extractor skipped: rawText too short');
    return [];
  }
  if (getProviderName() !== 'ollama') {
    if (typeof console !== 'undefined') console.info('[RewriteService] extractor skipped: provider is', getProviderName());
    return [];
  }
  const endpoint = getOllamaEndpoint().replace(/\/$/, '');
  const model = getOllamaModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let response;
  try {
    response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        // format: 'json' removed. With it set, llama3.2 sometimes
        // returns the empty object '{}' when uncertain instead of a
        // valid array. We now ask for JSON in the prompt and let the
        // model output it as prose; our parser extracts the array
        // substring. Restored 25k char window (down from 30k) so the
        // model has more attention budget per token.
        options: { temperature: 0.1, num_predict: 2000 },
        messages: [
          { role: 'system', content: ASSESSMENT_SYSTEM_PROMPT },
          { role: 'user', content: `SYLLABUS (may include multiple documents joined together):\n\n${rawText.slice(0, 25000)}\n\nReturn the JSON array of every graded assessment across all documents. Output ONLY the JSON array, nothing else.` }
        ]
      }),
      signal: controller.signal
    });
  } catch (networkErr) {
    clearTimeout(timer);
    if (typeof console !== 'undefined') console.warn('[RewriteService] extractor network error:', networkErr?.name, networkErr?.message);
    throw new Error('extractor: ollama unreachable');
  }
  clearTimeout(timer);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (typeof console !== 'undefined') console.warn('[RewriteService] extractor HTTP', response.status, body.slice(0, 160));
    throw new Error(`extractor: HTTP ${response.status}`);
  }
  try {
    const data = await response.json().catch(() => ({}));
    const raw = data?.message?.content || '';
    const debug = (() => {
      try { return localStorage.getItem('simplifii_extract_debug') === 'true'; } catch { return false; }
    })();
    if (debug && typeof console !== 'undefined') console.info('[RewriteService] raw model output:', raw);

    let parsed = null;
    try { parsed = JSON.parse(raw); } catch { /* try fallbacks */ }
    if (!parsed) {
      const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      try { parsed = JSON.parse(stripped); } catch { /* try next */ }
    }
    if (!parsed) {
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) { try { parsed = JSON.parse(arrayMatch[0]); } catch { /* fall through to truncation recovery */ } }
    }
    // Truncation recovery. When num_predict cuts the response mid-element,
    // the result starts with '[' and a few complete '{...}' objects but
    // ends mid-string, so JSON.parse rejects the whole thing. Walk back
    // from the end, find the last '},' or '}', truncate there, append ']',
    // and try again. Saves the partial extraction instead of returning [].
    if (!parsed && raw.trim().startsWith('[')) {
      const head = raw.trim();
      const lastClose = Math.max(head.lastIndexOf('},'), head.lastIndexOf('}'));
      if (lastClose > 0) {
        const recovered = head.slice(0, lastClose + 1) + ']';
        try {
          parsed = JSON.parse(recovered);
          if (typeof console !== 'undefined') console.info('[RewriteService] recovered truncated array, kept', Array.isArray(parsed) ? parsed.length : 0, 'objects');
        } catch { /* genuinely unsalvageable */ }
      }
    }

    // Reshape into an array. Three paths:
    //   1. Already an array - use directly.
    //   2. Object with an array-valued key (e.g. {assessments: [...]}) -
    //      unwrap that key.
    //   3. Single assessment object with assessment-like keys (title,
    //      name, assessment) - wrap in a one-element array. This is the
    //      common case when the syllabus only has one graded artefact.
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrayKey) {
        if (typeof console !== 'undefined') console.info('[RewriteService] unwrapping object key', arrayKey);
        parsed = parsed[arrayKey];
      } else if (parsed.title || parsed.name || parsed.assessment) {
        if (typeof console !== 'undefined') console.info('[RewriteService] wrapping single assessment object in array');
        parsed = [parsed];
      }
    }

    if (!Array.isArray(parsed)) {
      if (typeof console !== 'undefined') console.warn('[RewriteService] extractor: model returned non-array. Raw head:', String(raw).slice(0, 200));
      return [];
    }

    // Quality threshold: discard junk before it ever lands. Title must
    // start with a capital letter, run 4 to 60 chars, and not match
    // the noise words even if the LLM ignored the instruction.
    //
    // Field aliases. llama3.2 sometimes uses 'id' instead of 'title',
    // 'weightage' instead of 'weight', 'date' instead of 'dueDate'.
    // We accept all common variants so the model's stylistic choices
    // do not silently drop the entire result. If you find a real
    // syllabus where the model uses yet another key, add it to the
    // appropriate fallback chain here.
    const NOISE_WORDS = /^(item|cation|p\s*\d+|figure|table|page|section|lecture|topic|content|outline|rubric|details|overview|description|length|information|notes|comments|criteria)$/i;
    const pickTitle = (item) => {
      const raw = String(
        item.title ?? item.name ?? item.assessment ?? item.task ?? item.id ?? ''
      ).trim().replace(/\s+/g, ' ');
      // Normalise first character to uppercase so models that return
      // "literature review" still produce a valid title rather than being
      // silently dropped by the capital-letter guard below.
      return raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
    };
    const pickWeight = (item) => {
      const raw = String(item.weight ?? item.weighting ?? item.weightage ?? item.percentage ?? item.percent ?? '').trim();
      return raw && /\d/.test(raw) ? raw : '';
    };
    const pickWordCount = (item) => {
      const raw = item.wordCountGoal ?? item.wordCount ?? item.words ?? item.length;
      if (typeof raw === 'number' && raw > 0 && raw < 50000) return raw;
      if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return parseInt(raw.trim(), 10);
      return 0;
    };
    const pickDueDate = (item) => String(
      item.dueDate ?? item.due ?? item.deadline ?? item.date ?? item.when ?? ''
    ).trim().slice(0, 60);

    const seen = new Set();
    const briefs = [];
    let droppedNoLetter = 0, droppedShort = 0, droppedNoise = 0, droppedDup = 0;
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      // Type filter. Some models emit a 'type' or 'category' field that
      // says 'Lecture' / 'Tutorial' / 'Workshop' / 'Topic' / 'Theme' on
      // entries that are NOT graded. Reject those at the source, before
      // the title check, so a lecture titled 'Cell signalling' does not
      // sneak through as an assessment.
      const itemType = String(item.type || item.category || item.kind || '').toLowerCase();
      if (/^(lecture|tutorial|workshop|topic|theme|reading|module)\b/.test(itemType)) {
        droppedNoise++;
        continue;
      }
      const title = pickTitle(item);
      if (title.length < 4 || title.length > 60) { droppedShort++; continue; }
      if (!/^[A-Z]/.test(title)) { droppedNoLetter++; continue; }
      if (NOISE_WORDS.test(title)) { droppedNoise++; continue; }
      // Title-prefix filter for the same case: titles like 'Lecture 3'
      // or 'Topic 2 ...' should not survive even when there is no type
      // field.
      if (/^(lecture|tutorial|workshop|week\s*\d|topic|theme|module|reading)\b/i.test(title)) {
        droppedNoise++;
        continue;
      }
      const key = title.toLowerCase();
      if (seen.has(key)) { droppedDup++; continue; }
      seen.add(key);
      const weight = pickWeight(item);
      const wordCountGoal = pickWordCount(item);
      const dueDate = pickDueDate(item);
      const availableTopics = Array.isArray(item.availableTopics)
        ? item.availableTopics.filter(t => typeof t === 'string' && t.trim().length > 3).map(t => t.trim())
        : [];
      const hdCriteria = Array.isArray(item.hdCriteria)
        ? item.hdCriteria.filter(c => typeof c === 'string' && c.trim().length > 3).map(c => c.trim())
        : [];
      briefs.push({ title, weight, wordCountGoal, dueDate, availableTopics, hdCriteria });
    }
    if (typeof console !== 'undefined') {
      console.info(
        `[RewriteService] Ollama extracted ${briefs.length} assessment briefs` +
        ` (dropped short=${droppedShort} noLetter=${droppedNoLetter} noise=${droppedNoise} dup=${droppedDup})`
      );
    }

    // Defensive text-level rescue. When the JSON parse succeeded but the
    // quality filter dropped every item (common when the model ignores the
    // capitalisation instruction), the raw response often still contains
    // readable lines like "Literature Review (25%)". Scan those directly
    // before giving up. Only runs when raw is non-trivially long to avoid
    // false positives on genuinely empty syllabi.
    if (briefs.length === 0 && raw.trim().length > 20) {
      const seen2 = new Set();
      // Matches: optional leading number/bullet, then a capitalised-or-any
      // phrase, then a percentage figure nearby.
      const lineRe = /^[\d.\-*\s)]*([A-Za-z][A-Za-z0-9 ,'&/\-]{2,74}?)\s*[:\-(]?\s*(\d{1,3})\s*%/gm;
      for (const m of raw.matchAll(lineRe)) {
        const rawTitle = m[1].trim().replace(/\s+/g, ' ');
        const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        if (title.length < 4) continue;
        if (/^(lecture|tutorial|workshop|topic|theme|module|reading|week)\b/i.test(title)) continue;
        const key = title.toLowerCase();
        if (seen2.has(key)) continue;
        seen2.add(key);
        briefs.push({ title, weight: `${m[2]}%`, wordCountGoal: 0, dueDate: '' });
      }
      if (briefs.length > 0 && typeof console !== 'undefined') {
        console.info(`[RewriteService] text-level rescue recovered ${briefs.length} briefs from raw model output`);
      }
    }

    return briefs.slice(0, 12);
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[RewriteService] assessment extraction failed:', err?.name, err?.message);
    return [];
  }
};

// Backwards-compat wrapper: returns array of display strings.
export const extractAssessmentsWithOllama = async (rawText) => {
  const briefs = await __callAssessmentExtractor(rawText);
  return briefs.map(b => b.weight ? `${b.title} (${b.weight})` : b.title);
};

// Rich brief extractor: returns the full {title, weight, wordCountGoal,
// dueDate} objects so downstream consumers (sprint switcher, Logic Block
// progression, AURA Chat context) can use the structured data.
export const extractAssessmentBriefs = async (rawText) => __callAssessmentExtractor(rawText);

// pingOllama: 3 second health check against the active endpoint. Returns
// true when /api/tags responds 2xx, false on any failure (network, abort,
// non-2xx). Lets the cockpit confirm the Neural Link is alive on boot
// without surfacing a noisy error when it is not.
export const pingOllama = async () => {
  try {
    const endpoint = getOllamaEndpoint().replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${endpoint}/api/tags`, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
};

// Exported for unit tests and DevTools poking.
export const __internals = { SYSTEM_PROMPT, buildElevatePrompt, buildSynthesisePrompt, buildLogicModePrompt, cleanModelOutput, LOGIC_LENSES, fallbackCourseName, buildNameCoursePrompt, safeReadLocalStorage };
