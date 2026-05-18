import { useState, useEffect } from 'react';
import { createLogger } from '../../utils/logger';
import { mapToWorkspace, deriveRoadmapFromAssessments, extractDeepCourseData, mergeExtractionData } from '../../services/BriefService';

const log = createLogger('useIngestion');
// Dynamic import to avoid circular dependency with DocumentAIService -> UDLAuditService
const loadDocumentAI = () => import('../../services/DocumentAIService').then(m => m.processDocumentWithGCP);
// Typed node extraction (called after classification)
const loadNodeService = () => import('../../services/DocumentNodeService').then(m => m.extractNodes);
// Claude-powered structured extraction (called after pdfjs raw text extraction)
const extractStructured = async (text, filename, userId) => {
  try {
    const res = await fetch('/api/extract-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 4000), filename, user_id: userId }),
    });
    const data = await res.json();
    return data.success ? data.extraction : null;
  } catch { return null; }
};
import { fetchGroundingPdfs, listGroundingPdfs } from '../../utils/GroundingLoader';
import { listUploadedPdfs } from '../../services/IndexedDBService';
import { nameCourse, getProviderName, extractAssessmentBriefs, REASONING_START_EVENT, REASONING_END_EVENT } from '../../services/RewriteService';
import { reconcile as reconcileBriefs } from '../../services/SovereignReconciler';
import { SOVEREIGN_DATA_READY } from '../../core/Events';
import { persistCourseToSupabase } from '../../lib/coursePersistence';
import { useAuth } from '../../contexts/AuthContext';
import { logIngestionEvent, detectExtractionMethod } from '../../services/AccuracyLogger';

/**
 * useIngestion
 *
 * Owns the full PDF-to-course pipeline: file classification, unit-code grouping,
 * shadow-state draft creation, and background Ollama confirmation.
 *
 * PDF bridge point: replace processDocumentWithGCP (line ~100) with a hierarchical
 * parser or pass a real Supabase auth token once auth is wired. No UI changes needed.
 *
 * Parameters:
 *   profile                - learner profile from useProject()
 *   activeCourseId         - active course id from useProject()
 *   addCourseWithData      - course creator from useProject()
 *   upgradeCourseExtraction - in-place course upgrader from useProject()
 *   setInstitutionalData   - institutional context setter from useInstitution()
 *   onCoursesReady         - callback fired after multi-course ingest completes
 *                            (caller uses this to navigate to the gallery view)
 *
 * Returns:
 *   { handleGroupedIngest, handleIngestGrounding, ingesting, ingestStatus, groundingCount }
 */

/**
 * Classify a single document's extracted text using pattern matching.
 * Exported so CanvasScreen can use it for mid-session ingestion without
 * importing the full hook.
 * Returns one of: course_outline, brief, rubric, exam_paper, reading, unknown
 */
export function classifyDocumentText(text, filename) {
  const snippet = (text || '').slice(0, 1500);
  const nameLower = (filename || '').toLowerCase();
  // Filename hints first
  if (/outline|course[ _-]?info|unit[ _-]?guide|subject[ _-]?outline/i.test(nameLower)) return 'course_outline';
  if (/rubric|criteria|marking[ _-]?guide/i.test(nameLower)) return 'rubric';
  if (/brief|assess|task|instruction/i.test(nameLower)) return 'brief';
  if (/exam|paper|test|quiz/i.test(nameLower)) return 'exam_paper';
  // Content patterns
  if (/\b(Question\s+\d|Section\s+[I|II|III|IV|A-D]|\(\d+\s*marks?\)|\bexam\b.*\bpaper\b|HSC|VCE|QCE|WACE|ATAR)\b/i.test(snippet)) return 'exam_paper';
  // Broader exam paper signals: NESA/VCAA/QCAA cover pages, answer booklets, HSC long form
  if (/\b(HIGHER SCHOOL CERTIFICATE|NESA|VCAA|QCAA|SCSA|Board of Studies)\b/i.test(snippet)) return 'exam_paper';
  if (/\b(Multiple Choice|Extended Response|Answer Booklet|Working Space|Show your working)\b/i.test(snippet)) return 'exam_paper';
  if (/\b(marking guidelines|sample answer|marking criteria|criteria marks|awarded.*marks|band descriptions)\b/i.test(snippet)) return 'marking_guidelines';
  if (/marking.{0,20}guidelines/i.test(nameLower)) return 'marking_guidelines';
  if (/\b(criteria|band\s+[1-6]|high\s+distinction|distinction|credit|pass|fail|marking\s+guide|rubric|expected\s+qualities)\b/i.test(snippet)) return 'rubric';
  if (/\b(assessment\s+task|due\s+date|word\s+count|submission|weighting|learning\s+outcome|submit\s+via)\b/i.test(snippet)) return 'brief';
  if (/\b(course\s+outline|unit\s+guide|subject\s+description|teaching\s+staff|lecture\s+schedule|weekly\s+topic)\b/i.test(snippet)) return 'course_outline';
  if (/\b(abstract|doi:|journal|vol\.\s*\d|pp\.\s*\d|et\s+al|published\s+in)\b/i.test(snippet)) return 'reading';
  return 'unknown';
}

export function useIngestion({
  profile,
  activeCourseId,
  courses,
  addCourseWithData,
  upgradeCourseExtraction,
  setInstitutionalData,
  onCoursesReady
}) {
  const { user } = useAuth();
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  // Sprint 9.1a: groundingCount includes both baked-in and user-uploaded PDFs.
  // Baked-in count is sync; uploaded count updates via refreshGroundingCount().
  const [uploadedCount, setUploadedCount] = useState(0);
  useEffect(() => { listUploadedPdfs().then(r => setUploadedCount(r.length)).catch(() => {}); }, []);
  const groundingCount = listGroundingPdfs().length + uploadedCount;
  const refreshGroundingCount = () => {
    listUploadedPdfs().then(r => setUploadedCount(r.length)).catch(() => {});
  };

  // Ghost task filter. Discards any brief whose title is too short, starts
  // with a conjunction/preposition, matches term metadata, or is clearly
  // navigation/reading-list noise rather than a real assessment name.
  const CONJUNCTION_RE = /^(and|or|but|the|a|an|in|of|with|to|for|from|by|at|on)\b/i;
  // Term metadata that should never be a task title
  const TERM_NOISE_RE = /^(Term\s*[1-3]|Semester\s*[1-2]|Trimester\s*[1-3]|Session\s*[1-3]|T[1-3]|S[1-2]|Summer|Winter)$/i;
  // Reading list / navigation noise
  const NAV_NOISE_RE = /\b(Library holds|UNSW Library|Available at|Located at|accessed via|click here|see the|log in|visit the)\b/i;
  // Minimum 6 chars. Must contain an assessment keyword or be numbered.
  const ASSESSMENT_KW_RE = /\b(assessment|report|lab|essay|exam|quiz|practical|presentation|submission|task|assignment|project|test|review|analysis|portfolio|case study|journal|bibliography|proposal|chapter)\b/i;
  const NUMBERED_RE = /^(?:Assessment|Task|AT|Part)\s*[A-Z0-9]/i;
  const isEliteTitle = (t) => {
    if (typeof t !== 'string') return false;
    const s = t.trim();
    if (s.length < 6) return false;
    if (s.length > 80) return false;
    if (CONJUNCTION_RE.test(s)) return false;
    if (TERM_NOISE_RE.test(s)) return false;
    if (NAV_NOISE_RE.test(s)) return false;
    if (!ASSESSMENT_KW_RE.test(s) && !NUMBERED_RE.test(s)) return false;
    return true;
  };

  // Reconcile a list of candidate briefs onto canonical assessments and build
  // the standard derived state (titles, doneWhenChecklist, roadmap). Used by
  // both the shadow draft path (regex-only) and the confirmed path (regex
  // unioned with Ollama).
  const buildDerived = (candidateBriefs) => {
    const reconciledBriefs = reconcileBriefs(candidateBriefs).filter(b => isEliteTitle(b.title));
    const assessmentTitles = reconciledBriefs.map(b => b.weight ? `${b.title} (${b.weight})` : b.title);
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, 40) || 'item';
    const doneWhenChecklist = assessmentTitles.slice(0, 12).map((entry, i) => ({
      id: `assess_${i}_${slugify(entry)}`,
      text: entry,
      checked: false,
      triggerWord: entry.split(/\s+/).slice(0, 3).join(' ').toLowerCase()
    }));
    const derivedRoadmap = deriveRoadmapFromAssessments(assessmentTitles);
    return { reconciledBriefs, assessmentTitles, doneWhenChecklist, derivedRoadmap };
  };

  // Smart Handshake. Atomic create-and-fill so course name, tasks, extraction
  // data, blocks, and roadmap all land in a single new course in one transition.
  // No data leaks into the previously active course.
  //
  // Shadow State pattern: cold-load the cockpit instantly with a regex-only
  // draft roadmap so the learner never stares at a spinner. The heavy LLM
  // passes (extractAssessmentBriefs, nameCourse) run in the background and
  // upgrade the same course in place when they settle. Loading anxiety breaks
  // executive function. The shadow flag on extractionData lets downstream UI
  // mark data as DRAFT until ground truth lands.
  // Marry extracted dates to assessment briefs by proximity in the raw text.
  // If a brief title and a date appear within 300 chars of each other, pair them.
  // Falls back to positional matching when proximity fails.
  const marryDatesToBriefs = (briefs, dates, rawText) => {
    if (!dates || dates.length === 0 || !rawText) return briefs;
    const norm = rawText.replace(/\s+/g, ' ');
    // Only use absolute dates with a parsed value for the dueDate field
    const usable = dates.filter(d => d && d.parsed && d.type === 'absolute');
    if (usable.length === 0) return briefs;

    const assigned = new Set();
    const result = briefs.map(b => {
      const titleIdx = norm.toLowerCase().indexOf(b.title.toLowerCase());
      if (titleIdx === -1) return b;
      // Find the closest unassigned date within 300 chars
      let bestDist = Infinity;
      let bestDate = null;
      let bestIdx = -1;
      for (let i = 0; i < usable.length; i++) {
        if (assigned.has(i)) continue;
        const dateIdx = norm.toLowerCase().indexOf(usable[i].raw.toLowerCase());
        if (dateIdx === -1) continue;
        const dist = Math.abs(dateIdx - titleIdx);
        if (dist < bestDist && dist < 300) {
          bestDist = dist;
          bestDate = usable[i];
          bestIdx = i;
        }
      }
      if (bestDate && bestIdx >= 0) {
        assigned.add(bestIdx);
        return { ...b, dueDate: bestDate.parsed.toISOString() };
      }
      return b;
    });

    // Fallback: if N briefs and N usable dates and some unassigned, marry in order
    const unmatched = result.filter(b => !b.dueDate);
    const unusedDates = usable.filter((_, i) => !assigned.has(i));
    if (unmatched.length > 0 && unusedDates.length > 0) {
      let di = 0;
      return result.map(b => {
        if (!b.dueDate && di < unusedDates.length) {
          return { ...b, dueDate: unusedDates[di++].parsed.toISOString() };
        }
        return b;
      });
    }
    return result;
  };

  const handleSprintCreation = async (data) => {
    const regexTitles = Array.isArray(data.assessmentTitles) ? data.assessmentTitles.slice() : [];
    const extractedDates = Array.isArray(data.assessmentDates) ? data.assessmentDates : [];
    const rawText = data.rawText || '';
    const regexCandidateBriefs = regexTitles
      .map(t => String(t || '').trim())
      .filter(t => t.length >= 4)
      .map(t => {
        const stem = t.replace(/\s*\(\d+%\)\s*$/, '').trim();
        const weightMatch = t.match(/\((\d+%)\)/);
        return { title: stem, weight: weightMatch ? weightMatch[1] : '', wordCountGoal: 0, dueDate: null, source: 'brief' };
      });
    // Marry dates to briefs before reconciliation
    const datedBriefs = marryDatesToBriefs(regexCandidateBriefs, extractedDates, rawText);

    const draft = buildDerived(datedBriefs);
    const draftFirst = draft.assessmentTitles[0];
    const cleanCode = (data.unitCode && data.unitCode !== 'UNTITLED') ? data.unitCode : null;
    const examFallback = data.documentType === 'exam_paper' ? 'Past Exam Paper' : 'Course Brief';
    const draftTaskName = draftFirst || cleanCode || examFallback;
    const draftTask = { course: data.unitCode || 'Extracted', task: draftTaskName, level: data.level, rawText: data.rawText };
    const generatedBlocks = mapToWorkspace(data.rawText || '', data.level || 'Tertiary');
    // Write raw text to localStorage so AuraHUD's Sovereign Format Import button
    // has content to transform. Written once per ingest; overwritten if the
    // student imports a newer document in the same session.
    try { if (data.rawText) localStorage.setItem('simplifii_last_raw_text', data.rawText); } catch { /* storage unavailable */ }
    const draftName = (data.unitCode && data.unitCode !== 'UNTITLED') ? data.unitCode : 'Tap to name this';

    setInstitutionalData({
      learningOutcomes: data.learningOutcomes || [],
      referencingStyle: data.referencingStyle || null,
      rubricCriteria: data.rubricCriteria || []
    });

    const draftPayload = {
      tasks: [draftTask],
      activeTask: draftTask,
      extractionData: { ...data, assessmentTitles: draft.assessmentTitles, assessmentBriefs: draft.reconciledBriefs, doneWhenChecklist: draft.doneWhenChecklist, shadow: true },
      project: { blocks: generatedBlocks }
    };
    if (draft.derivedRoadmap) draftPayload.roadmap = draft.derivedRoadmap;
    // Term: use extracted term, fall back to active term, else null
    draftPayload.term = data.term || null;

    // Dedup: if a course with the same code already exists, upgrade it
    // instead of creating a duplicate. Match by code field OR name.
    const existingId = Object.entries(courses || {}).find(([, c]) => {
      const existingCode = (c.code || c.name || '').toUpperCase().trim();
      const incomingCode = (data.unitCode || draftName).toUpperCase().trim();
      return existingCode === incomingCode || (c.name || '').toUpperCase().trim() === draftName.toUpperCase().trim();
    })?.[0];

    let courseId;
    if (existingId) {
      upgradeCourseExtraction(existingId, draftPayload);
      courseId = existingId;
    } else {
      courseId = addCourseWithData(draftName, draftPayload);
    }

    // Persist to Supabase (fire-and-forget, does not block the UI).
    // Writes course + assessments rows so data survives across browsers.
    persistCourseToSupabase({
      name: draftName,
      code: data.unitCode || null,
      tier: data.level || null,
      term: data.term?.label || data.term?.code || null,
      assessments: draft.reconciledBriefs,
      rawText: data.rawText || null,
      extractionData: draftPayload.extractionData || null,
      localId: courseId,
    }).catch(err => {
      log.warn(' Supabase persist failed:', err?.message);
    });

    // Background: run Ollama extraction and nameCourse in parallel, then
    // upgrade the course in place. The learner keeps interacting with the
    // draft state during this window. If both LLM calls fail the draft
    // remains as-is with no destructive overwrite.
    if (data?.rawText && data.rawText.trim().length > 200 && getProviderName() === 'ollama') {
      window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
      // Sprint 8.1: extended sweep. In addition to names, weights, and due
      // dates, the model now looks for the topic/prompt menu (availableTopics)
      // and High Distinction marking criteria (hdCriteria) in rubric tables.
      const extractionFocus = 'Focus: Extract Assessment names, Weightings, Due Dates, available Topic choices or Prompts students can select from (if listed), and High Distinction marking criteria from any rubric tables (if present). Ignore unit policies, contact details, and reading lists.\n\n';
      // Sprint 5.0: send only the primary file text (course outline/syllabus)
      // to the extractor. Sending the full merged blob causes attention dilution
      // when 8-16 secondary files are concatenated. The outline is always first
      // in the merge order (classifyGroundingFile=0) and carries the canonical
      // assessment table. Secondary text still reaches workspace block generation
      // via data.rawText below.
      const briefsPromise = extractAssessmentBriefs(extractionFocus + (data.primaryRawText || data.rawText))
        .catch(err => { log.warn(' Ollama extraction error:', err.message); return []; });
      const namePromise = nameCourse(data.rawText)
        .catch(err => { log.warn(' nameCourse failed:', err.message); return null; });

      try {
        const [llmBriefs, derivedName] = await Promise.all([briefsPromise, namePromise]);
        const candidateBriefs = [
          ...llmBriefs.map(b => ({ ...b, source: b.source || 'outline' })),
          ...datedBriefs
        ];
        const datedCandidates = marryDatesToBriefs(candidateBriefs, extractedDates, rawText);
        const confirmed = buildDerived(datedCandidates);
        const conflictCount = confirmed.reconciledBriefs.reduce((n, b) => n + ((b.reconciled?.conflicts?.length) || 0), 0);
        if (typeof console !== 'undefined') {
          log.info('confirmed extraction:', confirmed.reconciledBriefs.length, 'canonical assessments (', conflictCount, 'conflicts resolved)');
        }
        const confirmedFirst = confirmed.assessmentTitles[0];
        const confirmedTask = { course: data.unitCode || 'Extracted', task: confirmedFirst || draftTaskName, level: data.level, rawText: data.rawText };
        // Sprint 8.5a: prevent title bleed. When the unit code is a valid 4+4
        // course code, prefix it so each course card is visually distinct even
        // when nameCourse returns the same string for sibling units.
        let resolvedName;
        if (derivedName && derivedName !== 'New Course') {
          const code = (data.unitCode || '').toUpperCase();
          const alreadyPrefixed = derivedName.toUpperCase().startsWith(code);
          resolvedName = code && !alreadyPrefixed ? `${code} ${derivedName}` : derivedName;
        }
        upgradeCourseExtraction(courseId, {
          name: resolvedName || undefined,
          tasks: [confirmedTask],
          activeTask: confirmedTask,
          // Sprint 8.5b: carry forward udlScore, udlPrinciples, udlRequirements,
          // and temporalMap from the regex-derived draft. The LLM confirmation
          // only produces assessmentTitles/Briefs/checklist; the shallow merge
          // in upgradeCourseExtraction would wipe these fields without this.
          extractionData: {
            udlScore: data.udlScore,
            udlPrinciples: data.udlPrinciples,
            udlRequirements: data.udlRequirements,
            temporalMap: data.temporalMap,
            assessmentTitles: confirmed.assessmentTitles,
            assessmentBriefs: confirmed.reconciledBriefs,
            doneWhenChecklist: confirmed.doneWhenChecklist,
            shadow: false
          },
          roadmap: confirmed.derivedRoadmap || undefined
        });
        window.dispatchEvent(new CustomEvent(SOVEREIGN_DATA_READY, { detail: { courseId } }));
        const greetingName = derivedName && derivedName !== 'New Course' ? derivedName : (data.unitCode || 'this course');
        const count = confirmed.assessmentTitles.length;
        let greeting;
        const hasParetoLitReview = confirmed.derivedRoadmap?.paretoSteps &&
          confirmed.assessmentTitles.some(t => /literature review/i.test(t));
        if (hasParetoLitReview) {
          greeting = `I've grounded your ${greetingName} Literature Review. We have 25 marks on the line: should we start with Step 1 (Locking your Topic)?`;
        } else if (count === 0) {
          greeting = `Course ${greetingName} confirmed. No assessments detected. Drop a fuller syllabus to unlock the roadmap.`;
        } else if (count === 1) {
          greeting = `Course ${greetingName} confirmed. One pillar mapped.`;
        } else {
          greeting = `Course ${greetingName} confirmed. ${count} pillars mapped.`;
        }
      } finally {
        window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      }
    } else {
      // Cloud path: Ollama is not available, but our serverless endpoints are.
      // Call classify-document and generate-sections in parallel so the panels
      // get accurate, content-specific data instead of generic scaffolding.
      // Fire-and-forget pattern: the shadow draft is visible immediately; this
      // background pass upgrades it in place when both calls resolve.
      (async () => {
        const userId = user?.id || null;
        const bodyText = rawText.slice(0, 4000);
        const shortText = rawText.slice(0, 1500);
        const wordCount = data.words || 2000;

        try {
          const [classifyRes, sectionsRes] = await Promise.allSettled([
            fetch('/api/classify-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ textSnippet: shortText, user_id: userId }),
            }).then(r => r.json()).catch(() => null),

            fetch('/api/generate-sections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                briefText: bodyText,
                assessmentTitle: draftTaskName,
                assessmentType: data.documentType || '',
                tier: data.level || 'tertiary',
                wordCount,
                user_id: userId,
              }),
            }).then(r => r.json()).catch(() => null),
          ]);

          const classifyData = classifyRes.value || {};
          const documentType = classifyData.type || null;
          const aiSections = sectionsRes.value?.sections?.length > 0
            ? sectionsRes.value.sections
            : null;

          // Notify HomeScreen so it can show the classification modal immediately
          if (documentType && documentType !== 'unknown') {
            window.dispatchEvent(new CustomEvent('simplifii:document-classified', {
              detail: {
                courseId,
                type: documentType,
                confidence: classifyData.confidence || 0.5,
                suggested_actions: classifyData.suggested_actions || [],
              },
            }));
          }

          // Enrich the first brief with a body so the canvas tools (BriefPanel,
          // TutorPanel, DecodePanel) have real content to work with. Without a
          // body, briefOrText in CanvasScreen collapses to just the title, and
          // every tool returns generic output.
          const enrichedBriefs = draft.reconciledBriefs.map((b, i) => ({
            ...b,
            body: i === 0 && !b.body ? rawText.slice(0, 5000) : (b.body || ''),
          }));
          // If regex found no briefs at all, synthesise one from the task name
          // so the canvas always has at least one addressable brief.
          const finalBriefs = enrichedBriefs.length > 0
            ? enrichedBriefs
            : [{ id: 'auto_0', title: draftTaskName, body: rawText.slice(0, 5000), wordCountGoal: wordCount, dueDate: null, weight: '', source: 'inferred' }];

          upgradeCourseExtraction(courseId, {
            extractionData: {
              shadow: false,
              ...(documentType ? { documentType } : {}),
              ...(aiSections ? { aiSections } : {}),
              assessmentBriefs: finalBriefs,
            },
          });

          // Sprint 5: generate task sequence for the primary assessment.
          // Fire-and-forget. Uses XN1 typed node if available, falls back
          // to the enriched brief body and rubric criteria from the document.
          (async () => {
            try {
              const xn1 = (data.nodes || []).find(n => n.nodeType === 'XN1' && n.content);
              const yn1 = (data.nodes || []).find(n => n.nodeType === 'YN1' && n.content);
              const briefForSeq = xn1?.content || finalBriefs[0]?.body || rawText.slice(0, 4000);
              const rubricForSeq = yn1?.content || (data.rubricCriteria || []).join('\n');
              if (briefForSeq && briefForSeq.length > 50) {
                const seqRes = await fetch('/api/generate-task-sequence', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    briefText: briefForSeq.slice(0, 4000),
                    rubricText: rubricForSeq.slice(0, 3000),
                    assessmentTitle: draftTaskName,
                    tier: data.level || 'tertiary',
                    user_id: userId,
                  }),
                }).then(r => r.json()).catch(() => null);
                if (seqRes?.success && seqRes.taskSequence) {
                  upgradeCourseExtraction(courseId, {
                    extractionData: { taskSequence: seqRes.taskSequence },
                  });
                }
              }
            } catch { /* non-blocking */ }
          })();
        } catch (err) {
          log.warn(' cloud enhancement failed:', err?.message);
          upgradeCourseExtraction(courseId, { extractionData: { shadow: false } });
        }

        window.dispatchEvent(new CustomEvent(SOVEREIGN_DATA_READY, { detail: { courseId } }));
      })();
    }
    return courseId;
  };

  // Split aggregated ingest data by unit code prefix so each course code gets
  // its own cockpit entry. Detects codes like BABS1201, MATH1131, etc. from
  // sourceFiles. Files without a recognisable code go into the fallback group
  // keyed by the profile unit code.
  const handleGroupedIngest = async (data) => {
    const files = data.sourceFiles || [];
    if (files.length === 0) return handleSprintCreation(data);

    const codeRegex = /\b([A-Za-z]{3,4}\d{4})\b/;
    const groups = {};
    for (const name of files) {
      const match = name.match(codeRegex);
      const code = (match ? match[1] : (data.unitCode || 'General')).toUpperCase().trim();
      if (!groups[code]) groups[code] = [];
      groups[code].push(name);
    }

    const codes = Object.keys(groups);
    if (codes.length <= 1) return handleSprintCreation(data);

    const uploadForSubset = (names) =>
      (data.sourceUploads || []).filter((u) => names.includes(u.name));

    for (const code of codes) {
      const groupList = groups[code];
      const subset = {
        ...data,
        unitCode: code,
        sourceFiles: groupList,
        sourceUploads: uploadForSubset(groupList)
      };
      await handleSprintCreation(subset);
    }

    if (onCoursesReady) onCoursesReady();
  };

  // Sprint 8.4: fix 8.3 regression. \b fails after digits when followed by
  // underscore (word char), so CO_BABS1201_1_2025*.pdf matched nothing.
  // Negative lookahead (?!\d) rejects a 5th digit but allows _, ., -, or EOF.
  const COURSE_CODE_RE = /([A-Z]{4}\d{4})(?!\d)/i;

  // Classify a grounding file by document type so the extractor sees documents
  // in CourseCode > Outline > Brief > Rubric order. Files whose name contains
  // a valid course code are anchored at priority -1 (highest) so the unit code
  // grouper sees the canonical name before the outline's classification kicks in.
  const classifyGroundingFile = (file) => {
    const n = (file.name || '');
    if (COURSE_CODE_RE.test(n)) return -1;
    const nl = n.toLowerCase();
    if (/outline|course[ _-]?info|co[_-]/i.test(nl)) return 0;
    if (/brief|assess|task|instruction/i.test(nl)) return 1;
    if (/rubric|criteria|marking/i.test(nl)) return 2;
    return 3;
  };

  // Sprint 8.1 Sovereign Translator: Context Isolation Guard. Clears all
  // transient extraction state before a new ingest run so context from a
  // previous course does not bleed into the current one. Also dispatches
  // simplifii:purge-context so LinearCanvas can reset selectedTopic.
  const purgeTransientContext = () => {
    try { window.localStorage.removeItem('simplifii_last_raw_text'); } catch { /* storage unavailable */ }
    window.dispatchEvent(new CustomEvent('simplifii:purge-context'));
  };

  // Ingest every PDF in /src/grounding/active/. Groups files by unit code
  // before extraction so each code gets its own cockpit entry.
  //
  // PDF bridge point: processDocumentWithGCP call below uses a mock JWT.
  // Replace the token argument with a real Supabase session token once
  // auth is wired (src/lib/supabaseClient.js).
  const handleIngestGrounding = async () => {
    if (ingesting) return;
    setIngesting(true);
    purgeTransientContext();
    setIngestStatus('Locating grounding folder...');
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
    try {
      const files = (await fetchGroundingPdfs()).sort((a, b) => classifyGroundingFile(a) - classifyGroundingFile(b));
      if (files.length === 0) {
        setIngestStatus('Nothing in /src/grounding/active/.');
        log.warn(' no PDFs returned by GroundingLoader');
        return;
      }

      const codeRegex = COURSE_CODE_RE;
      const fileGroups = {};
      for (const file of files) {
        const match = (file.name || '').match(codeRegex);
        const code = (match ? match[1] : (profile.courseName || 'Unknown')).toUpperCase().trim();
        if (!fileGroups[code]) fileGroups[code] = [];
        fileGroups[code].push(file);
      }

      // Sprint 8.3: removed hardcoded BABS1201 sort. Alphabetical order is
      // deterministic and the last-processed code becomes the active course.
      const codes = Object.keys(fileGroups).sort((a, b) => a.localeCompare(b));

      log.info(' detected', codes.length, 'unit groups:', codes.join(', '));

      for (const code of codes) {
        const groupFiles = fileGroups[code];
        let aggregated = {
          unitCode: code.toUpperCase().trim(),
          level: profile.level,
          theme: 'General',
          sourceFiles: groupFiles.map(f => f.name)
        };
        // Sprint 5.0: primary isolation. Files are sorted outline-first
        // (classifyGroundingFile returns 0 for outlines/syllabi). The first
        // successfully-read file becomes the primary extraction anchor sent
        // to Ollama. All files contribute to rawText for block generation,
        // but Ollama only sees the primary to avoid attention dilution.
        let primaryRawText = null;
        for (let i = 0; i < groupFiles.length; i++) {
          const file = groupFiles[i];
          setIngestStatus(`Scanning ${code}: ${file.name}`);
          log.info(' processing', file.name, 'group=', code, 'class=', classifyGroundingFile(file));
          try {
            const processDocument = await loadDocumentAI();
            const text = await processDocument(file);
            const deepData = extractDeepCourseData(text);
            aggregated = mergeExtractionData(aggregated, { ...deepData, rawText: text });
            if (primaryRawText === null) primaryRawText = text;
          } catch (err) {
            log.warn(' skipped', file.name, err && err.message);
          }
        }
        if (primaryRawText) aggregated.primaryRawText = primaryRawText;
        setIngestStatus(`Creating ${code} cockpit...`);
        await handleSprintCreation(aggregated);
      }

      setIngestStatus(`Ingested ${files.length} file${files.length === 1 ? '' : 's'} across ${codes.length} course${codes.length === 1 ? '' : 's'}.`);
    } catch (err) {
      log.error(' failed', err);
      setIngestStatus(`Ingestion failed: ${err && err.message ? err.message : 'unknown error'}`);
    } finally {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      setIngesting(false);
      setTimeout(() => setIngestStatus(''), 6000);
    }
  };

  // classifyText is defined at module level (exported below) so it can be
  // called by CanvasScreen mid-session ingest without importing the full hook.
  const classifyText = classifyDocumentText;

  // Ingest user-uploaded PDF Files from a file picker.
  // INGESTION CONTRACT: Each file is classified individually. Documents are
  // stored typed (not merged into one rawText blob). AURA receives structured
  // context per document type.
  const handleUploadedFiles = async (fileList) => {
    if (ingesting || !fileList || fileList.length === 0) return;
    setIngesting(true);
    purgeTransientContext();
    setIngestStatus('Reading uploaded files...');
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
    try {
      const sorted = [...fileList].sort((a, b) => classifyGroundingFile(a) - classifyGroundingFile(b));

      const codeRegex = COURSE_CODE_RE;
      const fileGroups = {};
      for (const file of sorted) {
        const match = (file.name || '').match(codeRegex);
        const code = (match ? match[1] : 'Untitled').toUpperCase().trim();
        if (!fileGroups[code]) fileGroups[code] = [];
        fileGroups[code].push(file);
      }

      const codes = Object.keys(fileGroups).sort((a, b) => a.localeCompare(b));
      let lastCourseId = null;

      for (const code of codes) {
        const groupFiles = fileGroups[code];
        let resolvedCode = code;

        // Per-file extraction and classification (INGESTION CONTRACT)
        const typedDocuments = []; // { type, filename, text, deepData }
        let primaryRawText = null;

        for (const file of groupFiles) {
          setIngestStatus(`Extracting ${file.name}...`);
          try {
            const processDocument = await loadDocumentAI();
            const text = await processDocument(file);
            if (!text || text.trim().length === 0) continue;

            // Try to find course code in content if filename had none
            if (resolvedCode === 'UNTITLED' && text) {
              const contentMatch = text.match(COURSE_CODE_RE);
              if (contentMatch) {
                resolvedCode = contentMatch[1].toUpperCase();
              }
            }

            // Classify this specific document (pattern matching first)
            const docType = classifyText(text, file.name);
            const deepData = extractDeepCourseData(text);

            // Claude structured extraction (enriches regex-based deepData)
            const claudeExtraction = await extractStructured(text, file.name, user?.id).catch(() => null);
            if (claudeExtraction) {
              // Use Claude's extraction to fill gaps in regex-based deepData
              if (claudeExtraction.courseCode && resolvedCode === 'UNTITLED') resolvedCode = claudeExtraction.courseCode.toUpperCase();
              if (claudeExtraction.assessmentTitle && !deepData.assessmentTitle) deepData.assessmentTitle = claudeExtraction.assessmentTitle;
              if (claudeExtraction.weight && !deepData.weighting) deepData.weighting = claudeExtraction.weight;
              if (claudeExtraction.dueDate && !deepData.assessmentDates?.length) deepData.assessmentDates = [{ raw: claudeExtraction.dueDate, parsed: new Date(claudeExtraction.dueDate), type: 'absolute' }];
              if (claudeExtraction.wordCount && !deepData.words) deepData.words = claudeExtraction.wordCount;
              if (claudeExtraction.rubricCriteria?.length > 0 && !deepData.rubricCriteria?.length) deepData.rubricCriteria = claudeExtraction.rubricCriteria;
              if (claudeExtraction.documentType) deepData.documentType = claudeExtraction.documentType;
              if (claudeExtraction.courseName) deepData.courseName = claudeExtraction.courseName;
              if (claudeExtraction.aiPermission) deepData.aiPermission = claudeExtraction.aiPermission;
            }

            // Typed node extraction (XN, YN, Z schema)
            const resolvedDocType = claudeExtraction?.documentType || docType;
            let docNodes = [];
            try {
              const extractNodesFn = await loadNodeService();
              const nodeResult = await extractNodesFn({ type: resolvedDocType, text, filename: file.name }, user?.id);
              if (nodeResult.nodes?.length > 0) docNodes = nodeResult.nodes;
            } catch { /* node extraction failed, non-blocking */ }

            typedDocuments.push({
              type: resolvedDocType,
              filename: file.name,
              text: text,
              deepData: deepData,
              nodes: docNodes,
            });

            if (primaryRawText === null) primaryRawText = text;

            // Log ingestion event
            if (user?.id) {
              logIngestionEvent({
                userId: user.id,
                docId: resolvedCode,
                docFilename: file.name,
                docType: docType,
                extractionMethod: detectExtractionMethod(file, text),
                rawTextLength: text?.length || 0,
                extractedFields: {
                  assessmentTitle: deepData.assessmentTitle ? { explicit: true } : null,
                  rubricCriteria: deepData.rubricCriteria?.length > 0 ? { explicit: true } : null,
                  dueDate: deepData.dueDate ? { explicit: true } : null,
                  wordCount: deepData.wordCount ? { explicit: true } : null,
                },
                dueDate: deepData.dueDate || null,
              }).catch(() => {});
            }
          } catch (err) {
            log.warn(' skipped', file.name, err && err.message);
          }
        }

        if (typedDocuments.length === 0) continue;

        // Build structured extraction data from typed documents (not a merged blob)
        const outlineDocs = typedDocuments.filter(d => d.type === 'course_outline');
        const briefDocs = typedDocuments.filter(d => d.type === 'brief');
        const rubricDocs = typedDocuments.filter(d => d.type === 'rubric');
        const examDocs = typedDocuments.filter(d => d.type === 'exam_paper');
        const readingDocs = typedDocuments.filter(d => d.type === 'reading');
        const unknownDocs = typedDocuments.filter(d => d.type === 'unknown');

        // Merge deep data from all documents (for assessment titles, dates, etc.)
        let aggregated = { unitCode: resolvedCode, level: profile.level, theme: 'General', sourceFiles: groupFiles.map(f => f.name) };
        for (const doc of typedDocuments) {
          aggregated = mergeExtractionData(aggregated, { ...doc.deepData, rawText: doc.text });
        }
        if (primaryRawText) aggregated.primaryRawText = primaryRawText;

        // Store typed documents array so AURA can read structured context
        aggregated.documents = typedDocuments.map(d => ({
          type: d.type,
          filename: d.filename,
          text: d.text.slice(0, 5000), // Cap per-doc to 5KB for storage
          title: d.deepData.assessmentTitle || d.deepData.courseName || d.filename,
          rubricCriteria: d.deepData.rubricCriteria || [],
          rubricBands: d.deepData.rubricBands || [],
          words: d.deepData.words || 0,
          weighting: d.deepData.weighting || 0,
          dueDate: d.deepData.assessmentDates?.[0]?.parsed?.toISOString() || null,
          nodes: d.nodes || [],
        }));

        // Aggregate all nodes across documents for course-level access
        aggregated.nodes = typedDocuments.flatMap(d => d.nodes || []);

        // Document type for the course (most important document's type)
        if (examDocs.length > 0) aggregated.documentType = 'exam_paper';
        else if (briefDocs.length > 0) aggregated.documentType = 'brief';
        else if (rubricDocs.length > 0) aggregated.documentType = 'rubric';
        else if (outlineDocs.length > 0) aggregated.documentType = 'course_outline';

        setIngestStatus(`Creating ${resolvedCode} cockpit...`);
        lastCourseId = await handleSprintCreation(aggregated);
      }

      setIngestStatus(`Ingested ${sorted.length} file${sorted.length === 1 ? '' : 's'} across ${codes.length} course${codes.length === 1 ? '' : 's'}.`);
      if (onCoursesReady) onCoursesReady(lastCourseId);
    } catch (err) {
      log.error(' failed', err);
      setIngestStatus(`Upload failed: ${err && err.message ? err.message : 'unknown error'}`);
    } finally {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      setIngesting(false);
      setTimeout(() => setIngestStatus(''), 6000);
    }
  };

  return { handleGroupedIngest, handleUploadedFiles, handleIngestGrounding, ingesting, ingestStatus, groundingCount, refreshGroundingCount };
}
