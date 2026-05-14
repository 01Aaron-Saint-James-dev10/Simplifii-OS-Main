/**
 * ResearchProjectContext.js
 *
 * State management for the Sovereign Research container.
 * Loads phases, strands, chapters, and all three logs from IndexedDB.
 * Applies Aaron's MRes seed on first launch (guarded by localStorage flag).
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  addResearchProject,
  addPhase,
  addStrand,
  addChapter,
  addMethodologyEntry,
  addReflexivityEntry,
  addSupervisorFeedback,
  cycleFeedbackStatus,
  listPhases,
  listStrands,
  listChapters,
  listMethodologyLog,
  listReflexivityLog,
  listSupervisorFeedback,
} from '../services/ResearchProjectService';
import { addSource } from '../services/CitationService';
import {
  getAllResearchProjects,
  getResearchProjectById,
} from '../services/IndexedDBService';
import {
  AARON_PROJECT,
  AARON_PHASES,
  AARON_STRANDS,
  AARON_CHAPTERS,
  AARON_METHODOLOGY_LOG,
  AARON_REFLEXIVITY_LOG,
  AARON_SUPERVISOR_FEEDBACK,
  AARON_CORPUS_SEEDS,
  AARON_PROJECT_ID,
} from '../data/AaronSeedData';

const SEED_FLAG = 'simplifii_aaron_seed_v1';

const ResearchProjectContext = createContext();

export function ResearchProjectProvider({ children }) {
  const [activeProject, setActiveProject]   = useState(null);
  const [phases,        setPhases]          = useState([]);
  const [strands,       setStrands]         = useState([]);
  const [chapters,      setChapters]        = useState([]);
  const [methodologyLog,   setMethodologyLog]   = useState([]);
  const [reflexivityLog,   setReflexivityLog]   = useState([]);
  const [supervisorFeedback, setSupervisorFeedback] = useState([]);
  const [seeding,       setSeeding]         = useState(false);

  // ─── Seed Aaron's MRes on first launch ──────────────────────────────────────

  useEffect(() => {
    if (localStorage.getItem(SEED_FLAG)) return;
    (async () => {
      setSeeding(true);
      try {
        // Save project
        await addResearchProject('local', AARON_PROJECT);
        // Phases
        for (const p of AARON_PHASES) await addPhase(p.projectId, p);
        // Strands
        for (const s of AARON_STRANDS) await addStrand(s.projectId, s.phaseId, s);
        // Chapters
        for (const c of AARON_CHAPTERS) await addChapter(c.projectId, c);
        // Methodology log
        for (const e of AARON_METHODOLOGY_LOG) await addMethodologyEntry(e.projectId, e);
        // Reflexivity log
        for (const e of AARON_REFLEXIVITY_LOG) await addReflexivityEntry(e.projectId, e);
        // Supervisor feedback
        for (const f of AARON_SUPERVISOR_FEEDBACK) await addSupervisorFeedback(f.projectId, f);
        // Corpus pre-seeds
        for (const src of AARON_CORPUS_SEEDS) {
          await addSource(AARON_PROJECT_ID, { ...src, sourceId: uuidv4() });
        }
        localStorage.setItem(SEED_FLAG, '1');
      } catch (err) {
        console.error('[ResearchProjectContext] seed failed:', err);
      } finally {
        setSeeding(false);
        await loadProject(AARON_PROJECT_ID);
      }
    })();
  }, []); // eslint-disable-line

  // ─── Load a project by ID ────────────────────────────────────────────────────

  const loadProject = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const project = await getResearchProjectById(projectId);
      if (!project) return;
      const [ph, st, ch, ml, rl, sf] = await Promise.all([
        listPhases(projectId),
        listStrands(projectId),
        listChapters(projectId),
        listMethodologyLog(projectId),
        listReflexivityLog(projectId),
        listSupervisorFeedback(projectId),
      ]);
      setActiveProject(project);
      setPhases(ph);
      setStrands(st);
      setChapters(ch);
      setMethodologyLog(ml);
      setReflexivityLog(rl);
      setSupervisorFeedback(sf);
    } catch (err) {
      console.error('[ResearchProjectContext] loadProject failed:', err);
    }
  }, []);

  // Load Aaron's project on mount if seed is already applied
  useEffect(() => {
    if (localStorage.getItem(SEED_FLAG)) {
      loadProject(AARON_PROJECT_ID);
    }
  }, [loadProject]);

  // ─── Methodology log callbacks ───────────────────────────────────────────────

  const addMethodologyEntryCallback = useCallback(async (data) => {
    if (!activeProject) return;
    const entry = await addMethodologyEntry(activeProject.projectId, data);
    setMethodologyLog(prev => [entry, ...prev]);
    return entry;
  }, [activeProject]);

  // ─── Reflexivity log callbacks ───────────────────────────────────────────────

  const addReflexivityEntryCallback = useCallback(async (data) => {
    if (!activeProject) return;
    const entry = await addReflexivityEntry(activeProject.projectId, data);
    setReflexivityLog(prev => [entry, ...prev]);
    return entry;
  }, [activeProject]);

  // ─── Supervisor feedback callbacks ───────────────────────────────────────────

  const addSupervisorFeedbackCallback = useCallback(async (data) => {
    if (!activeProject) return;
    const item = await addSupervisorFeedback(activeProject.projectId, data);
    setSupervisorFeedback(prev => [item, ...prev]);
    return item;
  }, [activeProject]);

  const cycleFeedbackStatusCallback = useCallback(async (feedback) => {
    const updated = await cycleFeedbackStatus(feedback);
    setSupervisorFeedback(prev => prev.map(f => f.feedbackId === updated.feedbackId ? updated : f));
    return updated;
  }, []);

  return (
    <ResearchProjectContext.Provider value={{
      activeProject,
      phases,
      strands,
      chapters,
      methodologyLog,
      reflexivityLog,
      supervisorFeedback,
      seeding,
      loadProject,
      addMethodologyEntry:   addMethodologyEntryCallback,
      addReflexivityEntry:   addReflexivityEntryCallback,
      addSupervisorFeedback: addSupervisorFeedbackCallback,
      cycleFeedbackStatus:   cycleFeedbackStatusCallback,
    }}>
      {children}
    </ResearchProjectContext.Provider>
  );
}

export const useResearchProject = () => useContext(ResearchProjectContext);
