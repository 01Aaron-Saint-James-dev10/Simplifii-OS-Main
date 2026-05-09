/**
 * LiteralMode
 *
 * Layer 4 of the Sovereign Architecture Blueprint.
 *
 * Render-time vocabulary transformer. Re-voices schema-anchored output
 * for primary / secondary streams (and any caller that opts in) into
 * plain, imperative, single-instruction English. NEVER generates new
 * content. NEVER receives rubric data directly. Only re-voices text
 * that has already come from upstream schema-anchored extraction.
 *
 * This is the architectural defence against the '5% Literature Review'
 * hallucination class re-emerging in primary / secondary streams: the
 * transformer cannot invent because it has no model in the pipeline.
 *
 * Hard rule from the Blueprint:
 *   literal_mode_never_generates_content_only_transforms = true
 */

// Pattern → replacement table. Order matters: more specific patterns
// fire first so they are not eaten by greedier later ones.
const PATTERNS = [
  // Vague advisory phrasing → imperative.
  [/\bconsider revising\b/gi, 'change'],
  [/\bit is recommended that\b/gi, 'do this:'],
  [/\bgoing forward\b/gi, ''],
  [/\bin order to\b/gi, 'to'],
  [/\bplease ensure that\b/gi, 'make sure'],
  [/\bit may be helpful to\b/gi, 'try to'],

  // Academic verbs → plain verbs.
  [/\bsynthesise\b/gi, 'combine ideas from'],
  [/\bsynthesize\b/gi, 'combine ideas from'],
  [/\bdemonstrates\b/gi, 'shows'],
  [/\bdemonstrate\b/gi, 'show'],
  [/\barticulate\b/gi, 'say'],
  [/\barticulated\b/gi, 'said'],
  [/\bengage with\b/gi, 'read'],
  [/\bengaging with\b/gi, 'reading'],
  [/\bfurthermore\b/gi, 'also'],
  [/\bmoreover\b/gi, 'also'],
  [/\bnotwithstanding\b/gi, 'even so'],
  [/\bnevertheless\b/gi, 'still'],
  [/\bconsequently\b/gi, 'so'],
  [/\bthereby\b/gi, 'so'],

  // Passive → active. These are heuristics, not full grammar parsing.
  // They handle the common rubric voice: 'should be revised', 'must be
  // demonstrated', 'is to be considered'.
  [/\bshould be revised\b/gi, 'rewrite this'],
  [/\bmust be demonstrated\b/gi, 'show this'],
  [/\bis to be considered\b/gi, 'think about'],
  [/\bare required to\b/gi, 'must'],
  [/\bis required to\b/gi, 'must']
];

const sanitiseDashes = (s) => String(s || '').replace(/[\u2014\u2013]/g, ',');

/**
 * literalise(text, options)
 *   text: string from schema-anchored upstream
 *   options:
 *     splitClauses: boolean (default true) - split multi-clause sentences
 *                   into one instruction per sentence
 *     dropEmpty: boolean (default true) - strip leftover whitespace from
 *                deletions like 'going forward'
 * Returns the transformed string. If text is empty or non-string,
 * returns it unchanged.
 */
export const literalise = (text, options = {}) => {
  if (!text || typeof text !== 'string') return text;
  const { splitClauses = true, dropEmpty = true } = options;
  let out = sanitiseDashes(text);
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  if (splitClauses) {
    // Split on semicolons and the patterns ', and ' / ', but ' that often
    // chain two instructions in academic prose. One instruction per
    // sentence is the readability target.
    out = out.replace(/;\s*/g, '. ');
    out = out.replace(/,\s*(and|but|so|while|whereas)\s+/gi, '. ');
  }
  if (dropEmpty) {
    out = out.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
    // Capitalise the first letter of any sentence that starts lowercase
    // after our deletions / splits.
    out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());
  }
  return out;
};

/**
 * shouldLiteralise(streamProfile, userPreference): single source of truth
 * for whether a render path should run output through literalise(). Stream
 * profile sets the default; userPreference (when not null) overrides.
 */
export const shouldLiteralise = (streamProfile, userPreference) => {
  if (typeof userPreference === 'boolean') return userPreference;
  return !!streamProfile?.literalModeDefault;
};

export const __internals = { PATTERNS, sanitiseDashes };
