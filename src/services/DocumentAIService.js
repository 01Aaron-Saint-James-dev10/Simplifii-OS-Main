/**
 * DocumentAIService.js
 *
 * Three-tier PDF extraction with graceful fallback:
 *   1. GCP Document AI (when an OAuth token is present in localStorage).
 *   2. Local pdfjs-dist parse (sovereign / privacy-first; PDF stays in the browser).
 *   3. Canned mock (only if both above paths fail; keeps UI alive in dev).
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { speakSystemMessage } from './MessagingHub';

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
  return pageTexts.join('\n\n');
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
