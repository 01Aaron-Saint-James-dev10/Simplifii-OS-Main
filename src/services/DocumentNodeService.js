/**
 * DocumentNodeService.js
 *
 * Typed document node extraction. Calls /api/extract-nodes with
 * a classified document and returns structured nodes (Z, XN, YN, QN schema).
 *
 * Additive: nodes[] is stored alongside existing extractionData fields.
 * Never replaces assessmentBriefs[], rubricCriteria[], or documents[].
 */

import { createLogger } from '../utils/logger';

const log = createLogger('DocumentNodeService');

/**
 * Split document text into chunks at natural paragraph boundaries.
 * Rubrics get a larger chunk size since they carry dense tabular data.
 */
function chunkDocument(text, maxChunkSize = 4000) {
  if (text.length <= maxChunkSize) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChunkSize) {
      chunks.push(remaining);
      break;
    }

    const slice = remaining.slice(0, maxChunkSize);
    const lastBreak = Math.max(
      slice.lastIndexOf('\n\n'),
      slice.lastIndexOf('\n'),
      slice.lastIndexOf('. ')
    );

    const cutPoint = lastBreak > maxChunkSize * 0.5
      ? lastBreak + 1
      : maxChunkSize;

    chunks.push(remaining.slice(0, cutPoint).trim());
    remaining = remaining.slice(cutPoint).trim();
  }

  return chunks;
}

/**
 * Merge nodes from multiple chunk extractions.
 * YN1/YN2: JSON array merge (parse, concat, re-stringify).
 * All others: string-concatenate content, trim to 2000 chars.
 * Takes highest confidence per nodeType across chunks.
 */
function mergeChunkNodes(chunkResults) {
  const merged = {};

  for (const nodes of chunkResults) {
    for (const node of nodes) {
      if (!merged[node.nodeType]) {
        merged[node.nodeType] = { ...node };
        continue;
      }

      const existing = merged[node.nodeType];

      // YN1 and YN2: JSON array merge
      if (node.nodeType === 'YN1' || node.nodeType === 'YN2') {
        let existingArr = null;
        let newArr = null;
        try { existingArr = JSON.parse(existing.content); } catch { /* not parseable */ }
        try { newArr = JSON.parse(node.content); } catch { /* not parseable */ }

        if (Array.isArray(existingArr) && Array.isArray(newArr)) {
          const combined = [...existingArr, ...newArr];
          existing.content = JSON.stringify(combined).slice(0, 2000);
          existing.confidence = Math.max(existing.confidence, node.confidence);
        } else if (node.confidence > existing.confidence) {
          // Fall back to highest-confidence chunk only
          merged[node.nodeType] = { ...node };
        }
        continue;
      }

      // All other nodes: string-concatenate
      if (node.content && existing.content) {
        existing.content = (existing.content + '\n' + node.content).slice(0, 2000);
        existing.confidence = Math.max(existing.confidence, node.confidence);
      } else if (node.content && !existing.content) {
        merged[node.nodeType] = { ...node };
      } else if (node.confidence > existing.confidence) {
        existing.confidence = node.confidence;
      }
    }
  }

  return Object.values(merged);
}

/**
 * Detect question type from question text using structural patterns.
 * Returns: multiple_choice | short_answer | extended_response
 */
function detectQuestionType(text, marks) {
  const lower = text.toLowerCase();
  if (/^\s*\(a\)\s|^\s*a\.\s|which of the following/i.test(text)) return 'multiple_choice';
  if (marks && marks >= 8) return 'extended_response';
  if (/discuss|evaluate|analyse|assess|explain.*detail|to what extent/i.test(lower)) return 'extended_response';
  if (marks && marks <= 3) return 'short_answer';
  return 'short_answer';
}

/**
 * Extract individual questions from exam paper text.
 * Splits on "Question N" or numbered patterns like "1." "2." at line start.
 * Returns QN-prefixed nodes (QN1, QN2, etc.).
 */
function extractExamQuestions(text) {
  const nodes = [];

  // Pattern: "Question N" headers or "N." at line start followed by content
  const questionPattern = /(?:^|\n)\s*(?:Question\s+(\d+)|(\d+)\s*[.)]\s)/gi;
  const splits = [];
  let match;

  while ((match = questionPattern.exec(text)) !== null) {
    const num = parseInt(match[1] || match[2], 10);
    splits.push({ index: match.index, number: num });
  }

  if (splits.length === 0) {
    // Fallback: treat entire text as one question block
    return [{ nodeType: 'QN1', content: text.slice(0, 2000), confidence: 0.3, question_number: 1, marks: null, question_type: 'short_answer' }];
  }

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].index;
    const end = i + 1 < splits.length ? splits[i + 1].index : text.length;
    const questionText = text.slice(start, end).trim().slice(0, 2000);
    const qNum = splits[i].number;

    // Extract marks from "(X marks)" or "(X mark)" pattern
    const marksMatch = questionText.match(/\((\d+)\s*marks?\)/i);
    const marks = marksMatch ? parseInt(marksMatch[1], 10) : null;

    const questionType = detectQuestionType(questionText, marks);

    nodes.push({
      nodeType: `QN${qNum}`,
      content: questionText,
      confidence: marks ? 0.9 : 0.6,
      question_number: qNum,
      marks,
      question_type: questionType,
    });
  }

  return nodes;
}

/**
 * Extract typed nodes from a classified document.
 *
 * @param {{ type: string, text: string, filename: string }} doc
 * @param {string|null} userId - for quota tracking
 * @returns {Promise<{ nodes: Array, extractionError: boolean, truncationWarning?: boolean, originalLength?: number, documentChunks?: number }>}
 */
export async function extractNodes(doc, userId = null) {
  if (!doc?.text || doc.text.length < 20) {
    return { nodes: [], extractionError: false };
  }

  const docType = doc.type || 'brief';

  // Exam papers: local regex extraction (no API call needed)
  if (docType === 'exam_paper') {
    const nodes = extractExamQuestions(doc.text);
    log.info('Extracted', nodes.length, 'QN nodes for exam_paper', doc.filename);
    return { nodes, extractionError: false };
  }

  const supportedTypes = ['brief', 'rubric', 'course_outline', 'outline'];
  if (!supportedTypes.includes(docType)) {
    return { nodes: [], extractionError: false };
  }

  // Rubrics get larger chunks to preserve table structure
  const maxChunk = docType === 'rubric' ? 6000 : 4000;
  const chunks = chunkDocument(doc.text, maxChunk);
  const truncated = doc.text.length > maxChunk;

  try {
    const chunkResults = [];

    for (const chunk of chunks) {
      const response = await fetch('/api/extract-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chunk,
          documentType: docType,
          filename: doc.filename || 'unknown',
          user_id: userId,
          chunkIndex: chunks.length > 1 ? chunkResults.length : undefined,
          totalChunks: chunks.length > 1 ? chunks.length : undefined,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.nodes)) {
        chunkResults.push(data.nodes);
      }
    }

    if (chunkResults.length === 0) {
      log.warn('No chunks returned nodes for', doc.filename);
      return { nodes: [], extractionError: true };
    }

    const nodes = chunks.length === 1
      ? chunkResults[0]
      : mergeChunkNodes(chunkResults);

    log.info('Extracted', nodes.length, 'nodes for', docType, doc.filename,
      chunks.length > 1 ? `(${chunks.length} chunks merged)` : '');

    const result = { nodes, extractionError: false };
    if (truncated) {
      result.truncationWarning = true;
      result.originalLength = doc.text.length;
    }
    if (chunks.length > 1) {
      result.documentChunks = chunks.length;
    }
    return result;
  } catch (err) {
    log.warn('Node extraction failed for', doc.filename, err?.message);
    return { nodes: [], extractionError: true };
  }
}
