/**
 * ChatService.js
 *
 * AURA Chat. Wraps the local Ollama /api/chat endpoint with a persona-locked
 * system prompt and the active course's syllabus context, so the student can
 * ask questions about their unit and get answers grounded in the actual
 * extracted material rather than hallucinated boilerplate.
 *
 * The persona is the Academic Advocate: collaborative researcher,
 * ADHD-friendly, slightly witty, grounded. Australian English only. No
 * em-dashes or en-dashes. Stays under 200 words by default.
 *
 * Sovereign by construction. The endpoint defaults to localhost:11434 and is
 * never overridden to anything off-device. The student's syllabus, message,
 * and the persona instructions all stay on the Mac.
 */

const OLLAMA_ENDPOINT_KEY = 'simplifii_ollama_endpoint';
const OLLAMA_MODEL_KEY = 'simplifii_ollama_model';
const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';
const REASONING_START_EVENT = 'simplifii:reasoning-start';
const REASONING_END_EVENT = 'simplifii:reasoning-end';

const safeReadLocalStorage = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
};

const PERSONA_SYSTEM = [
  'You are AURA, an Australian academic writing partner inside Simplifii OS.',
  'You support a student\'s research and writing by answering questions about their active course.',
  '',
  'PERSONA:',
  '- Collaborative researcher, not a tutor.',
  '- ADHD-friendly: short, scannable, concrete. Lead with the answer, then nuance.',
  '- Slightly witty but grounded. Never sycophantic.',
  '- Treat the student as the author of their work.',
  '',
  'ABSOLUTE RULES, never break them:',
  '1. Australian English only (analyse, organise, colour, behaviour, optimise, recognise, centre, defence, programme). Never use US spellings.',
  '2. Never use em-dashes or en-dashes. Use commas, full stops, semicolons, or restructure the sentence.',
  '3. If the student asks about their course (assessments, due dates, weightings, learning outcomes, rubric criteria), look at the COURSE CONTEXT below FIRST. Quote the relevant line back when it answers the question.',
  '4. If the answer is not in the COURSE CONTEXT, say so plainly. Do not invent dates, weightings, citations, or rubric criteria.',
  '5. Stay under 200 words unless the student explicitly asks for more.',
  '6. No greetings, no sign-offs, no bullet headers like ANSWER. Just the answer.'
].join('\n');

const buildContextBlock = (course) => {
  if (!course) return 'No active course.';
  const ed = course.extractionData;
  const parts = [];
  if (course.name) parts.push(`COURSE: ${course.name}`);
  if (!ed) {
    parts.push('No syllabus has been ingested for this course yet. Tell the student to drop their outline, brief, and rubric via Add Course.');
    return parts.join('\n');
  }
  if (ed.unitCode) parts.push(`UNIT CODE: ${ed.unitCode}`);
  if (ed.detectedLevel) parts.push(`LEVEL: ${ed.detectedLevel}`);
  if (ed.referencingStyle) parts.push(`REFERENCING: ${ed.referencingStyle}`);
  if (ed.words) parts.push(`WORD COUNT TARGET: ${ed.words}`);
  if (Array.isArray(ed.assessmentTitles) && ed.assessmentTitles.length) {
    parts.push(`ASSESSMENTS:\n${ed.assessmentTitles.map(t => `- ${t}`).join('\n')}`);
  }
  if (Array.isArray(ed.assessmentDates) && ed.assessmentDates.length) {
    parts.push(`DATES: ${ed.assessmentDates.join(', ')}`);
  }
  if (Array.isArray(ed.learningOutcomes) && ed.learningOutcomes.length) {
    parts.push(`LEARNING OUTCOMES:\n${ed.learningOutcomes.slice(0, 8).map((lo, i) => `${i + 1}. ${lo}`).join('\n')}`);
  }
  if (Array.isArray(ed.rubricCriteria) && ed.rubricCriteria.length) {
    parts.push(`RUBRIC CUES: ${ed.rubricCriteria.slice(0, 5).join('; ')}`);
  }
  if (course.roadmap) {
    const r = course.roadmap;
    const roadmapParts = [];
    if (r.currentTask) roadmapParts.push(`CURRENT: ${r.currentTask}`);
    if (r.nextAssessment) roadmapParts.push(`NEXT: ${r.nextAssessment}`);
    if (r.finalMilestone) roadmapParts.push(`FINAL: ${r.finalMilestone}`);
    if (roadmapParts.length) parts.push(`SEMESTER ROADMAP:\n${roadmapParts.join('\n')}`);
  }
  if (typeof ed.rawText === 'string' && ed.rawText.length > 0) {
    // 8000 char window. Previous 1500 cap was clipping right after
    // the course description, leaving AURA blind to the assessment
    // table and rubric criteria buried later in the document.
    // llama3.2 has 128k context so 8000 is comfortable. AURA can
    // now answer 'what is the weighting for the lit review' without
    // referring the student back to the original PDF.
    parts.push(`SYLLABUS EXCERPT (first 8000 chars):\n${ed.rawText.slice(0, 8000)}`);
  }
  return parts.join('\n\n');
};

const cleanModelOutput = (raw) => {
  if (!raw) return '';
  let out = String(raw).trim();
  out = out.replace(/^(here(\s+is|'s)|sure[,!.]?|certainly[,!.]?|of course[,!.]?|absolutely[,!.]?)\s*[-:,.]?\s*/i, '');
  out = out.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith('“') && out.endsWith('”'))) {
    out = out.slice(1, -1).trim();
  }
  if (/[\u2014\u2013]/.test(out)) {
    if (typeof console !== 'undefined') console.warn('[ChatService] AURA returned dash characters. Replacing.');
    out = out.replace(/\s*[\u2014\u2013]\s*/g, ', ');
  }
  return out;
};

const getOllamaEndpoint = () => safeReadLocalStorage(OLLAMA_ENDPOINT_KEY, DEFAULT_OLLAMA_ENDPOINT) || DEFAULT_OLLAMA_ENDPOINT;
const getOllamaModel = () => safeReadLocalStorage(OLLAMA_MODEL_KEY, DEFAULT_OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL;

export const askAura = async (message, course, history = []) => {
  if (!message || !message.trim()) throw new Error('Empty message.');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
  }

  const start = Date.now();
  try {
    const endpoint = getOllamaEndpoint().replace(/\/$/, '');
    const model = getOllamaModel();
    const contextBlock = buildContextBlock(course);
    const systemPrompt = `${PERSONA_SYSTEM}\n\nCOURSE CONTEXT:\n${contextBlock}`;

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const turn of history.slice(-6)) {
      if (turn?.role === 'user' || turn?.role === 'assistant') {
        messages.push({ role: turn.role, content: String(turn.content || '') });
      }
    }
    messages.push({ role: 'user', content: message });

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
          options: { temperature: 0.5, num_predict: 600 },
          messages
        }),
        signal: controller.signal
      });
    } catch (networkErr) {
      throw new Error(`AURA could not reach the local model at ${endpoint}. Is 'ollama serve' running?`);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (response.status === 404 && /model/i.test(body)) {
        throw new Error(`Model '${model}' not found. Run 'ollama pull ${model}'.`);
      }
      throw new Error(`AURA returned ${response.status}. ${body.slice(0, 160)}`);
    }

    const data = await response.json().catch(() => ({}));
    const cleaned = cleanModelOutput(data?.message?.content || '');
    if (!cleaned) throw new Error('AURA returned empty content. Try rephrasing.');
    if (typeof console !== 'undefined') {
      console.info('[ChatService] response in', Date.now() - start, 'ms');
    }
    return cleaned;
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
    }
  }
};

export const __internals = { PERSONA_SYSTEM, buildContextBlock, cleanModelOutput };
