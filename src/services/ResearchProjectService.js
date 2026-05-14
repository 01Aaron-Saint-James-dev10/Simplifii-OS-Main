/**
 * ResearchProjectService.js
 *
 * Data model and CRUD layer for the Sovereign Research container.
 * Handles Research Projects, Phases (MRes/PhD/Postdoc), Strands, Chapters,
 * Methodology Log, Reflexivity Log, and Supervisor Feedback.
 *
 * Integrity laws:
 *   1. positionalityStatement and theoreticalFramework are mandatory schema
 *      fields on every project. Empty string is allowed on creation; the UI
 *      surfaces a prompt to complete them before first submission.
 *   2. verified: false is the default for all new records until the researcher
 *      explicitly confirms the entry.
 *   3. Pure factory functions are exported separately so tests need no I/O mock.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  saveResearchProject,
  getResearchProjectById,
  savePhase,
  getPhasesByProject,
  saveStrand,
  getStrandsByPhase,
  getStrandsByProject,
  saveChapter,
  getChaptersByProject,
  saveMethodologyEntry,
  getMethodologyEntriesByProject,
  saveReflexivityEntry,
  getReflexivityEntriesByProject,
  saveSupervisorFeedback,
  getSupervisorFeedbackByProject,
  updateSupervisorFeedbackRecord,
} from './IndexedDBService';

// ─── Project ──────────────────────────────────────────────────────────────────

export function createResearchProject(userId, data = {}) {
  return {
    projectId:               data.projectId || uuidv4(),
    userId:                  userId || 'local',
    title:                   data.title || '',
    shortTitle:              data.shortTitle || '',
    institution:             data.institution || '',
    supervisor:              data.supervisor || '',
    supervisorEmail:         data.supervisorEmail || null,
    ethicsNumber:            data.ethicsNumber || null,
    // Mandatory integrity fields (Integrity Law 1)
    positionalityStatement:  data.positionalityStatement || '',
    theoreticalFramework:    data.theoreticalFramework || '',
    // Status
    status:                  data.status || 'active',
    startYear:               data.startYear || new Date().getFullYear(),
    targetYear:              data.targetYear || null,
    addedAt:                 data.addedAt || new Date().toISOString(),
    updatedAt:               new Date().toISOString(),
  };
}

export async function addResearchProject(userId, data = {}) {
  const record = createResearchProject(userId, data);
  await saveResearchProject(record);
  return record;
}

export async function getResearchProject(projectId) {
  if (!projectId) return null;
  return getResearchProjectById(projectId);
}

// ─── Phase ────────────────────────────────────────────────────────────────────

/**
 * Phase types: mres | phd | postdoc | honours | masters_coursework
 * Phase statuses: active | placeholder | completed
 */
export function createPhase(projectId, data = {}) {
  return {
    phaseId:     data.phaseId || uuidv4(),
    projectId,
    title:       data.title || '',
    type:        data.type || 'mres',
    description: data.description || '',
    startYear:   data.startYear || null,
    endYear:     data.endYear || null,
    status:      data.status || 'placeholder',
    order:       data.order ?? 0,
    addedAt:     data.addedAt || new Date().toISOString(),
  };
}

export async function addPhase(projectId, data = {}) {
  const record = createPhase(projectId, data);
  await savePhase(record);
  return record;
}

export async function listPhases(projectId) {
  if (!projectId) return [];
  const phases = await getPhasesByProject(projectId);
  return phases.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// ─── Strand ───────────────────────────────────────────────────────────────────

/**
 * Strand methodology types: qualitative | quantitative | mixed | audit | survey
 * Strand statuses: active | paused | completed
 */
export function createStrand(projectId, phaseId, data = {}) {
  return {
    strandId:    data.strandId || uuidv4(),
    projectId,
    phaseId,
    title:       data.title || '',
    description: data.description || '',
    methodology: data.methodology || null,
    status:      data.status || 'active',
    order:       data.order ?? 0,
    addedAt:     data.addedAt || new Date().toISOString(),
  };
}

export async function addStrand(projectId, phaseId, data = {}) {
  const record = createStrand(projectId, phaseId, data);
  await saveStrand(record);
  return record;
}

export async function listStrands(projectId, phaseId) {
  if (!projectId) return [];
  const all = phaseId
    ? await getStrandsByPhase(phaseId)
    : await getStrandsByProject(projectId);
  return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// ─── Chapter ──────────────────────────────────────────────────────────────────

/**
 * Chapter types: introduction | literature_review | methodology |
 *                findings | discussion | conclusion | standard
 * Chapter statuses: not_started | drafting | revising | reviewed | complete
 */
export function createChapter(projectId, data = {}) {
  return {
    chapterId:      data.chapterId || uuidv4(),
    projectId,
    phaseId:        data.phaseId || null,
    strandId:       data.strandId || null,
    number:         data.number ?? null,
    title:          data.title || '',
    type:           data.type || 'standard',
    status:         data.status || 'not_started',
    wordCountGoal:  data.wordCountGoal || 3000,
    order:          data.order ?? 0,
    addedAt:        data.addedAt || new Date().toISOString(),
    lastEditedAt:   data.lastEditedAt || null,
  };
}

export async function addChapter(projectId, data = {}) {
  const record = createChapter(projectId, data);
  await saveChapter(record);
  return record;
}

export async function listChapters(projectId) {
  if (!projectId) return [];
  const chapters = await getChaptersByProject(projectId);
  return chapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function updateChapterStatus(chapter, newStatus) {
  const updated = { ...chapter, status: newStatus, lastEditedAt: new Date().toISOString() };
  await saveChapter(updated);
  return updated;
}

// ─── Methodology Log ──────────────────────────────────────────────────────────

/**
 * Entry types: decision | pivot | reflection | method_change | ethics_amendment
 */
export function createMethodologyEntry(projectId, data = {}) {
  return {
    entryId:    data.entryId || uuidv4(),
    projectId,
    type:       data.type || 'decision',
    content:    data.content || '',
    chapterId:  data.chapterId || null,
    date:       data.date || new Date().toISOString().split('T')[0],
    addedAt:    data.addedAt || new Date().toISOString(),
  };
}

export async function addMethodologyEntry(projectId, data = {}) {
  const record = createMethodologyEntry(projectId, data);
  await saveMethodologyEntry(record);
  return record;
}

export async function listMethodologyLog(projectId) {
  if (!projectId) return [];
  const entries = await getMethodologyEntriesByProject(projectId);
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Reflexivity Log ──────────────────────────────────────────────────────────

/**
 * Entry types: positionality | power_dynamic | dual_role |
 *              lived_experience | reflexive_memo | tension
 */
export function createReflexivityEntry(projectId, data = {}) {
  return {
    entryId:    data.entryId || uuidv4(),
    projectId,
    type:       data.type || 'positionality',
    content:    data.content || '',
    date:       data.date || new Date().toISOString().split('T')[0],
    addedAt:    data.addedAt || new Date().toISOString(),
  };
}

export async function addReflexivityEntry(projectId, data = {}) {
  const record = createReflexivityEntry(projectId, data);
  await saveReflexivityEntry(record);
  return record;
}

export async function listReflexivityLog(projectId) {
  if (!projectId) return [];
  const entries = await getReflexivityEntriesByProject(projectId);
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Supervisor Feedback ──────────────────────────────────────────────────────

/**
 * Source types: paste | meeting | docx | voice
 * Status values: unaddressed | in_progress | addressed | declined | discussed
 * Priority values: low | normal | high
 */
export function createSupervisorFeedback(projectId, data = {}) {
  return {
    feedbackId:       data.feedbackId || uuidv4(),
    projectId,
    source:           data.source || 'paste',
    content:          data.content || '',
    status:           data.status || 'unaddressed',
    priority:         data.priority || 'normal',
    suggestedChapter: data.suggestedChapter || null,
    date:             data.date || new Date().toISOString().split('T')[0],
    addedAt:          data.addedAt || new Date().toISOString(),
    updatedAt:        new Date().toISOString(),
  };
}

export async function addSupervisorFeedback(projectId, data = {}) {
  const record = createSupervisorFeedback(projectId, data);
  await saveSupervisorFeedback(record);
  return record;
}

export async function listSupervisorFeedback(projectId) {
  if (!projectId) return [];
  const items = await getSupervisorFeedbackByProject(projectId);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function cycleFeedbackStatus(feedback) {
  const cycle = ['unaddressed', 'in_progress', 'addressed', 'declined', 'discussed'];
  const current = cycle.indexOf(feedback.status);
  const next = cycle[(current + 1) % cycle.length];
  const updated = { ...feedback, status: next, updatedAt: new Date().toISOString() };
  await updateSupervisorFeedbackRecord(updated);
  return updated;
}

// ─── Status helpers (pure, exported for tests and UI) ────────────────────────

export function getChapterStatusLabel(status) {
  const labels = {
    not_started: 'Not started',
    drafting:    'Drafting',
    revising:    'Revising',
    reviewed:    'Reviewed',
    complete:    'Complete',
  };
  return labels[status] || status;
}

export function getMethodologyTypeLabel(type) {
  const labels = {
    decision:         'Decision',
    pivot:            'Pivot',
    reflection:       'Reflection',
    method_change:    'Method change',
    ethics_amendment: 'Ethics amendment',
  };
  return labels[type] || type;
}

export function getReflexivityTypeLabel(type) {
  const labels = {
    positionality:   'Positionality',
    power_dynamic:   'Power dynamic',
    dual_role:       'Dual role',
    lived_experience:'Lived experience',
    reflexive_memo:  'Reflexive memo',
    tension:         'Tension',
  };
  return labels[type] || type;
}

export function getFeedbackStatusLabel(status) {
  const labels = {
    unaddressed: 'Unaddressed',
    in_progress: 'In progress',
    addressed:   'Addressed',
    declined:    'Declined',
    discussed:   'Discussed',
  };
  return labels[status] || status;
}
