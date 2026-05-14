# Simplifii-OS Production State
Updated: 2026-05-15
Bundle: b207110a

## Live at
https://simplifii-os-main.vercel.app

## Database (Supabase, Sydney)
| Table | Rows | Purpose |
|-------|------|---------|
| profiles | 5+ | User accounts with tier, year_level, state, pain_points, preferences |
| courses | 4+ | User-created courses with code, tier, term |
| assessments | 21+ | Extracted assessments with title, due_date, weight, brief_text |
| feedback | 0+ | Beta tester feedback (bug/idea/general) |
| history_of_thought_events | 0 | Encrypted activity log (stub) |
| syllabi | 4 | NESA, VCE, QCE, WACE English |
| syllabus_outcomes | 0 | Ready for outcome mapping |
| past_papers | 26 | 6 NESA + 7 VCE + 7 QCE + 6 WACE |
| past_questions | 55+ | NESA marker feedback, state board paper refs |
| nesa_papers | 0 | Legacy table (superseded by past_papers) |
| study_sessions | 0 | Ready for telemetry |

## API Endpoints
| Route | Status | Auth |
|-------|--------|------|
| /api/scrape | Live | Firecrawl key |
| /api/tutor | Live | Anthropic key (tier-aware, EAL/D, Easy Read) |
| /api/scaffold-suggest | Live | Supabase service role |
| /api/audio-overview | 501 stub | N/A |
| /api/study-session | 501 stub | N/A |

## Features Live
- Auth: Google OAuth, email/password, magic link, forgot password
- Onboarding: 7 tiers, secondary-specific (year level, state, pain points), accessibility prefs, neuroscience profiler
- EmptyWorkspace: PDF upload (primary), URL ingestion (Firecrawl), manual creation
- CanvasScreen: TipTap editor, 7 panel tabs (Brief, Tutor, Preview, Sources, Authenticity, Check, Past Q's)
- Socratic Tutor: Claude-powered, tier-aware, EAL/D language support, Easy Read mode
- Voice-to-text: Web Speech API, en-AU, permission modal
- PDF ingestion: pdfjs-dist extraction, assessment detection, Supabase persistence
- Assessment list view for multi-assessment courses
- HSC Past Questions panel with search + year filter
- Feedback button + modal + admin triage dashboard
- Crisis resources: 10 verified helplines, 6 categories
- Tester welcome modal, beta banner, tester guide
- Study pattern tracking (localStorage), ASCII branded loader
- BrOWSER 2.0 avatar (5 states), display name greeting (time-aware)
- Screen reader navigation announcements

## Env Vars (Vercel)
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY
- FIRECRAWL_API_KEY
- ANTHROPIC_API_KEY
