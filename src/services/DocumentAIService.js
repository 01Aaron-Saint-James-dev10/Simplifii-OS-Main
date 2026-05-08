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

// PDF.js worker. The worker file is the parser code, fetched once from unpkg.
// Your PDF *content* is parsed entirely in the browser and never leaves the
// device. To go fully offline, copy
//   node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js
// into public/, then change the workerSrc to '/pdf.worker.min.js'.
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;
}

const extractWithPdfJs = async (fileBlob) => {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
    speakSystemMessage("Adonis, I need you to re-authenticate to access the Research Engine.");
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
  try {
    console.info('[DocumentAI] Sovereign mode: parsing PDF locally with pdfjs-dist.');
    const text = await extractWithPdfJs(fileBlob);
    if (!text || text.trim().length === 0) {
      throw new PdfExtractionError(
        'No text layer found. This PDF may be a scan or image-only document. Try a text-based PDF or run OCR first.'
      );
    }
    return text;
  } catch (pdfErr) {
    if (pdfErr instanceof PdfExtractionError) throw pdfErr;
    throw new PdfExtractionError(
      'Could not read this PDF locally. The file may be encrypted, corrupt, or use an unsupported format.',
      pdfErr
    );
  }
};
