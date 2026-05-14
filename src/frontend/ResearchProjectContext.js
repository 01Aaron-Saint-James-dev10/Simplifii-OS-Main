/**
 * ResearchProjectContext.js
 *
 * State management for the Sovereign Research container.
 * Loads phases, strands, chapters, and all three logs from IndexedDB.
 *
 * Onboarding model (Proposal-First):
 *   - On mount, check IndexedDB for any existing research project.
 *   - If none found, expose `needsOnboarding: true` so ResearchHomeScreen
 *     shows the ProposalOnboarding gate instead of the dashboard.
 *   - `applyDemoSeed()` loads Aaron's pre-seeded MRes for testing.
 *   - `createProjectFromProposal(data)` creates a real project from extracted data.
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
  const [activeProject,      setActiveProject]      = useState(null);
  const [phases,             setPhases]             = useState([]);
  const [strands,            setStrands]            = useState([]);
  const [chapters,           setChapters]           = useState([]);
  const [methodologyLog,     setMethodologyLog]     = useState([]);
  const [reflexivityLog,     setReflexivityLog]     = useState([]);
  const [supervisorFeedback, setSupervisorFeedback] = useState([]);
  const [seeding,            setSeeding]            = useState(false);
  const [loaded,             setLoaded]             = useState(false);

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

  // ─── On mount: check for existing projects ───────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        // If demo seed was already applied, load Aaron's project directly
        if (localStorage.getItem(SEED_FLAG)) {
          await loadProject(AARON_PROJECT_ID);
          setLoaded(true);
          return;
        }
        // Otherwise check if any real user project exists
        const all = await getAllResearchProjects();
        if (all && all.length > 0) {
          await loadProject(all[0].projectId);
        }
      } catch (err) {
        console.error('[ResearchProjectContext] mount load failed:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [loadProject]);

  // ─── Apply Aaron demo seed (triggered by "Use Demo Data" button) ─────────────

  const applyDemoSeed = useCallback(async () => {
    if (localStorage.getItem(SEED_FLAG)) {
      await loadProject(AARON_PROJECT_ID);
      return;
    }
    setSeeding(true);
    try {
      await addResearchProject('local', AARON_PROJECT);
      for (const p of AARON_PHASES) await addPhase(p.projectId, p);
      for (const s of AARON_STRANDS) await addStrand(s.projectId, s.phaseId, s);
      for (const c of AARON_CHAPTERS) await addChapter(c.projectId, c);
      for (const e of AARON_METHODOLOGY_LOG) await addMethodologyEntry(e.projectId, e);
      for (const e of AARON_REFLEXIVITY_LOG) await addReflexivityEntry(e.projectId, e);
      for (const f of AARON_SUPERVISOR_FEEDBACK) await addSupervisorFeedback(f.projectId, f);
      for (const src of AARON_CORPUS_SEEDS) {
        await addSource(AARON_PROJECT_ID, { ...src, sourceId: uuidv4() });
      }
      localStorage.setItem(SEED_FLAG, '1');
      await loadProject(AARON_PROJECT_ID);
    } catch (err) {
      console.error('[ResearchProjectContext] demo seed failed:', err);
    } finally {
      setSeeding(false);
    }
  }, [loadProject]);

  // ─── Create project from uploaded proposal ───────────────────────────────────

  const createProjectFromProposal = useCallback(async (data) => {
    setSeeding(true);
    try {
      const projectId = uuidv4();
      const project = await addResearchProject('local', {
        projectId,
        title:                 data.title,
        supervisor:            data.supervisor || '',
        institution:           data.institution || '',
        positionalityStatement: data.positionalityStatement || '',
        theoreticalFramework:  data.theoreticalFramework || '',
        status:                'active',
        startYear:             new Date().getFullYear(),
      });

      // Create primary phase
      const phaseType = data.researchType || 'mres';
      const phaseTitle = { mres: 'MRes Phase 1', phd: 'PhD Candidature', honours: 'Honours Year', masters: 'Masters Phase 1' }[phaseType] || 'Phase 1';
      const phase = await addPhase(projectId, { title: phaseTitle, type: phaseType, status: 'active', order: 0 });

      // Create primary strand
      const strand = await addStrand(projectId, phase.phaseId, { title: 'Primary Research Strand', status: 'active', order: 0 });

      // Create chapters from suggested structure
      const chapterList = (data.suggestedChapters || []);
      const createdChapters = [];
      for (let i = 0; i < chapterList.length; i++) {
        const ch = chapterList[i];
        const created = await addChapter(projectId, {
          strandId:  strand.strandId,
          phaseId:   phase.phaseId,
          number:    ch.number,
          title:     `Chapter ${ch.number}: ${ch.title}`,
          status:    i === 0 ? 'drafting' : 'not_started',
          order:     i,
        });
        createdChapters.push(created);
      }

      await loadProject(projectId);
    } catch (err) {
      console.error('[ResearchProjectContext] createProjectFromProposal failed:', err);
    } finally {
      setSeeding(false);
    }
  }, [loadProject]);

  // ─── Methodology log ─────────────────────────────────────────────────────────

  const addMethodologyEntryCallback = useCallback(async (data) => {
    if (!activeProject) return;
    const entry = await addMethodologyEntry(activeProject.projectId, data);
    setMethodologyLog(prev => [entry, ...prev]);
    return entry;
  }, [activeProject]);

  // ─── Reflexivity log ─────────────────────────────────────────────────────────

  const addReflexivityEntryCallback = useCallback(async (data) => {
    if (!activeProject) return;
    const entry = await addReflexivityEntry(activeProject.projectId, data);
    setReflexivityLog(prev => [entry, ...prev]);
    return entry;
  }, [activeProject]);

  // ─── Supervisor feedback ─────────────────────────────────────────────────────

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

  // needsOnboarding: loaded but no project and no demo seed
  const needsOnboarding = loaded && !activeProject && !seeding;

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
      loaded,
      needsOnboarding,
      loadProject,
      applyDemoSeed,
      createProjectFromProposal,
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
