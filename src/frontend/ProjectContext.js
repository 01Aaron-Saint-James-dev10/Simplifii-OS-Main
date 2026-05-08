import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { checkTemporalAlignment } from '../services/TemporalFilter';
import { appendThinkingLog } from '../services/SheetsService';

const ProjectContext = createContext();

const initialProjectState = {
  blocks: [
    { id: 1, type: 'Informative Title', content: '' },
    { id: 2, type: 'Introduction & Context', content: '' },
    { id: 3, type: 'Primary Article 1 Summary', content: '' },
    { id: 4, type: 'Primary Article 2 Summary', content: '' },
    { id: 5, type: 'Review Article Synthesis', content: '' },
    { id: 6, type: 'Conclusion & Future Directions', content: '' },
    { id: 7, type: 'Research Process Documentation', content: '' }
  ],
  integrityLog: [],
  verifications: [],
  inbox: []
};

const DEFAULT_PROFILE = {
  name: 'Adonis',
  deadline: 'Friday',
  courseName: '',
  level: 'university',
  processingStyles: []
};

const DEFAULT_COURSE_ID = 'course_default';

const makeEmptyCourse = (name = 'New Course') => ({
  name,
  tasks: [],
  extractionData: null,
  activeTask: null,
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

  // Defensive: if active id ever points at a missing course, retarget.
  useEffect(() => {
    if (!courses[activeCourseId]) {
      const first = Object.keys(courses)[0];
      if (first) setActiveCourseId(first);
    }
  }, [activeCourseId, courses]);

  const activeCourse = courses[activeCourseId] || makeEmptyCourse('(Missing course)');
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
  const removeCourse = (id) => {
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
      courses, activeCourseId, setActiveCourseId, addCourse, removeCourse, renameCourse
    }}>{children}</ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
