import { useState } from 'react';
import { mapToWorkspace, deriveRoadmapFromAssessments, extractDeepCourseData, mergeExtractionData } from '../../services/BriefService';
import { processDocumentWithGCP } from '../../services/DocumentAIService';
import { fetchGroundingPdfs, listGroundingPdfs } from '../../utils/GroundingLoader';
import { nameCourse, getProviderName, extractAssessmentBriefs, REASONING_START_EVENT, REASONING_END_EVENT } from '../../services/RewriteService';
import { reconcile as reconcileBriefs } from '../../services/SovereignReconciler';
import { speakSystemMessage } from '../../services/MessagingHub';
import { SOVEREIGN_DATA_READY } from '../../core/Events';

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
export function useIngestion({
  profile,
  activeCourseId,
  addCourseWithData,
  upgradeCourseExtraction,
  setInstitutionalData,
  onCoursesReady
}) {
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const groundingCount = listGroundingPdfs().length;

  // Ghost task filter. Discards any brief whose title is too short or starts
  // with a conjunction/preposition -- both are symptoms of the text-level
  // rescue regex grabbing mid-sentence fragments rather than real assessment
  // names. Applied inside buildDerived so it gates EVERY source (regex +
  // Ollama JSON + text-rescue) in a single pass.
  const CONJUNCTION_RE = /^(and|or|but|the|a|an|in|of|with|to|for|from|by|at|on)\b/i;
  const isEliteTitle = (t) => typeof t === 'string' && t.trim().length >= 5 && !CONJUNCTION_RE.test(t.trim());

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
  const handleSprintCreation = async (data) => {
    const regexTitles = Array.isArray(data.assessmentTitles) ? data.assessmentTitles.slice() : [];
    const regexCandidateBriefs = regexTitles
      .map(t => String(t || '').trim())
      .filter(t => t.length >= 4)
      .map(t => {
        const stem = t.replace(/\s*\(\d+%\)\s*$/, '').trim();
        const weightMatch = t.match(/\((\d+%)\)/);
        return { title: stem, weight: weightMatch ? weightMatch[1] : '', wordCountGoal: 0, dueDate: '', source: 'brief' };
      });

    const draft = buildDerived(regexCandidateBriefs);
    const draftFirst = draft.assessmentTitles[0];
    const draftTaskName = draftFirst || data.unitCode || 'Course Brief';
    const draftTask = { course: data.unitCode || 'Extracted', task: draftTaskName, level: data.level, rawText: data.rawText };
    const generatedBlocks = mapToWorkspace(data.rawText || '', data.level || 'Tertiary');
    // Write raw text to localStorage so AuraHUD's Sovereign Format Import button
    // has content to transform. Written once per ingest; overwritten if the
    // student imports a newer document in the same session.
    try { if (data.rawText) localStorage.setItem('simplifii_last_raw_text', data.rawText); } catch { /* storage unavailable */ }
    const draftName = data.unitCode || 'New Course';

    setInstitutionalData({
      learningOutcomes: data.learningOutcomes || [],
      referencingStyle: data.referencingStyle || 'Harvard',
      rubricCriteria: data.rubricCriteria || []
    });

    const draftPayload = {
      tasks: [draftTask],
      activeTask: draftTask,
      extractionData: { ...data, assessmentTitles: draft.assessmentTitles, assessmentBriefs: draft.reconciledBriefs, doneWhenChecklist: draft.doneWhenChecklist, shadow: true },
      project: { blocks: generatedBlocks }
    };
    if (draft.derivedRoadmap) draftPayload.roadmap = draft.derivedRoadmap;

    const courseId = addCourseWithData(draftName, draftPayload);

    speakSystemMessage(
      draft.assessmentTitles.length > 0
        ? `Draft roadmap ready. ${draft.assessmentTitles.length} pillars detected. Refining in the background.`
        : 'Draft cockpit ready. Refining the syllabus in the background.',
      `${draftName} draft ready.`
    );

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
        .catch(err => { if (typeof console !== 'undefined') console.warn('[handleSprintCreation] Ollama extraction error:', err.message); return []; });
      const namePromise = nameCourse(data.rawText)
        .catch(err => { if (typeof console !== 'undefined') console.warn('[handleSprintCreation] nameCourse failed:', err.message); return null; });

      try {
        const [llmBriefs, derivedName] = await Promise.all([briefsPromise, namePromise]);
        const candidateBriefs = [
          ...llmBriefs.map(b => ({ ...b, source: b.source || 'outline' })),
          ...regexCandidateBriefs
        ];
        const confirmed = buildDerived(candidateBriefs);
        const conflictCount = confirmed.reconciledBriefs.reduce((n, b) => n + ((b.reconciled?.conflicts?.length) || 0), 0);
        if (typeof console !== 'undefined') {
          console.info('[handleSprintCreation] confirmed extraction:', confirmed.reconciledBriefs.length, 'canonical assessments (', conflictCount, 'conflicts resolved)');
        }
        const confirmedFirst = confirmed.assessmentTitles[0];
        const confirmedTask = { course: data.unitCode || 'Extracted', task: confirmedFirst || draftTaskName, level: data.level, rawText: data.rawText };
        upgradeCourseExtraction(courseId, {
          name: derivedName && derivedName !== 'New Course' ? derivedName : undefined,
          tasks: [confirmedTask],
          activeTask: confirmedTask,
          extractionData: {
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
        speakSystemMessage(greeting, `${greetingName} confirmed.`);
      } finally {
        window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      }
    } else {
      // No LLM available: clear the shadow flag so the draft is treated as
      // final. The learner gets the same regex roadmap without a perpetual
      // DRAFT badge.
      upgradeCourseExtraction(courseId, { extractionData: { shadow: false } });
      window.dispatchEvent(new CustomEvent(SOVEREIGN_DATA_READY, { detail: { courseId } }));
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

  // Sprint 8.2: Pillar Re-Architecture. Exactly 4 uppercase letters followed
  // by exactly 4 digits (e.g. BABS1201, COMP3900). Case-insensitive for
  // file-system edge cases (e.g. babs1201_outline.pdf still matches).
  const COURSE_CODE_RE = /\b([A-Z]{4}\d{4})\b/i;

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
        if (typeof console !== 'undefined') console.warn('[handleIngestGrounding] no PDFs returned by GroundingLoader');
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

      // Sort codes so BABS1201 is processed last and becomes the active
      // course (addCourseWithData sets activeCourseId on each call; last wins).
      const codes = Object.keys(fileGroups).sort((a, b) => {
        if (a === 'BABS1201') return 1;
        if (b === 'BABS1201') return -1;
        return a.localeCompare(b);
      });

      if (typeof console !== 'undefined') console.info('[handleIngestGrounding] detected', codes.length, 'unit groups:', codes.join(', '));

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
          if (typeof console !== 'undefined') console.info('[handleIngestGrounding] processing', file.name, 'group=', code, 'class=', classifyGroundingFile(file));
          try {
            // PDF bridge: swap mock_jwt_token_xyz123 for a real Supabase
            // session token once src/lib/supabaseClient.js auth is complete.
            const text = await processDocumentWithGCP(file, 'mock_jwt_token_xyz123');
            const deepData = extractDeepCourseData(text);
            aggregated = mergeExtractionData(aggregated, { ...deepData, rawText: text });
            if (primaryRawText === null) primaryRawText = text;
          } catch (err) {
            if (typeof console !== 'undefined') console.warn('[handleIngestGrounding] skipped', file.name, err && err.message);
          }
        }
        if (primaryRawText) aggregated.primaryRawText = primaryRawText;
        setIngestStatus(`Creating ${code} cockpit...`);
        await handleSprintCreation(aggregated);
      }

      setIngestStatus(`Ingested ${files.length} file${files.length === 1 ? '' : 's'} across ${codes.length} course${codes.length === 1 ? '' : 's'}.`);
    } catch (err) {
      if (typeof console !== 'undefined') console.error('[handleIngestGrounding] failed', err);
      setIngestStatus(`Ingestion failed: ${err && err.message ? err.message : 'unknown error'}`);
    } finally {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      setIngesting(false);
      setTimeout(() => setIngestStatus(''), 6000);
    }
  };

  return { handleGroupedIngest, handleIngestGrounding, ingesting, ingestStatus, groundingCount };
}
