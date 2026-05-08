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

// PDF.js worker. Served from the cockpit's own origin so the parser works
// offline and never touches unpkg.com at runtime. The worker file is copied
// into public/ at install time by scripts/copy-pdf-worker.js (registered
// as the postinstall hook in package.json), so a fresh `npm install`
// always populates it. Your PDF content is parsed entirely in the browser
// and never leaves the device.
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

const extractWithPdfJs = async (fileBlob) => {
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
    pageTexts.push(content.items.map(item => item.str).join(' '));
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
    speakSystemMessage("I need you to re-authenticate to access the Research Engine.");
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
  const liveToken = localStorage.getItem('gcp_access_token') || authToken;

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
