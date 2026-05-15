/**
 * sensoryProfiles.js
 *
 * 10 sensory profiles mapped to the sensory dial (1-10).
 * Each profile defines how the entire UI behaves at that intensity level.
 * Level 1 = minimal stimulation. Level 10 = full experience.
 */

const SENSORY_PROFILES = [
  null, // index 0 unused (dial is 1-10)
  // Level 1: Absolute minimal
  {
    animationSpeed: 0,
    fontWeight: 400,
    lineHeight: 2.0,
    columnDensity: 'single',
    backgroundIntensity: 'flat',
    soundEnabled: false,
    ambientEffects: false,
    bionicTextDefault: false,
    cursorSize: 'xl',
    matrixRain: false,
    tutorResponseLength: 'brief',
    transitionMs: 0,
  },
  // Level 2: Near-minimal
  {
    animationSpeed: 0,
    fontWeight: 400,
    lineHeight: 1.9,
    columnDensity: 'single',
    backgroundIntensity: 'flat',
    soundEnabled: false,
    ambientEffects: false,
    bionicTextDefault: false,
    cursorSize: 'large',
    matrixRain: false,
    tutorResponseLength: 'brief',
    transitionMs: 200,
  },
  // Level 3: Calm
  {
    animationSpeed: 0.3,
    fontWeight: 400,
    lineHeight: 1.8,
    columnDensity: 'narrow',
    backgroundIntensity: 'flat',
    soundEnabled: false,
    ambientEffects: false,
    bionicTextDefault: true,
    cursorSize: 'large',
    matrixRain: false,
    tutorResponseLength: 'brief',
    transitionMs: 300,
  },
  // Level 4: Gentle
  {
    animationSpeed: 0.5,
    fontWeight: 400,
    lineHeight: 1.8,
    columnDensity: 'narrow',
    backgroundIntensity: 'subtle',
    soundEnabled: false,
    ambientEffects: true,
    bionicTextDefault: true,
    cursorSize: 'standard',
    matrixRain: false,
    tutorResponseLength: 'medium',
    transitionMs: 400,
  },
  // Level 5: Standard (default)
  {
    animationSpeed: 0.8,
    fontWeight: 400,
    lineHeight: 1.8,
    columnDensity: 'standard',
    backgroundIntensity: 'subtle',
    soundEnabled: false,
    ambientEffects: true,
    bionicTextDefault: false,
    cursorSize: 'standard',
    matrixRain: false,
    tutorResponseLength: 'medium',
    transitionMs: 400,
  },
  // Level 6: Engaged
  {
    animationSpeed: 1.0,
    fontWeight: 500,
    lineHeight: 1.6,
    columnDensity: 'standard',
    backgroundIntensity: 'medium',
    soundEnabled: true,
    ambientEffects: true,
    bionicTextDefault: false,
    cursorSize: 'standard',
    matrixRain: false,
    tutorResponseLength: 'medium',
    transitionMs: 400,
  },
  // Level 7: Active
  {
    animationSpeed: 1.0,
    fontWeight: 500,
    lineHeight: 1.6,
    columnDensity: 'standard',
    backgroundIntensity: 'medium',
    soundEnabled: true,
    ambientEffects: true,
    bionicTextDefault: false,
    cursorSize: 'standard',
    matrixRain: false,
    tutorResponseLength: 'detailed',
    transitionMs: 300,
  },
  // Level 8: Stimulating
  {
    animationSpeed: 1.2,
    fontWeight: 500,
    lineHeight: 1.5,
    columnDensity: 'standard',
    backgroundIntensity: 'full',
    soundEnabled: true,
    ambientEffects: true,
    bionicTextDefault: false,
    cursorSize: 'standard',
    matrixRain: true,
    tutorResponseLength: 'detailed',
    transitionMs: 300,
  },
  // Level 9: High energy
  {
    animationSpeed: 1.3,
    fontWeight: 600,
    lineHeight: 1.4,
    columnDensity: 'standard',
    backgroundIntensity: 'full',
    soundEnabled: true,
    ambientEffects: true,
    bionicTextDefault: false,
    cursorSize: 'standard',
    matrixRain: true,
    tutorResponseLength: 'detailed',
    transitionMs: 200,
  },
  // Level 10: Maximum
  {
    animationSpeed: 1.5,
    fontWeight: 600,
    lineHeight: 1.4,
    columnDensity: 'standard',
    backgroundIntensity: 'full',
    soundEnabled: true,
    ambientEffects: true,
    bionicTextDefault: false,
    cursorSize: 'standard',
    matrixRain: true,
    tutorResponseLength: 'detailed',
    transitionMs: 150,
  },
];

/**
 * Get the sensory profile for a given level (1-10).
 * @param {number} level - 1 to 10
 * @returns {object} sensory profile config
 */
export const getSensoryProfile = (level) => {
  const clamped = Math.max(1, Math.min(10, Math.round(level) || 5));
  return SENSORY_PROFILES[clamped];
};

/**
 * Get CSS custom properties for a sensory level.
 * Apply these to the canvas root element.
 */
export const getSensoryCSSVars = (level) => {
  const p = getSensoryProfile(level);
  return {
    '--sensory-animation-speed': String(p.animationSpeed),
    '--sensory-font-weight': String(p.fontWeight),
    '--sensory-line-height': String(p.lineHeight),
    '--sensory-transition-ms': `${p.transitionMs}ms`,
  };
};

/**
 * Get the tutor response length instruction for the system prompt.
 */
export const getTutorLengthInstruction = (level) => {
  const p = getSensoryProfile(level);
  if (p.tutorResponseLength === 'brief') {
    return 'User sensory level is LOW (1-3). Give brief one-sentence responses. No examples unless asked. Under 30 words.';
  }
  if (p.tutorResponseLength === 'detailed') {
    return 'User sensory level is HIGH (7-10). Give detailed responses with examples and multiple angles. Up to 150 words.';
  }
  return 'User sensory level is MEDIUM (4-6). Standard responses. 50-80 words.';
};

export default SENSORY_PROFILES;
