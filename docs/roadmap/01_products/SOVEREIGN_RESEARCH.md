# Sovereign Research — Research Higher Degree Mode [SPEC]

## What this is

The container architecture for Honours, MRes, PhD, and senior academics. Multi-year projects with phases, strands, chapters. Supervisor integration. Reflexivity log. Methodology log. Personal corpus. Voice DNA. Cross-phase amalgamation.

## Status

[SPEC] — fully specified in original Sovereign Research OS prompt. Never built.

## Audience

- Honours students
- Coursework Masters with dissertation component
- MRes candidates (Aaron's tier)
- PhD candidates
- Postdocs
- Faculty researchers

## Aaron is the dogfood case

Aaron's MRes is the working example. Three-phase research program:
- **Phase 1: MRes (2026-2027)** — Institutional Mapping
  - Strand 1: National Policy and Resource Audit (38-42 universities)
  - Strand 2: UNSW Staff Survey + Cross-institution Interviews
- **Phase 2: PhD (2027-2030)** — Disability-Led Co-Production
  - Strand 1: Lived experience co-research
  - Strand 2: Implementation case studies at HIGH-adoption institutions
  - Strand 3: Framework development (UDL 3.0+ enhanced)
- **Phase 3: Postdoc / Academic Position (2030+)** — Sector Transformation

## Persona templates

### Persona 1: The Lived-Experience Researcher (Aaron's archetype)
- Mature-age, first-in-family, neurodivergent
- Dual positionality (researcher + practitioner + lived experience)
- Reflexivity is methodological, not optional
- Needs: positionality tracker, dual-role acknowledgement, lived experience integration moments, supervisor pushback support
- Onboarding asks: "Does your lived experience inform your research methodologically?"
- If yes: reflexivity log is prominently displayed, Logic Frame Layer 1 includes positionality questions per chapter

### Persona 2: The Quantitative Researcher
- Often STEM background
- Methodology log heavy on statistical decisions
- Less reflexivity emphasis (still tracked for ethics, not central)
- Needs: stats decision log, methodology version control, results interpretation discipline
- Onboarding asks: "Is your work primarily quantitative, qualitative, or mixed?"

### Persona 3: The Long-Distance PhD
- Part-time, working professional
- Often spends weeks away then weeks deep
- Needs: strong re-entry overlays (where was I?), session resumption, supervisor catch-up generation
- Onboarding asks: "Are you part-time or full-time?"

### Persona 4: The First-Generation Researcher
- No family/friend network in academia
- Doesn't know what they don't know
- Needs: academic literacy coach, supervisor expectation explainers, ethics process scaffolding
- Onboarding asks: "Is anyone in your immediate network familiar with postgraduate research?"

### Persona 5: The Senior Academic
- 10+ years post-PhD
- Multiple concurrent projects, co-authors, journals
- Needs: workspace view across publications, co-author flows, journal target tracking, peer review response templates
- Different container shape: Workspace → Publications

## Container architecture

```
Project
├── Phase 1
│   ├── Strand 1
│   │   ├── Chapter 4 (Findings: Audit)
│   │   └── Chapter 5 (Findings: Survey)
│   ├── Strand 2
│   │   └── Chapter 5
│   ├── Chapter 1 (Introduction)
│   ├── Chapter 2 (Literature Review)
│   ├── Chapter 3 (Methodology)
│   ├── Chapter 6 (Discussion)
│   └── Chapter 7 (Conclusion)
├── Phase 2 (placeholder)
└── Phase 3 (placeholder)

Cross-cutting:
├── Project Sources (the corpus)
├── Methodology Log
├── Reflexivity Log
├── Supervisor Feedback
└── Authenticity Receipt
```

## Data model

See TIER_ARCHITECTURE.md and original Sovereign Research OS prompt for full IndexedDB schemas. Stores: projects, phases, strands, chapters, projectSources, methodologyLog, reflexivityLog, supervisorFeedback.

## Methodology Log

Every decision recorded:
- Decision: "Chose semi-structured interviews over surveys because..."
- Pivot: "South Australia merger reduced 42 → 38 universities"
- Reflection: "Realised my reflexivity framing was naive..."
- Method change: "Added Chapter 4b after ethics amendment"
- Ethics amendment: "Amendment dated X expanded participant scope"

UI accessible from project home, methodology chapter, quick-add in canvas toolbar.

## Reflexivity Log

For lived-experience researchers:
- Positionality notes
- Power dynamic acknowledgements
- Dual-role acknowledgements (Aaron: researcher + UNSW staff + lived experience)
- Lived experience integration moments
- Reflexive memos by date
- Tensions / contradictions noticed

Integrates with Layer 1 (Logic Frame) — surfaces positionality questions when relevant.

## Supervisor Integration

- Paste feedback (email, comment)
- Type during meeting (meeting notes mode)
- Upload .docx with tracked changes
- Voice transcription (record meeting with consent)
- Quick add from selected text in editor

AI parses into actionable items: priority, category, suggested chapter/section.

Status tracking: unaddressed / in_progress / addressed / declined / discussed.

## Cross-Phase Amalgamation

Special view for synthesis:
- Pick 2+ phases
- See findings side by side
- AI suggests connections, contradictions, evolution
- Build longitudinal narrative
- Useful for: PhD chapter building on MRes, monograph integrating decade of work

## Authenticity Receipt for Thesis

Tier-aware Receipt:
- Per-chapter authenticity scores
- Phase-level summary
- Methodology decisions log summary
- Reflexivity log summary
- Source corpus integrity (X verified citations)
- Total time span, sessions, hours
- AI assists categorised by tool
- Cryptographic hash chain across all snapshots
- QR code for optional public verification

## Aaron's seed data

Pre-populate Aaron's MRes on first launch (with confirmation prompt):
- Title, supervisor, ethics number
- Phase 1 active, Phases 2-3 placeholders
- Strands 1 and 2
- 7 chapters with statuses
- Methodology log entries (real decisions: SA merger pivot, Strand 2 broadening)
- Reflexivity log entries (dual role, lived experience integration, power dynamics)
- Corpus pre-seeds (Thorpe 2025, Cumming 2024, ADCET 2022, CAST UDL 3.0, Braun & Clarke)

## What this sprint should ship

Minimum viable:
1. Project, Phase, Strand, Chapter data model
2. Research Home screen with phase/strand/chapter navigation
3. Methodology Log
4. Reflexivity Log
5. Supervisor Feedback panel
6. Aaron's MRes seed

Full version adds:
7. Corpus management (depends on Citation Engine)
8. Cross-Phase Amalgamation view
9. Authenticity Receipt
10. Voice DNA extraction from personal writing

## Build cost

Minimum viable: full day sprint (6-8 hours).
Full version: 2-day sprint.

## Dependencies

- TIER_ARCHITECTURE.md must be built first
- CITATION_INTEGRITY_ENGINE.md must be built for full corpus support
- INGESTION_ENGINE.md must be built for source upload

## Notes added

- 2026-05-15: Originally Sprint 1 of today. Never executed.
- This is the dogfood story. Aaron's MRes documented in real-time becomes the proof.
