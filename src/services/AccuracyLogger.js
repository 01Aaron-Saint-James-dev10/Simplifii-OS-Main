/**
 * AccuracyLogger.js
 *
 * Frontend logging hooks for the Accuracy System v2.
 * Handles: ingestion event logging, context snapshot capture,
 * staleness detection, and token estimation.
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Log an ingestion event with confidence scoring.
 */
export async function logIngestionEvent({
  userId,
  docId,
  docFilename,
  docType,
  extractionMethod = 'clean_pdf',
  rawTextLength = 0,
  pageCount = 0,
  pagesUsed = [],
  extractedFields = {},
  dueDate = null,
}) {
  if (!userId) return null;

  // Compute confidence per field
  const confidenceByField = {};
  const fields = ['assessmentTitle', 'rubricCriteria', 'dueDate', 'wordCount'];
  for (const field of fields) {
    if (extractedFields[field] && extractedFields[field].explicit) {
      confidenceByField[field] = 1.0;
    } else if (extractedFields[field]) {
      confidenceByField[field] = 0.5;
    } else {
      confidenceByField[field] = 0.0;
    }
  }

  // Geometric mean for overall confidence
  const values = Object.values(confidenceByField).filter(v => v > 0);
  const confidenceScore = values.length > 0
    ? Math.pow(values.reduce((p, v) => p * v, 1), 1 / values.length)
    : 0;

  // Low confidence fields
  const lowConfidenceFields = Object.entries(confidenceByField)
    .filter(([, v]) => v < 0.7)
    .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});

  // Staleness: expires 7 days before due date, or 42 days from now
  const stalenessExpiresAt = dueDate
    ? new Date(new Date(dueDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data } = await supabase.from('ingestion_events').insert({
      user_id: userId,
      doc_id: docId,
      doc_filename: docFilename,
      doc_type: docType,
      extraction_method: extractionMethod,
      raw_text_length: rawTextLength,
      page_count: pageCount,
      pages_used_for_extraction: pagesUsed,
      confidence_score: confidenceScore,
      confidence_by_field: confidenceByField,
      low_confidence_fields: lowConfidenceFields,
      extracted_fields: extractedFields,
      document_context_available: rawTextLength >= 100,
      brieftext_length: rawTextLength,
      staleness_expires_at: stalenessExpiresAt,
    }).select('id').single();
    return data?.id || null;
  } catch { return null; }
}

/**
 * Log an AURA context snapshot before an API call.
 */
export async function logContextSnapshot({
  userId,
  callId,
  sessionId,
  parentIngestionEventId = null,
  steeringDials = {},
  activeTaskId = null,
  rubricConfidence = 0,
  contextFieldsPresent = {},
  contextFieldsMissing = {},
  estimatedTokenCount = 0,
  contextTruncated = false,
  truncatedFields = [],
  brieftextLength = 0,
  documentContextAvailable = false,
}) {
  if (!userId) return;
  try {
    await supabase.from('aura_context_snapshots').insert({
      user_id: userId,
      call_id: callId,
      session_id: sessionId,
      parent_ingestion_event_id: parentIngestionEventId,
      steering_dials: steeringDials,
      active_task_id: activeTaskId,
      rubric_confidence_at_call: rubricConfidence,
      context_fields_present: contextFieldsPresent,
      context_fields_missing: contextFieldsMissing,
      estimated_token_count: estimatedTokenCount,
      context_truncated: contextTruncated,
      truncated_fields: truncatedFields,
      brieftext_length_at_call: brieftextLength,
      document_context_available: documentContextAvailable,
    });
  } catch { /* non-blocking */ }
}

/**
 * Log a response flag (learner feedback on AURA quality).
 */
export async function logResponseFlag({
  userId,
  callId,
  sessionId,
  flagCategory,
}) {
  if (!userId || !callId) return;
  try {
    await supabase.from('aura_response_flags').insert({
      user_id: userId,
      call_id: callId,
      session_id: sessionId,
      learner_flagged_wrong: true,
      flag_category: flagCategory,
      flag_timestamp: new Date().toISOString(),
    });
  } catch { /* non-blocking */ }
}

/**
 * Check if a document is stale (past its expiry).
 * @param {string} courseId
 * @param {string} userId
 * @returns {{ stale: boolean, daysOld: number }|null}
 */
export async function checkDocumentStaleness(courseId, userId) {
  if (!userId || !courseId) return null;
  try {
    const { data } = await supabase
      .from('ingestion_events')
      .select('extraction_timestamp, staleness_expires_at')
      .eq('user_id', userId)
      .eq('doc_id', courseId)
      .order('extraction_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const now = new Date();
    const expires = new Date(data.staleness_expires_at);
    const extracted = new Date(data.extraction_timestamp);
    const daysOld = Math.floor((now - extracted) / (1000 * 60 * 60 * 24));
    return { stale: now > expires, daysOld };
  } catch { return null; }
}

/**
 * Estimate token count for a system prompt + context + messages.
 * Rough heuristic: 1 token per 4 characters.
 */
export function estimateTokenCount(systemPrompt, contextJson, messagesJson) {
  const total = (systemPrompt?.length || 0) + (contextJson?.length || 0) + (messagesJson?.length || 0);
  return Math.ceil(total / 4);
}

/**
 * Detect extraction method from file characteristics.
 * @param {File} file
 * @param {string} extractedText
 * @returns {string} extraction method enum value
 */
export function detectExtractionMethod(file, extractedText) {
  if (!extractedText || extractedText.length === 0) return 'empty';

  // Check if file is likely an image (scanned PDF)
  const isImage = file?.type?.startsWith('image/');
  if (isImage) return 'ocr_image';

  // Check for high non-Latin character ratio (multilingual)
  const nonLatin = (extractedText.match(/[^\u0000-\u007F]/g) || []).length;
  if (nonLatin / extractedText.length > 0.3) return 'multilingual';

  return 'clean_pdf';
}
