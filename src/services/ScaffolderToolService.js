/**
 * ScaffolderToolService.js
 *
 * Generates micro-tasks (15-30 min) per assessment section based on
 * the detected assessment format. Reads from sectionTemplates.js.
 * Falls back to essay_critical when no format is detected.
 *
 * Contract: docs/TOOLS_SPEC.md Tool #3
 */

import { getTemplate } from './sectionTemplates';

// Legacy fallback sub-tasks (used when a section ID from the template
// has no defaultSubtasks defined).
const LEGACY_SUBTASKS = {
  body: [
    { label: 'Write a topic sentence for paragraph 1', estimatedMinutes: 15 },
    { label: 'Add evidence from one source', estimatedMinutes: 15 },
    { label: 'Explain what the evidence means for your argument', estimatedMinutes: 15 },
    { label: 'Repeat for each main point (one paragraph each)', estimatedMinutes: 30 },
    { label: 'Add a transition sentence between paragraphs', estimatedMinutes: 15 },
  ],
};

/**
 * Get the section list for a given format.
 * @param {string} format - assessment format key (e.g. 'lab_report')
 * @returns {Array} section objects from the template
 */
export function getSectionsForFormat(format) {
  const template = getTemplate(format);
  return template.sections || [];
}

/**
 * Generate sub-tasks for a specific section within an assessment format.
 * @param {string} sectionId - section ID (e.g. 'aim_hypothesis')
 * @param {Object} brief - assessment brief object
 * @param {string} format - assessment format key
 * @returns {Array<{ id, label, estimatedMinutes, status }>}
 */
// TODO: wire to /api/tools/scaffolder (Anthropic API) for brief-aware generation
export function generateSubtasks(sectionId, brief, format) {
  const template = getTemplate(format || brief?.format?.format);
  const section = (template.sections || []).find(s => s.id === sectionId);

  let tasks;
  if (section && section.defaultSubtasks && section.defaultSubtasks.length > 0) {
    tasks = section.defaultSubtasks;
  } else {
    // Fall back to legacy key-based lookup
    const key = (sectionId || 'body').toLowerCase().replace(/\s+/g, '_');
    tasks = LEGACY_SUBTASKS[key] || LEGACY_SUBTASKS.body;
  }

  return tasks.map((t, i) => ({
    id: `${sectionId}_${i}`,
    label: t.label,
    estimatedMinutes: t.estimatedMinutes,
    status: 'todo',
  }));
}

/**
 * Get Definition of Done items for a section.
 * @param {string} sectionId
 * @param {string} format
 * @returns {Array<{ criterion, source, autoCheck }>}
 */
export function getDefinitionOfDone(sectionId, format) {
  const template = getTemplate(format);
  const section = (template.sections || []).find(s => s.id === sectionId);
  return section?.definitionOfDone || [];
}
