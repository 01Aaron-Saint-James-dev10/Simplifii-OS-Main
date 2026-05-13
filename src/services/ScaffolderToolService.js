/**
 * ScaffolderToolService.js
 *
 * Tier 1 stub. Generates micro-tasks (15-30 min) per assessment section
 * via backwards planning. Heuristic generation per section type.
 *
 * Contract: docs/TOOLS_SPEC.md Tool #3
 */

const SECTION_SUBTASKS = {
  introduction: [
    { label: 'Read the brief and note what topic you chose', estimatedMinutes: 15 },
    { label: 'Write one sentence stating what this paper is about', estimatedMinutes: 15 },
    { label: 'Outline why the topic matters (2-3 sentences)', estimatedMinutes: 15 },
    { label: 'Draft a plan sentence: what will each section cover?', estimatedMinutes: 15 },
  ],
  methods: [
    { label: 'Outline what you measured or observed', estimatedMinutes: 15 },
    { label: 'Describe sample size and selection', estimatedMinutes: 15 },
    { label: 'Write the procedure step by step', estimatedMinutes: 30 },
    { label: 'Add the statistical tests used', estimatedMinutes: 15 },
  ],
  results: [
    { label: 'List your key findings as bullet points', estimatedMinutes: 15 },
    { label: 'Write one paragraph per finding with data', estimatedMinutes: 30 },
    { label: 'Add a reference to each table or figure', estimatedMinutes: 15 },
  ],
  discussion: [
    { label: 'Restate the main finding in one sentence', estimatedMinutes: 15 },
    { label: 'Compare your finding to two published studies', estimatedMinutes: 30 },
    { label: 'Explain any unexpected results', estimatedMinutes: 15 },
    { label: 'State one limitation and one future direction', estimatedMinutes: 15 },
  ],
  conclusion: [
    { label: 'Summarise the main argument in 2-3 sentences', estimatedMinutes: 15 },
    { label: 'Restate how the evidence supports the argument', estimatedMinutes: 15 },
    { label: 'End with a forward-looking sentence', estimatedMinutes: 15 },
  ],
  references: [
    { label: 'Collect all in-text citations into a list', estimatedMinutes: 15 },
    { label: 'Format each reference in the required style', estimatedMinutes: 30 },
    { label: 'Cross-check: every in-text citation has a reference entry', estimatedMinutes: 15 },
  ],
  body: [
    { label: 'Write a topic sentence for paragraph 1', estimatedMinutes: 15 },
    { label: 'Add evidence from one source', estimatedMinutes: 15 },
    { label: 'Explain what the evidence means for your argument', estimatedMinutes: 15 },
    { label: 'Repeat for each main point (one paragraph each)', estimatedMinutes: 30 },
    { label: 'Add a transition sentence between paragraphs', estimatedMinutes: 15 },
  ],
};

// TODO: wire to /api/tools/scaffolder (Anthropic API) for brief-aware generation
export function generateSubtasks(sectionType, brief) {
  const key = (sectionType || 'body').toLowerCase().replace(/\s+/g, '_');
  const template = SECTION_SUBTASKS[key] || SECTION_SUBTASKS.body;
  return template.map((t, i) => ({
    id: `${key}_${i}`,
    label: t.label,
    estimatedMinutes: t.estimatedMinutes,
    status: 'todo',
  }));
}
