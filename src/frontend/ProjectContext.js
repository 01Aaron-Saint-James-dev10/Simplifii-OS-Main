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
  project: { ...initialProjectState, blocks: initialProjectState.blocks.map(b => ({ ...b })) }
});

const DEFAULT_COURSES = { [DEFAULT_COURSE_ID]: makeEmptyCourse('My First Course') };

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
  const activeCourse = { ...rawActiveCourse, roadmap: { ...DEFAULT_ROADMAP, ...(rawActiveCourse.roadmap || {}) } };
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
      if (Object.keys(next).length === 0) next[DEFAULT_COURSE_ID] = makeEmptyCourse('My First Course');
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
      courses, activeCourse, activeCourseId, setActiveCourseId, addCourse, addCourseWithData, removeCourse, renameCourse
    }}>{children}</ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
