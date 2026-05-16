/**
 * TaskLifecycleManager.js
 *
 * Tracks the 7-phase task arc and fires AURA guidance at each phase boundary.
 * Does NOT replace ExecutiveSpine. Wraps it with lifecycle awareness.
 *
 * Phases:
 *   1. PRE-TASK: before the learner opens the cockpit
 *   2. SETUP: ingestion, rubric decoding, timeline building
 *   3. PLANNING: Pareto Steps generated, time blocking
 *   4. WRITING: blocks exist, cockpit active
 *   5. REVIEW: all Pareto Steps complete, rubric check
 *   6. SUBMISSION: export initiated or submitted_at present
 *   7. POST-SUBMISSION: grade return, feedback processing
 */

function dispatch(eventName, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

export const PHASES = {
  PRE_TASK: 1,
  SETUP: 2,
  PLANNING: 3,
  WRITING: 4,
  REVIEW: 5,
  SUBMISSION: 6,
  POST_SUBMISSION: 7,
};

export const PHASE_LABELS = {
  1: 'Pre-task',
  2: 'Setup',
  3: 'Planning',
  4: 'Writing',
  5: 'Review',
  6: 'Submission',
  7: 'Post-submission',
};

/**
 * AURA phase-transition messages.
 * These are guidance prompts AURA surfaces at each boundary.
 */
export const PHASE_MESSAGES = {
  '1_2': (task) => `You have opened "${task.title || 'your task'}". Before you start writing, dropping in your brief and rubric will let me give you specific guidance. Want to do that now?`,
  '2_3': (task) => `Brief loaded. I found ${task.rubricCount || 0} rubric criteria. Your top Pareto Step is "${task.paretoStep1 || 'not set yet'}". Ready to plan?`,
  '3_4': (task) => `Writing started. "${task.paretoStep1 || 'Pareto Step 1'}" is your first focus. ${task.topCriterion || 'The top rubric criterion'} is worth ${task.topWeight || '?'}. I am here when you need me.`,
  '4_5': () => 'All Pareto Steps complete. Before you submit, want a rubric check?',
  '5_6': () => 'Your rubric check passed. Ready to export and submit.',
  '6_7': () => 'Submitted. If you get your grade back, enter it here so I can help you improve next time.',
  '7_grade': (task) => `Grade logged. "${task.weakestCriterion || 'Your weakest area'}" moves to Pareto Step 1 on your next similar task.`,
};

/**
 * Determine the current phase of a task based on its data.
 * @param {object} course - course object from ProjectContext
 * @returns {number} phase (1-7)
 */
export function determinePhase(course) {
  if (!course) return PHASES.PRE_TASK;

  const ext = course.extractionData || {};
  const briefs = ext.assessmentBriefs || [];
  const hasIngestion = briefs.length > 0 && (briefs[0].body || ext.primaryRawText);
  const hasPareto = ext.paretoSteps && ext.paretoSteps.length > 0;
  const hasBlocks = course.blocks && Object.keys(course.blocks).length > 0;
  const allParetoComplete = hasPareto && (ext.paretoStepsComplete || []).length >= (ext.paretoSteps || []).length;
  const submitted = course.submitted_at || ext.submitted_at;
  const gradeReceived = course.grade || ext.grade_received_at;

  if (gradeReceived) return PHASES.POST_SUBMISSION;
  if (submitted) return PHASES.SUBMISSION;
  if (allParetoComplete) return PHASES.REVIEW;
  if (hasBlocks) return PHASES.WRITING;
  if (hasPareto) return PHASES.PLANNING;
  if (hasIngestion) return PHASES.SETUP;
  return PHASES.PRE_TASK;
}

/**
 * Check for phase transition and fire event if changed.
 * Call this whenever course data updates.
 * @param {string} taskId
 * @param {number} previousPhase
 * @param {number} currentPhase
 * @param {object} taskContext - for message generation
 */
export function checkPhaseTransition(taskId, previousPhase, currentPhase, taskContext = {}) {
  if (previousPhase === currentPhase) return null;
  if (currentPhase <= previousPhase) return null; // Only forward transitions

  const transitionKey = `${previousPhase}_${currentPhase}`;
  const messageFn = PHASE_MESSAGES[transitionKey];
  const message = messageFn ? messageFn(taskContext) : null;

  // Dispatch phase transition event
  dispatch('simplifii:phase-transition', {
    taskId,
    fromPhase: previousPhase,
    toPhase: currentPhase,
    fromLabel: PHASE_LABELS[previousPhase],
    toLabel: PHASE_LABELS[currentPhase],
    message,
    timestamp: Date.now(),
  });

  // Queue message for AURA if chat is not open
  if (message) {
    const queued = JSON.parse(sessionStorage.getItem('simplifii_aura_queue') || '[]');
    queued.push({ message, phase: currentPhase, taskId, timestamp: Date.now() });
    sessionStorage.setItem('simplifii_aura_queue', JSON.stringify(queued));
  }

  return { fromPhase: previousPhase, toPhase: currentPhase, message };
}

/**
 * Get queued AURA messages (for when chat opens after a phase transition).
 * Clears the queue after reading.
 * @returns {Array} queued messages
 */
export function getQueuedAuraMessages() {
  try {
    const queued = JSON.parse(sessionStorage.getItem('simplifii_aura_queue') || '[]');
    sessionStorage.removeItem('simplifii_aura_queue');
    return queued;
  } catch { return []; }
}
