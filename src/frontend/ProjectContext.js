import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { checkTemporalAlignment } from '../services/TemporalFilter';
import { appendThinkingLog } from '../services/SheetsService';

const ProjectContext = createContext();

// Blocks intentionally start empty. Once a brief is grounded, mapToWorkspace
// generates the right blocks for the detected academic level (school /
// undergrad / honours / phd). No level-specific defaults baked in here.
const initialProjectState = {
  blocks: [],
  integrityLog: [],
  verifications: [],
  inbox: []
};

// Profile collected during onboarding. Empty name falls back to a neutral
// 'Sovereign User' label at display time so the OS never assumes who you are.
const DEFAULT_PROFILE = {
  name: '',
  deadline: 'Friday',
  courseName: '',
  level: 'university',
  processingStyles: []
};

const DEFAULT_COURSE_ID = 'course_default';

// Semester Roadmap. Slots are null until a syllabus handshake derives real
// assessment titles via deriveRoadmapFromAssessments. The previous version
// shipped 'Literature Review / Oral Presentation / Final Exam' as defaults,
// which leaked hardcoded placeholders into every fresh course. The cockpit
// now stays empty until the student's actual data lands. The Roadmap panel
// in MasterDashboard hides when every slot is null.
const DEFAULT_ROADMAP = {
  currentTask: null,
  nextAssessment: null,
  finalMilestone: null
};

// One-time migration. Old courses created before the placeholder purge have
// the legacy strings stored in localStorage. Wipe them where they exactly
// match the old defaults so the cockpit reads as clean state. Tracked via
// a versioned flag so the loop never repeats.
const LEGACY_ROADMAP = {
  currentTask: 'Literature Review',
  nextAssessment: 'Oral Presentation',
  finalMilestone: 'Final Exam'
};
const purgeLegacyRoadmap = (courses) => {
  let mutated = false;
  const next = {};
  for (const [id, c] of Object.entries(courses || {})) {
    const r = c?.roadmap;
    if (r && r.currentTask === LEGACY_ROADMAP.currentTask && r.nextAssessment === LEGACY_ROADMAP.nextAssessment && r.finalMilestone === LEGACY_ROADMAP.finalMilestone) {
      next[id] = { ...c, roadmap: { ...DEFAULT_ROADMAP } };
      mutated = true;
    } else {
      next[id] = c;
    }
  }
  return mutated ? next : courses;
};

const makeEmptyCourse = (name = 'New Course') => ({
  name,
  tasks: [],
  extractionData: null,
  activeTask: null,
  roadmap: { ...DEFAULT_ROADMAP },
  project: { ...initialProjectState, blocks: initialProjectState.blocks.map(b => ({ ...b })) },
  // Sprint state. activeAssessmentTitle scopes the LinearCanvas to a
  // specific assessment (e.g. 'Literature Review (5%)'). sprintDrafts
  // stashes per-assessment block snapshots so a student can dip in and
  // out of multiple tasks without losing their place. Empty by default;
  // populated lazily as the student switches sprints.
  activeAssessmentTitle: null,
  sprintDrafts: {}
});

// Zero-state by default. The cockpit boots with NO placeholder course so
// the student sees an empty cockpit until they drop a syllabus. The
// previous 'My First Course' default was a zombie that the founder kept
// confusing with extracted assessment data. Courses now exist only when
// the student creates one (via Add Course or via the onboarding
// handshake). activeCourseId may be set to a course that does not exist
// (after migration or a cleared course); the activeCourse computed
// value handles that case gracefully.
const DEFAULT_COURSES = {};

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// One-time migration from the pre-CourseManager keys. If the new courses key
// already exists we trust it and skip. Otherwise we wrap whatever single-
// course data the student had into one default course so nothing is lost.
const tryMigrateLegacy = () => {
  if (localStorage.getItem('simplifii_courses_v1')) return null;
  const oldProject = loadJSON('simplifii_project_state', null);
  const oldTasks = loadJSON('simplifii_tasks', null);
  const oldExtraction = loadJSON('simplifii_extractionData', null);
  const oldProfile = loadJSON('simplifii_profile', null);
  if (!oldProject && !oldTasks && !oldExtraction) return null;
  return {
    [DEFAULT_COURSE_ID]: {
      name: oldProfile?.courseName || 'Legacy Course',
      tasks: oldTasks || [],
      extractionData: oldExtraction || null,
      activeTask: null,
      project: oldProject || { ...initialProjectState }
    }
  };
};

export const ProjectProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => loadJSON('simplifii_profile', DEFAULT_PROFILE));
  const [courses, setCourses] = useState(() => {
    const stored = loadJSON('simplifii_courses_v1', null);
    if (stored && Object.keys(stored).length > 0) return stored;
    const migrated = tryMigrateLegacy();
    return migrated || DEFAULT_COURSES;
  });
  const [activeCourseId, setActiveCourseId] = useState(() => {
    const stored = localStorage.getItem('simplifii_activeCourseId');
    return stored || DEFAULT_COURSE_ID;
  });

  useEffect(() => { localStorage.setItem('simplifii_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('simplifii_courses_v1', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('simplifii_activeCourseId', activeCourseId); }, [activeCourseId]);

  // Roadmap legacy purge. One-time: any course whose roadmap exactly matches
  // the pre-purge defaults gets wiped to nulls so the cockpit shows empty
  // state on first reload after upgrade. Flag prevents the loop from re-
  // running, so a student who later sets 'Literature Review' as a real
  // currentTask does not lose it.
  useEffect(() => {
    try {
      if (localStorage.getItem('simplifii_roadmap_purged_v1') === 'true') return;
      setCourses(prev => purgeLegacyRoadmap(prev));
      localStorage.setItem('simplifii_roadmap_purged_v1', 'true');
    } catch { /* storage unavailable */ }
  }, []);

  // Defensive: if active id ever points at a missing course, retarget.
  useEffect(() => {
    if (!courses[activeCourseId]) {
      const first = Object.keys(courses)[0];
      if (first) setActiveCourseId(first);
    }
  }, [activeCourseId, courses]);

  // Merge legacy courses (stored before the roadmap field existed) with the
  // default milestones so consumers can always read activeCourse.roadmap.x
  // without optional chaining sprinkled through every panel.
  const rawActiveCourse = courses[activeCourseId] || makeEmptyCourse('(Missing course)');

  // Console helpers for schema lock. Exposed once on first render so a
  // student can paste a schema from DevTools without wiring up a UI yet:
  //   window.simplifii.lockSchema('BABS1201', [
  //     { title: 'Literature Review', weight: '25%', wordCountGoal: 2000, dueDate: 'Friday Week 5' },
  //     { title: 'Test 1', weight: '30%' },
  //     ...
  //   ]);
  //   window.simplifii.unlockSchema('BABS1201');
  // The course id argument matches activeCourseId; use
  //   window.simplifii.activeCourseId   to find it.
  if (typeof window !== 'undefined' && !window.simplifii) {
    window.simplifii = {
      get activeCourseId() { return localStorage.getItem('simplifii_activeCourseId'); },
      lockSchema: (courseId, pillars) => {
        if (!courseId || !Array.isArray(pillars)) {
          console.warn('[simplifii.lockSchema] usage: lockSchema(courseId, [{title, weight, wordCountGoal, dueDate}, ...])');
          return;
        }
        try {
          localStorage.setItem(`simplifii_schema_${courseId}`, JSON.stringify({ pillars }));
          console.info('[simplifii.lockSchema] locked', pillars.length, 'pillars for', courseId, '. Reload to apply.');
        } catch (e) { console.warn('[simplifii.lockSchema] failed:', e.message); }
      },
      unlockSchema: (courseId) => {
        try {
          localStorage.removeItem(`simplifii_schema_${courseId}`);
          console.info('[simplifii.unlockSchema] cleared override for', courseId, '. Reload to revert to LLM extraction.');
        } catch (e) { console.warn('[simplifii.unlockSchema] failed:', e.message); }
      }
    };
  }

  // Per-course schema override. When a student knows the LLM extraction
  // is unreliable for their syllabus PDFs (or simply wants to pin the
  // assessments to a verified list), they can write a JSON schema to
  //   localStorage.simplifii_schema_<courseId>
  // shaped as { pillars: [{ title, weight, wordCountGoal, dueDate }, ...] }
  // The override completely replaces the LLM/regex assessment list and
  // the rebuilt DoD checklist + Semester Roadmap. This is sovereign by
  // construction (per-browser, never synced) and generalisable (works
  // for any course, BABS, MRes, future units).
  const __readSchemaOverride = (courseId) => {
    if (typeof window === 'undefined' || !courseId) return null;
    try {
      const raw = window.localStorage.getItem(`simplifii_schema_${courseId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const pillars = Array.isArray(parsed?.pillars) ? parsed.pillars : null;
      if (!pillars || pillars.length === 0) return null;
      return pillars
        .map(p => ({
          title: String(p?.title || '').trim(),
          weight: String(p?.weight || '').trim(),
          wordCountGoal: Number(p?.wordCountGoal) > 0 ? Number(p.wordCountGoal) : 0,
          dueDate: String(p?.dueDate || '').trim()
        }))
        .filter(p => p.title.length >= 3);
    } catch { return null; }
  };
  const __schemaPillars = __readSchemaOverride(activeCourseId);

  // Resolve the currently focused assessment brief (if any). The brief
  // carries the title, weight, wordCountGoal, and dueDate, which the
  // canvas uses for its Logic Block progression and AURA Chat context.
  const __activeTitle = rawActiveCourse.activeAssessmentTitle || null;
  const __extractedBriefs = Array.isArray(rawActiveCourse.extractionData?.assessmentBriefs)
    ? rawActiveCourse.extractionData.assessmentBriefs
    : [];
  // Schema override wins over extracted briefs when present.
  const __briefs = __schemaPillars || __extractedBriefs;
  const __resolveBrief = (title) => {
    if (!title) return null;
    return __briefs.find(b => {
      const display = b.weight ? `${b.title} (${b.weight})` : b.title;
      return display === title || b.title === title;
    }) || null;
  };

  // When the schema override is active, rebuild the extractionData
  // surfaces (assessmentTitles, doneWhenChecklist) so every consumer
  // sees the locked list without needing to know the override exists.
  const __overriddenExtractionData = __schemaPillars
    ? (() => {
        const titles = __schemaPillars.map(p => p.weight ? `${p.title} (${p.weight})` : p.title);
        const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, 40) || 'item';
        const checklist = titles.slice(0, 12).map((entry, i) => ({
          id: `lock_${i}_${slugify(entry)}`,
          text: entry,
          checked: false,
          triggerWord: entry.split(/\s+/).slice(0, 3).join(' ').toLowerCase()
        }));
        return {
          ...(rawActiveCourse.extractionData || {}),
          assessmentBriefs: __schemaPillars,
          assessmentTitles: titles,
          doneWhenChecklist: checklist
        };
      })()
    : null;

  // Roadmap derivation when override is active. Same priority logic
  // BriefService.deriveRoadmapFromAssessments uses.
  const __overriddenRoadmap = __schemaPillars
    ? (() => {
        const titles = __schemaPillars.map(p => p.weight ? `${p.title} (${p.weight})` : p.title);
        const finalMatch =
          titles.find(t => /\bfinal\b/i.test(t)) ||
          [...titles].reverse().find(t => /\bexam\b/i.test(t));
        return {
          currentTask: titles[0] || null,
          nextAssessment: titles[1] || null,
          finalMilestone: finalMatch || (titles.length >= 3 ? titles[titles.length - 1] : null)
        };
      })()
    : null;

  const activeCourse = {
    ...rawActiveCourse,
    roadmap: __overriddenRoadmap || { ...DEFAULT_ROADMAP, ...(rawActiveCourse.roadmap || {}) },
    sprintDrafts: rawActiveCourse.sprintDrafts || {},
    activeAssessmentTitle: __activeTitle,
    activeAssessmentBrief: __resolveBrief(__activeTitle),
    extractionData: __overriddenExtractionData || rawActiveCourse.extractionData,
    schemaLocked: !!__schemaPillars
  };
  const { tasks, extractionData, activeTask, project } = activeCourse;

  const updateActiveCourse = (mutator) => {
    setCourses(prev => {
      const current = prev[activeCourseId] || makeEmptyCourse();
      return { ...prev, [activeCourseId]: mutator(current) };
    });
  };

  const setTasks = (next) => updateActiveCourse(c => ({ ...c, tasks: typeof next === 'function' ? next(c.tasks) : next }));
  const setExtractionData = (next) => updateActiveCourse(c => ({ ...c, extractionData: typeof next === 'function' ? next(c.extractionData) : next }));
  const setActiveTask = (next) => updateActiveCourse(c => ({ ...c, activeTask: typeof next === 'function' ? next(c.activeTask) : next }));
  const setProject = (next) => updateActiveCourse(c => ({ ...c, project: typeof next === 'function' ? next(c.project) : next }));

  // Sprint switching. Each course tracks per-assessment drafts in
  // sprintDrafts keyed on assessment title. switchSprint(title):
  //   1. Stashes the current project.blocks under the current
  //      activeAssessmentTitle so the student does not lose their place.
  //   2. Loads the target sprint's blocks if one exists; otherwise
  //      starts a fresh slate sized to the course level.
  //   3. Updates activeAssessmentTitle so the canvas header reflects
  //      the current sprint.
  // Pass null to return to the default 'no specific assessment' view.
  const switchSprint = (title) => {
    updateActiveCourse(c => {
      const drafts = { ...(c.sprintDrafts || {}) };
      const currentTitle = c.activeAssessmentTitle;
      const currentBlocks = (c.project?.blocks || []).map(b => ({ ...b }));
      // Snapshot whatever blocks the student was just on. Use a stable
      // key for the unscoped state so the student can return to it.
      const stashKey = currentTitle || '__default__';
      drafts[stashKey] = { blocks: currentBlocks };
      // Load destination blocks. Fresh slate if no draft exists yet.
      const targetKey = title || '__default__';
      const targetBlocks = drafts[targetKey]?.blocks
        ? drafts[targetKey].blocks.map(b => ({ ...b }))
        : initialProjectState.blocks.map(b => ({ ...b, content: '' }));
      return {
        ...c,
        activeAssessmentTitle: title || null,
        sprintDrafts: drafts,
        project: { ...c.project, blocks: targetBlocks, integrityLog: [], verifications: [], inbox: [] }
      };
    });
  };

  // CourseManager API
  const addCourse = (name = 'New Course') => {
    const id = `course_${Date.now()}`;
    setCourses(prev => ({ ...prev, [id]: makeEmptyCourse(name) }));
    setActiveCourseId(id);
    return id;
  };

  // Atomic create-and-fill. The Smart Handshake calls this with the full
  // payload extracted from the syllabus so course name, tasks, extraction
  // data, blocks, and roadmap all land in the new course in a single
  // setCourses transition. Avoids the race where setExtractionData/setTasks
  // fire against the previous activeCourseId before setActiveCourseId
  // commits on the next tick.
  const addCourseWithData = (name = 'New Course', payload = {}) => {
    const id = `course_${Date.now()}`;
    const base = makeEmptyCourse(name);
    const merged = {
      ...base,
      ...payload,
      // Roadmap is a nested object; merge the defaults so a partial
      // payload (e.g. only currentTask) does not blank the other slots.
      roadmap: { ...base.roadmap, ...(payload.roadmap || {}) },
      // Project must keep its blocks structure; allow caller to override
      // blocks specifically without losing the rest.
      project: payload.project
        ? { ...base.project, ...payload.project }
        : base.project
    };
    setCourses(prev => ({ ...prev, [id]: merged }));
    setActiveCourseId(id);
    return id;
  };
  const removeCourse = (id) => {
    // Purge per-course localStorage keys before dropping the course record.
    // Add new prefixes here when future per-course storage lands.
    const PER_COURSE_PREFIXES = ['simplifii_linear_canvas_'];
    PER_COURSE_PREFIXES.forEach(prefix => {
      try { localStorage.removeItem(prefix + id); } catch { /* storage unavailable */ }
    });

    setCourses(prev => {
      const next = { ...prev };
      delete next[id];
      // No auto-recreated placeholder. If the student deletes the last
      // course, the cockpit returns to zero-state until they drop a new
      // syllabus or click Add Course manually.
      return next;
    });
    if (activeCourseId === id) {
      const remaining = Object.keys(courses).filter(k => k !== id);
      setActiveCourseId(remaining[0] || DEFAULT_COURSE_ID);
    }
  };
  const renameCourse = (id, name) => {
    setCourses(prev => prev[id] ? { ...prev, [id]: { ...prev[id], name } } : prev);
  };

  const lastSyncIndex = useRef(0);
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const logsToSync = (project.integrityLog || []).slice(lastSyncIndex.current);
      if (logsToSync.length > 0) {
        appendThinkingLog(logsToSync, 'mock_jwt_token_xyz123');
        lastSyncIndex.current = (project.integrityLog || []).length;
      }
    }, 60000);
    return () => clearInterval(syncInterval);
  }, [project.integrityLog]);

  const appendToBlock = (type, content) => {
    setProject(prev => {
      const existing = prev.blocks.find(b => b.type.toLowerCase().includes(type.toLowerCase()));
      if (!existing) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => b.id === existing.id ? { ...b, content: b.content ? `${b.content}\n\n${content}` : content } : b)
      };
    });
  };

  const receiveMessage = (msg) => setProject(prev => ({ ...prev, inbox: [msg, ...(prev.inbox || [])] }));
  const clearMessage = (id) => setProject(prev => ({ ...prev, inbox: (prev.inbox || []).filter(m => m.id !== id) }));
  const updateBlock = (id, newContent) => setProject(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, content: newContent } : b) }));

  const logEffort = (blockId, metrics) => {
    const now = Date.now();
    const temporalMatch = checkTemporalAlignment(now);
    setProject(prev => {
      const newVerifications = [...(prev.verifications || [])];
      if (temporalMatch.aligned && !newVerifications.find(v => v.week === temporalMatch.event.week)) {
        newVerifications.push({
          week: temporalMatch.event.week,
          topic: temporalMatch.event.topic,
          type: temporalMatch.event.type,
          verifiedAt: now,
          method: 'Passive Activity'
        });
      }
      return {
        ...prev,
        integrityLog: [...(prev.integrityLog || []), { blockId, softVerified: temporalMatch.aligned, ...metrics }],
        verifications: newVerifications
      };
    });
  };

  const setBlocks = (newBlocks) => setProject(prev => ({ ...prev, blocks: newBlocks, integrityLog: [], verifications: [], inbox: [] }));

  const grounding = {
    complete: !!extractionData,
    learningOutcomes: extractionData?.learningOutcomes || [],
    assessmentDates: extractionData?.assessmentDates || [],
    udlRequirements: extractionData?.udlRequirements || [],
    udlPrinciples: extractionData?.udlPrinciples || [],
    udlSuggestions: extractionData?.udlSuggestions || [],
    referencingStyle: extractionData?.referencingStyle || null,
    rubricCriteria: extractionData?.rubricCriteria || [],
    evidenceFormula: extractionData?.evidenceFormula || [],
    detectedLevel: extractionData?.detectedLevel || null,
    targetWords: extractionData?.words || null
  };

  return (
    <ProjectContext.Provider value={{
      project, updateBlock, appendToBlock, receiveMessage, clearMessage, setBlocks, logEffort,
      profile, setProfile,
      tasks, setTasks,
      extractionData, setExtractionData,
      activeTask, setActiveTask,
      grounding,
      // CourseManager
      courses, activeCourse, activeCourseId, setActiveCourseId, addCourse, addCourseWithData, removeCourse, renameCourse, switchSprint
    }}>{children}</ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
