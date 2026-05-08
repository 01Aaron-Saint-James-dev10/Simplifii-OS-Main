/**
 * MicroStepService.js
 *
 * UDL Action and Expression scaffold. Given an assessment brief, asks
 * Ollama for the first five literal micro-steps a student should take
 * to start the work. The point: replace vague academic prose ('conduct
 * research') with observable actions ('Open Google Scholar in a new
 * tab. Search for X. Download three peer-reviewed PDFs.').
 *
 * Intended for ADHD and executive-function support: the cockpit can
 * generate micro-steps for any pillar regardless of which university,
 * which course, or which student. No hardcoded assumptions about
 * BABS1201 or any specific syllabus.
 *
 * Sovereign: routed through the same Ollama endpoint as RewriteService.
 * No external API.
 */

const OLLAMA_ENDPOINT_KEY = 'simplifii_ollama_endpoint';
const OLLAMA_MODEL_KEY = 'simplifii_ollama_model';
const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

const safeReadLS = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch { return fallback; }
};

const SYSTEM_PROMPT = [
  'You are a UDL Action and Expression coach inside Simplifii OS, an Australian academic cockpit.',
  'Your job: take an assessment brief and return the FIRST 5 literal micro-steps a student should do RIGHT NOW to start the work.',
  '',
  'ABSOLUTE RULES:',
  '1. Australian English only. Never use US spellings.',
  '2. Never use em-dashes or en-dashes.',
  '3. Each step starts with a concrete imperative verb (Open, Search, Download, Read, Outline, Write, Annotate, Sketch).',
  '4. Each step is 5 to 18 words, observable from outside (someone watching could check it off).',
  '5. Replace vague phrases ("conduct research", "engage with the literature") with literal actions ("Open Google Scholar", "Save three PDFs to a folder named pillar-1").',
  '6. Return ONLY a JSON array of 5 objects, exact keys:',
  '   [{"step": 1, "title": "Short label", "action": "Imperative one-line"}, ...]',
  '7. No preamble, no markdown fence, no commentary.'
].join('\n');

const buildUserPrompt = (brief, courseContext) => [
  'ASSESSMENT BRIEF:',
  `Title: ${brief?.title || 'Unknown assessment'}`,
  `Weight: ${brief?.weight || 'unknown'}`,
  `Word target: ${brief?.wordCountGoal || 'not specified'}`,
  `Due: ${brief?.dueDate || 'not specified'}`,
  '',
  courseContext ? `COURSE: ${courseContext}` : '',
  '',
  'Return the JSON array of 5 micro-steps the student should do first.'
].filter(Boolean).join('\n');

const safeParseSteps = (raw) => {
  if (!raw) return [];
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { /* try fallbacks */ }
  if (!parsed) {
    const stripped = String(raw).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { parsed = JSON.parse(stripped); } catch { /* try array substring */ }
  }
  if (!parsed) {
    const m = String(raw).match(/\[[\s\S]*\]/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
  }
  if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
    const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
    if (arrayKey) parsed = parsed[arrayKey];
  }
  if (!Array.isArray(parsed)) return [];
  // Sweep dashes the model may have slipped in despite the system prompt.
  const sanitise = (s) => String(s || '').replace(/[\u2014\u2013]/g, ',').trim();
  return parsed
    .map((item, i) => ({
      step: Number(item?.step) || (i + 1),
      title: sanitise(item?.title || item?.name || `Step ${i + 1}`).slice(0, 60),
      action: sanitise(item?.action || item?.text || item?.do || item?.description || '').slice(0, 220)
    }))
    .filter(s => s.action.length >= 3)
    .slice(0, 5);
};

export const generateMicroSteps = async (brief, courseContext) => {
  if (!brief || !brief.title) throw new Error('No assessment brief supplied.');

  const endpoint = (safeReadLS(OLLAMA_ENDPOINT_KEY, DEFAULT_OLLAMA_ENDPOINT) || DEFAULT_OLLAMA_ENDPOINT).replace(/\/$/, '');
  const model = safeReadLS(OLLAMA_MODEL_KEY, DEFAULT_OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0.4, num_predict: 600 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(brief, courseContext) }
        ]
      }),
      signal: controller.signal
    });
  } catch (networkErr) {
    clearTimeout(timer);
    throw new Error(`Ollama unreachable at ${endpoint}. Is 'ollama serve' running?`);
  }
  clearTimeout(timer);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Ollama returned ${response.status}. ${body.slice(0, 160)}`);
  }
  const data = await response.json().catch(() => ({}));
  const raw = data?.message?.content || '';
  const steps = safeParseSteps(raw);
  if (steps.length === 0) {
    throw new Error('Could not parse micro-steps from the model output. Try regenerating.');
  }
  if (typeof console !== 'undefined') console.info('[MicroStepService] generated', steps.length, 'steps for', brief.title);
  return steps;
};
