# Sprint Priority Queue [CRITICAL — READ FIRST EVERY DAY]

## Purpose

This is the sequenced order of sprints. When Aaron is ready to build, he opens THIS file first, picks the top item, opens its spec, and executes ONE sprint.

**Rule: only ONE sprint at a time. Never stack sprints in CC.**

## Current state (as of 2026-05-15, evening)

### Cleanup [SHIPPED ✓]
CC merged v2-sprint-assessment-aware-canvas → v2-rebuild-canvas-first, then merged v2-rebuild-canvas-first → main. Empty branches deleted. Pushed to origin.

### Real branch state
- `main`: HEAD de2ee75a, 145 files / +17,095 / -9,418 lines, all v2 work current
- `v2-rebuild-canvas-first`: HEAD dd8c38ea, fully merged to main
- Empty branches deleted (v2-sprint-sovereign-research-os, v2-sprint-ingestion-comms)
- Build passes
- One untracked file: docs/SYSTEM_AUDIT.md (harmless)

### Next action: drop the roadmap folder into the repo
- Save `docs/roadmap/` into `/Users/adonis666/Simplifii-OS_Master/docs/roadmap/`
- Commit and push
- Then sprint 2 can begin tomorrow

## Phase 0 — Foundation (May-July 2026)

### Sprint 1: CLEANUP [SHIPPED ✓ — 15 May 2026]
- Merged v2-sprint-assessment-aware-canvas into v2-rebuild-canvas-first (dd8c38ea)
- Merged v2-rebuild-canvas-first into main (de2ee75a)
- Pushed to origin
- Empty branches deleted (local)
- Build passes
- **Output:** Clean repo, single source of truth on main

### Sprint 2: TIER ARCHITECTURE [QUEUED — DO NEXT]
- **Spec file:** `00_foundation/TIER_ARCHITECTURE.md`
- **What ships:** TierService.js, 5 tier definitions, capability map, migration logic, tier picker in onboarding
- **Cost:** 3-4 hours, single CC session
- **Why first:** Every product mode keys off this. Build once, build everything cleanly after.
- **Output:** Foundation for Sovereign Research, Study, Home, Pathways, etc.
- **Status:** [SPEC] ready

### Sprint 3: CITATION INTEGRITY ENGINE
- **Spec file:** `00_foundation/CITATION_INTEGRITY_ENGINE.md`
- **What ships:** CitationService.js, 4 styles (APA7, Harvard, Chicago, Vancouver), verification flow, corpus management, hallucination prevention
- **Cost:** Full day sprint (6-8 hours)
- **Why second:** Foundation for academic credibility. Receipt depends on this.
- **Output:** The killer differentiator. Zero fabrication. Trusted academic tool.
- **Status:** [SPEC] ready

### Sprint 4: SOVEREIGN RESEARCH MVP (Aaron's tier shipped)
- **Spec file:** `01_products/SOVEREIGN_RESEARCH.md`
- **What ships:** Project/Phase/Strand/Chapter data model, Research Home screen, Methodology Log, Reflexivity Log, Supervisor Feedback panel, Aaron's MRes seed
- **Cost:** Full day sprint (6-8 hours)
- **Why third:** Aaron's tier is the dogfood priority. Once shipped, Aaron writes his thesis on it daily.
- **Output:** Aaron's working tool. Phase 0 foundation complete.
- **Status:** [SPEC] ready

### Sprint 5: TEST + DOGFOOD WEEK (no new code)
- **What happens:** Aaron writes MRes content in Sovereign for a full week
- **Cost:** Aaron's normal thesis time
- **Output:** Real feedback on real friction. Bug list. Feature priority adjustments.
- **Why fifth:** Before adding more features, validate the foundation works.

### Sprint 6: INGESTION ENGINE
- **Spec file:** `00_foundation/INGESTION_ENGINE.md`
- **What ships:** IngestionService.js orchestrator, handlers for PDF / image (OCR) / audio (Web Speech) / web URL / text paste / docx, IngestScreen UI, review-before-commit flow
- **Cost:** 2-day sprint
- **Why sixth:** Unlocks multi-modal input for all products. Critical for Sovereign Home, Study, Pathways.
- **Status:** [SPEC] ready (was the file plan CC tried to start)

### Sprint 7: COMMUNICATIONS LAYER
- **Spec file:** `02_features/COMMUNICATIONS_LAYER.md`
- **What ships:** CommunicationsService, floating launcher, 5 templates (extension, supervisor check-in, ethics, scholarship, peer review), Voice DNA matching, project context awareness
- **Cost:** 3-day sprint
- **Why seventh:** Cross-cutting feature. Solves supervisor email anxiety. Reduces admin friction.
- **Status:** [SPEC] ready

### Sprint 8: THE RECEIPT MVP
- **Spec file:** `02_features/THE_RECEIPT.md`
- **What ships:** ProvenanceService.generateReceipt, PDF generation per tier, SHA-256 hashing, 5 tier-aware templates
- **Cost:** 3-day sprint
- **Why eighth:** The differentiator made tangible. Authenticity moat shipped.
- **Status:** [SPEC] ready

### Sprint 9: REVIEW + PATH DECISION
- **What happens:** Aaron reviews progress, decides which Phase 1 product to launch first
- **Default:** Sovereign Research RHD soft launch
- **Cost:** Aaron's strategic time
- **Output:** Phase 1 launch plan locked

## Phase 1 — Sovereign Research Launch (August 2026)

### Sprint 10: VOICE DNA SERVICE
- **What ships:** Voice DNA extraction from Aaron's existing writing, enforcement in AI suggestions, application across 5 layers
- **Cost:** 2-day sprint
- **Why:** Critical for Aaron's own use AND for Pathways equity tier (voice preservation)

### Sprint 11: PAYMENT INFRASTRUCTURE
- **What ships:** Stripe integration, pricing pages, subscription management, free tier enforcement
- **Cost:** 3-day sprint
- **Why:** Revenue infrastructure for Sovereign Research launch

### Sprint 12: USER ACCOUNT + AUTH
- **What ships:** Email signup, magic link auth, tier selection on signup, profile management
- **Cost:** 2-day sprint

### Sprint 13: ONBOARDING FLOW
- **What ships:** First-run experience for each tier, sample project pre-seed for new users, getting-started tutorial
- **Cost:** 2-day sprint

### Sprint 14: SOVEREIGN RESEARCH POLISH SPRINT
- **What ships:** UI polish, accessibility audit, performance optimisation, bug fixes from dogfood week feedback
- **Cost:** 3-day sprint

### Sprint 15: LAUNCH
- **What happens:** Sovereign Research goes live. Aaron's narrative posts begin. Founder pricing locks in.
- **Cost:** Marketing + launch operations time
- **Target:** 100 paying users in 60 days

## Phase 2 — Sovereign Study Launch (October 2026)

After Phase 1 stable, queue:
- Sprint 16: SOVEREIGN STUDY TIER (Secondary)
- Sprint 17: HSC QUESTION REGENERATOR (single subject MVP: Biology)
- Sprint 18: PRACTICE MODE MVP
- Sprint 19: SOVEREIGN STUDY LAUNCH

## Phase 3 — Sovereign Home Launch (January 2027)

After Phase 2 stable, queue:
- Sprint 20: HOMESCHOOL TIER + CURRICULUM REFACTOR
- Sprint 21: QUEST MODE UI
- Sprint 22: STATE REPORTING (NSW first)
- Sprint 23: SOVEREIGN HOME LAUNCH

## Phase 4 — B2B Pilot (March-June 2027)

- Sprint 24: INSTITUTIONAL DASHBOARD MVP
- Sprint 25: UDL AUDIT TOOL
- Sprint 26: COHORT ANALYTICS
- Sprint 27: B2B SALES INFRASTRUCTURE

## Backlog (not yet queued)

These have specs but no sprint date yet. Move to queue when capacity allows.

### Cross-cutting features
- Live Tutor (proactive AI companion) — `02_features/LIVE_TUTOR.md`
- Co-Writing Rooms — `02_features/CO_WRITING_ROOMS.md`
- Specialised Writing Modes (Brain Dump, Defence, Friction, Focus) — `02_features/SPECIALISED_WRITING_MODES.md`
- References Manager full v1 — `02_features/REFERENCES_MANAGER.md`
- Practice Mode all 8 sub-modes — `02_features/PRACTICE_MODE.md`
- **Slash Commands (NEW)** — `02_features/SLASH_COMMANDS.md` — keyboard-first command palette from TempleOS directive

### Foundation extensions
- **Local LLM Path (NEW)** — `00_foundation/LOCAL_LLM_PATH.md` — Ollama integration for full privacy

### Design system work
- Open Design Migration — `04_design/OPEN_DESIGN_MIGRATION.md`
- Login Routing per Tier — `04_design/LOGIN_ROUTING_PER_TIER.md`
- Mario Kart Tier Characters — `04_design/MARIO_KART_TIER_CHARACTERS.md`
- Visual Identity per Mode — `04_design/VISUAL_IDENTITY_PER_MODE.md`
- **Mockups Per Tier (NEW — 7 files)** — `04_design/MOCKUPS/` — one mockup spec per tier informing each tier's build sprint

### Additional products
- Sovereign Pathways (Equity) — `01_products/SOVEREIGN_PATHWAYS_EQUITY.md`
- Sovereign Maths (Autistic Learners) — `01_products/SOVEREIGN_MATHS_AUTISTIC.md`
- Sovereign Schools (B2B Secondary)

### NDIS pathway
- NDIS provider registration prep
- Pilot study design (becomes Aaron's PhD Chapter 3)
- Aria Learning co-pilot conversation

### Elon-mode strategic directives (source material)
- Captured in `08_elon_mode/` folder
- Inform existing buildable specs
- Reference but don't execute directly

## Rules for using this queue

1. **Top of queue wins.** Don't skip ahead to interesting items.
2. **One sprint at a time.** Never queue two simultaneously in CC.
3. **Approve plan before execution.** CC produces file plan, Aaron approves, CC builds. Never let CC run unsupervised.
4. **Test after every sprint.** No sprint ships without manual smoke test + automated tests passing.
5. **Document sprint completion.** Update SPRINT_HISTORY.md after each sprint.
6. **Re-prioritise quarterly.** This queue isn't immutable. Aaron reviews every 3 months.

## When something changes

### New idea arrives mid-sprint
- Capture it in the relevant spec file (add to "Notes added" section)
- DO NOT pivot mid-sprint
- Re-prioritise at next sprint review

### A sprint reveals dependencies we didn't know about
- Document in POST_MORTEMS.md
- Adjust queue if needed
- Communicate scope changes before committing

### Aaron's life requires the queue to slow down
- This is expected. Adjust without guilt.
- MRes thesis takes priority over Sovereign always.
- Mental health takes priority over both always.

## Sprint review template

After each sprint:
- [ ] Did it ship what was specified?
- [ ] Did tests pass?
- [ ] Did the build pass?
- [ ] Was it merged into main branch?
- [ ] Did SPRINT_HISTORY.md get updated?
- [ ] What did we learn (POST_MORTEMS.md)?
- [ ] Does the queue need re-ordering?

## Notes added

- 2026-05-15: First sprint priority queue. The single most important file in this roadmap.
- This file prevents Aaron from accidentally stacking sprints in CC again.
- This file enables tomorrow-Aaron to pick up where today-Aaron left off.
- Update after every sprint. Treat it as living infrastructure.
