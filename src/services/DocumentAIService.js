/**
 * DocumentAIService.js
 *
 * Three-tier PDF extraction with graceful fallback:
 *   1. GCP Document AI (when an OAuth token is present in localStorage).
 *   2. Local pdfjs-dist parse (sovereign / privacy-first; PDF stays in the browser).
 *   3. Canned mock (only if both above paths fail; keeps UI alive in dev).
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { auditCurriculum } from './UDLAuditService';

const PROJECT_ID = process.env.REACT_APP_GCP_PROJECT_ID || 'simplifii-os-production';
const LOCATION = 'us';
const PROCESSOR_ID = process.env.REACT_APP_DOCUMENT_AI_PROCESSOR_ID || 'c79a8ed226a1576e';

// PDF.js worker. Served from the cockpit's own origin. The copy script
// (scripts/copy-pdf-worker.js) emits one of two filenames depending on
// which pdfjs-dist version is installed:
//   3.x and earlier  -> public/pdf.worker.min.js   (UMD, classic script)
//   4.x              -> public/pdf.worker.min.mjs  (ESM, module script)
// We probe HEAD on the .js variant first; if missing, fall back to .mjs.
// The result is cached in a module-scoped promise so repeat parses do
// not re-probe.
let workerInitPromise = null;
const initWorker = async () => {
  if (typeof window === 'undefined') return;
  if (pdfjsLib.GlobalWorkerOptions.workerSrc) return;
  const candidates = ['/pdf.worker.min.js', '/pdf.worker.min.mjs'];
  for (const url of candidates) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = url;
        console.info('[DocumentAI] PDF worker resolved at', url);
        return;
      }
    } catch { /* try next */ }
  }
  throw new Error("PDF worker not found in /public. Run 'npm install' to populate it (postinstall hook), or 'npm run copy-pdf-worker' manually.");
};
if (typeof window !== 'undefined') {
  workerInitPromise = initWorker().catch(err => {
    console.error('[DocumentAI]', err.message);
    return Promise.reject(err);
  });
}

const extractWithPdfJs = async (fileBlob) => {
  // Wait for the worker probe to settle before kicking off the parse.
  // If the probe rejected (no worker file found), surface that so the
  // caller can show the breach banner instead of the generic catch-all.
  if (workerInitPromise) await workerInitPromise;
  const arrayBuffer = await fileBlob.arrayBuffer();
  // Disable the font fetch so a missing standard-font URL does not abort
  // the parse; the cockpit only needs the text layer, not glyph rendering.
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false
  });
  const pdf = await loadingTask.promise;
  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Reconstruct line breaks from item geometry. pdfjs returns text
    // items in reading order but joins them with whitespace by default,
    // which collapses assessment lists and learning outcomes into a
    // single wall of words. The downstream regex then has nothing to
    // anchor on.
    //
    // Strategy: trust item.hasEOL when set (newer pdfjs builds emit it
    // reliably), otherwise insert a newline only when the Y baseline
    // shifts down by more than 6 px. The previous 2 px threshold was
    // too tight: kerning, subscript, superscript, and ligature glyph
    // splits routinely produce 3 to 5 px Y deltas WITHIN a visual
    // line, which the old code mistook for line breaks. The result
    // was words like 'Biology' splitting into 'Biolo' + newline +
    // 'gy' and learning outcomes rendering as fragments.
    let lastY = null;
    let pageText = '';
    for (const item of content.items) {
      const y = item.transform ? item.transform[5] : null;
      const yJumpedDown = y !== null && lastY !== null && (lastY - y) > 6;
      if (item.hasEOL || yJumpedDown) {
        pageText += '\n';
      } else if (pageText.length > 0 && !/\s$/.test(pageText)) {
        pageText += ' ';
      }
      pageText += item.str || '';
      if (y !== null) lastY = y;
    }
    pageTexts.push(pageText);
  }
  let combined = pageTexts.join('\n\n');
  // De-hyphenate words split across line breaks. Academic PDFs frequently
  // wrap on hyphenation: 'communi-\ncation', 'biolo-\ngy', 'methodo-\nlogy'.
  // pdfjs preserves the hyphen and the newline literally, so the
  // downstream regex sees fragments like 'cation' or 'gy' as if they
  // were standalone words. We only join when the second half starts
  // with a lowercase letter, so genuine compound terms like
  // 'self-evaluation' on a single line are preserved.
  combined = combined.replace(/([A-Za-z]{2,})-\s*\n\s*([a-z]{2,})/g, '$1$2');
  return combined;
};

const callGcpDocumentAi = async (fileBlob, liveToken) => {
  const endpoint = `https://${LOCATION}-documentai.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}:process`;

  const base64String = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(fileBlob);
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${liveToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rawDocument: { content: base64String, mimeType: fileBlob.type || 'application/pdf' }
    })
  });

  if (response.status === 401) {
    // Clear the stale token so subsequent uploads skip the GCP path
    // entirely and go straight to local pdfjs. Without this, every
    // Grounding upload attempt produces three 401 round-trips and
    // three duplicate 're-authenticate' speech messages.
    try { localStorage.removeItem('gcp_access_token'); } catch { /* storage unavailable */ }
    throw new Error('Document AI: 401 Unauthorized. Token expired or invalid.');
  }
  if (!response.ok) {
    throw new Error(`Document AI: ${response.statusText}`);
  }

  const data = await response.json();
  return data.document.text;
};

export class PdfExtractionError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'PdfExtractionError';
    this.cause = cause;
  }
}

export const processDocumentWithGCP = async (fileBlob, authToken) => {
  const stored = (() => {
    try { return localStorage.getItem('gcp_access_token'); } catch { return null; }
  })();
  // Reject obvious mock tokens. The legacy onboarding code passes
  // 'mock_jwt_token_xyz123' as authToken, which used to drive every
  // upload through GCP and produce three 401 round-trips per file.
  // We only try GCP when localStorage has a non-empty real token.
  const isMock = (t) => !t || /^mock[_-]/i.test(t) || t.length < 20;
  const liveToken = !isMock(stored) ? stored : (!isMock(authToken) ? authToken : null);

  // Tier 1: GCP Document AI when authenticated.
  if (liveToken) {
    try {
      console.info('[DocumentAI] Using live GCP OAuth token.');
      return await callGcpDocumentAi(fileBlob, liveToken);
    } catch (gcpErr) {
      console.warn('[DocumentAI] GCP path failed, falling back to local pdfjs:', gcpErr);
      // fall through to pdfjs
    }
  }

  // Tier 2: Sovereign local parse via pdfjs-dist. No silent mock fallback.
  // If pdfjs cannot extract real text (corrupt file, scan-only PDF without an
  // OCR layer), throw a typed error the UI can surface to the student.
  // We log the underlying error to console so the student can self-diagnose
  // when the surface message is too generic; the worker version mismatch
  // and 'PasswordException' both surface as distinct console traces.
  try {
    console.info('[DocumentAI] Sovereign mode: parsing PDF locally with pdfjs-dist.');
    const text = await extractWithPdfJs(fileBlob);
    if (!text || text.trim().length === 0) {
      throw new PdfExtractionError(
        'No text layer found. This PDF looks like a scan or image-only document. Try a text-based PDF, or OCR the file first (Preview app: File menu, Export as PDF after running text recognition).'
      );
    }
    return text;
  } catch (pdfErr) {
    if (pdfErr instanceof PdfExtractionError) throw pdfErr;
    console.error('[DocumentAI] pdfjs-dist parse failed:', pdfErr);
    const name = pdfErr?.name || '';
    const msg = pdfErr?.message || '';
    if (/PasswordException|password/i.test(name + ' ' + msg)) {
      throw new PdfExtractionError(
        'This PDF is password-protected. Remove the password (Preview app: Export, uncheck Encrypt) and try again.',
        pdfErr
      );
    }
    if (/InvalidPDFException|invalid pdf|missing pdf/i.test(name + ' ' + msg)) {
      throw new PdfExtractionError(
        'This file is not a valid PDF. Confirm the extension matches the contents, or re-export the file.',
        pdfErr
      );
    }
    if (/MissingPDFException/i.test(name)) {
      throw new PdfExtractionError(
        'PDF stream missing or empty. The file may have been truncated during upload.',
        pdfErr
      );
    }
    if (/worker|Setting up fake worker/i.test(msg)) {
      throw new PdfExtractionError(
        'PDF worker did not load. Run `npm run copy-pdf-worker` then refresh the page.',
        pdfErr
      );
    }
    throw new PdfExtractionError(
      `Could not read this PDF locally (${name || 'unknown error'}: ${msg.slice(0, 120) || 'no detail'}). Check the browser console for the full trace.`,
      pdfErr
    );
  }
};

// ============================================================
// Sovereign Format (.sm) Transformer
// ============================================================

/**
 * convertToSovereignFormat
 *
 * Converts raw extracted text (from any PDF or paste) into a valid
 * Simplifii-Markdown (.sm) document. Zero API calls. Runs entirely in
 * the browser using regex heuristics.
 *
 * @param {string} rawText      Extracted text from processDocumentWithGCP or paste
 * @param {object} ctx          Context from the caller
 * @param {string} ctx.platform 'euka' | 'khan_academy' | 'distance_ed' | 'other'
 * @param {string} ctx.level    'primary' | 'secondary' | 'university' | 'tafe' | 'homeschool'
 * @param {string} ctx.subject  Subject name (optional)
 * @returns {string}            The .sm file content as a string
 */
export function convertToSovereignFormat(rawText, {
  platform = 'other',
  level = 'secondary',
  subject = '',
} = {}) {
  // Run UDL 3.0 audit before building the document so results can be
  // embedded in front matter as teacher scaffolding notes.
  const audit = auditCurriculum(rawText);

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // ---- Extract title ----
  const title = _extractTitle(lines) || 'Untitled Lesson';

  // ---- Extract learning objectives ----
  const objectives = _extractObjectives(lines);

  // ---- Extract key concepts (bold or definition patterns) ----
  const concepts = _extractConcepts(lines);

  // ---- Extract numbered steps / instructions ----
  const steps = _extractSteps(lines);

  // ---- Extract overview sentences (first 3 non-header sentences) ----
  const overview = _extractOverview(lines, title);

  // ---- Compute friction coefficient ----
  const frictionCoefficient = _computeFrictionCoefficient(lines);

  // ---- Build Socratic prompts from objectives ----
  const socratics = _buildSocratics(objectives, title);

  // ---- Assemble .sm document ----
  const now = new Date().toISOString();

  const frontMatter = [
    '---',
    'sm_version: "1.0"',
    `title: "${title.replace(/"/g, "'")}"`,
    `subject: "${subject || _guessSubject(lines)}"`,
    `level: "${level}"`,
    `source_platform: "${platform}"`,
    `friction_coefficient: ${frictionCoefficient}`,
    `udl_modes: ["visual", "literal"]`,
    objectives.length
      ? 'learning_objectives:\n' + objectives.map(o => `  - "${o.replace(/"/g, "'").slice(0, 120)}"`).join('\n')
      : 'learning_objectives: []',
    `created_at: "${now}"`,
    // UDL 3.0 Audit results embedded as teacher scaffolding notes.
    // Barrier language follows the social model: barriers are curriculum
    // failures, not student deficits. (UDL_3_0_SPEC.md Part 8.4)
    `udl_audit:`,
    `  barrier_count: ${audit.barrierCount}`,
    `  critical_count: ${audit.criticalCount}`,
    `  high_count: ${audit.highCount}`,
    `  udl3_score: ${audit.udl3Score}`,
    `  ahead_compliant: ${audit.aheadCompliant}`,
    audit.teacherNotes.length > 0
      ? '  teacher_notes:\n' + audit.teacherNotes.slice(0, 6).map(n =>
          `    - "${n.replace(/"/g, "'").replace(/\n/g, ' ').slice(0, 160)}"`
        ).join('\n')
      : '  teacher_notes: []',
    '---',
  ].join('\n');

  const tier1 = [
    '# Tier 1: Summary',
    '',
    '## Overview',
    '',
    overview || `This lesson covers the topic of ${title}.`,
    '',
    '## Key Concepts',
    '',
    concepts.length
      ? '| Term | Plain-Language Definition |\n|---|---|\n' +
        concepts.map(c => `| ${c.term} | ${c.definition} |`).join('\n')
      : '_Key concepts will be added by your teacher or extracted on full import._',
    '',
    '## Step-by-Step Scaffolding',
    '',
    steps.length
      ? steps.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '1. Read the overview and key concepts above.\n2. Answer the reflection prompts in Tier 2.\n3. Draft your response in the Tier 3 Interaction Sandbox.',
  ].join('\n');

  const tier2 = [
    '# Tier 2: Socratic Layer',
    '',
    '## Reflection Prompts',
    '',
    socratics.map((q, i) => `${i + 1}. ${q}`).join('\n'),
    '',
    '## Check Your Understanding',
    '',
    objectives.length
      ? objectives.slice(0, 4).map(o => `- [ ] ${o}`).join('\n')
      : `- [ ] I can explain the main idea of this lesson in my own words\n- [ ] I can give one real-world example of the key concept`,
  ].join('\n');

  const tier3 = [
    '# Tier 3: Your Writing',
    '',
    '## Interaction Sandbox',
    '',
    '[Write your response here. This is the section that will be assessed.]',
    '',
    '## Notes',
    '',
    '[Use this space for rough ideas, diagrams described in words, or anything you want to remember.]',
  ].join('\n');

  return [frontMatter, '', tier1, '', tier2, '', tier3].join('\n');
}

// ---- Internal extraction helpers (not exported) ----

function _extractTitle(lines) {
  const h1 = lines.find(l => /^#\s+/.test(l));
  if (h1) return h1.replace(/^#+\s+/, '').trim();
  // Fallback: first line that looks like a heading (short, title-cased)
  const candidate = lines.find(l => l.length < 80 && /^[A-Z]/.test(l) && !/[:.,]$/.test(l));
  return candidate || lines[0] || '';
}

function _extractObjectives(lines) {
  const result = [];
  let inObjectivesBlock = false;
  for (const line of lines) {
    if (/learning\s+objectives?|students\s+will|by\s+the\s+end|outcomes?/i.test(line)) {
      inObjectivesBlock = true;
      continue;
    }
    if (inObjectivesBlock) {
      if (/^(##|#)\s/.test(line)) break;
      const cleaned = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 200) result.push(cleaned);
      if (result.length >= 5) break;
    }
  }
  return result;
}

function _extractConcepts(lines) {
  const result = [];
  for (const line of lines) {
    // Pattern: "Term: definition" or "**Term** - definition"
    const colonMatch = line.match(/^([A-Z][^:]{2,40}):\s+(.{10,120})$/);
    if (colonMatch) {
      result.push({ term: colonMatch[1].replace(/\*\*/g, '').trim(), definition: colonMatch[2].trim() });
    }
    const boldMatch = line.match(/^\*\*(.+?)\*\*\s*[-:]\s*(.{10,120})$/);
    if (boldMatch) {
      result.push({ term: boldMatch[1].trim(), definition: boldMatch[2].trim() });
    }
    if (result.length >= 8) break;
  }
  return result;
}

function _extractSteps(lines) {
  const result = [];
  for (const line of lines) {
    if (/^\d+\.\s+.{10,}/.test(line)) {
      result.push(line.replace(/^\d+\.\s+/, '').trim());
    }
    if (result.length >= 6) break;
  }
  return result;
}

function _extractOverview(lines, title) {
  const sentences = [];
  const titleWords = title.toLowerCase().split(/\s+/);
  for (const line of lines) {
    if (/^(#|\||---|\d+\.)/.test(line)) continue;
    if (line.length < 30) continue;
    // Prefer sentences that contain title keywords
    const lineWords = line.toLowerCase();
    const relevance = titleWords.filter(w => w.length > 3 && lineWords.includes(w)).length;
    if (relevance > 0 || sentences.length === 0) sentences.push(line);
    if (sentences.length >= 3) break;
  }
  return sentences.join(' ');
}

function _computeFrictionCoefficient(lines) {
  const total = lines.length;
  if (total === 0) return 0.5;
  const avgLen = lines.reduce((s, l) => s + l.length, 0) / total;
  const listDensity = lines.filter(l => /^[-*•\d.]/.test(l)).length / total;
  const headingDensity = lines.filter(l => /^#+\s/.test(l)).length / total;
  // Long sentences + few lists + few headings = high friction
  const lengthScore = Math.min(avgLen / 120, 1.0) * 0.5;
  const structureScore = (1 - Math.min(listDensity + headingDensity, 1.0)) * 0.5;
  return Math.round((lengthScore + structureScore) * 100) / 100;
}

function _buildSocratics(objectives, title) {
  // AHEAD Ireland Action and Expression scaffold (UDL 3.0 Checkpoints 9.1, 9.2, 9.4).
  // Plan-Do-Monitor-Reflect (PDMR) structure wraps the content-specific questions.
  const pdmrPlan    = 'PLAN: Before you begin, list the steps you intend to take to complete this task.';
  const pdmrMonitor = 'MONITOR: Pause at the halfway point. Are you on track? What, if anything, do you need to adjust?';
  const pdmrReflect = 'REFLECT: After completing this task, rate your confidence (1-5) and note one thing you would do differently next time.';

  // UDL 3.0 Belonging + Empathy prompt (Checkpoints 1.2, Part 8.1, 8.3)
  const belongingPrompt = `How does the topic of "${title}" connect to your own experience, community, or professional context?`;

  // UDL 3.0 Joy and Play prompt (Checkpoint 1.2, Part 8.2)
  const joyPrompt = `Without worrying about being right yet: what surprises or interests you most about ${title}?`;

  let contentQuestions;
  if (objectives.length > 0) {
    contentQuestions = objectives.slice(0, 3).map(obj => {
      const verbMatch = obj.match(/^(describe|explain|identify|analyse|analyze|apply|evaluate|compare|define|discuss)/i);
      if (verbMatch) {
        return obj.replace(new RegExp(`^${verbMatch[1]}`, 'i'), 'In your own words,') + '?';
      }
      return `In your own words: ${obj.charAt(0).toLowerCase() + obj.slice(1).replace(/\.$/, '')}?`;
    });
  } else {
    contentQuestions = [
      `What is the most important idea in this lesson about ${title}?`,
      'What is one thing from this lesson that challenges or changes how you think?',
    ];
  }

  return [pdmrPlan, ...contentQuestions, belongingPrompt, joyPrompt, pdmrMonitor, pdmrReflect];
}

function _guessSubject(lines) {
  const text = lines.join(' ').toLowerCase();
  if (/\bmath|equation|formula|algebra|calculus|geometry\b/.test(text)) return 'Mathematics';
  if (/\bphysics|force|motion|energy|velocity\b/.test(text)) return 'Physics';
  if (/\bbiology|cell|organism|evolution|genetics\b/.test(text)) return 'Biology';
  if (/\bchemistry|element|compound|reaction|molecule\b/.test(text)) return 'Chemistry';
  if (/\bhistory|war|century|empire|revolution\b/.test(text)) return 'History';
  if (/\benglish|essay|literature|narrative|grammar\b/.test(text)) return 'English';
  if (/\bgeograph|climate|landform|population|ecosystem\b/.test(text)) return 'Geography';
  return 'General';
}
