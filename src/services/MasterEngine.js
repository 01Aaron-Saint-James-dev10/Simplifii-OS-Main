/**
 * MasterEngine.js
 *
 * Two responsibilities:
 *   1. Active Grounding: simulate Gemini + Google Cloud Search claim verification
 *      against the user's Drive Research Vault (verifyClaim).
 *   2. Feature Registry: a single source of truth for the "Universal Suite" of
 *      modules every Simplifii-OS student can boot on demand. Components are
 *      lazy-loaded so they only enter the bundle when actually rendered.
 */

import { lazy } from 'react';

const GCP_PROJECT_ID = process.env.REACT_APP_GCP_PROJECT_ID || 'simplifii-os-production';

// ---------------------------------------------------------------------------
// 1. Active Grounding (Truth HUD pipeline simulation)
// ---------------------------------------------------------------------------

export const verifyClaim = async (text, authToken) => {
  if (!text || text.trim().length < 15) return null;

  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerText = text.toLowerCase();

      if (lowerText.includes('mitochondria') || lowerText.includes('atp')) {
        resolve({
          status: 'verified',
          confidence: 0.98,
          message: 'Claim verified against Drive Vault (BABS1201_Lecture3.pdf).',
          source: 'vault'
        });
      } else if (lowerText.includes('always') || lowerText.includes('never') || lowerText.includes('prove')) {
        resolve({
          status: 'flagged',
          confidence: 0.45,
          message: 'Absolute claim detected. Suggest softening language or citing peer-reviewed evidence.',
          source: 'gemini'
        });
      } else if (lowerText.includes('2024') || lowerText.includes('recent')) {
        resolve({
          status: 'web_verified',
          confidence: 0.88,
          message: 'Recent fact corroborated via Google Cloud Search.',
          source: 'web'
        });
      } else {
        resolve(null);
      }
    }, 800);
  });
};

// ---------------------------------------------------------------------------
// 2. Universal Feature Registry
// ---------------------------------------------------------------------------
// Every student tier (highschool, undergrad, mres, phd) gets the modules that
// fit their workflow. Add new entries here when a new Universal-suite module
// lands; nothing else has to change.

export const TIERS = ['highschool', 'undergrad', 'mres', 'phd'];

export const FeatureRegistry = {
  smartIntake: {
    label: 'Smart Intake',
    description: 'Lighter-weight sprint creator for quick course briefs.',
    component: lazy(() => import('../frontend/SmartIntake')),
    tiers: ['highschool', 'undergrad', 'mres', 'phd']
  },
  humaniser: {
    label: 'Humaniser',
    description: 'Tone rewrite that preserves the student\'s authentic voice.',
    component: lazy(() => import('../frontend/Humaniser')),
    tiers: ['highschool', 'undergrad', 'mres', 'phd']
  },
  graphView: {
    label: 'Knowledge Graph View',
    description: 'Visualise the semantic entities pulled from research sources.',
    component: lazy(() => import('../frontend/GraphView')),
    tiers: ['undergrad', 'mres', 'phd']
  },
  essayScorer: {
    label: 'Essay Scorer',
    description: 'Score current draft against the active rubric criteria.',
    component: lazy(() => import('../frontend/EssayScorer')),
    tiers: ['highschool', 'undergrad', 'mres', 'phd']
  }
};

export const getAvailableFeatures = (tier) => {
  if (!tier || !TIERS.includes(tier)) return [];
  return Object.entries(FeatureRegistry)
    .filter(([, feat]) => feat.tiers.includes(tier))
    .map(([key, feat]) => ({ key, ...feat }));
};

export const getFeature = (key) => FeatureRegistry[key] || null;

// EffortTracker is a hook (not a mountable component) so it travels through
// MasterEngine as a re-export rather than an entry in the registry.
export { useEffortTracker } from '../frontend/EffortTracker';
