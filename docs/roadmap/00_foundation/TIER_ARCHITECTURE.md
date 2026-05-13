# Tier Architecture [SPEC]

## What this is

A universal container system where Simplifii adapts to user level. Same Executive Function Stack across all tiers; what changes is the container shape, default settings, register expectations, and pricing.

## Status

[SPEC] — never built. Was queued for sprint that didn't execute. Ready to refine.

## Why this is foundation

Without tiers, the product is generic. With tiers, the product meets every user where they are. Without tier architecture, none of the dependent features (Research mode, Homeschool mode, Institutional mode) can exist.

## The five tiers

### TIER_SECONDARY
- Year 11-12 (HSC, IB, A-Levels)
- Major work types: HSC Major Work, IB EE, Science Extension, English Extension, History Extension, Society & Culture PIP
- Word count: 1,500-8,000
- Timeframe: 1-12 months
- Supervisor role: 'teacher'
- Methodology complexity: introductory
- Citation styles: MLA, APA 7
- Reflexivity: not required
- Ethics: not required
- Vibe Meter sweet spot: 40-60

### TIER_UNDERGRAD
- Bachelor's students
- Examples: Essays, lab reports, final projects
- Container: Course → Assessment → Draft (existing course mode)
- Word count: 800-6,000
- Timeframe: 1-4 months
- Supervisor: 'lecturer'
- Citation styles: APA 7, Harvard, Chicago, Vancouver, AGLC4
- Reflexivity: not required
- Ethics: not required
- Vibe Meter: 55-75

### TIER_HONOURS_MASTERS_COURSEWORK
- Honours thesis, capstone, coursework Masters dissertation
- Container: Project → Chapters → Drafts
- Word count: 10,000-30,000
- Timeframe: 6-18 months
- Supervisor: 'primary supervisor'
- Reflexivity: optional
- Ethics: sometimes
- Vibe Meter: 65-85

### TIER_RESEARCH_HIGHER_DEGREE
- MRes, PhD, doctoral thesis
- Container: Project → Phases → Strands → Chapters → Drafts
- Word count: 20,000-100,000
- Timeframe: 12-60 months
- Reflexivity: methodological
- Ethics: usually required
- Vibe Meter: 75-95
- Enables: phases, strands, reflexivity log, methodology log, cross-phase amalgamation, defence mode

### TIER_ACADEMIC_PROFESSIONAL
- Postdocs, faculty, senior researchers
- Examples: journal articles, book chapters, monographs, grants, policy submissions
- Container: Workspace → Publications → Drafts
- Word count: 3,000-80,000
- Timeframe: 1-60 months
- Enables: co-authors, journal targets, peer review responses, multi-publication tracking
- Vibe Meter: 80-95

## Capability mapping

Each facet (feature) is enabled per tier:

| Facet | Secondary | Undergrad | Hons/Masters | RHD | Academic |
|---|---|---|---|---|---|
| Voice DNA | no | yes | yes | yes | yes |
| Citation Engine | yes | yes | yes | yes | yes |
| Reflexivity Log | no | no | optional | yes | yes |
| Methodology Log | no | no | yes | yes | yes |
| Phases & Strands | no | no | no | yes | yes |
| Supervisor Integration | basic | basic | full | full | n/a |
| Ethics Tracking | no | no | yes | yes | yes |
| Co-Author Workflows | no | no | no | no | yes |
| Cross-Phase Amalgamation | no | no | no | yes | yes |
| Defence Mode | no | no | no | yes | n/a |
| Practice Mode | yes | yes | yes | yes | yes |
| Institutional Dashboard | n/a (read by school) | n/a | n/a | n/a | n/a (read by faculty) |

## Service API contract

```js
TierService.getCapabilities(tier) → {
  enabledFacets: [string],
  defaultSweetSpot: { min, max },
  supervisorLabel: string,
  containerShape: string,
  defaultCitationStyles: [string],
  reflexivityRequirement: 'none' | 'optional' | 'methodological',
  ethicsRequirement: 'none' | 'sometimes' | 'usually'
}

TierService.isFacetEnabled(tier, facet) → boolean
TierService.canSwitchTier(fromTier, toTier) → boolean
TierService.migrateContainer(project, newTier) → migration plan
TierService.getAllTiers() → [tierDefinitions]
```

## Onboarding routing

User signs up → identifies their situation:
- "I'm in Year 11/12" → TIER_SECONDARY
- "I'm at uni doing a Bachelor's" → TIER_UNDERGRAD
- "I'm doing Honours or coursework Masters" → TIER_HONOURS_MASTERS_COURSEWORK
- "I'm doing research (MRes/PhD)" → TIER_RESEARCH_HIGHER_DEGREE
- "I'm an academic" → TIER_ACADEMIC_PROFESSIONAL
- "I'm not sure" → defaults to TIER_UNDERGRAD with prompt to refine later
- "I'm a parent homeschooling" → routes to Sovereign Home product (separate flow)
- "I'm a teacher/professor" → routes to B2B Institutional (separate flow)

## What this sprint should ship

1. `src/services/TierService.js` with all 5 tier definitions
2. Capability map
3. Migration logic between tiers
4. Tier picker in onboarding
5. Settings reflect active tier
6. Tests for tier switching

## Build cost

3-4 hours. Single CC sprint. No dependencies.

## Why this must ship first

Every other product (Research, Home, Equity, B2B) keys off tier. Build this once, build everything cleanly after.

## Notes added

- 2026-05-15: Originally specced in Sovereign Research OS sprint. Never built. Foundation for all other modes.
