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

const mockDocumentAI = async (file) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(`[SIMULATED DOCUMENT AI EXTRACTION FOR ${file.name}]\n\nUnit Code: BABS1201\nTheme: Molecules\nTier: mres\nLength: 2000 words\nRequirements: Primary sources required.`);
  }, 1500);
});

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

  // Tier 2: Sovereign local parse via pdfjs-dist.
  try {
    console.info('[DocumentAI] Sovereign mode: parsing PDF locally with pdfjs-dist.');
    const text = await extractWithPdfJs(fileBlob);
    if (text && text.trim().length > 0) return text;
    throw new Error('pdfjs returned empty text (likely scanned PDF without OCR layer).');
  } catch (pdfErr) {
    console.warn('[DocumentAI] Local pdfjs parse failed, falling back to canned mock:', pdfErr);
  }

  // Tier 3: Canned mock so the UI never blocks in dev.
  return await mockDocumentAI(fileBlob);
};
