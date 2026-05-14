/**
 * RecoveryReminders.js
 *
 * ADHD-friendly recovery prompts for the Pit Stop overlay.
 * Three categories: hydrate, stretch, fuel.
 * Each stretch prompt includes an optional SVG line animation path
 * for the user to follow with their eyes or head.
 */

export const HYDRATE_PROMPTS = [
  'BrOWSER needs fuel. Grab a glass of water before re-entering the cockpit.',
  'You just ran a 25-minute sprint. Water first, then victory.',
  'Your brain is 73% water. Top it up. Even half a glass counts.',
  'Pit stop rule: no re-entry without hydration. 30 seconds. You got this.',
  'Research tip: hydration improves working memory. This is not optional.',
];

export const FUEL_PROMPTS = [
  "If you haven't eaten in the last 2 hours, grab something now. A banana is enough.",
  'BrOWSER says: low fuel = low rigour. Quick snack, then back to it.',
  'Your prefrontal cortex runs on glucose. Feed it something real.',
  'Snack check: eat something with protein if you can. Your focus will thank you.',
  'Food is a methodological tool. A hungry researcher makes weak arguments.',
];

export const STRETCH_PROMPTS = [
  {
    text:    'Slow neck roll. Follow the green line with your chin. 10 seconds.',
    svgPath: 'M 20 50 Q 50 10 80 50 Q 50 90 20 50',
    label:   'Neck roll',
  },
  {
    text:    'Eyes only. Follow the line across the screen without moving your head.',
    svgPath: 'M 10 50 L 90 50',
    label:   'Horizontal eye track',
  },
  {
    text:    'Shoulder rolls. Follow the line up and over. Twice each side.',
    svgPath: 'M 30 70 Q 50 20 70 70',
    label:   'Shoulder arc',
  },
  {
    text:    'Figure-eight eye movement. Follow the line for 10 seconds.',
    svgPath: 'M 50 50 Q 25 25 50 50 Q 75 75 50 50 Q 25 75 50 50 Q 75 25 50 50',
    label:   'Figure eight',
  },
  {
    text:    'Look to the farthest point in the room. Hold for 5 seconds. Then back to screen.',
    svgPath: 'M 10 50 L 90 50 L 50 10',
    label:   'Distance reset',
  },
];

export const BREATHE_PROMPTS = [
  {
    text:    '4-7-8 breath. Follow the line in for 4, hold for 7, out for 8.',
    svgPath: 'M 10 80 Q 50 20 90 80',
    label:   '4-7-8 breath',
  },
  {
    text:    'Box breath. Follow each side: inhale, hold, exhale, hold. 4 counts each.',
    svgPath: 'M 20 20 L 80 20 L 80 80 L 20 80 Z',
    label:   'Box breath',
  },
];

/**
 * Get a random prompt from a category.
 * @param {'hydrate'|'fuel'|'stretch'|'breathe'} category
 */
export function getRandomPrompt(category) {
  const map = {
    hydrate: HYDRATE_PROMPTS,
    fuel:    FUEL_PROMPTS,
    stretch: STRETCH_PROMPTS,
    breathe: BREATHE_PROMPTS,
  };
  const pool = map[category] || HYDRATE_PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
