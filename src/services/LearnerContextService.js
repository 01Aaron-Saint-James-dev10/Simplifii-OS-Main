/**
 * LearnerContextService.js
 *
 * Builds a LEARNER CONTEXT block from all collected profile data.
 * Injected into every AI system prompt so Claude adapts to the
 * specific learner, not a generic student.
 *
 * Data sources:
 *   - Supabase profiles: tier, year_level, state, pain_points, preferences.profiler
 *   - SettingsContext: accessibilityProfile, sensoryLevel, scaffoldingLevel, gritLevel, lodLevel
 *   - Session check-in: energy, mood, goal (when available)
 */

const PROFILER_DESCRIPTIONS = {
  workingMemory: {
    reread: 'frequently needs to re-read entire passages to retain information',
    reread_sentence: 'needs to re-read individual sentences occasionally',
    continue: 'generally retains information on first read',
    unsure: 'uncertain about their working memory patterns',
  },
  cognitiveLoad: {
    freeze: 'freezes when facing too many tasks at once',
    rank: 'can rank tasks when guided but struggles unprompted',
    pick: 'can independently pick priorities from a list',
    unsure: 'uncertain about their task prioritisation ability',
  },
  taskInitiation: {
    stare: 'experiences significant blank-page paralysis',
    notes: 'starts with scattered notes before structuring',
    dive: 'can dive straight into writing without scaffolding',
    unsure: 'uncertain about their starting patterns',
  },
  attentionRegulation: {
    hyperfocus_crash: 'hyperfocuses then crashes (burst-rest pattern)',
    pomodoro: 'works best in timed intervals with structured breaks',
    drift: 'attention drifts frequently without external cues',
    steady: 'can sustain attention for longer periods',
  },
  emotionUnderPressure: {
    panic_start: 'panics and starts rushing under deadline pressure',
    shutdown: 'shuts down and avoids the task under pressure',
    plan: 'responds to pressure by planning and prioritising',
    unsure: 'uncertain about their pressure response',
  },
  feedbackProcessing: {
    avoid: 'avoids reading feedback (fear of negative evaluation)',
    skim: 'skims feedback quickly without deep processing',
    deep_read: 'reads feedback carefully and acts on it',
    unsure: 'uncertain about their feedback processing habits',
  },
};

const PAIN_POINT_PROMPTS = {
  'Starting tasks': 'struggles with task initiation',
  'Staying focused': 'has difficulty maintaining sustained attention',
  'Understanding what teachers want': 'finds it hard to decode assessment requirements',
  'Time management': 'struggles with time allocation and deadline management',
  'Anxiety before assessments': 'experiences assessment anxiety',
  'Reading long texts': 'finds extended reading challenging',
  'Writing essays': 'finds essay writing difficult',
  'Maths concepts': 'struggles with mathematical concepts',
  'Memorising for exams': 'has difficulty with rote memorisation',
  'Group work': 'finds collaborative work challenging',
  'Asking for help': 'finds it hard to ask for help',
  'Getting started after a break': 'struggles with re-engagement after time away',
};

/**
 * Build learner context string from profile data.
 *
 * @param {object} opts
 * @param {string} opts.tier - education tier
 * @param {string} opts.yearLevel - year level (secondary only)
 * @param {string} opts.state - Australian state
 * @param {string[]} opts.painPoints - self-reported pain points
 * @param {object} opts.profiler - profiler responses (6 dimensions)
 * @param {string} opts.accessibilityProfile - profile ID
 * @param {number} opts.sensoryLevel - sensory level 1-10
 * @param {string} opts.scaffoldingLevel - heavy/balanced/light
 * @param {string} opts.gritLevel - literal/balanced/socratic
 * @param {string} opts.lodLevel - compass/sprint/map
 * @param {object} opts.checkin - session check-in (energy, mood, goal)
 * @returns {string} LEARNER CONTEXT block for AI system prompts
 */
export function buildLearnerContext({
  tier, yearLevel, state, painPoints, profiler,
  accessibilityProfile, sensoryLevel, scaffoldingLevel, gritLevel, lodLevel,
  checkin,
} = {}) {
  const lines = [];

  // Education context
  if (tier === 'secondary' && yearLevel && state) {
    lines.push(`Education: ${yearLevel} student in ${state}, Australia`);
  } else if (tier) {
    const tierLabels = { primary: 'Primary school', secondary: 'Secondary school', tertiary: 'University undergraduate', postgrad: 'Postgraduate researcher', homeschool: 'Homeschool learner', tafe: 'TAFE/vocational student' };
    lines.push(`Education: ${tierLabels[tier] || tier}`);
  }

  // Cognitive profile from profiler
  if (profiler && typeof profiler === 'object') {
    const traits = [];
    for (const [dimension, value] of Object.entries(profiler)) {
      const desc = PROFILER_DESCRIPTIONS[dimension]?.[value];
      if (desc) traits.push(desc);
    }
    if (traits.length > 0) {
      lines.push(`Cognitive profile: ${traits.join('; ')}`);
    }
  }

  // Pain points
  if (Array.isArray(painPoints) && painPoints.length > 0) {
    const mapped = painPoints
      .map(p => PAIN_POINT_PROMPTS[p] || p.toLowerCase())
      .join(', ');
    lines.push(`Self-reported challenges: ${mapped}`);
  }

  // Steering dials
  const steeringParts = [];
  if (scaffoldingLevel && scaffoldingLevel !== 'balanced') steeringParts.push(`scaffolding: ${scaffoldingLevel}`);
  if (gritLevel && gritLevel !== 'balanced') steeringParts.push(`grit: ${gritLevel}`);
  if (lodLevel && lodLevel !== 'compass') steeringParts.push(`detail level: ${lodLevel}`);
  if (steeringParts.length > 0) lines.push(`Steering: ${steeringParts.join(', ')}`);

  // Session check-in
  if (checkin) {
    if (checkin.energy) lines.push(`Current energy: ${checkin.energy}/7`);
    if (checkin.mood) lines.push(`Current mood: ${checkin.mood}`);
    if (checkin.goal) lines.push(`Session goal: "${checkin.goal}"`);
  }

  if (lines.length === 0) return '';

  return `\nLEARNER CONTEXT (adapt your responses to this specific learner):
${lines.map(l => `- ${l}`).join('\n')}

ADAPT your tone, complexity, and scaffolding based on the above. If they struggle with task initiation, offer a concrete first step. If energy is low, keep responses brief. If scaffolding is set to heavy, provide more structure. If grit is set to socratic, ask questions instead of giving answers.`;
}

/**
 * Extract profiler data from Supabase profile row.
 * @param {object} profileRow - raw Supabase profile
 * @returns {object} { tier, yearLevel, state, painPoints, profiler }
 */
export function extractProfileData(profileRow) {
  if (!profileRow) return {};
  return {
    tier: profileRow.tier || null,
    yearLevel: profileRow.year_level || null,
    state: profileRow.state || null,
    painPoints: profileRow.pain_points || [],
    profiler: profileRow.preferences?.profiler || null,
  };
}
