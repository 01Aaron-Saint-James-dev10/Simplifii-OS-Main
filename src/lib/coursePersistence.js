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
 * Returns { courseId, assessmentIds } on success.
 */
export async function persistCourseToSupabase({ name, code, tier, term, assessments }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const courseId = uuidv4();
  const { error: courseErr } = await supabase.from('courses').insert({
    id: courseId,
    user_id: user.id,
    name: name || 'Untitled Course',
    code: code || null,
    tier: tier || null,
    term: term || null,
  });
  if (courseErr) throw courseErr;

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
      weight: brief.weight || null,
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
