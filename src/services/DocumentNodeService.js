/**
 * DocumentNodeService.js
 *
 * Typed document node extraction. Calls /api/extract-nodes with
 * a classified document and returns structured nodes (Z, XN, YN schema).
 *
 * Additive: nodes[] is stored alongside existing extractionData fields.
 * Never replaces assessmentBriefs[], rubricCriteria[], or documents[].
 */

import { createLogger } from '../utils/logger';

const log = createLogger('DocumentNodeService');

/**
 * Extract typed nodes from a classified document.
 *
 * @param {{ type: string, text: string, filename: string }} doc
 * @param {string|null} userId - for quota tracking
 * @returns {Promise<{ nodes: Array<{nodeType: string, nodeId: string, content: string|null, confidence: number}>, extractionError: boolean }>}
 */
export async function extractNodes(doc, userId = null) {
  if (!doc?.text || doc.text.length < 20) {
    return { nodes: [], extractionError: false };
  }

  // Only extract nodes for known document types
  const supportedTypes = ['brief', 'rubric', 'course_outline', 'outline'];
  const docType = doc.type || 'brief';
  if (!supportedTypes.includes(docType)) {
    return { nodes: [], extractionError: false };
  }

  try {
    const response = await fetch('/api/extract-nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: doc.text.slice(0, 4000),
        documentType: docType,
        filename: doc.filename || 'unknown',
        user_id: userId,
      }),
    });

    const data = await response.json();

    if (data.success && Array.isArray(data.nodes)) {
      log.info('Extracted', data.nodes.length, 'nodes for', docType, doc.filename);
      return { nodes: data.nodes, extractionError: false };
    }

    log.warn('Node extraction returned no nodes for', doc.filename, data.error);
    return { nodes: [], extractionError: data.extractionError || false };
  } catch (err) {
    log.warn('Node extraction failed for', doc.filename, err?.message);
    return { nodes: [], extractionError: true };
  }
}
