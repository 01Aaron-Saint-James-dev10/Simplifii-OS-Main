/**
 * TierService
 *
 * Canonical tier definitions for Simplifii-OS.
 * Five academic tiers, each with a capability map, container shape,
 * Vibe Meter sweet spot, citation defaults, and supervisor label.
 *
 * This is the single source of truth for tier-gated features.
 * All other services and components must read from here.
 *
 * Hard rules:
 *   - Tier config NEVER comes from inference or an LLM.
 *   - isFacetEnabled is the only gate for conditional rendering.
 *   - migrateContainer returns a plan object; it never mutates state.
 */

// ─── Tier constants ───────────────────────────────────────────────────────────

export const TIER_SECONDARY                  = 'TIER_SECONDARY';
export const TIER_UNDERGRAD                  = 'TIER_UNDERGRAD';
export const TIER_HONOURS_MASTERS_COURSEWORK = 'TIER_HONOURS_MASTERS_COURSEWORK';
export const TIER_RESEARCH_HIGHER_DEGREE     = 'TIER_RESEARCH_HIGHER_DEGREE';
export const TIER_ACADEMIC_PROFESSIONAL      = 'TIER_ACADEMIC_PROFESSIONAL';

export const ALL_TIERS = [
  TIER_SECONDARY,
  TIER_UNDERGRAD,
  TIER_HONOURS_MASTERS_COURSEWORK,
  TIER_RESEARCH_HIGHER_DEGREE,
  TIER_ACADEMIC_PROFESSIONAL,
];

// ─── Facet names ─────────────────────────────────────────────────────────────

export const FACET_VOICE_DNA               = 'voiceDna';
export const FACET_CITATION_ENGINE         = 'citationEngine';
export const FACET_REFLEXIVITY_LOG         = 'reflexivityLog';
export const FACET_METHODOLOGY_LOG         = 'methodologyLog';
export const FACET_PHASES_AND_STRANDS      = 'phasesAndStrands';
export const FACET_SUPERVISOR_INTEGRATION  = 'supervisorIntegration';
export const FACET_ETHICS_TRACKING         = 'ethicsTracking';
export const FACET_CO_AUTHOR_WORKFLOWS     = 'coAuthorWorkflows';
export const FACET_CROSS_PHASE_AMALGAM     = 'crossPhaseAmalgamation';
export const FACET_DEFENCE_MODE            = 'defenceMode';
export const FACET_PRACTICE_MODE           = 'practiceMode';
export const FACET_INSTITUTIONAL_DASHBOARD = 'institutionalDashboard';

// ─── Tier definitions ─────────────────────────────────────────────────────────

const TIER_DEFINITIONS = {
  [TIER_SECONDARY]: {
    id: TIER_SECONDARY,
    label: 'Secondary',
    description: 'Year 11 to 12 (HSC, IB, A-Levels)',
    containerShape: 'course',
    wordCountRange: { min: 1500, max: 8000 },
    timeframeMonths: { min: 1, max: 12 },
    supervisorLabel: 'teacher',
    defaultCitationStyles: ['MLA', 'APA7'],
    reflexivityRequirement: 'none',
    ethicsRequirement: 'none',
    vibeMeterSweetSpot: { min: 40, max: 60 },
    enabledFacets: [
      FACET_CITATION_ENGINE,
      FACET_PRACTICE_MODE,
    ],
    supervisorIntegrationLevel: 'basic',
  },

  [TIER_UNDERGRAD]: {
    id: TIER_UNDERGRAD,
    label: 'Undergraduate',
    description: "Bachelor's degree students",
    containerShape: 'course',
    wordCountRange: { min: 800, max: 6000 },
    timeframeMonths: { min: 1, max: 4 },
    supervisorLabel: 'lecturer',
    defaultCitationStyles: ['APA7', 'Harvard', 'Chicago', 'Vancouver', 'AGLC4'],
    reflexivityRequirement: 'none',
    ethicsRequirement: 'none',
    vibeMeterSweetSpot: { min: 55, max: 75 },
    enabledFacets: [
      FACET_VOICE_DNA,
      FACET_CITATION_ENGINE,
      FACET_PRACTICE_MODE,
    ],
    supervisorIntegrationLevel: 'basic',
  },

  [TIER_HONOURS_MASTERS_COURSEWORK]: {
    id: TIER_HONOURS_MASTERS_COURSEWORK,
    label: 'Honours / Masters',
    description: 'Honours thesis, capstone, or coursework Masters dissertation',
    containerShape: 'project',
    wordCountRange: { min: 10000, max: 30000 },
    timeframeMonths: { min: 6, max: 18 },
    supervisorLabel: 'primary supervisor',
    defaultCitationStyles: ['APA7', 'Harvard', 'Chicago', 'Vancouver', 'AGLC4'],
    reflexivityRequirement: 'optional',
    ethicsRequirement: 'sometimes',
    vibeMeterSweetSpot: { min: 65, max: 85 },
    enabledFacets: [
      FACET_VOICE_DNA,
      FACET_CITATION_ENGINE,
      FACET_REFLEXIVITY_LOG,
      FACET_METHODOLOGY_LOG,
      FACET_SUPERVISOR_INTEGRATION,
      FACET_ETHICS_TRACKING,
      FACET_PRACTICE_MODE,
    ],
    supervisorIntegrationLevel: 'full',
  },

  [TIER_RESEARCH_HIGHER_DEGREE]: {
    id: TIER_RESEARCH_HIGHER_DEGREE,
    label: 'Research Higher Degree',
    description: 'MRes, PhD, or doctoral thesis',
    containerShape: 'project',
    wordCountRange: { min: 20000, max: 100000 },
    timeframeMonths: { min: 12, max: 60 },
    supervisorLabel: 'primary supervisor',
    defaultCitationStyles: ['APA7', 'Harvard', 'Chicago', 'Vancouver', 'AGLC4'],
    reflexivityRequirement: 'methodological',
    ethicsRequirement: 'usually',
    vibeMeterSweetSpot: { min: 75, max: 95 },
    enabledFacets: [
      FACET_VOICE_DNA,
      FACET_CITATION_ENGINE,
      FACET_REFLEXIVITY_LOG,
      FACET_METHODOLOGY_LOG,
      FACET_PHASES_AND_STRANDS,
      FACET_SUPERVISOR_INTEGRATION,
      FACET_ETHICS_TRACKING,
      FACET_CROSS_PHASE_AMALGAM,
      FACET_DEFENCE_MODE,
      FACET_PRACTICE_MODE,
    ],
    supervisorIntegrationLevel: 'full',
  },

  [TIER_ACADEMIC_PROFESSIONAL]: {
    id: TIER_ACADEMIC_PROFESSIONAL,
    label: 'Academic Professional',
    description: 'Postdocs, faculty, and senior researchers',
    containerShape: 'workspace',
    wordCountRange: { min: 3000, max: 80000 },
    timeframeMonths: { min: 1, max: 60 },
    supervisorLabel: null,
    defaultCitationStyles: ['APA7', 'Harvard', 'Chicago', 'Vancouver', 'AGLC4'],
    reflexivityRequirement: 'methodological',
    ethicsRequirement: 'usually',
    vibeMeterSweetSpot: { min: 80, max: 95 },
    enabledFacets: [
      FACET_VOICE_DNA,
      FACET_CITATION_ENGINE,
      FACET_REFLEXIVITY_LOG,
      FACET_METHODOLOGY_LOG,
      FACET_PHASES_AND_STRANDS,
      FACET_ETHICS_TRACKING,
      FACET_CO_AUTHOR_WORKFLOWS,
      FACET_CROSS_PHASE_AMALGAM,
      FACET_PRACTICE_MODE,
    ],
    supervisorIntegrationLevel: 'none',
  },
};

// ─── Onboarding answer map ────────────────────────────────────────────────────

const ONBOARDING_ANSWER_MAP = {
  "I'm in Year 11/12":                          TIER_SECONDARY,
  "I'm at uni doing a Bachelor's":               TIER_UNDERGRAD,
  "I'm doing Honours or coursework Masters":     TIER_HONOURS_MASTERS_COURSEWORK,
  "I'm doing research (MRes/PhD)":               TIER_RESEARCH_HIGHER_DEGREE,
  "I'm an academic":                             TIER_ACADEMIC_PROFESSIONAL,
  "I'm not sure":                                TIER_UNDERGRAD,
  "I'm a parent homeschooling":                  null,
  "I'm a teacher/professor":                     null,
};

// ─── Service API ──────────────────────────────────────────────────────────────

/**
 * Returns the full capability object for a tier.
 * Throws if the tier id is not valid.
 */
export function getCapabilities(tier) {
  const def = TIER_DEFINITIONS[tier];
  if (!def) throw new Error(`TierService: unknown tier "${tier}"`);
  return {
    enabledFacets:             [...def.enabledFacets],
    defaultSweetSpot:          { ...def.vibeMeterSweetSpot },
    supervisorLabel:           def.supervisorLabel,
    containerShape:            def.containerShape,
    defaultCitationStyles:     [...def.defaultCitationStyles],
    reflexivityRequirement:    def.reflexivityRequirement,
    ethicsRequirement:         def.ethicsRequirement,
    wordCountRange:            { ...def.wordCountRange },
    timeframeMonths:           { ...def.timeframeMonths },
    supervisorIntegrationLevel: def.supervisorIntegrationLevel,
  };
}

/**
 * Returns true if the given facet is enabled for the given tier.
 * Returns false for unknown tiers or unknown facets (no throw).
 */
export function isFacetEnabled(tier, facet) {
  const def = TIER_DEFINITIONS[tier];
  if (!def) return false;
  return def.enabledFacets.includes(facet);
}

/**
 * Returns true if both tier ids are valid.
 * Switching between any two valid tiers is always allowed at the service layer;
 * UI confirmation and container migration are the caller's responsibility.
 */
export function canSwitchTier(fromTier, toTier) {
  return Boolean(TIER_DEFINITIONS[fromTier] && TIER_DEFINITIONS[toTier]);
}

/**
 * Returns a migration plan describing what will change when a project
 * moves from one tier to another. Never mutates the project object.
 *
 * The plan is informational: the UI shows it to the user before confirming.
 */
export function migrateContainer(project, newTier) {
  if (!project) throw new Error('TierService.migrateContainer: project is required');
  const fromTier = project.tier;
  const fromDef  = TIER_DEFINITIONS[fromTier];
  const toDef    = TIER_DEFINITIONS[newTier];
  if (!toDef) throw new Error(`TierService.migrateContainer: unknown target tier "${newTier}"`);

  const fromFacets = fromDef ? fromDef.enabledFacets : [];
  const toFacets   = toDef.enabledFacets;

  const facetsGained = toFacets.filter(f => !fromFacets.includes(f));
  const facetsLost   = fromFacets.filter(f => !toFacets.includes(f));

  const containerChanging = fromDef
    ? fromDef.containerShape !== toDef.containerShape
    : true;

  return {
    fromTier,
    toTier:              newTier,
    containerShape:      toDef.containerShape,
    containerChanging,
    facetsGained,
    facetsLost,
    supervisorLabelFrom: fromDef ? fromDef.supervisorLabel : null,
    supervisorLabelTo:   toDef.supervisorLabel,
    dataLoss:            facetsLost.length > 0,
    summary: containerChanging || facetsLost.length > 0
      ? 'Some features and layout will change. Review below before confirming.'
      : 'No data will be lost. Layout and features stay the same.',
  };
}

/**
 * Returns all 5 tier definition objects (shallow copies).
 */
export function getAllTiers() {
  return ALL_TIERS.map(id => ({ ...TIER_DEFINITIONS[id] }));
}

/**
 * Maps a plain-language onboarding answer to a tier constant.
 * Returns TIER_UNDERGRAD for any unrecognised answer.
 * Returns null for answers that route outside the tier system
 * (homeschool, institutional) so the caller can redirect appropriately.
 */
export function resolveFromOnboardingAnswer(answer) {
  if (Object.prototype.hasOwnProperty.call(ONBOARDING_ANSWER_MAP, answer)) {
    return ONBOARDING_ANSWER_MAP[answer];
  }
  return TIER_UNDERGRAD;
}
