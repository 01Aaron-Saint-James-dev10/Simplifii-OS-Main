/**
 * AccessibilityProfileService.js
 *
 * Manages the 4 accessibility profiles + standard. Each profile defines
 * default settings, system prompt additions, and UI defaults.
 * Profiles are stored in Supabase but also have local fallbacks.
 */

export const PROFILES = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Default Simplifii experience',
    defaults: {},
    promptAddition: '',
    uiDefaults: {},
  },
  twice_exceptional: {
    id: 'twice_exceptional',
    name: 'Twice-exceptional (2e)',
    description: 'Gifted intelligence combined with learning differences. Advanced cognition with specific accessibility needs.',
    defaults: { sensoryLevel: 6, literalMode: false, decisionSkeleton: false },
    promptAddition: 'User is twice-exceptional: gifted intelligence combined with learning differences. Respond with intellectual depth AND accessibility. Use sophisticated vocabulary. Offer multi-layer explanations: surface + deeper analysis. Acknowledge complexity rather than oversimplifying. Watch for perfectionism shutdown: validate effort. Reduce shame around easy steps: frame as thorough. Recognise masking: if user dismisses help, gently re-offer. Allow tangential interests as productive, not distraction.',
    uiDefaults: { fontScale: 'normal', bionicReading: false, sensoryLevel: 6 },
    formatPriority: ['original', 'worked_example', 'visual'],
  },
  autism_level_3: {
    id: 'autism_level_3',
    name: 'Autism (substantial support)',
    description: 'Predictable, minimal stimulation, one-thing-at-a-time interactions.',
    defaults: { sensoryLevel: 2, literalMode: true, decisionSkeleton: true, predictabilityAnnouncements: true },
    promptAddition: 'User has Autism Level 3: substantial support needs. Respond with maximum predictability and minimal cognitive load. One concept per response, never multiple. Use exact same opening phrase each session. Confirm understanding before adding new info. Visual scaffolds first, text second. Never use figurative language. Step-by-step with numbered list always. Stay with user chosen topic: do not redirect. Use first-person I (clearer agency). Mark all uncertainty: [I think] vs [confirmed]. Allow processing time: Take your time between exchanges.',
    uiDefaults: { fontScale: 'large', lineSpacing: 'loose', bionicReading: false, sensoryLevel: 2, reducedMotion: true },
    formatPriority: ['plain_english', 'step_by_step', 'visual'],
  },
  adhd: {
    id: 'adhd',
    name: 'ADHD',
    description: 'Attention regulation. Working memory challenges. Dopamine-driven motivation.',
    defaults: { sensoryLevel: 7, literalMode: false, decisionSkeleton: false },
    promptAddition: 'User has ADHD. Respond with stimulating engagement and external structure. Lead with the most interesting or important point. Use varied response lengths to maintain attention. Bold or highlight key actionable items. Provide explicit time estimates for every task. Break work into 5-15 min chunks max. Use novelty: vary phrasing, examples, formats. Add stakes or urgency where genuine. Celebrate transitions between tasks. Body doubling tone: Let us tackle this together. Externalise working memory: You said earlier you wanted X.',
    uiDefaults: { fontScale: 'normal', bionicReading: true, sensoryLevel: 7 },
    formatPriority: ['step_by_step', 'visual', 'audio'],
  },
  dyslexic: {
    id: 'dyslexic',
    name: 'Dyslexic',
    description: 'Reading and decoding difference. Strong oral and visual reasoning.',
    defaults: { sensoryLevel: 5, literalMode: false },
    promptAddition: 'User has dyslexia. Respond with maximum text accessibility. Short sentences (max 15 words). Active voice always. Use bullet points not paragraphs. Avoid passive constructions. Repeat key terms with consistent spelling. Use words user has seen before in this session. Lead with the conclusion, then explain. Offer audio version of all responses. Use visual analogies and diagrams. Mark difficult words with definition tooltips. NEVER include unnecessary punctuation. Hyphenate complex words when introducing.',
    uiDefaults: { fontScale: 'large', lineSpacing: 'relaxed', bionicReading: false, sensoryLevel: 5, editorFont: 'opendyslexic' },
    formatPriority: ['audio', 'visual', 'plain_english'],
  },
};

/**
 * Get the system prompt addition for a profile (or multiple profiles).
 * @param {string|string[]} profileIds
 * @returns {string}
 */
export const getProfilePromptAddition = (profileIds) => {
  const ids = Array.isArray(profileIds) ? profileIds : [profileIds];
  return ids
    .map(id => PROFILES[id]?.promptAddition || '')
    .filter(Boolean)
    .join('\n\n');
};

/**
 * Get the merged UI defaults for one or more profiles.
 * Later profiles override earlier ones (sensory takes minimum).
 * @param {string|string[]} profileIds
 * @returns {object}
 */
export const getMergedUIDefaults = (profileIds) => {
  const ids = Array.isArray(profileIds) ? profileIds : [profileIds];
  const merged = {};
  let minSensory = 10;
  for (const id of ids) {
    const profile = PROFILES[id];
    if (!profile) continue;
    Object.assign(merged, profile.uiDefaults);
    if (profile.uiDefaults.sensoryLevel != null) {
      minSensory = Math.min(minSensory, profile.uiDefaults.sensoryLevel);
    }
  }
  if (ids.length > 1) merged.sensoryLevel = minSensory;
  return merged;
};

/**
 * Get the preferred format priority for a profile.
 * @param {string} profileId
 * @returns {string[]}
 */
export const getFormatPriority = (profileId) => {
  return PROFILES[profileId]?.formatPriority || ['original', 'plain_english', 'step_by_step'];
};

/**
 * Get all profile cards for the onboarding/settings UI.
 */
export const getProfileCards = () => Object.values(PROFILES).map(p => ({
  id: p.id,
  name: p.name,
  description: p.description,
}));
