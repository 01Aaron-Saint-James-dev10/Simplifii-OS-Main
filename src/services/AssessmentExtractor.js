/**
 * AssessmentExtractor.js
 *
 * Ollama-powered assessment brief extractor. Sends a tight JSON-only prompt
 * with syllabus text and asks the model to return an array of
 * {title, weight, wordCountGoal, dueDate, availableTopics, hdCriteria}.
 * Extracted from RewriteService.js.
 */

import {
  getProviderName,
  getOllamaEndpoint,
  getOllamaModel,
} from './RewriteConstants';

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

// Quality filter constants
const NOISE_WORDS = /^(item|cation|p\s*\d+|figure|table|page|section|lecture|topic|content|outline|rubric|details|overview|description|length|information|notes|comments|criteria)$/i;

const pickTitle = (item) => {
  const raw = String(
    item.title ?? item.name ?? item.assessment ?? item.task ?? item.id ?? ''
  ).trim().replace(/\s+/g, ' ');
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

/**
 * Internal: send the prompt and parse the JSON response. Returns an array
 * of normalised brief objects on success (possibly empty). THROWS on
 * hard failures (network unreachable, non-2xx HTTP, abort).
 */
const __callAssessmentExtractor = async (rawText) => {
  if (!rawText || rawText.trim().length < 200) {
    if (typeof console !== 'undefined') console.info('[AssessmentExtractor] skipped: rawText too short');
    return [];
  }
  if (getProviderName() !== 'ollama') {
    if (typeof console !== 'undefined') console.info('[AssessmentExtractor] skipped: provider is', getProviderName());
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
    if (typeof console !== 'undefined') console.warn('[AssessmentExtractor] network error:', networkErr?.name, networkErr?.message);
    throw new Error('extractor: ollama unreachable');
  }
  clearTimeout(timer);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (typeof console !== 'undefined') console.warn('[AssessmentExtractor] HTTP', response.status, body.slice(0, 160));
    throw new Error(`extractor: HTTP ${response.status}`);
  }
  try {
    const data = await response.json().catch(() => ({}));
    const raw = data?.message?.content || '';
    const debug = (() => {
      try { return localStorage.getItem('simplifii_extract_debug') === 'true'; } catch { return false; }
    })();
    if (debug && typeof console !== 'undefined') console.info('[AssessmentExtractor] raw model output:', raw);

    let parsed = null;
    try { parsed = JSON.parse(raw); } catch { /* try fallbacks */ }
    if (!parsed) {
      const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      try { parsed = JSON.parse(stripped); } catch { /* try next */ }
    }
    if (!parsed) {
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) { try { parsed = JSON.parse(arrayMatch[0]); } catch { /* fall through */ } }
    }
    // Truncation recovery
    if (!parsed && raw.trim().startsWith('[')) {
      const head = raw.trim();
      const lastClose = Math.max(head.lastIndexOf('},'), head.lastIndexOf('}'));
      if (lastClose > 0) {
        const recovered = head.slice(0, lastClose + 1) + ']';
        try {
          parsed = JSON.parse(recovered);
          if (typeof console !== 'undefined') console.info('[AssessmentExtractor] recovered truncated array, kept', Array.isArray(parsed) ? parsed.length : 0, 'objects');
        } catch { /* genuinely unsalvageable */ }
      }
    }

    // Reshape into an array
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrayKey) {
        if (typeof console !== 'undefined') console.info('[AssessmentExtractor] unwrapping object key', arrayKey);
        parsed = parsed[arrayKey];
      } else if (parsed.title || parsed.name || parsed.assessment) {
        if (typeof console !== 'undefined') console.info('[AssessmentExtractor] wrapping single assessment object in array');
        parsed = [parsed];
      }
    }

    if (!Array.isArray(parsed)) {
      if (typeof console !== 'undefined') console.warn('[AssessmentExtractor] model returned non-array. Raw head:', String(raw).slice(0, 200));
      return [];
    }

    const seen = new Set();
    const briefs = [];
    let droppedNoLetter = 0, droppedShort = 0, droppedNoise = 0, droppedDup = 0;
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const itemType = String(item.type || item.category || item.kind || '').toLowerCase();
      if (/^(lecture|tutorial|workshop|topic|theme|reading|module)\b/.test(itemType)) {
        droppedNoise++;
        continue;
      }
      const title = pickTitle(item);
      if (title.length < 4 || title.length > 60) { droppedShort++; continue; }
      if (!/^[A-Z]/.test(title)) { droppedNoLetter++; continue; }
      if (NOISE_WORDS.test(title)) { droppedNoise++; continue; }
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
        `[AssessmentExtractor] Ollama extracted ${briefs.length} assessment briefs` +
        ` (dropped short=${droppedShort} noLetter=${droppedNoLetter} noise=${droppedNoise} dup=${droppedDup})`
      );
    }

    // Text-level rescue for when JSON parse succeeded but quality filter
    // dropped every item
    if (briefs.length === 0 && raw.trim().length > 20) {
      const seen2 = new Set();
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
        console.info(`[AssessmentExtractor] text-level rescue recovered ${briefs.length} briefs from raw model output`);
      }
    }

    return briefs.slice(0, 12);
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[AssessmentExtractor] extraction failed:', err?.name, err?.message);
    return [];
  }
};

// Backwards-compat wrapper: returns array of display strings.
export const extractAssessmentsWithOllama = async (rawText) => {
  const briefs = await __callAssessmentExtractor(rawText);
  return briefs.map(b => b.weight ? `${b.title} (${b.weight})` : b.title);
};

// Rich brief extractor: returns the full structured objects.
export const extractAssessmentBriefs = async (rawText) => __callAssessmentExtractor(rawText);
