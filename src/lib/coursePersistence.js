import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';
import { createLogger } from '../utils/logger';

const log = createLogger('coursePersistence');

/**
 * Persist a course and its assessments to Supabase.
 *
 * Fire-and-forget from useIngestion and AddCourseModal.
 * Does not throw on failure (caller should .catch and log).
 *
 * Schema: courses(id, user_id, name, local_id, data JSONB, created_at, updated_at)
 * Schema: assessments(id, course_id, title, brief_text, brief_file_url, due_date, status, created_at)
 *
 * The `data` JSONB column stores extraction state so courses survive sign-out:
 * { code, tier, term, rawText (truncated), extractionData (minus rawText) }
 *
 * Returns { courseId, assessmentIds } on success.
 */
export async function persistCourseToSupabase({ name, code, tier, term, assessments, rawText, extractionData, localId }) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) { log.warn('auth check failed:', authErr.message); return null; }
  if (!user) { log.warn('no authenticated user, skipping persist'); return null; }

  // Build the data JSONB payload (everything AURA needs on reload)
  const dataPayload = {
    code: code || null,
    tier: tier || null,
    term: term || null,
  };

  // Store typed documents array if available (structured per-document data)
  if (extractionData?.documents) {
    // Cap each document's text to 3KB for JSONB size limits
    dataPayload.documents = extractionData.documents.map(d => ({
      ...d,
      text: d.text ? d.text.slice(0, 3000) : '',
    }));
  }

  // Store minimal extractionData (exclude rawText blobs, keep metadata)
  if (extractionData) {
    const { rawText: _discard, primaryRawText: _discard2, documents: _discard3, ...rest } = extractionData;
    dataPayload.extractionData = rest;
  }

  // Fallback: store truncated rawText for legacy courses without typed documents
  if (rawText && !extractionData?.documents) {
    dataPayload.rawText = rawText.slice(0, 12000);
  }

  const courseId = localId || uuidv4();
  log.info('persisting course:', courseId, 'name:', name, 'user:', user.id);
  const { data: upsertResult, error: courseErr } = await supabase.from('courses').upsert({
    id: courseId,
    user_id: user.id,
    name: name || 'Untitled Course',
    local_id: localId || courseId,
    data: dataPayload,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (courseErr) {
    log.warn('course upsert failed:', courseErr.message, courseErr.details, courseErr.hint);
    throw courseErr;
  }
  log.info('course upserted OK:', courseId);

  const assessmentIds = [];
  const briefs = Array.isArray(assessments) ? assessments : [];
  for (const brief of briefs) {
    if (!brief.title || brief.title.length < 3) continue;
    const assessId = uuidv4();
    const { error: assessErr } = await supabase.from('assessments').insert({
      id: assessId,
      course_id: courseId,
      title: brief.title,
      brief_text: brief.body || brief.briefText || null,
      due_date: brief.dueDate ? new Date(brief.dueDate).toISOString().split('T')[0] : null,
      status: 'draft',
    });
    if (assessErr && typeof console !== 'undefined') {
      log.warn('assessment insert failed:', assessErr.message);
    } else {
      assessmentIds.push(assessId);
    }
  }

  return { courseId, assessmentIds };
}
