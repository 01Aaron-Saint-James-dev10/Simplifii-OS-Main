# Einstein Forensic Audit: Simplifii-OS

**Date:** 2026-05-14
**Auditor:** Claude (Opus 4.6)
**Scope:** Full codebase forensic review
**Verdict:** Functional beta with structural debt. No blockers. Several warnings.

---

## 1. REPOSITORY HEALTH

| Metric | Value | Severity |
|---|---|---|
| Total commits | 274 (279 across all branches) | OK |
| Project age | 8 days (2026-05-07 to 2026-05-15) | INFO: extremely rapid development |
| Total branches | 84 | WARN: high branch count for 8 days |
| Stashes | 0 | OK |
| Total JS/JSX files | 168 source files | OK |
| Total lines (src/) | 29,666 | OK |
| Total lines (src/ + api/) | 30,655 | OK |
| API endpoints | 14 serverless functions | OK |
| Supabase migrations | 11 SQL files | OK |

### Recent Commit History (last 20)

```
160b6327 fix: add viewport meta tag for mobile rendering
7415c49a feat: layered feedback system (AI response + session-end)
c27be4be feat: breath visualiser + break panel tab
f778a736 feat: document type detection + joke stays until dismissed + slash hints
2dd7fdbe feat: redesign AI use page with warmth and mission alignment
e711bf83 feat: audio overview generation + browser TTS playback
fcfc29c5 feat: joke generator via /joke text command and voice
221ce0a6 fix: crisis modal hierarchy + matrix rain quick-toggle
9479bb99 feat: dashboard visual parity with landing page
dfb2aadd feat: realtime clock + timezone + tier-aware dashboard greeting
ad03dd7f feat: tier-aware affirmations + Sprints O-R-V logged to backlog
eb4531fa feat: landing copy accuracy, pricing, tip jar, awards removal, privacy
663e491c audit: FULL GO verdict after Gate 4 Master Sprint
4f4697d6 fix: Batch 4 cleanup (drop nesa_papers, fix rgba warnings)
3deec7c9 feat: Batch 3 UX (collapsible left rail, back button verified)
f4d24a68 feat: Batch 2 cosmetic + UX (theme labels, tooltips, decision wire, rain toggle)
3d793e53 fix: accurate privacy claims - synced not local-only
7c85675d feat: persist embedded tool results to supabase
606e5bd3 fix: export compiles all sections not just active
a923ec8a feat: deploy dynamic sections API
```

### Largest Files (by line count)

| Lines | File | Severity |
|---|---|---|
| 1,233 | src/services/sectionTemplates.js | CRITICAL: 2.5x over 500-line limit |
| 953 | src/services/RewriteService.js | CRITICAL: nearly 2x over limit |
| 776 | src/services/BriefService.js | WARN: 55% over limit |
| 674 | src/frontend/ProjectContext.js | WARN: 35% over limit |
| 524 | src/frontend/hooks/useIngestion.js | WARN: slightly over limit |

**5 files exceed the 500-line architectural limit.** The top two are significantly oversized.

---

## 2. ARCHITECTURE

### Directory Structure

```
src/
  api/             1 file   (anthropicClient.js: client-side Anthropic wrapper)
  backend/         1 file   (LMSConnector.js: STUB, simulated data only)
  contexts/        2 files  (AuthContext.js, RouterContext.js)
  core/            8 files  (EventBus, Events, ExecutiveSpine, HistoryOfThought, LiteralMode, SovereignRouter, StudyPatternTracker + grounding/)
  data/            1 file   (AaronSeedData.js)
  frontend/        ~140 files across 10+ subdirectories
  lib/             3 files  (coursePersistence.js, storage.js, supabaseClient.js)
  services/        34 files (business logic layer)
  theme/           2 files  (sovereign-themes.css, tokens.js)
  utils/           1 file   (GroundingLoader.js)
api/               14 Vercel serverless functions
```

### React Components: 66 files in src/frontend/components/

Subdirectories: disclaimers (3), extensions (2), games (2), visuals (2)

### Services Layer: 34 files (including 3 test files)

Key services: BriefService, RewriteService, ChatService, CitationService, DocumentAIService, ExportService, IndexedDBService, TierService, UDLAuditService, VerificationService

### Serverless API Layer: 14 endpoints

| Endpoint | Purpose | AI Model |
|---|---|---|
| /api/tutor | Socratic tutor | claude-sonnet-4 |
| /api/decode-hidden | Hidden curriculum decoder | claude-sonnet-4 |
| /api/decode-rubric | Rubric translator | claude-sonnet-4 |
| /api/score-essay | Essay scoring | claude-sonnet-4 |
| /api/simplify-brief | Brief simplification | claude-sonnet-4 |
| /api/generate-sections | Section generation | claude-sonnet-4 |
| /api/next-step | Next step suggestion | claude-sonnet-4 |
| /api/represent | Multi-modal representations | claude-sonnet-4 |
| /api/classify-document | Document classification | claude-sonnet-4 |
| /api/audio-overview | Audio overview script | claude-sonnet-4 |
| /api/joke | Joke generator | claude-sonnet-4 |
| /api/scaffold-suggest | Past question matching | None (DB query) |
| /api/scrape | Web scraping | Firecrawl |
| /api/study-session | Study session tracking | None (DB query) |

### Architectural Concerns

| Finding | Severity |
|---|---|
| `src/backend/LMSConnector.js` is a stub returning hardcoded data. Never imported anywhere. | WARN: dead code |
| `src/frontend/components/CanvasEditor.legacy.jsx` exists alongside CanvasEditor.jsx. Not imported. | WARN: dead code |
| `src/api/anthropicClient.js` makes direct browser-to-Anthropic API calls with `anthropic-dangerous-direct-browser-access` header | CRITICAL: see Security section |
| Two services (RubricTranslatorService, BriefSimplifierService) import and use the client-side Anthropic wrapper | WARN: should route through serverless API instead |
| `scrapes/` directory in root with sub-directory | INFO: consider moving to data/ |

---

## 3. CODE QUALITY

### Technical Debt Markers

| Marker | Count | Severity |
|---|---|---|
| TODO / FIXME / HACK / XXX | 4 | OK: very low |
| console.log / console.error / console.warn | 44 | WARN: moderate; most are guarded with `typeof console` checks which is good |

### TODO Details

1. `src/frontend/CanvasScreen.jsx:382` -- TODO: route to appropriate panel based on choice
2. `src/services/CheckAgainstRubricService.js:51` -- TODO: wire to /api/tools/check-against-rubric
3. `src/services/ScaffolderToolService.js:42` -- TODO: wire to /api/tools/scaffolder

These represent unfinished API integrations. The services exist as stubs.

### Test Coverage

| Finding | Severity |
|---|---|
| Only 3 test files exist in entire codebase | CRITICAL |
| Files: CitationService.test.js, CitationStyleService.test.js, StatusService.test.js (in services/) | -- |
| No test runner configured in package.json scripts (no `test` script) | CRITICAL |
| 0 component tests | CRITICAL |
| 0 API endpoint tests | CRITICAL |
| 0 integration tests | CRITICAL |

**Test coverage is effectively zero.** For a codebase nearing 30k lines, this is the single largest risk.

### Dead Code

| File | Issue | Severity |
|---|---|---|
| src/backend/LMSConnector.js | Exported but never imported anywhere | WARN |
| src/frontend/components/CanvasEditor.legacy.jsx | Legacy file, not imported (replaced by CanvasEditor.jsx) | WARN |
| src/services/CheckAgainstRubricService.js | Stub with TODO, may not be wired | WARN |
| src/services/ScaffolderToolService.js | Stub with TODO, may not be wired | WARN |

### Files Over 500 Lines

5 files exceed the project's own 500-line architectural limit (defined in CLAUDE.md):

1. **sectionTemplates.js** (1,233 lines): data file, arguably acceptable but should be split by tier
2. **RewriteService.js** (953 lines): needs decomposition
3. **BriefService.js** (776 lines): needs decomposition
4. **ProjectContext.js** (674 lines): React context doing too much
5. **useIngestion.js** (524 lines): complex hook, borderline

### Duplicate RLS Policies

The baseline migration creates duplicate RLS policies on the `courses` table (old-style `courses_*_own` and new-style `Users can * own courses`). Migration `20260514120200` cleans these up, but the baseline still creates them. This is harmless but messy.

---

## 4. SECURITY

### Severity: CRITICAL -- Client-Side API Key Exposure

| Finding | Severity | File |
|---|---|---|
| `src/api/anthropicClient.js` reads `REACT_APP_ANTHROPIC_API_KEY` and makes direct browser-to-Anthropic calls | CRITICAL | src/api/anthropicClient.js |
| Uses `anthropic-dangerous-direct-browser-access: true` header | CRITICAL | src/api/anthropicClient.js |
| Two services import this client-side wrapper: RubricTranslatorService.js, BriefSimplifierService.js | CRITICAL | src/services/ |

**The file itself acknowledges this is "v1 prototyping only" and "production must proxy through a server."** This must be migrated to serverless API endpoints before any public launch. Any `REACT_APP_` prefixed env var is embedded in the build output and visible to anyone who opens browser dev tools.

### Hardcoded Supabase URLs

| Finding | Severity | File |
|---|---|---|
| Hardcoded Supabase URL as fallback: `https://aqcreatryuvuuynwvnqy.supabase.co` | WARN | src/core/HistoryOfThought.js (lines 254, 380) |
| Hardcoded Supabase URL as fallback | WARN | api/scaffold-suggest.js (line 18) |

The Supabase URL itself is not a secret (it is a public endpoint), but hardcoding it as a fallback bypasses env-var configuration and makes rotation harder.

### Service Role Key Fallback

`api/scaffold-suggest.js` line 19: `process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || ''`

Falling back from a service role key to an anon key silently degrades permissions. The empty string fallback means the endpoint could run with no auth at all. This should fail explicitly.

### Secrets in Source Code

| Check | Result |
|---|---|
| Hardcoded `sk-` API keys | NONE FOUND |
| Hardcoded passwords or tokens | NONE FOUND |
| .env files committed | NONE FOUND |
| API keys in client-visible code | See anthropicClient.js above (reads from env at build time) |

### RLS Coverage (Supabase)

| Table | RLS Enabled | Policies | Severity |
|---|---|---|---|
| profiles | Yes | SELECT/INSERT/UPDATE own | OK |
| courses | Yes | SELECT/INSERT/UPDATE/DELETE own | OK |
| assessments | Yes | SELECT/INSERT/UPDATE/DELETE via course FK | OK |
| history_of_thought_events | Yes | SELECT/INSERT own | OK |
| feedback | Yes | INSERT/SELECT own + Aaron read-all | OK |
| syllabi | Yes | Public read | OK (educational content) |
| syllabus_outcomes | Yes | Public read | OK |
| past_papers | Yes | Public read | OK |
| past_questions | Yes | Public read | OK |
| study_sessions | Yes | SELECT/INSERT/UPDATE own | OK |

**All tables have RLS enabled with appropriate policies.** The syllabus tables are intentionally public-read. No missing RLS policies found.

**Note:** The syllabus tables (syllabi, syllabus_outcomes, past_papers, past_questions) have NO insert/update policies for regular users. Only service-role or admin can write. This is correct by design but means there is no admin panel for content management yet.

---

## 5. DATABASE

### Tables (from migrations)

| Table | Columns (approx) | Purpose |
|---|---|---|
| profiles | 12 | User profiles (extends auth.users) |
| courses | 8 | Enrolled courses |
| assessments | 7 | Assessment tasks per course |
| history_of_thought_events | 9 | Encrypted activity log |
| feedback | 8 | Beta tester feedback |
| syllabi | 10 | Syllabus metadata |
| syllabus_outcomes | 6 | Learning outcomes |
| past_papers | 9 | HSC/VCE/QCE/WACE papers |
| past_questions | 8 | Individual past questions |
| study_sessions | 8 | Pomodoro/study tracking |

**Total: 10 tables**

### Potentially Empty Tables

| Table | Concern | Severity |
|---|---|---|
| syllabus_outcomes | Only 4 syllabi seeded, no outcomes seeded | WARN: feature incomplete |
| past_papers | No seed data | WARN: scaffold-suggest will return nothing |
| past_questions | No seed data | WARN: scaffold-suggest will return nothing |

The `api/scaffold-suggest` endpoint queries `past_questions` but there is no seed data for questions. This endpoint will always return empty results until the ingestion scripts (`scripts/ingest-nesa.js`, etc.) are run.

### Orphaned Tables

None found. All tables have clear FK relationships and are referenced in application code.

### Schema Observations

- `study_sessions.course_id` and `study_sessions.assessment_id` are TEXT, not UUID with FK. This means no referential integrity for session tracking.
- `profiles.preferences` is JSONB with no schema validation. Drift risk as features add arbitrary keys.

---

## 6. COST ANALYSIS

### Anthropic API Endpoints

**11 of 14 serverless functions call the Anthropic API** using `claude-sonnet-4-20250514`.

Additionally, 2 client-side services (RubricTranslatorService, BriefSimplifierService) call Anthropic directly via the browser wrapper.

**Total unique AI call paths: 13**

### Per-Call Cost Estimates (Claude Sonnet 4)

Based on Anthropic pricing for claude-sonnet-4 (approximately $3/MTok input, $15/MTok output):

| Endpoint | Est. Input Tokens | Est. Output Tokens | Est. Cost/Call |
|---|---|---|---|
| /api/tutor | ~1,500 | ~200 | ~$0.0075 |
| /api/decode-hidden | ~6,000 | ~2,000 | ~$0.048 |
| /api/decode-rubric | ~5,000 | ~1,500 | ~$0.0375 |
| /api/score-essay | ~6,000 | ~2,000 | ~$0.048 |
| /api/simplify-brief | ~3,000 | ~1,500 | ~$0.0315 |
| /api/generate-sections | ~3,000 | ~600 | ~$0.018 |
| /api/next-step | ~2,000 | ~150 | ~$0.0083 |
| /api/represent | ~4,000 | ~1,000 | ~$0.027 |
| /api/classify-document | ~2,000 | ~50 | ~$0.0068 |
| /api/audio-overview | ~2,000 | ~250 | ~$0.0098 |
| /api/joke | ~500 | ~100 | ~$0.003 |

**Weighted average per API call: ~$0.022**

### Usage Assumptions

A typical active user session involves:
- 1 brief ingestion (classify + decode-hidden + decode-rubric + simplify + generate-sections = 5 calls)
- 3-5 tutor interactions
- 1 score check
- 1 next-step call
- Occasional: represent, audio-overview, joke

**Estimated calls per active session: 10-12**
**Estimated cost per active session: ~$0.22-$0.26**

### Monthly Cost Projections

| Active Users/Month | Sessions/User/Month | Total Sessions | Estimated API Cost | Vercel Costs (est.) | Total |
|---|---|---|---|---|---|
| 100 | 8 | 800 | ~$200 | ~$20 (Pro plan) | ~$220/mo |
| 1,000 | 8 | 8,000 | ~$2,000 | ~$50 | ~$2,050/mo |
| 10,000 | 8 | 80,000 | ~$20,000 | ~$200 | ~$20,200/mo |

### Cost Risks

| Risk | Severity |
|---|---|
| No rate limiting on any API endpoint | CRITICAL: a single user could generate unlimited API calls |
| No per-user usage caps or quotas | CRITICAL |
| No caching of repeated identical requests | WARN |
| Joke endpoint calls Claude for every joke | INFO: could use a pre-generated joke bank |
| classify-document is called on every upload even if already classified | WARN |

---

## 7. SUMMARY OF FINDINGS BY SEVERITY

### CRITICAL (must fix before production)

1. **Client-side Anthropic API key exposure** via `src/api/anthropicClient.js` with `anthropic-dangerous-direct-browser-access`. Two services use this path.
2. **Zero test coverage** for a 30k-line codebase. 3 test files exist but no test runner is configured.
3. **No rate limiting** on any of the 14 API endpoints. Unbounded cost exposure.
4. **No per-user usage quotas.** A single user could bankrupt the API budget.
5. **sectionTemplates.js at 1,233 lines** and **RewriteService.js at 953 lines** violate the 500-line limit and are difficult to maintain.

### WARN (should fix soon)

6. **Hardcoded Supabase URL fallbacks** in HistoryOfThought.js and scaffold-suggest.js.
7. **scaffold-suggest.js silently degrades** from service-role key to anon key to empty string.
8. **44 console statements** in production code (most are guarded, but should be replaced with a proper logger).
9. **Dead code**: LMSConnector.js (never imported), CanvasEditor.legacy.jsx (replaced), two stub services.
10. **3 files between 500-776 lines** need refactoring.
11. **84 branches** for an 8-day-old repo. Branch hygiene needed.
12. **study_sessions uses TEXT for course_id/assessment_id** instead of UUID FKs. No referential integrity.
13. **Empty syllabus content tables** mean scaffold-suggest returns nothing.

### INFO (low priority)

14. Project is 8 days old with 274 commits. Development pace is extraordinary but sustainable debt is accumulating.
15. Only 4 TODO markers. The codebase is remarkably clean for its age.
16. Console statements are mostly well-namespaced (e.g., `[HistoryOfThought]`, `[useIngestion]`).
17. Commit messages are high quality and descriptive.
18. RLS policies are comprehensive and correct on all 10 tables.
19. The CLAUDE.md constitution is thorough and well-enforced architecturally.
20. The joke endpoint works but costs ~$0.003 per joke. A joke bank would cost $0.

---

## 8. RECOMMENDED PRIORITY ORDER

1. **Migrate anthropicClient.js to serverless** -- eliminate client-side API key exposure
2. **Add rate limiting** to all API endpoints (Vercel Edge Middleware or per-endpoint guards)
3. **Add per-user usage quotas** tracked in Supabase
4. **Set up test runner** (Jest/Vitest) and write critical-path tests
5. **Split sectionTemplates.js and RewriteService.js** under 500 lines
6. **Remove dead code** (LMSConnector, CanvasEditor.legacy, stub services)
7. **Add a proper logging abstraction** to replace console statements
8. **Clean up branches** (archive or delete merged branches)
9. **Add FK constraints** to study_sessions.course_id and assessment_id
10. **Run syllabus ingestion scripts** to populate past_questions data

---

## ADDENDUM: P0 Issues Resolved (2026-05-15)

### P0.1: Client-Side API Key Exposure -- RESOLVED

- `src/api/anthropicClient.js` gutted. Both exports (`callAnthropic`, `isApiKeyConfigured`) now throw/return false. The file is kept as a tombstone to prevent import errors.
- `src/services/RubricTranslatorService.js` rewired to call `/api/decode-rubric` serverless endpoint instead of direct Anthropic browser calls.
- `src/services/BriefSimplifierService.js` rewired to call `/api/simplify-brief` serverless endpoint instead of direct Anthropic browser calls.
- `anthropic-dangerous-direct-browser-access` header eliminated from codebase.
- `REACT_APP_ANTHROPIC_API_KEY` no longer read anywhere. Verified: zero matches in `build/` output.
- All AI calls now route through Vercel serverless functions where `ANTHROPIC_API_KEY` is a server-only env var.

### P0.2: Rate Limiting -- RESOLVED

- Created `api/_rateLimit.js`: in-memory sliding-window rate limiter compatible with Vercel Fluid Compute instance reuse.
- All 14 API endpoints wrapped with per-identifier rate limiting:
  - `/api/tutor`: 30 req/min
  - `/api/scrape`: 10 req/min
  - `/api/scaffold-suggest`: 20 req/min
  - `/api/represent`: 20 req/min
  - `/api/classify-document`: 30 req/min
  - `/api/audio-overview`: 5 req/min
  - `/api/joke`: 10 req/min
  - `/api/next-step`: 20 req/min
  - `/api/score-essay`: 15 req/min
  - `/api/generate-sections`: 20 req/min
  - `/api/decode-hidden`: 15 req/min
  - `/api/decode-rubric`: 15 req/min
  - `/api/simplify-brief`: 15 req/min
  - `/api/study-session`: 20 req/min
- Identifier: user_id from request body (preferred) or client IP (fallback).
- Returns 429 with retry-after when exceeded.
- Note: in-memory store resets on cold starts. For production scale, migrate to Upstash Redis.

### P0.3: scaffold-suggest Auth Degradation -- RESOLVED

- Removed hardcoded Supabase URL fallback (`https://aqcreatryuvuuynwvnqy.supabase.co`).
- Removed silent degradation from service-role key to anon key to empty string.
- Now requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` explicitly.
- Returns 401 with clear error message when credentials are missing.
- Logs missing credentials at cold start for debugging.

### Remaining CRITICAL Items (Not Addressed in P0)

- **Zero test coverage**: Still no test runner or meaningful tests. (P1 sprint)
- **sectionTemplates.js (1,233 lines)** and **RewriteService.js (953 lines)**: Still over 500-line limit. (P1 sprint)

---

*Generated by Einstein Forensic Audit, 2026-05-14*
*P0 Addendum: 2026-05-15*
*Auditor: Claude Opus 4.6*
*Codebase snapshot: commit 160b6327 (audit), P0 fix branch: fix/p0-pre-tester-audit-findings*
