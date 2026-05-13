# Mockup: TIER_ACADEMIC_PROFESSIONAL — Sage [SPEC]

## Tier identity

- **Tier:** TIER_ACADEMIC_PROFESSIONAL
- **Character:** Sage
- **Audience:** Postdocs, lecturers, senior researchers, faculty, independent researchers
- **Archetype:** Senior, multi-project, doesn't need scaffolding, needs efficiency

## Palette overrides

- Primary: `--zinc-950` (Obsidian)
- Accent: `--bronze-500` (#C8923F)
- Secondary: `--burgundy-500` (#9B2C2C)
- Ink black: `--zinc-100` (for high-contrast text on bronze surfaces)
- Mascot SVG: owl or scholar figure, gravitas without preciousness

## Workspace architecture (different from research tiers)

Academic tier doesn't have a single thesis. It has a workspace of multiple concurrent publications, grants, peer reviews, manuscripts.

Container shape: Workspace → Publications → Drafts.

## Home dashboard layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [🦉 Sage]   Prof Aaron Saint-James (future)   [🔍]   [⚙]            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   WORKSPACE                                                        │
│   ─────────────────────────────────                                │
│                                                                    │
│   ┌─────────────────────────────┬─────────────────────────────┐   │
│   │  IN DRAFT (3)               │  UNDER REVIEW (2)           │   │
│   │                             │                             │   │
│   │  Sovereign OS Evaluation    │  UDL 3.0 National Survey    │   │
│   │  Higher Education Research  │  British J of Inclusion     │   │
│   │  78% • Coauthor: Cumming    │  Decision: pending          │   │
│   │                             │                             │   │
│   │  Disability-Led Research    │  Reflexive Research Methods │   │
│   │  Methodology Manifesto      │  Qualitative Inquiry        │   │
│   │  42% • Solo                 │  Decision: revision         │   │
│   │                             │                             │   │
│   │  Co-Production Toolkit v2   │                             │   │
│   │  Practice Guide             │                             │   │
│   │  15% • Coauthors: 3         │                             │   │
│   └─────────────────────────────┴─────────────────────────────┘   │
│                                                                    │
│   GRANTS                                                           │
│   ─────────────────────────────────                                │
│   ARC Discovery — Idea stage                                       │
│   NDIS Capacity Building — Application drafting                    │
│   Paul Ramsay Foundation — Letter of intent submitted              │
│                                                                    │
│   PEER REVIEW QUEUE                                                │
│   ─────────────────────────────────                                │
│   2 manuscripts awaiting review (Frontiers, Higher Education)      │
│                                                                    │
│   THIS WEEK                                                        │
│   ─────────────────────────────────                                │
│   Mon: PhD student supervision meetings                            │
│   Tue: Faculty council                                             │
│   Wed: Sovereign OS public talk @ HERDSA                           │
│   Thu: Grant writing day                                           │
│   Fri: Manuscript revisions                                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Navigation structure

### Left rail
- Publications (categorised: drafting / under review / published / co-authoring)
- Grants (applications, active grants)
- Peer review (incoming reviews to do)
- Supervision (PhD/Masters students you supervise)
- Workspace settings

### Different from RHD
- Multiple concurrent works (not single thesis)
- Co-author flows prominent
- Grant lifecycle management
- Peer review queue
- Supervision dashboards (for those supervising)

## Key panels

### Per-publication canvas
- TipTap editor with chapter/section navigation
- Co-author indicators (who edited what, when)
- Comment threads (per section, per co-author)
- Submission tracker (target journal, submission date, decision)
- Revision rounds tracker

### Grant application canvas
- Structured to grant scheme template (ARC, NHMRC, NDIS, etc)
- Budget builder
- Track record auto-populated from publication history
- Justification scaffolding
- Submission deadline countdown

### Peer review canvas
- Manuscript under review
- Annotation tools
- Review template (per journal standards)
- Comparison to previous reviews
- Submission to journal portal

### Supervision dashboard
- Each supervised student visible
- Their progress / methodology log / receipt
- Meeting scheduler
- Feedback templates

## Welcome screen

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│        [🦉 Sage figure, bronze accent]                  │
│                                                        │
│              Welcome to your workspace.                │
│                                                        │
│        Multiple projects. One sovereign space.         │
│                                                        │
│   [Import your publications]                           │
│   [Add a new publication]                              │
│   [Connect Zotero / EndNote]                           │
│                                                        │
│             "The corpus expands."                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Empty state copy

- "Workspace empty. Add your first publication or import your existing manuscripts."
- "No co-authors connected. Invite collaborators by email."
- "Peer review queue empty. Connect your reviewer accounts to manage."

## Loading messages (Sage specific)

- "Sage is loading your workspace"
- "Publications queued"
- "Compiling your scholarly output"
- "Cross-referencing the corpus"

## Voice and copy register

- Peer-to-peer
- Terse
- Expects expertise
- No fluff
- "Reviewer 2 has noted Y" not "Hey, looks like a reviewer mentioned something"
- "Submission deadline in 6 days" not "Just a reminder!"

## Tier-specific features visible

- Multi-publication workspace
- Co-author flows (commenting, tracked changes, contribution percentages)
- Journal target tracking (impact factor, scope, recent decisions)
- Peer review response templates
- Citation analytics across own publications
- Grant scheme templates
- Supervision dashboards
- ORCID integration
- Scopus / Google Scholar sync

## Tier-specific features HIDDEN

- Quest mode (homeschool only)
- Practice mode (student tiers)
- Phases & Strands (RHD only — though Sage can supervise students with these)
- Tier-appropriate features only — Sage doesn't need beginner scaffolding

## Co-author UX

When a publication has co-authors:
- Each co-author's edits attributed
- Comments threaded per section
- "Resolve" workflow for review threads
- Authorship statement auto-generated
- Contribution percentages tracked
- Final author order suggested based on CRediT taxonomy

## Submission tracking

Per manuscript:
- Target journal selected
- Submission date
- Editor decision (with date)
- Review rounds tracked
- Time-in-review monitored
- Acceptance / rejection logged
- If rejected: reformulate for new journal flow

## Grant lifecycle

Per grant application:
- Scheme details (deadline, eligibility, budget cap)
- Application sections (track record, project description, budget, references)
- Co-investigators
- Letters of support tracking
- Submission portal integration
- Outcome tracking
- If funded: active grant management

## Pricing-aware UX

Sage tier has two pricing options:
- Standard ($89/month) — most features
- Pro ($149/month) — team workspace (up to 5 collaborators), API access, white-label

Pro features shown with subtle indicator. Upgrade prompts non-intrusive.

## Theme-swap behaviour

Sage is the senior aesthetic. Most academics will keep it. Swappable to:
- Atlas (slightly less senior feel)
- Bowser-OS (those who want the research aesthetic of their RHD students)
- Hub (those who want institutional dashboard aesthetic)

Layout stays multi-publication workspace.

## Mobile considerations

Senior academics often work cross-device:
- Tablet for reviewing manuscripts
- Desktop for grant writing
- Phone for quick comment responses

Mobile layout focuses on:
- Inbox-style review queue
- Quick comment responses
- Supervision check-ins
- Calendar view of deadlines

## Build cost

This mockup informs Sovereign Academic build. Lower priority than student tiers (revenue per user higher but smaller market).

Estimated 3-week sprint to launch with minimum viable Academic tier.

Build sequence:
1. Workspace data model (publication, grant, peer-review entities)
2. Multi-publication navigation
3. Co-author infrastructure
4. Submission tracking
5. Grant application templates
6. Peer review tools
7. ORCID integration
8. Supervision dashboard

## Notes added

- 2026-05-15: Sage is the most "professional" tier. Aaron's future self at age 40+.
- Different container shape from all other tiers (workspace not project).
- Lower volume but higher revenue per user.
- Critical for capturing Aaron's future trajectory as he moves from MRes → PhD → postdoc → faculty.
