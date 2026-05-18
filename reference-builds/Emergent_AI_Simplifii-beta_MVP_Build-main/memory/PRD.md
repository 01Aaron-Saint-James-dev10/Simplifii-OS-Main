# Simplifii-β — Product Requirements Document

## Status: PRE-LAUNCH STABILISATION

### Stage 1 Deployed (17 Apr 2026)
- Bug #1: Brief Simplifier async with polling (no more 524 timeouts)
- Bug #2: Humaniser AI Risk Score — real heuristic, not LLM fabrication
- Bug #3: Unified ticket logic — deduct only on success, auto-refund on failure
- Bug #7: Essay Scorer dynamic rubric scale
- Bug #8: Essay Scorer percentage math fixed
- Bug #9: Rubric Simplifier "marks marks" fix + editable total marks
- Bug #10: PDF text cleaning (broken words, ligatures)
- Bug #11: PDF branding "Simplifii" (no beta)

### Stage 2 (Completed)
- Bug #4: Course Planner Study Plan 500
- Bug #5: Course Planner Timeline shows all courses
- Bug #6: Course Planner "Due Soon" counter

### Stage 3 (Completed)
- Bug #12: My Outputs restore full interactive view
- Bug #13: /faq route 404 on production domain

### Stage 4 — Deployment / Stability (5 May 2026)
- Added `GET /health` endpoint in `server.py` for K8s liveness probes (verified HTTP 200 on localhost:8001)
- **Assessment Scaffolder error handling improved**:
  - `utils/llm.py::send_with_retry`: On final retry failure, detects upstream gateway/overloaded errors (BadGateway, 502/503/504, overloaded, unavailable) and raises a clear message: *"The AI service is temporarily busy. This is on our provider's end, not your documents. Please wait a moment and try again."*
  - `routes/tools.py::_run_scaffold_job`: Widened error passthrough so user-actionable messages (credits, upstream outages, timeouts, invalid AI response) are surfaced verbatim instead of being masked as generic "Failed to create scaffold".
  - Root cause of user report was transient Anthropic 502s during their session, not document size (combined ~35KB input well within Claude's 200k context).
  - Tickets are still only deducted on successful completion (no-deduct-on-failure preserved).
  - End-to-end verified: multi-document scaffolder call returns 7 structure sections + 4 doc connections + 3 rubric alignments.

## Backlog / Post-launch
- Migrate async job queue from in-memory → MongoDB (currently blocked by user to avoid deployment risk)
- Google Workspace domain configuration for simplifii.com.au

## Critical Guardrails
- **Australian English** in all user-facing strings (analyse, colour, centre, organise)
- **No refactoring** of working tools; surgical edits only
- **Owner bypass** (aaronbugge@gmail.com → is_owner=True) — do not alter
- **Deduct-on-success**: tickets only charged when the tool output is delivered
