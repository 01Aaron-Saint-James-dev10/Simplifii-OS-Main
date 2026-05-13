import {
  getCapabilities,
  isFacetEnabled,
  canSwitchTier,
  migrateContainer,
  getAllTiers,
  resolveFromOnboardingAnswer,
  TIER_SECONDARY,
  TIER_UNDERGRAD,
  TIER_HONOURS_MASTERS_COURSEWORK,
  TIER_RESEARCH_HIGHER_DEGREE,
  TIER_ACADEMIC_PROFESSIONAL,
  ALL_TIERS,
  FACET_PHASES_AND_STRANDS,
  FACET_REFLEXIVITY_LOG,
  FACET_CITATION_ENGINE,
  FACET_DEFENCE_MODE,
  FACET_CO_AUTHOR_WORKFLOWS,
  FACET_VOICE_DNA,
} from './TierService';

// ─── getCapabilities ──────────────────────────────────────────────────────────

describe('getCapabilities', () => {
  test('returns a capabilities object for each of the 5 tiers', () => {
    for (const tier of ALL_TIERS) {
      const caps = getCapabilities(tier);
      expect(Array.isArray(caps.enabledFacets)).toBe(true);
      expect(caps.defaultSweetSpot).toHaveProperty('min');
      expect(caps.defaultSweetSpot).toHaveProperty('max');
      expect(typeof caps.containerShape).toBe('string');
      expect(Array.isArray(caps.defaultCitationStyles)).toBe(true);
    }
  });

  test('citation engine is enabled for all 5 tiers', () => {
    for (const tier of ALL_TIERS) {
      const caps = getCapabilities(tier);
      expect(caps.enabledFacets).toContain(FACET_CITATION_ENGINE);
    }
  });

  test('RHD sweet spot is 75-95', () => {
    const caps = getCapabilities(TIER_RESEARCH_HIGHER_DEGREE);
    expect(caps.defaultSweetSpot).toEqual({ min: 75, max: 95 });
  });

  test('secondary supervisor label is teacher', () => {
    const caps = getCapabilities(TIER_SECONDARY);
    expect(caps.supervisorLabel).toBe('teacher');
  });

  test('academic professional supervisor label is null', () => {
    const caps = getCapabilities(TIER_ACADEMIC_PROFESSIONAL);
    expect(caps.supervisorLabel).toBeNull();
  });

  test('throws for an unknown tier', () => {
    expect(() => getCapabilities('TIER_FAKE')).toThrow();
  });

  test('returns copies, not shared references', () => {
    const a = getCapabilities(TIER_UNDERGRAD);
    const b = getCapabilities(TIER_UNDERGRAD);
    a.enabledFacets.push('test');
    expect(b.enabledFacets).not.toContain('test');
  });
});

// ─── isFacetEnabled ───────────────────────────────────────────────────────────

describe('isFacetEnabled', () => {
  test('Phases and Strands enabled for RHD', () => {
    expect(isFacetEnabled(TIER_RESEARCH_HIGHER_DEGREE, FACET_PHASES_AND_STRANDS)).toBe(true);
  });

  test('Phases and Strands enabled for Academic Professional', () => {
    expect(isFacetEnabled(TIER_ACADEMIC_PROFESSIONAL, FACET_PHASES_AND_STRANDS)).toBe(true);
  });

  test('Phases and Strands NOT enabled for Undergrad', () => {
    expect(isFacetEnabled(TIER_UNDERGRAD, FACET_PHASES_AND_STRANDS)).toBe(false);
  });

  test('Phases and Strands NOT enabled for Secondary', () => {
    expect(isFacetEnabled(TIER_SECONDARY, FACET_PHASES_AND_STRANDS)).toBe(false);
  });

  test('Defence Mode enabled for RHD only', () => {
    expect(isFacetEnabled(TIER_RESEARCH_HIGHER_DEGREE, FACET_DEFENCE_MODE)).toBe(true);
    expect(isFacetEnabled(TIER_HONOURS_MASTERS_COURSEWORK, FACET_DEFENCE_MODE)).toBe(false);
    expect(isFacetEnabled(TIER_ACADEMIC_PROFESSIONAL, FACET_DEFENCE_MODE)).toBe(false);
    expect(isFacetEnabled(TIER_UNDERGRAD, FACET_DEFENCE_MODE)).toBe(false);
    expect(isFacetEnabled(TIER_SECONDARY, FACET_DEFENCE_MODE)).toBe(false);
  });

  test('Co-Author Workflows enabled for Academic Professional only', () => {
    expect(isFacetEnabled(TIER_ACADEMIC_PROFESSIONAL, FACET_CO_AUTHOR_WORKFLOWS)).toBe(true);
    for (const tier of ALL_TIERS.filter(t => t !== TIER_ACADEMIC_PROFESSIONAL)) {
      expect(isFacetEnabled(tier, FACET_CO_AUTHOR_WORKFLOWS)).toBe(false);
    }
  });

  test('Voice DNA NOT enabled for Secondary', () => {
    expect(isFacetEnabled(TIER_SECONDARY, FACET_VOICE_DNA)).toBe(false);
  });

  test('Voice DNA enabled for all tiers except Secondary', () => {
    for (const tier of ALL_TIERS.filter(t => t !== TIER_SECONDARY)) {
      expect(isFacetEnabled(tier, FACET_VOICE_DNA)).toBe(true);
    }
  });

  test('Reflexivity Log NOT enabled for Secondary or Undergrad', () => {
    expect(isFacetEnabled(TIER_SECONDARY, FACET_REFLEXIVITY_LOG)).toBe(false);
    expect(isFacetEnabled(TIER_UNDERGRAD, FACET_REFLEXIVITY_LOG)).toBe(false);
  });

  test('returns false for an unknown tier', () => {
    expect(isFacetEnabled('TIER_FAKE', FACET_CITATION_ENGINE)).toBe(false);
  });

  test('returns false for an unknown facet name', () => {
    expect(isFacetEnabled(TIER_UNDERGRAD, 'fakeFacet')).toBe(false);
  });
});

// ─── canSwitchTier ────────────────────────────────────────────────────────────

describe('canSwitchTier', () => {
  test('returns true for all valid tier-to-tier combinations', () => {
    for (const from of ALL_TIERS) {
      for (const to of ALL_TIERS) {
        expect(canSwitchTier(from, to)).toBe(true);
      }
    }
  });

  test('returns false when fromTier is invalid', () => {
    expect(canSwitchTier('TIER_FAKE', TIER_UNDERGRAD)).toBe(false);
  });

  test('returns false when toTier is invalid', () => {
    expect(canSwitchTier(TIER_UNDERGRAD, 'TIER_FAKE')).toBe(false);
  });

  test('returns false when both tiers are invalid', () => {
    expect(canSwitchTier('TIER_A', 'TIER_B')).toBe(false);
  });

  test('returns false when either argument is undefined', () => {
    expect(canSwitchTier(undefined, TIER_UNDERGRAD)).toBe(false);
    expect(canSwitchTier(TIER_UNDERGRAD, undefined)).toBe(false);
  });
});

// ─── migrateContainer ─────────────────────────────────────────────────────────

describe('migrateContainer', () => {
  test('returns a migration plan object for valid from/to pair', () => {
    const plan = migrateContainer({ tier: TIER_UNDERGRAD }, TIER_RESEARCH_HIGHER_DEGREE);
    expect(plan).toBeDefined();
    expect(plan.fromTier).toBe(TIER_UNDERGRAD);
    expect(plan.toTier).toBe(TIER_RESEARCH_HIGHER_DEGREE);
    expect(Array.isArray(plan.facetsGained)).toBe(true);
    expect(Array.isArray(plan.facetsLost)).toBe(true);
  });

  test('upgrading to RHD from Undergrad gains Phases and Strands', () => {
    const plan = migrateContainer({ tier: TIER_UNDERGRAD }, TIER_RESEARCH_HIGHER_DEGREE);
    expect(plan.facetsGained).toContain(FACET_PHASES_AND_STRANDS);
  });

  test('downgrading from RHD to Undergrad loses Defence Mode', () => {
    const plan = migrateContainer({ tier: TIER_RESEARCH_HIGHER_DEGREE }, TIER_UNDERGRAD);
    expect(plan.facetsLost).toContain(FACET_DEFENCE_MODE);
    expect(plan.dataLoss).toBe(true);
  });

  test('same-tier migration reports no container change and no data loss', () => {
    const plan = migrateContainer({ tier: TIER_UNDERGRAD }, TIER_UNDERGRAD);
    expect(plan.containerChanging).toBe(false);
    expect(plan.dataLoss).toBe(false);
  });

  test('summary is a non-empty string', () => {
    const plan = migrateContainer({ tier: TIER_UNDERGRAD }, TIER_RHD_OR_SECONDARY());
    expect(typeof plan.summary).toBe('string');
    expect(plan.summary.length).toBeGreaterThan(0);
  });

  test('throws when project is null', () => {
    expect(() => migrateContainer(null, TIER_UNDERGRAD)).toThrow();
  });

  test('throws when toTier is invalid', () => {
    expect(() => migrateContainer({ tier: TIER_UNDERGRAD }, 'TIER_FAKE')).toThrow();
  });

  test('handles project with no tier set (first-time migration)', () => {
    const plan = migrateContainer({ tier: undefined }, TIER_UNDERGRAD);
    expect(plan).toBeDefined();
    expect(plan.toTier).toBe(TIER_UNDERGRAD);
  });
});

// ─── getAllTiers ──────────────────────────────────────────────────────────────

describe('getAllTiers', () => {
  test('returns exactly 5 tier definitions', () => {
    expect(getAllTiers()).toHaveLength(5);
  });

  test('every entry has an id, label, and enabledFacets array', () => {
    for (const def of getAllTiers()) {
      expect(typeof def.id).toBe('string');
      expect(typeof def.label).toBe('string');
      expect(Array.isArray(def.enabledFacets)).toBe(true);
    }
  });

  test('returns copies, not internal references', () => {
    const defs = getAllTiers();
    defs[0].label = 'MUTATED';
    expect(getAllTiers()[0].label).not.toBe('MUTATED');
  });
});

// ─── resolveFromOnboardingAnswer ──────────────────────────────────────────────

describe('resolveFromOnboardingAnswer', () => {
  test('Year 11/12 resolves to TIER_SECONDARY', () => {
    expect(resolveFromOnboardingAnswer("I'm in Year 11/12")).toBe(TIER_SECONDARY);
  });

  test("Bachelor's resolves to TIER_UNDERGRAD", () => {
    expect(resolveFromOnboardingAnswer("I'm at uni doing a Bachelor's")).toBe(TIER_UNDERGRAD);
  });

  test('Honours/Masters resolves to TIER_HONOURS_MASTERS_COURSEWORK', () => {
    expect(resolveFromOnboardingAnswer("I'm doing Honours or coursework Masters")).toBe(TIER_HONOURS_MASTERS_COURSEWORK);
  });

  test('MRes/PhD resolves to TIER_RESEARCH_HIGHER_DEGREE', () => {
    expect(resolveFromOnboardingAnswer("I'm doing research (MRes/PhD)")).toBe(TIER_RESEARCH_HIGHER_DEGREE);
  });

  test('Academic resolves to TIER_ACADEMIC_PROFESSIONAL', () => {
    expect(resolveFromOnboardingAnswer("I'm an academic")).toBe(TIER_ACADEMIC_PROFESSIONAL);
  });

  test('"I\'m not sure" defaults to TIER_UNDERGRAD', () => {
    expect(resolveFromOnboardingAnswer("I'm not sure")).toBe(TIER_UNDERGRAD);
  });

  test('homeschool answer returns null (routes outside tier system)', () => {
    expect(resolveFromOnboardingAnswer("I'm a parent homeschooling")).toBeNull();
  });

  test('institutional answer returns null (routes outside tier system)', () => {
    expect(resolveFromOnboardingAnswer("I'm a teacher/professor")).toBeNull();
  });

  test('unknown answer defaults to TIER_UNDERGRAD', () => {
    expect(resolveFromOnboardingAnswer('something unexpected')).toBe(TIER_UNDERGRAD);
    expect(resolveFromOnboardingAnswer('')).toBe(TIER_UNDERGRAD);
    expect(resolveFromOnboardingAnswer(undefined)).toBe(TIER_UNDERGRAD);
  });
});

// ─── Helper used internally in tests ─────────────────────────────────────────

function TIER_RHD_OR_SECONDARY() {
  return TIER_RESEARCH_HIGHER_DEGREE;
}
