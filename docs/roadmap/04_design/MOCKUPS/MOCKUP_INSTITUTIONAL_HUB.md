# Mockup: TIER_INSTITUTIONAL — Hub [SPEC]

## Tier identity

- **Tier:** TIER_INSTITUTIONAL (B2B)
- **Character:** Hub
- **Audience:** University admin, faculty heads, EDI directors, school principals, NDIS providers
- **Archetype:** Calm, institutional, dashboard-driven, professional

## Palette overrides

- Primary: `--zinc-950` (Obsidian base) — could optionally lift to lighter mode for board rooms
- Accent: `--cyan-500` (#06B6D4)
- Secondary: `--slate-500` (#64748B)
- Data viz: standard institutional palette (blues, greens, ambers for traffic-light analytics)
- Mascot SVG: geometric network node, abstract, institutional clean

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [⬡ Hub]   UNSW Sydney   Faculty: Arts & Social Sciences   [⚙]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   THIS TERM AT A GLANCE                                            │
│   ─────────────────────────────────                                │
│                                                                    │
│   ┌──────────────────────┬──────────────────────┬──────────────┐  │
│   │  ENROLMENT           │  ENGAGEMENT          │  AUTHENTICITY│  │
│   │                      │                      │              │  │
│   │  12,847 students     │  82% active monthly  │  84% avg     │  │
│   │  62% using Sovereign │  73% weekly          │  47 outliers │  │
│   │  +12% on last term   │  Median 4h/week      │              │  │
│   └──────────────────────┴──────────────────────┴──────────────┘  │
│                                                                    │
│   COHORT SEARCH                                                    │
│   ─────────────────────────────────                                │
│   [BABS1201______________________________________________]  [🔍]  │
│                                                                    │
│   STRESS HOTSPOTS (auto-detected this term)                       │
│   ─────────────────────────────────                                │
│   🔴 ARTS3885 Assessment 2 — 73% of cohort flagged confusion      │
│      Cluster: methodology section, unclear command verbs           │
│      [View detail] [Run UDL audit]                                 │
│                                                                    │
│   🟠 PSYC1011 Tutorial 6 — sustained low engagement                │
│      Pattern: students dropping off in Week 6 readings             │
│      [View detail] [Run UDL audit]                                 │
│                                                                    │
│   🟡 ECON1101 Quiz 3 — high revision frequency                     │
│      Pattern: average 8 attempts per question                      │
│      [View detail]                                                 │
│                                                                    │
│   UDL AUDIT QUEUE                                                  │
│   ─────────────────────────────────                                │
│   3 syllabi awaiting audit • 7 audits complete • 2 in progress    │
│   [Upload syllabus for audit]                                      │
│                                                                    │
│   RECENT REPORTS                                                   │
│   ─────────────────────────────────                                │
│   T1 2026 Compliance Summary [Generated yesterday]                 │
│   ARTS3885 UDL Gap Analysis [3 days ago]                           │
│   Faculty Equity Indicators Q1 [1 week ago]                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation structure

### Top tabs
- Dashboard (overview)
- Cohorts (per-course analytics)
- UDL Audit (syllabus refactor pipeline)
- Authenticity (Receipt verification at scale)
- Compliance (reports for academic integrity board)
- Equity (widening-participation analytics)
- Settings (admin seats, integrations)

### Per-cohort view
Drill into BABS1201 → see:
- Aggregate (de-identified) metrics
- Stress patterns over time
- Common stuck points
- Top issues per assessment
- Suggested UDL fixes
- Compare to similar courses

## Key panels

### Cohort search bar
Primary entry point. Search by:
- Course code (e.g., BABS1201)
- Term (e.g., T2 2026)
- Faculty (e.g., Arts & Social Sciences)
- Assessment type (e.g., essays, lab reports)
- Student tag (e.g., first-in-family, equity pathway)

### Stress heatmap
Visual representation of cohort distress:
- Time axis (semester week)
- Course/assessment Y-axis
- Heat scale: emerald (low stress) → amber → rose (high stress)
- Click any cell → drill into specifics
- Privacy: aggregate only, never individual identifiable

### UDL Audit pipeline
Upload syllabus/assessment brief → AI audits → returns gap analysis with specific rewrites.

Lecturer view:
- Upload
- Review AI suggestions
- Edit recommendations
- Accept or modify
- Implement changes (export back to LMS or course handbook)

### Authenticity verification
- Submission Receipt scanner
- Bulk verification of submission batches
- Flagged outliers list (low authenticity scores)
- Comparison to cohort distribution
- Investigation tools (without invading student privacy)

### Compliance reports
- Disability Standards for Education
- Higher Education Standards Framework
- TEQSA reporting alignment
- Indigenous Education Strategy progress
- Equity outcomes by widening-participation cohort

## Welcome screen (first-time institutional admin)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│        [⬡ Hub network node, cyan glow]                  │
│                                                        │
│              Welcome to Hub.                           │
│                                                        │
│        Connect your cohort to begin.                   │
│                                                        │
│   [Upload student enrolment data]                      │
│   [Connect via LMS (Canvas / Moodle / Brightspace)]    │
│   [Connect via SIS (Student Information System)]       │
│                                                        │
│        "Aggregate insights. Individual privacy."       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Empty state copy

- "No cohort data connected yet. Connect your LMS or SIS to begin."
- "No UDL audits yet. Upload a syllabus to start."
- "No authenticity outliers detected. Healthy cohort behaviour."

## Loading messages (Hub specific)

- "Hub is aggregating cohort data"
- "Analytics ready"
- "Compiling report"
- "Verifying submissions"

## Voice and copy register

- Administrative, factual, ready to be skimmed
- Never alarmist (avoid "Crisis!" framing)
- Honest about limitations ("Aggregate patterns, not individual proof")
- Privacy-first throughout copy
- Australian English, professional register

## Tier-specific features visible

- Cohort search
- UDL audit pipeline
- Authenticity verification at scale
- Compliance dashboards
- Admin seat management
- LMS / SIS integrations
- Multi-faculty support (for whole-university tier)
- Custom report generation
- Cohort tag management

## Tier-specific features HIDDEN

- Individual student work (NEVER accessible to institutional users)
- Methodology Log content (only aggregate metadata visible)
- Reflexivity Log content (only counts, never content)
- Personal supervisor relationships
- Co-Writing Rooms
- Practice Mode for individual users

## Privacy architecture in UI

CRITICAL: every institutional UI element must reinforce privacy boundaries.

Persistent banner / footer text:
> "Hub shows aggregate cohort patterns. Individual student work, drafts, and content remain private to each student. Authenticity verification uses cryptographic hashes only."

Every data view labelled with privacy scope:
- "Aggregate — 487 students"
- "De-identified — patterns only"
- "Cohort distribution — no individual data"

If admin tries to drill below aggregate threshold (e.g., cohort of 4): system refuses, shows: "Sample too small for de-identified analysis. Privacy preserved."

## Pricing tier visible in UI

Different institutional tiers see different features:

### Department tier ($25K/year)
- Single department scope
- Cohort search within department
- 10 UDL audits/year
- Basic compliance dashboard

### Faculty tier ($60K/year)
- Faculty-wide scope
- All cohort analytics
- 50 UDL audits/year
- Full compliance dashboard
- Quarterly strategy session

### Whole University tier ($150K-$300K/year)
- All faculties
- Unlimited UDL audits
- Authenticity API access
- Custom integrations
- Dedicated success manager
- Annual external privacy audit

### Cross-Institutional Consortium ($1M+/year)
- Multi-institution comparative analytics
- Sector benchmarks
- Policy advisory access

## Admin seats management

- Each institutional license has X admin seats
- Add/remove admins
- Role-based access (Dean, EDI Director, Faculty Head, Lecturer, Read-only)
- Audit log of admin actions
- 2FA enforced for all institutional users
- SSO integration (SAML, OAuth) for whole-university tier

## Mobile / tablet considerations

Institutional users primarily desktop. Mobile is read-only check-ins:
- Dashboard summary on phone
- Heatmap simplified
- Reports generated on desktop, viewable on mobile
- Push notifications for critical alerts (opt-in)

## LMS integration UI

For institutions with LMS connected:
- "Linked: Canvas T1 2026"
- Cohort data syncs nightly
- Students see "Use Sovereign for this assessment" prompt in LMS
- Submissions flow back to LMS with Receipt attached

## Reporting cadence

Auto-generated reports:
- Weekly cohort summary (Friday)
- Monthly compliance digest
- Term-end full report
- Year-end strategic summary

Custom reports on demand:
- "Generate report for our EDI committee meeting"
- "Run UDL maturity assessment for our faculty"
- "Compare our equity outcomes to sector benchmarks"

## Theme-swap behaviour

Hub is the institutional default. Some EDI directors might prefer:
- Compass (less institutional, more professional)
- Sage (more academic gravitas)

Layout stays dashboard-aggregate-search-driven.

## Build cost

This mockup informs Institutional Command Centre build (Phase 4 B2B sprints).

Build sequence:
1. Cohort data model (aggregate-only architecture)
2. Cohort search
3. Stress heatmap (basic version)
4. UDL audit pipeline
5. Compliance reports (NSW first)
6. Admin seat management
7. LMS integrations
8. Multi-faculty support

Estimated: 12-week sprint to launch with minimal viable B2B.

## Notes added

- 2026-05-15: Hub is the most differentiated tier from B2C. Different audience, different needs, different copy.
- Privacy architecture must be obvious in UI — selling "aggregate analytics" requires visible boundaries.
- Pricing visible in UI helps prevent feature confusion (admin knows what their tier accesses).
- Aaron's institutional relationships at UNSW make this the natural Phase 4 pilot.
