/**
 * ScaffoldingService
 *
 * Pure functions extracted from Scaffolder.js for use across v2 screens.
 * The Scaffolder component itself is deleted in Commit 4; this service
 * carries the algorithmic logic forward.
 */

// Tier descriptor table. Used by the v2 scaffold selector and any surface
// that needs to present tier identity to the learner.
export const TIERS = [
  { id: 'primary',   num: '01', short: 'K-6',               glyph: 'P', name: 'Primary',   focus: 'Foundation & Focus',         sub: 'Gamified Micro-Quests' },
  { id: 'secondary', num: '02', short: 'Y7-10',             glyph: 'S', name: 'Secondary', focus: 'Executive Function',         sub: 'Body-Doubled Checklist' },
  { id: 'tertiary',  num: '03', short: 'Senior / Tertiary', glyph: 'T', name: 'Tertiary',  focus: 'Cognitive Load & Synthesis', sub: 'Backwards-Mapped Skeleton' }
];

/**
 * Maps a profile.level string to a scaffold tier id.
 * @param {string} level - profile.level value
 * @returns {'primary'|'secondary'|'tertiary'}
 */
export const tierFromLevel = (level) => {
  const l = String(level || '').toLowerCase();
  if (l === 'primary') return 'primary';
  if (l === 'secondary' || l === 'highschool' || l === 'tafe') return 'secondary';
  return 'tertiary';
};

/**
 * Builds the brief summary block shown in the source intake panel.
 * @param {Object} brief - assessment brief object
 * @param {string} courseName - active course name
 * @returns {string}
 */
export const buildBriefSummary = (brief, courseName) => {
  const titleLine = `${(brief.title || '').toUpperCase()}${courseName ? ' · ' + courseName : ''}`;
  const wordsLine = brief.wordCountGoal
    ? `Target ${brief.wordCountGoal.toLocaleString()} words.`
    : 'Submission requirements per the syllabus.';
  const weightLine = brief.weight ? `Weighting ${brief.weight}.` : '';
  const dueLine = brief.dueDate ? ` Due ${brief.dueDate}.` : '';
  return `${titleLine}\n${wordsLine}\n${weightLine}${dueLine}\nMarked across rubric bands extracted from your uploaded brief.`;
};

/**
 * Builds the backwards-mapped milestone timeline for the tertiary scaffold.
 * Pure function of the brief. Used by v2 Socratic scaffolding and the
 * semester roadmap derivation.
 * @param {Object} brief - assessment brief object
 * @returns {Array<{state: string, when: string, name: string, from: string, marks: number}>}
 */
export const buildTertiaryMilestones = (brief) => {
  const target = brief.wordCountGoal || 2000;
  const briefName = brief.title || 'Assessment';
  return [
    { state: 'done',   when: 'Wk 1 · Mon', name: 'Brief decoded into rubric bands',                       from: `Two rubric bands extracted from ${briefName}`,             marks: 0 },
    { state: 'done',   when: 'Wk 2 · Wed', name: 'Search strategy locked',                                from: 'Keywords + Boolean string saved into the Grounding Drive',  marks: 0 },
    { state: 'active', when: 'Wk 3 · Fri', name: `Foundation paragraph (${Math.round(target * 0.25)} w)`, from: 'Frame the disagreement, name the pillars',                  marks: 4 },
    { state: 'next',   when: 'Wk 4 · Tue', name: 'Core synthesis · weigh competing claims',               from: 'The synthesis band wants positions weighed, not catalogued', marks: Math.max(8, Math.round((brief.weight || 25) / 2)) },
    { state: 'next',   when: 'Wk 5 · Thu', name: 'Polish · resolve open questions, refs',                 from: 'Marker reads the close before deciding the band',            marks: 6 },
    { state: 'next',   when: brief.dueDate ? `Due · ${brief.dueDate}` : 'Wk 6 · Fri', name: 'Submission + integrity report export', from: 'Verified human authorship · thinking history attached', marks: 3 }
  ];
};
