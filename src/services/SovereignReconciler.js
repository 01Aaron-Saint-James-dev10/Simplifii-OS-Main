/**
 * SovereignReconciler
 *
 * Cross-document tie-breaker. When the Course Outline, Assessment
 * Brief, and Marking Rubric disagree about the same graded task, this
 * module collapses them into a single canonical assessment with a
 * stable id (assessment_alpha, assessment_beta, ...) so every layer of
 * the OS (sidebar, Studio, Scaffolder, AURA chat) refers to the same
 * artefact even when the source documents use different labels.
 *
 * Two responsibilities:
 *
 *   1. Fuzzy clustering. Group equivalent titles even when they use
 *      Part 1 / Part A, Roman / Arabic numerals, abbreviations
 *      (Lit Review vs Literature Review), or punctuation differences.
 *
 *   2. Conflict resolution. Inside a cluster, pick a single canonical
 *      brief by source priority:
 *
 *        Weight   :  rubric > outline > brief > none
 *        DueDate  :  syllabus > outline > brief > none
 *        Title    :  prefer the longest non-noisy version
 *        WordGoal :  highest non-zero (briefs sometimes only print
 *                    minimums; rubric usually carries the cap)
 *
 * Briefs that do not carry a `source` field still cluster correctly;
 * conflict resolution falls back to "first non-empty value wins" with
 * a preference for the longer / more specific string.
 *
 * Returns the same brief objects with two new fields added:
 *
 *   canonicalId   string   stable cluster id, assessment_<greek>
 *   reconciled    object   { weightSource, dateSource, conflicts }
 *                          present only when at least one field was
 *                          chosen across multiple candidates.
 *
 * Pure module. No DOM, no network, no localStorage. Safe to test
 * with synthetic input.
 */

const GREEK = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon',
  'zeta', 'eta', 'theta', 'iota', 'kappa',
  'lambda', 'mu', 'nu', 'xi'
];

const SOURCE_RANK_WEIGHT = { rubric: 3, outline: 2, brief: 1 };
const SOURCE_RANK_DATE   = { syllabus: 3, outline: 2, brief: 1 };

const ROMAN_TO_ARABIC = {
  i: '1', ii: '2', iii: '3', iv: '4', v: '5',
  vi: '6', vii: '7', viii: '8', ix: '9', x: '10'
};

const ALIAS_TOKENS = {
  lit: 'literature',
  rev: 'review',
  pres: 'presentation',
  proj: 'project',
  asst: 'assessment',
  assess: 'assessment',
  comm: 'communication',
  intro: 'introduction',
  prop: 'proposal'
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'for', 'to', 'in', 'on', 'at', 'by',
  'task', 'assessment', 'item', 'part'
]);

// Normalise a title for fuzzy comparison. Lowercases, drops weight
// suffixes, expands abbreviations, converts Roman numerals (i, ii, iii)
// to Arabic, swaps "Part A" / "Part 1" for a single token, and drops
// stop words. Two titles that normalise to the same token bag belong
// to the same assessment.
const normaliseTitle = (raw) => {
  if (!raw || typeof raw !== 'string') return [];
  let s = raw
    .toLowerCase()
    .replace(/\s*\(\d+%?\)\s*$/, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Part A / Part 1 / Section II all collapse to part_<n>
  s = s.replace(/\b(part|section|task)\s+([a-z\d]+)\b/g, (_, label, idx) => {
    const arabic = ROMAN_TO_ARABIC[idx] || (/^[a-z]$/.test(idx) ? String(idx.charCodeAt(0) - 96) : idx);
    return `${label}_${arabic}`;
  });
  const tokens = s.split(' ')
    .map(t => ALIAS_TOKENS[t] || t)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  return tokens;
};

// Jaccard similarity between two token bags. 0 = disjoint, 1 = same.
const tokenSimilarity = (a, b) => {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
};

const SIMILARITY_THRESHOLD = 0.6;

// Cluster briefs by normalised-token similarity. Greedy single-pass:
// each brief joins the first existing cluster it matches above the
// threshold; otherwise it seeds a new cluster.
const clusterBriefs = (briefs) => {
  const clusters = [];
  for (const brief of briefs) {
    const tokens = normaliseTitle(brief.title);
    if (tokens.length === 0) {
      clusters.push({ tokens: [String(brief.title || '').toLowerCase()], members: [brief] });
      continue;
    }
    let placed = false;
    for (const cluster of clusters) {
      if (tokenSimilarity(tokens, cluster.tokens) >= SIMILARITY_THRESHOLD) {
        cluster.members.push(brief);
        const merged = new Set([...cluster.tokens, ...tokens]);
        cluster.tokens = Array.from(merged);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push({ tokens, members: [brief] });
  }
  return clusters;
};

// Pick the canonical value for one field across a cluster of candidates.
// rankFn returns the priority for each candidate's source label;
// the highest-ranked non-empty value wins. Ties break on first-seen.
const pickByRank = (members, field, rankFn, isEmpty = (v) => !v) => {
  let best = null;
  let bestRank = -1;
  let bestSource = null;
  for (const m of members) {
    const value = m[field];
    if (isEmpty(value)) continue;
    const rank = rankFn(m.source);
    if (rank > bestRank) {
      best = value;
      bestRank = rank;
      bestSource = m.source || 'unspecified';
    }
  }
  return { value: best, source: bestSource, decided: bestRank >= 0 };
};

const pickLongestTitle = (members) => {
  let best = '';
  for (const m of members) {
    const t = String(m.title || '').trim();
    if (t.length > best.length) best = t;
  }
  return best;
};

const pickHighestWordCount = (members) => {
  let best = 0;
  for (const m of members) {
    const n = Number(m.wordCountGoal) || 0;
    if (n > best) best = n;
  }
  return best;
};

// Build the canonical brief for a single cluster.
const reconcileCluster = (members, canonicalId) => {
  if (members.length === 1) {
    return { ...members[0], canonicalId };
  }
  const weightPick = pickByRank(members, 'weight', (s) => SOURCE_RANK_WEIGHT[s] || 0);
  const datePick   = pickByRank(members, 'dueDate', (s) => SOURCE_RANK_DATE[s] || 0);
  const title = pickLongestTitle(members);
  const wordCountGoal = pickHighestWordCount(members);

  const conflicts = [];
  const distinctWeights = new Set(members.map(m => String(m.weight || '').trim()).filter(Boolean));
  if (distinctWeights.size > 1) conflicts.push({ field: 'weight', values: Array.from(distinctWeights) });
  const distinctDates = new Set(members.map(m => String(m.dueDate || '').trim()).filter(Boolean));
  if (distinctDates.size > 1) conflicts.push({ field: 'dueDate', values: Array.from(distinctDates) });

  return {
    title,
    weight: weightPick.value || '',
    wordCountGoal,
    dueDate: datePick.value || '',
    canonicalId,
    reconciled: {
      weightSource: weightPick.decided ? weightPick.source : null,
      dateSource:   datePick.decided ? datePick.source : null,
      conflicts,
      memberCount: members.length
    }
  };
};

// Public entry point. Takes an array of brief objects (any with the
// shape {title, weight, wordCountGoal, dueDate, source?}) and returns
// the canonical, deduplicated set with stable canonicalIds in the
// order they were encountered. Briefs lacking titles are dropped.
//
// Source labels are optional but recommended. Known labels:
//   'rubric'   the marking rubric
//   'outline'  the course outline
//   'brief'    an individual assessment brief
//   'syllabus' the syllabus / overview document
// Unknown or missing sources rank lowest.
export const reconcile = (briefs) => {
  if (!Array.isArray(briefs) || briefs.length === 0) return [];
  const filtered = briefs.filter(b => b && typeof b === 'object' && String(b.title || '').trim().length > 0);
  const clusters = clusterBriefs(filtered);
  return clusters.map((cluster, i) => reconcileCluster(cluster.members, `assessment_${GREEK[i] || `n${i}`}`));
};

// Lightweight helper for callers that only have plain titles (the
// regex pipeline outputs strings, not full briefs). Wraps each title
// as a {title} brief, reconciles, and returns the unique canonical
// titles in cluster order.
export const reconcileTitles = (titles) => {
  if (!Array.isArray(titles)) return [];
  const briefs = titles.map(t => ({ title: t }));
  return reconcile(briefs).map(b => b.title);
};

// Test seam: exposed for unit tests / debugging only. Not part of the
// stable public API; do not consume from UI code.
export const __internals = { normaliseTitle, tokenSimilarity, clusterBriefs, SIMILARITY_THRESHOLD };
