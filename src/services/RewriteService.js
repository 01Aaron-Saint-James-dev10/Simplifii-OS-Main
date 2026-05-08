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

const getOllamaEndpoint = () => safeReadLocalStorage(OLLAMA_ENDPOINT_KEY, DEFAULT_OLLAMA_ENDPOINT) || DEFAULT_OLLAMA_ENDPOINT;

const getOllamaModel = () => safeReadLocalStorage(OLLAMA_MODEL_KEY, DEFAULT_OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL;

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
  'OUTPUT FORMAT: A JSON array of objects. Each object has these keys:',
  '  "title": short name of the assessment (3 to 60 chars, capital first letter)',
  '  "weight": percentage as a string like "30%", or "" if no weighting is given',
  '  "wordCountGoal": integer target word count (e.g. 1500), or 0 if not specified',
  '  "dueDate": short due date string (e.g. "Friday Week 5", "12 May 2026"), or "" if not specified',
  'Example:',
  '  [{"title":"Literature Review","weight":"25%","wordCountGoal":2000,"dueDate":"Friday Week 5"},',
  '   {"title":"Test 1","weight":"30%","wordCountGoal":0,"dueDate":"Week 7"},',
  '   {"title":"Science Communication Project","weight":"25%","wordCountGoal":0,"dueDate":"Week 11"},',
  '   {"title":"Final Exam","weight":"20%","wordCountGoal":0,"dueDate":"Exam Period"}]',
  '',
  'ABSOLUTE RULES:',
  '1. Australian English only.',
  '2. Never use em-dashes or en-dashes.',
  '3. Return ONLY the JSON array. No preamble, no markdown fence, no commentary.',
  '4. Exclude topics, lecture titles, learning outcomes, rubric column headers, navigation copy (Moodle, Hub), and word fragments (cation, p 2, Item).',
  '5. Each title must appear ONLY ONCE. Deduplicate aggressively across documents.',
  '6. The weightings of the returned assessments should sum to approximately 100% if the syllabus is complete. If your output sums to far less than 100%, scan the input again for assessments you missed.',
  '7. If the syllabus genuinely lists no assessments, return [].'
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
        options: { temperature: 0.1, num_predict: 800 },
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
      if (arrayMatch) { try { parsed = JSON.parse(arrayMatch[0]); } catch { /* give up */ } }
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
    const NOISE_WORDS = /^(item|cation|p\s*\d+|figure|table|page|section|lecture|topic|content|outline|rubric|details|overview|description|length|information|notes|comments|criteria)$/i;
    const seen = new Set();
    const briefs = [];
    let droppedNoLetter = 0, droppedShort = 0, droppedNoise = 0, droppedDup = 0;
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const title = String(item.title || item.name || item.assessment || '').trim().replace(/\s+/g, ' ');
      if (title.length < 4 || title.length > 60) { droppedShort++; continue; }
      if (!/^[A-Z]/.test(title)) { droppedNoLetter++; continue; }
      if (NOISE_WORDS.test(title)) { droppedNoise++; continue; }
      const key = title.toLowerCase();
      if (seen.has(key)) { droppedDup++; continue; }
      seen.add(key);
      const weightRaw = String(item.weight || item.weighting || '').trim();
      const weight = weightRaw && /\d/.test(weightRaw) ? weightRaw : '';
      const wcRaw = item.wordCountGoal !== undefined ? item.wordCountGoal : item.words;
      const wordCountGoal = (typeof wcRaw === 'number' && wcRaw > 0 && wcRaw < 50000)
        ? wcRaw
        : (typeof wcRaw === 'string' && /^\d+$/.test(wcRaw.trim())) ? parseInt(wcRaw.trim(), 10) : 0;
      const dueDate = String(item.dueDate || item.due || item.deadline || '').trim().slice(0, 60);
      briefs.push({ title, weight, wordCountGoal, dueDate });
    }
    if (typeof console !== 'undefined') {
      console.info('[RewriteService] Ollama extracted', briefs.length, 'assessment briefs (dropped:', { short: droppedShort, noLetter: droppedNoLetter, noise: droppedNoise, dup: droppedDup }, ')');
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
