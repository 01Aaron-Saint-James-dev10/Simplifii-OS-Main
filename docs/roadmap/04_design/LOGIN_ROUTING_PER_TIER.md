# Login Routing Per Tier [SPEC]

## What this is

When a user logs in, they're routed to their tier's home layout. Adding new tiers or new features per tier never breaks other tiers' builds. Each tier's layout is isolated, swappable, additive.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15.

## Why this matters

Without routing isolation:
- Adding a feature to Sovereign Home risks breaking Sovereign Research
- Updating the RHD home layout could regress the HSC layout
- Builds become brittle, cross-tier
- Sprint risk compounds

With routing isolation:
- Each tier lives in its own folder
- Each tier owns its layout, navigation, default panels
- Shared primitives shared, owned layouts owned
- A bug in TIER_HOMESCHOOL never crashes TIER_RHD

## Architecture

### Folder structure

```
src/frontend/
├── primitives/              # shared across all tiers
├── components/              # shared compound components
├── tiers/
│   ├── secondary/
│   │   ├── SecondaryHome.jsx
│   │   ├── SecondaryNav.jsx
│   │   ├── SecondaryDashboard.jsx
│   │   ├── routes.js
│   │   └── config.js
│   ├── undergrad/
│   │   ├── UndergradHome.jsx
│   │   └── ...
│   ├── honours_masters/
│   ├── research_higher_degree/
│   ├── academic_professional/
│   ├── homeschool/
│   └── institutional/
└── routing/
    ├── TierRouter.jsx       # the master router
    └── tierResolver.js      # determines tier from user profile
```

### Master router

```js
// src/frontend/routing/TierRouter.jsx
function TierRouter() {
  const { tier, isLoading } = useUserTier();
  
  if (isLoading) return <BootSplash />;
  
  switch(tier) {
    case 'TIER_SECONDARY': return <SecondaryRoutes />;
    case 'TIER_UNDERGRAD': return <UndergradRoutes />;
    case 'TIER_HONOURS_MASTERS': return <HonoursMastersRoutes />;
    case 'TIER_RESEARCH_HIGHER_DEGREE': return <RhdRoutes />;
    case 'TIER_ACADEMIC_PROFESSIONAL': return <AcademicRoutes />;
    case 'TIER_HOMESCHOOL': return <HomeschoolRoutes />;
    case 'TIER_INSTITUTIONAL': return <InstitutionalRoutes />;
    default: return <TierPickerOnboarding />;
  }
}
```

Each tier's `routes.js` defines its own React Router config. Each tier's `<XHome />` is its own dashboard. Each tier's `<XNav />` is its own nav structure.

### Shared, owned, layered

What's shared across tiers (the primitives layer):
- 5 Sovereign Layers (LogicFrame, FadedScaffold, CognitiveAnchor, VibeMeter, HistoryOfThought)
- Canvas screen
- Editor
- Receipt generation
- Citation engine
- Ingestion engine
- Settings
- Communications Layer

What's owned per tier (the layout layer):
- Home dashboard composition
- Navigation structure
- Onboarding flow
- Default panels visible
- Quick actions
- Welcome screen
- Email templates
- Notification copy

What's themed per tier (the character layer):
- Palette
- Mascot
- Loading messages
- Voice / register defaults
- Pomodoro audio defaults

## Tier-resolver logic

```js
// src/frontend/routing/tierResolver.js
export async function resolveTier(user) {
  // 1. Explicit user choice wins
  if (user.tier) return user.tier;
  
  // 2. Onboarding selection
  if (user.onboardingTier) return user.onboardingTier;
  
  // 3. Heuristics (last resort)
  if (user.age && user.age >= 16 && user.age <= 18) return 'TIER_SECONDARY';
  
  // 4. Default — show tier picker
  return null;
}
```

Tier is editable any time in Settings. Switching tiers migrates the container if possible (see TIER_ARCHITECTURE.md migration logic).

## Onboarding flow

First login:
1. Welcome screen with character preview rotation
2. "Tell us where you are in your learning"
3. Picker:
   - "I'm in Year 11/12" → SECONDARY
   - "I'm doing a Bachelor's degree" → UNDERGRAD
   - "I'm doing Honours or a coursework Masters" → HONOURS_MASTERS
   - "I'm doing research (MRes/PhD)" → RHD
   - "I'm an academic / researcher" → ACADEMIC
   - "I'm homeschooling my family" → HOMESCHOOL
   - "I'm at a school or university (staff)" → INSTITUTIONAL
   - "I'm not sure" → defaults to UNDERGRAD with reassurance "You can change this any time"
4. Confirmation
5. Route to tier home

## Per-tier home dashboard examples

### SecondaryHome
- "Welcome back, [Name]"
- Active major work (single card, prominent)
- Practice exam shortcut
- Recent sessions
- Quick capture (photo / voice memo of notes)
- Quest progress (gamified, opt-in)
- Calendar with upcoming due dates

### UndergradHome
- "Welcome back, [Name]"
- Current courses (4-6 cards)
- This week's assessments
- Recent drafts
- Calendar
- Communications inbox snippet
- Receipt summary

### RhdHome (Aaron's tier — Bowser-OS character)
- Phase / strand / chapter navigation
- Methodology log shortcut
- Reflexivity log shortcut
- Supervisor feedback panel
- Recent sessions per chapter
- Corpus quick-access
- Receipt summary
- Cross-phase amalgamation view (advanced)

### HomeschoolHome (Forager character)
- Each child's current quest
- Today's plan
- Recent portfolio captures
- Curriculum progress map
- State reporting status
- Parent dashboard quick-stats

### InstitutionalHome (Hub character)
- Cohort search bar
- Aggregate analytics summary
- UDL audit tool
- Recent staff activity
- Compliance status
- Admin seat management

Each is owned by its tier folder. Adding a panel to RhdHome cannot regress SecondaryHome.

## Adding a new tier (the cost)

To add TIER_VOCATIONAL (TAFE students):
1. Create `src/frontend/tiers/vocational/` folder
2. Build `VocationalHome.jsx`, `VocationalNav.jsx`, `routes.js`, `config.js`
3. Add character config (palette, mascot, voice)
4. Add case to TierRouter switch
5. Add option to onboarding picker
6. Ship

Zero other tiers touched. Zero regression risk.

This is the architectural goal: tier addition is purely additive.

## Adding a feature to one tier only

To add "Quest Mode" to HOMESCHOOL only (kids see gamified quest labels):
1. Build component in `src/frontend/tiers/homeschool/QuestMode.jsx`
2. Reference it only in `HomeschoolHome.jsx` and `HomeschoolNav.jsx`
3. Other tiers never see it, never load it, never break

If later we want Quest Mode in SECONDARY:
1. Lift to `src/frontend/components/QuestMode.jsx`
2. Reference in `SecondaryHome.jsx`
3. RHD and ACADEMIC still don't load it

Code-splitting at the tier level means each tier loads only what it needs. Bundle sizes stay sane.

## Routing safeguards

- 404 within a tier routes to that tier's home (not a generic 404)
- Switching tiers shows confirmation if active projects would be affected
- Tier-locked features (e.g. Reflexivity Log requires RHD) gracefully show "upgrade your tier" prompt rather than crashing
- All tier routes share session, settings, identity, auth

## Migration plan (current state to this state)

The current canvas-first build assumes UNDERGRAD-shaped users (Course → Assessment → Draft). To migrate:

### Phase 1 — Set up tier folder structure (½ day)
- Create `src/frontend/tiers/` with all 7 tier folders
- Move existing canvas-first home into `tiers/undergrad/UndergradHome.jsx`
- Create stub homes for other tiers
- Build TierRouter
- Wire to current entry point

### Phase 2 — Build SecondaryHome (1 day)
- Different dashboard composition
- HSC-specific quick actions
- Tier-aware sweet spots
- Verify isolation from UndergradHome

### Phase 3 — Build RhdHome (2 days)
- Phase / strand / chapter navigation
- Methodology + reflexivity panels
- Aaron's seed data
- Verify isolation

### Phase 4 — Build remaining tier homes (1 day each)
- HonoursMastersHome
- AcademicHome
- HomeschoolHome
- InstitutionalHome

Total: ~1-week sprint for full tier routing infrastructure.

## What this sprint should ship

Minimum viable (½ day):
1. TierRouter.jsx
2. tierResolver.js
3. Move current home to UndergradHome
4. Onboarding picker
5. Verify nothing broke

Full v1 (5-day sprint):
6. All 7 tier home stubs
7. RhdHome fully built (Aaron's tier — dogfood priority)
8. SecondaryHome fully built
9. HomeschoolHome fully built
10. Tier-aware navigation
11. Tier-locked feature handling

## Dependencies

- TIER_ARCHITECTURE.md (data model must exist)
- Settings UI (for tier switching)

Does not depend on character system — tier routing works without characters. Characters layer on top later.

## Notes added

- 2026-05-15: Aaron's direct request: "The login needs to then direct to different layouts — which will not affect the other layers or builds in any way — that way if we add more stuff in, it gets reserved into md. Like folders until we are ready to get to that part."
- This IS the answer to that request. Folder isolation + tier-owned routing.
- Pairs with TIER_ARCHITECTURE.md, MARIO_KART_TIER_CHARACTERS.md, OPEN_DESIGN_MIGRATION.md.
