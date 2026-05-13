# The Receipt + Public Authenticity Ledger [SPEC]

## What this is

A one-page PDF attached to every submission. Proves the work was authored by the human over time, with documented process, AI assists, edits, and provenance hash. Optional public ledger commits the hash to a verifiable record.

The moat made tangible. The thing that makes Simplifii infrastructure.

## Status

[BACKLOG → SPEC] — sketched in Elon Mode discussion. Ready to specify.

## Why this exists

In the AI era, every submitted piece of writing is suspect. Markers cannot tell if a student wrote it. Universities scramble for detection tools that don't work. Students who DO write their own work are accused. Trust collapses.

The Receipt restores trust through transparency. Not "we detected this is real" (no AI can do that reliably). Instead: "here is the documented process this work emerged from."

## The Receipt PDF — what's on it

### Page 1 — Cover

```
SOVEREIGN AUTHENTICITY RECEIPT

Aaron Saint-James
MDIA5001 Writing for Media — Assessment 2
University of New South Wales
Submitted: 15 May 2026, 23:47 AEST

Authenticity Score: 87%
Receipt ID: 7a2f-9c8e-4b3a
Cryptographic hash: 9b8e7d6c5a4b3a2e...
Verification: simplifii.com/verify/7a2f-9c8e-4b3a

This work was authored by the named human over 14 sessions
spanning 11 days, totalling 23 hours and 14 minutes of active
writing time. The full provenance below.
```

### Page 2 — Process Summary

```
Writing Sessions:        14
Total active time:       23h 14m
Idle time (thinking):    8h 32m
Average session length:  1h 39m
First session:           4 May 2026, 19:23 AEST
Final session:           15 May 2026, 23:14 AEST
Days of work:            11
Days touched:            14

Words written:           2,847 (final)
Words edited (added):    8,234 (lifetime)
Words removed:           5,387 (lifetime)
Net deletions:           5,387 / 8,234 = 65%
                         (heavy revision pattern, healthy)

Edits made:             1,847
Versions captured:       42 snapshots, 3 manual branches
Citations inserted:     14 (all verified)
Sources in corpus:      23
```

### Page 3 — AI Assist Log

```
AI Tools Used (transparent log):

Brief Simplifier:     3 uses (assessment brief decoded)
Rubric Translator:    2 uses (rubric explained in plain English)
Scaffolder:           4 uses (section sub-tasks generated)
Cognitive Anchor:    12 uses (relevant sources surfaced)
Faded Scaffold:       2 uses (one stem inserted, completed by user)
Check Against Rubric: 3 uses (pre-submission gap check)

NEVER USED:
- Reconstruction Engine (no AI-generated paragraphs)
- Bulk Generation (no chaos-to-draft)

This receipt confirms: ALL prose was authored by the human.
AI assists used for scaffolding, decoding, and surfacing — not generation.
```

### Page 4 — Per-Section Authenticity

```
Section          Words   Sessions  Time    Edits   Score
Introduction     487     3         2h 14m  234     92%
Main Body        1843    6         12h 03m 1247    85%
Conclusion       317     2         1h 47m  98      94%
References       200     3         7h 10m  268     88%

Overall:         2847    14        23h 14m 1847    87%
```

### Page 5 — Version Timeline

```
Major milestones captured:

4 May 2026:    Project created
4 May 2026:    Brief uploaded, decoded
6 May 2026:    Outline complete
8 May 2026:    First 500 words milestone
9 May 2026:    Pre-AI rewrite snapshot (before structural revision)
10 May 2026:   Branch: "Methodology v2" forked
12 May 2026:   1500 words milestone
14 May 2026:   Pre-restore snapshot (rolled back to v2)
15 May 2026:   2500 words milestone
15 May 2026:   Final submission snapshot

Branch tree visualised:
  main ────●────●────●────●────●────●──[submit]
           │              │
           Methodology v2 ●
```

### Page 6 — Cryptographic Proof

```
Document Hash (SHA-256):
9b8e7d6c5a4b3a2e1f0d9c8b7a6e5f4d3c2b1a0987654321fedcba0987654321

Hash Chain:
Each snapshot references the hash of the previous snapshot, creating
an immutable provenance chain. Tampering with any past version
would invalidate all subsequent hashes.

42 snapshots in chain, all valid.

Verification:
Scan QR code to verify at simplifii.com/verify/7a2f-9c8e-4b3a
(Read-only public verification page. No personal data exposed.)

[QR CODE]

This receipt cannot be edited after generation. It is signed
cryptographically and locked to the submitted document.
```

## Tier-aware variations

### Secondary (HSC student)

Single-page certificate:
- Student name, school, major work title
- Hours worked, words written, sessions
- Authenticity score
- Cryptographic hash
- Suitable for HSC submission attachment

### Undergrad

Per-assessment receipt (above pattern, 2 pages).

### Honours / Masters

Multi-chapter thesis receipt (4-6 pages):
- Per-chapter breakdown
- Supervisor interaction count
- Methodology decisions summary

### Research Higher Degree

Comprehensive thesis receipt (8-12 pages):
- All phases, all strands, all chapters
- Methodology decisions log
- Reflexivity log summary
- Source corpus integrity
- Cryptographic hash chain
- Suitable for examination submission

### Academic Professional

Publication receipt:
- Per-author contribution percentages
- Submission history
- Peer review responses incorporated
- Revision rounds
- Authenticity for journal verification

## Public Authenticity Ledger (opt-in)

User can choose to commit their Receipt hash to a public ledger:
- Anonymous by default (only hash, not identity)
- Identifiable if user opts in (cv link, ORCID, employer verification)
- Could be: blockchain (Ethereum, Solana), private ledger, certificate authority

Future use cases:
- Employers verify candidate's degree authenticity
- Universities verify transfer credit work
- Journals verify manuscript authorship
- Funders verify research outputs
- Public researchers verify their own corpus

Optional: aggregate stats across user's ledger:
```
Aaron Saint-James
- 47 verified academic outputs since 2024
- Average authenticity score: 92%
- Total recorded thinking time: 1,247 hours
- Verified by Simplifii Authenticity Ledger
```

## Technical implementation

### Hashing
SHA-256 of:
- Final document content
- Concatenated content of all snapshots
- Methodology log entries
- Reflexivity log entries
- Supervisor feedback addressed
- Sources cited
- Timestamps and durations

Hash chain: each snapshot's hash includes previous snapshot's hash, so tampering invalidates the chain.

### Storage
- Receipt PDF generated on-demand
- Hash stored in IndexedDB (local)
- If public ledger opted in: hash transmitted to ledger service
- User controls retention of underlying snapshots (Receipt remains valid as long as snapshots exist)

### Verification page
- Public URL: simplifii.com/verify/{receiptId}
- Shows: receipt validity, hash, timestamp, summary stats (no personal data)
- Visitor can re-hash submitted document and compare
- Tamper-evident

## Use cases

### Use Case 1: HSC student attaches Receipt to major work submission

Aisha submits Science Extension to her teacher.
Receipt attached as page 1.
Teacher sees: 47 sessions, 89 hours, 12 verified citations, AI assists logged transparently.
Teacher trusts the work.

### Use Case 2: PhD candidate submits thesis with Receipt

Aaron submits MRes thesis.
Receipt attached as Appendix A.
Examiners see: 247 sessions over 18 months, 47 verified citations, methodology log shows real pivots, reflexivity log shows authentic engagement.
Defence is grounded in evidence of process.

### Use Case 3: Job applicant verifies degree authenticity

Graduate applies for role.
Includes link to public ledger entry.
Employer scans QR, sees aggregate authenticity stats.
Confidence in authentic learning.

### Use Case 4: Journal verifies authorship

Author submits manuscript.
Receipt attached as supplementary file.
Journal can verify human authorship without invasive detection tools.
Trust restored.

### Use Case 5: University adopts Receipt as standard

UNSW partners with Simplifii.
All students get Sovereign access.
All assessments submitted with Receipt.
Academic integrity restored at institutional scale.

## What this sprint should ship

Minimum viable (3-day sprint):
1. ProvenanceService.generateReceipt({ projectId, tier })
2. PDF generation (using existing DocxExportService pattern)
3. SHA-256 hashing of document + snapshots
4. Per-tier Receipt templates (5 templates)
5. Receipt modal in CanvasNav

Enhanced (2-week sprint):
6. Hash chain across snapshots
7. Public verification page
8. QR code generation
9. Multiple file format export (PDF, signed JSON)
10. Public ledger integration (opt-in)
11. Employer verification API

## Dependencies

- HistoryOfThought (yesterday)
- Version History (yesterday)
- Tier architecture

## Why this is the moat

Microsoft can't do this. Notion can't do this. Grammarly can't do this. ChatGPT can't do this.

Receipts require:
- Continuous capture (we have this via HistoryOfThought)
- Version history (we have this)
- Methodology log (we have this in Research mode)
- Cryptographic hashing (we'll build this)
- Privacy-first storage (we have this via IndexedDB)

The Receipt is the most defensible feature in Simplifii. Competitors can copy 5 Sovereign Layers. They can copy the canvas. They cannot copy years of continuous process capture for individual users. The longer Aaron uses Simplifii, the stronger his Receipt evidence becomes.

This is what universities, employers, funders will eventually require. Simplifii becomes infrastructure.

## Notes added

- 2026-05-15: Sketched in Elon Mode discussion as "The Receipt". Most defensible feature.
- The QR code + verification page makes it social. Students share their Receipt as proof of authentic work.
- Public ledger is opt-in only. Privacy paramount.
- Tier-aware templates ensure Year 12 student doesn't get a thesis-shaped receipt.
