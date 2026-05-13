# Institutional Command Centre [SPEC]

## What this is

B2B infrastructure layer. Universities and schools subscribe to access aggregate (de-identified) analytics, cohort-level diagnostics, UDL audit tools for their syllabi, and curriculum optimisation. The student tool becomes university infrastructure.

## Status

[BACKLOG → SPEC] — raised by Aaron 2026-05-15 in "Institutional Annexation" framing.

## Why this exists

Universities have massive budgets for:
- Academic integrity tools (Turnitin: $500K-$2M per institution annually)
- LMS contracts (Canvas, Brightspace: $1M-$5M per institution annually)
- Learning analytics (Aspire, Pearson: $200K-$1M)
- Accessibility compliance (Blackboard Ally and similar: $100K-$500K)

They have minimal budgets for student writing support. But student outcomes (retention, satisfaction, completion) are increasingly tied to funding.

Institutional Command Centre transforms Simplifii from a student tool into university infrastructure that:
- Diagnoses cohort-level learning issues
- Recommends specific UDL fixes
- Provides authenticity verification at institutional scale
- Generates compliance reports
- Replaces multiple existing vendor contracts

## What institutions get access to

### 1. Cohort Forensic Analytics

Academic searches by course code (e.g. BABS1201) and sees:
- Aggregate (de-identified) student stress patterns
- Common stuck points in specific assessments
- Time-on-task distributions
- Where students disengage
- Which Logic Frame questions students consistently struggle with
- Which rubric criteria are unclear to students

Example dashboard output:
```
BABS1201 — Term 1 2026

Enrolment: 487 students using Sovereign (62% of cohort)

Assessment 2 (Lab Report) — Critical Issues
- 73% of students flagged "methodology section" as confusing
- Mean time-on-methodology: 4.2 hours (cohort average for similar sections: 2.1 hours)
- 41% revised methodology section 5+ times pre-submission
- Common Logic Frame question students returned to: "What is your independent variable?"

Suggested UDL 3.0 fix:
The original prompt: "Describe your methodology"
Proposed UDL 3.0 version: 
- "What did you measure? (Identify your variable and explain why this one matters)"
- "How did you measure it? (Walk through your procedure as if teaching it)"
- "How did you ensure your measurement was reliable? (What controls or repetitions?)"

Apply this fix? [Yes] [No] [Edit first]
```

### 2. Curriculum Alchemist (UDL 3.0 Audit)

Lecturer uploads syllabus / assessment brief / lecture content. System:
- Extracts learning outcomes
- Maps to Australian Curriculum / AQF levels
- Audits against UDL 3.0 principles:
  - Multiple means of engagement
  - Multiple means of representation
  - Multiple means of action/expression
- Identifies accessibility gaps
- Outputs "UDL 3.0 Gap Analysis Report"
- Suggests specific rewrites

Output for lecturer:
```
ARTS3885 Violence, Resistance, Change — UDL 3.0 Audit

Overall Score: 47/100 (typical for sector)

Strengths:
- Multiple text formats provided
- Clear marking criteria

Gaps:
- Assessment 2: only written submission option (single mode of expression)
- Reading list: 90% text, no audio/video alternatives
- Lecture slides: dense text, no visual representation alternative
- No reflexivity scaffolding for diverse learners

Specific recommendations:
1. Offer Assessment 2 in 3 modes: essay / video essay / podcast
2. Provide audio versions of top 5 readings (we can generate these)
3. Add visual summary slides to current text-heavy decks
4. Add positionality prompt to assessment briefs

Estimated implementation effort: 8 hours
Estimated student impact: 23% reduction in withdrawal, based on sector data
```

### 3. Institutional Authenticity Verification

University verifies Receipts at scale:
- API endpoint for verification queries
- Bulk verification of submission batches
- Compliance reports for academic integrity board
- Tamper-evident audit trails
- Integration with Turnitin / iThenticate as complementary (not replacement)

Output for academic integrity team:
```
2026 Term 1 — Authenticity Report

Submissions verified through Sovereign: 12,847
Average authenticity score: 84%
Outliers flagged for review: 47 (0.4%)

Common patterns in flagged submissions:
- Brief workspace duration (less than 3 hours total)
- No version history
- High AI assist proportion vs human edits

Note: low authenticity ≠ academic dishonesty. Indicates patterns
worth investigating, not proof of misconduct.
```

### 4. Department-Level Dashboards

Department head sees:
- Aggregate engagement across all courses
- Comparative analysis (your courses vs sector benchmarks)
- Trend over time (semester-on-semester improvement)
- Specific staff coaching opportunities
- Student wellbeing indicators (engagement, stress, time-on-task)

### 5. Cohort Tag (student opt-in)

Students can opt to share their (de-identified) data with their institution:
- In exchange for premium features (free tier access, exam practice unlimited)
- Or for direct support requests
- Or just because they want their institution to improve

Opt-in is per-cohort tag (e.g. "T1_2026_UNSW_BABS1201") — students can be in multiple tags.

University only sees aggregated data, never individual identities. Privacy preserved.

## Pricing

### Tier 1: Department Access ($25K/year)
- Up to 500 students in one department
- Cohort analytics
- UDL audit tool (10 syllabi per year)
- 1 admin seat

### Tier 2: Faculty Access ($60K/year)
- Up to 5,000 students
- Full faculty dashboards
- UDL audit tool (50 syllabi per year)
- 5 admin seats
- Quarterly strategy session

### Tier 3: Whole University ($150K-$300K/year, depending on size)
- Unlimited students
- All features
- Authenticity verification API
- Custom integration with existing LMS
- Dedicated success manager
- White-labelled student app option

### Tier 4: Cross-Institutional Consortium ($1M+/year)
- For sector-wide bodies (Group of Eight, ATN, RUN)
- Comparative analytics across member institutions
- Sector-level UDL maturity benchmarks
- Policy advisory access

## Sales targets (Australia)

Year 1 (2026-2027):
- 3 universities at Faculty level (Aaron's natural connections: UNSW, Monash, Tasmania)
- 1 NSW Department of Education school district (HSC support)
- Revenue target: $250K ARR

Year 2 (2027-2028):
- 6 universities at Faculty level
- 2 at Whole University level
- 3 school districts
- 1 cross-institutional consortium
- Revenue target: $2M ARR

Year 3 (2028-2029):
- 15 universities (mix of levels)
- 10 school districts
- 3 consortia (including international)
- International expansion
- Revenue target: $10M+ ARR

## Why institutions will buy

1. **Replace existing vendor contracts** — UDL audit replaces accessibility tools; cohort analytics replace some learning analytics tools
2. **Compliance pressure** — DSE (Disability Standards for Education), HESF (Higher Education Standards Framework), Disability Discrimination Act all require accommodations Simplifii directly supports
3. **Equity targets** — Universities have widening-participation KPIs that Sovereign Pathways directly serves
4. **Authenticity crisis** — AI submissions are an existential threat; Receipts solve it
5. **Student satisfaction** — NSS / SES scores increasingly tied to wellbeing and support
6. **Retention pressure** — Every withdrawal costs $20K+; Sovereign reduces withdrawals

## Aaron's strategic advantages for B2B sales

- Existing UNSW relationships (PVCSS, Disability Innovation Institute, EDI committee)
- HESP policy submission published — credibility with Department of Education
- Diversified Project track record at UNSW
- NDRP Research Leadership Award winner
- Multiple advisory positions (ACSES, PWDA, ADCET)
- MRes thesis literally validates the product (national UDL audit IS the diagnostic Sovereign delivers)

## Critical constraint: data privacy

Institutional features ONLY access aggregate, de-identified data.

- Individual student work NEVER shared with institution without student's explicit per-action consent
- "Cohort Tag" is opt-in, easily revocable
- Authenticity verification works on hash, not content
- Compliance with: Privacy Act 1988 (Cth), GDPR (for international), state privacy laws
- Annual external privacy audit included for Whole University tier
- Student-controlled data export and deletion always available

Without this constraint, institutional features would destroy student trust. The constraint IS the differentiator.

## What this sprint should ship

Minimum viable B2B (3-week sprint):
1. InstitutionalDashboard route
2. Course code search
3. Aggregate analytics for ONE pilot institution (UNSW)
4. Cohort tag opt-in flow for students
5. UDL audit tool for syllabi (single subject pilot)
6. Pricing/sales infrastructure

Full v1 (12-week sprint):
7. Department / Faculty / University dashboards
8. UDL Curriculum Alchemist (cross-disciplinary)
9. Authenticity verification API
10. LMS integrations (Canvas, Moodle)
11. Department head dashboards
12. White-labelled student app option
13. Admin seat management
14. Annual contract / renewal flows

## Dependencies

- Tier architecture
- Receipt + authenticity system
- Citation engine (for syllabus / brief ingestion)
- Ingestion engine
- HistoryOfThought (for analytics base)

## Why this is the ultimate moat

B2C users churn. B2C revenue is per-month, per-individual, low retention risk but low LTV.

B2B universities buy annually, renew long-term, multi-year contracts, high LTV. One university at $200K/year = 800 individual subscribers at $25/month.

10 universities = $2M ARR with one sales rep. 50 universities = $10M ARR.

But B2B requires the B2C base to demonstrate value. Universities won't buy until thousands of students are already using and loving Simplifii.

Build order:
1. B2C foundation (current)
2. B2C scale (next 6 months)
3. B2B pilots (months 6-12)
4. B2B scale (Year 2+)

## Notes added

- 2026-05-15: Raised by Aaron with "Institutional Annexation" framing.
- The framing ("hefty fee", "forensic access", "annex") is provocative — softening for actual customer conversations is important.
- Aaron's MRes IS the product. His national UDL audit becomes Sovereign's diagnostic engine. The thesis becomes the sales asset.
- Year 1 pilot at UNSW makes natural sense given Aaron's relationships there.
