# References Manager (right-side citation block) [SPEC]

## What this is

Right-rail panel for managing the project's reference corpus. Paste URL / DOI / PDF, AI extracts metadata, generates citation in active style, summarises source, identifies methodology, scores relevance, inserts at cursor with one click. Auto-builds bibliography.

Aaron's specific request from May 15: "how can we add references into this canvas block for it to put it maybe on the right-hand side of the canvas? Then use AI to map out the citation for the reference in the preferred referencing style, how it relates to this course or assessment, a summary of it. All the data, other methodologies, and stuff like that as well."

## Status

[SPEC] — directly requested. Foundational dependency: Citation Integrity Engine.

## Position

Right-rail panel, alongside existing canvas panels (Brief, Tutor, Preview, Sources, Authenticity, Check). New tab: "R" (References).

Or replaces "S" (Sources) and consolidates.

## UI Layout

```
┌─────────────────────────┐
│  REFERENCES             │
│  [+ Add source]         │
│                         │
│  Search: [____________] │
│  Filter: All ▼          │
│                         │
│  ──────────────────     │
│                         │
│  📄 Cumming, T. (2024)  │
│  Frontiers in Education │
│  ★★★★★ verified         │
│  Relevance: Methods 87  │
│  [Insert cite] [Open]   │
│                         │
│  ──────────────────     │
│                         │
│  📄 Hamraie, A. (2019)  │
│  Crip Technoscience     │
│  ★★★★☆ unverified        │
│  Relevance: Theory 92   │
│  [Insert cite] [Open]   │
│                         │
└─────────────────────────┘
```

## Add Source flow

Click "+ Add source":

Modal with multi-input:
- Paste URL
- Paste DOI
- Paste citation (any format, AI parses)
- Upload PDF
- Search for source (typeahead from common databases)
- Manual entry (form)

Processing:
1. Extract metadata via AI
2. Show extracted fields for verification:
   - Authors
   - Year
   - Title
   - Journal / Book / Publisher
   - DOI / URL
   - Volume / Issue / Pages
3. User confirms or edits
4. AI generates:
   - 200-word summary
   - Methodology used (if applicable)
   - Key findings
   - Relevance score per chapter type
   - Citation key (lastname_year)
   - Tags
5. Save to projectSources store
6. Marked verified: false until user explicitly verifies

## Verification Step (CRITICAL — anti-hallucination)

Before any source is used in AI-suggested citations:
- 'Verify' button visible on source card
- Click → opens detail panel with extracted text + AI's metadata interpretation side-by-side
- User confirms each field correct
- Click 'Verified' → badge turns emerald
- Only verified sources used in AI suggestions across the 5 Layers

This prevents Simplifii from EVER citing a hallucinated source.

## Insert Citation flow

In editor:
- Place cursor where citation needed
- Click "Insert cite" on source card
OR
- Cmd+K shortcut → opens search modal → select source → insert

Citation inserted in active style:
- APA 7: (Cumming, 2024) or Cumming (2024)
- Grammar context detected (AI determines parenthetical vs narrative)
- Page number prompt if quoting verbatim
- Multi-author handled correctly: (Cumming et al., 2024)

## Auto-Bibliography

Auto-builds at end of draft (or dedicated References section):
- Updates as citations added / removed
- Alphabetised per style
- Hanging indent in APA
- Italicised journal names
- DOI as hyperlink in digital version
- Plain text in print

Style switcher reformats entire bibliography:
- Click "Switch to Harvard" → all citations + bibliography reformat instantly
- No data lost, source metadata stays clean

## Relevance Scoring

For each source, AI scores 0-100 relevance to each chapter type:
- Introduction
- Literature Review
- Methodology
- Findings
- Discussion
- Conclusion

Scores visible on source card. Filter / sort by relevance to current section.

This powers the Layer 3 Cognitive Anchor rail (anchors prioritised by relevance).

## Methodology Extraction

For research sources, AI extracts:
- Study design (qualitative, quantitative, mixed)
- Method (interviews, survey, ethnography, experiment, etc)
- Sample size
- Analysis approach
- Geographic context
- Year of data collection

This populates a filter ("Show me all qualitative methodology papers from Australia") and supports literature review structuring.

## Pinning per section

User can pin a source to a specific section:
- Right-click source card → "Pin to Methodology section"
- Pinned sources surface prominently when student opens that section
- Layer 3 Cognitive Anchor surfaces pinned sources first

## Personal Notes

Each source has a notes field:
- "This is the foundational UDL 3.0 paper"
- "Saint-James et al critique this position"
- "Use for Chapter 4 audit findings comparison"

Notes searchable across all sources. Useful for synthesising literature review.

## Import / Export

Import:
- BibTeX (.bib)
- RIS (.ris)
- Zotero JSON
- EndNote XML
- Mendeley export
- Paste reference list (AI parses each)
- DOI list

Export:
- BibTeX (.bib) for Overleaf / LaTeX users
- RIS (.ris) for Zotero / Mendeley
- Plain text bibliography in any style
- Formatted as standalone reference document

## Cross-Project corpus

For RHD and Academic tiers, sources persist across projects:
- A source added in MRes Chapter 2 available in PhD Chapter 1
- Tagged "MRes_foundational" or "PhD_new"
- Build a personal research library over years

## Special source types

Beyond standard journal articles:

- **Field notes** (your own observations) — not for citation, but searchable
- **Interview transcripts** (your data) — citation as primary source
- **Audit data** (your spreadsheets) — citation as primary source
- **Personal writing** (your past publications) — citation legitimate
- **Supervisor emails** (private context) — not cited, but searchable for context
- **Grey literature** (government reports, policy docs, NGO papers) — properly cited
- **Pre-prints** (Arxiv, SocArxiv) — cited with version
- **Conference papers** (proceedings, abstracts) — cited correctly

## Build cost

Foundation features (must ship together):
1. Add source with metadata extraction
2. Verification flow
3. Insert citation at cursor
4. Auto-bibliography
5. Style switcher (4 styles: APA7, Harvard, Chicago, Vancouver)
6. Hallucination prevention

Build: 6-8 day sprint as part of Citation Integrity Engine sprint.

Enhanced features (separate sprint):
7. Relevance scoring per chapter
8. Methodology extraction
9. Cross-project library
10. Import/export (BibTeX, RIS, Zotero, EndNote)
11. Special source types
12. Personal notes
13. Pinning per section

Build: additional 3-4 day sprint.

## Dependencies

- Citation Integrity Engine (foundation)
- Ingestion Engine (for PDF upload)
- 5 Sovereign Layers (Layer 3 reads from corpus)

## Notes added

- 2026-05-15: Aaron specifically asked for "right-hand side of the canvas" placement.
- This is THE references manager replacing Zotero / Mendeley for Sovereign users.
- Hallucination prevention is the legal differentiator (no fake citations ever).
- AI relevance scoring is the productivity differentiator.
- Cross-project library is the long-term moat (compounds over years).
