/**
 * TaskSequenceManager.js
 *
 * Phase state management for Sprint 5: Task Guidance Engine.
 * Persists the current phase per assessment to localStorage.
 * Dispatches simplifii:phase-advanced when the phase changes.
 *
 * Does NOT modify any existing core module. Reads from extractionData
 * via the caller. State storage is keyed by a stable assessment identifier.
 */

const STORAGE_KEY_PREFIX = 'simplifii_task_phase_';
const PHASE_ADVANCED_EVENT = 'simplifii:phase-advanced';

function dispatch(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PHASE_ADVANCED_EVENT, { detail }));
  }
}

/**
 * Build a stable storage key for an assessment.
 * Uses courseId + assessmentTitle to avoid collisions between courses.
 *
 * @param {string} courseId
 * @param {string} assessmentTitle
 * @returns {string}
 */
export function buildAssessmentKey(courseId, assessmentTitle) {
  const slug = (assessmentTitle || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40);
  return `${STORAGE_KEY_PREFIX}${courseId}_${slug}`;
}

/**
 * Get the current phase ID for an assessment.
 * Returns the first phase ID if no state has been stored yet.
 *
 * @param {string} assessmentKey - from buildAssessmentKey
 * @param {Array} phases - phases array from taskSequence
 * @returns {string | null}
 */
export function getCurrentPhaseId(assessmentKey, phases = []) {
  try {
    const stored = localStorage.getItem(assessmentKey);
    if (stored && phases.some(p => p.id === stored)) return stored;
  } catch { /* storage unavailable */ }
  return phases.length > 0 ? phases[0].id : null;
}

/**
 * Set the current phase ID for an assessment.
 * Persists to localStorage and dispatches simplifii:phase-advanced.
 *
 * @param {string} assessmentKey
 * @param {string} phaseId
 * @param {Array} phases
 */
export function setCurrentPhaseId(assessmentKey, phaseId, phases = []) {
  const phase = phases.find(p => p.id === phaseId);
  if (!phase) return;

  try {
    localStorage.setItem(assessmentKey, phaseId);
  } catch { /* storage unavailable */ }

  dispatch({ assessmentKey, phaseId, phase });
}

/**
 * Advance to the next phase in sequence.
 * No-op if already on the last phase.
 *
 * @param {string} assessmentKey
 * @param {Array} phases
 * @returns {string | null} the new phaseId, or null if already at last phase
 */
export function advancePhase(assessmentKey, phases = []) {
  const currentId = getCurrentPhaseId(assessmentKey, phases);
  const currentIndex = phases.findIndex(p => p.id === currentId);
  if (currentIndex === -1 || currentIndex >= phases.length - 1) return null;

  const nextPhase = phases[currentIndex + 1];
  setCurrentPhaseId(assessmentKey, nextPhase.id, phases);
  return nextPhase.id;
}

/**
 * Get the phase object for the current phase.
 *
 * @param {string} assessmentKey
 * @param {Array} phases
 * @returns {object | null}
 */
export function getCurrentPhase(assessmentKey, phases = []) {
  const currentId = getCurrentPhaseId(assessmentKey, phases);
  return phases.find(p => p.id === currentId) || null;
}

/**
 * Reset an assessment back to the first phase.
 * Used when a student re-opens an already-started assessment.
 *
 * @param {string} assessmentKey
 */
export function resetPhase(assessmentKey) {
  try {
    localStorage.removeItem(assessmentKey);
  } catch { /* storage unavailable */ }
}
