# Citation Integrity Engine [SPEC]

## What this is

Citation system that NEVER fabricates. Supports 8+ citation styles. Auto-bibliography. One-click style switching. Direct insertion at cursor. The killer differentiator: hallucination-proof.

## Status

[SPEC] — partially explored, ready to refine.

## Why this is foundation

Every tier needs citations. Without integrity, the product is dangerous for academic users. With integrity, this becomes the most trusted writing tool in academia.

## Supported styles

- APA 7th Edition (psychology, education, social sciences)
- Harvard (UK / Australia variants)
- Chicago 17 (notes-bibliography AND author-date)
- MLA 9
- Vancouver (biomedical)
- AGLC 4 (Australian legal)
- AMA (American Medical)
- IEEE (engineering)
- Custom (user defines)

## Core principle: zero fabrication

The system ONLY cites from the user's corpus. Never invents authors, dates, or titles.

If user types "(Smith, 2023)" without Smith in corpus:
- Red wavy underline appears
- Hover tooltip: "Smith 2023 not in your corpus. Add to library or remove citation."
- "Add source" button to ingest

If AI suggests a citation (in any layer like Logic Frame, Cognitive Anchor, Scaffold):
- Must be from corpus
- Must be marked verified: true
- Otherwise displays "[REFERENCE NEEDED]" placeholder
- Never auto-generates author names, years, or titles

## Corpus management

Every project has a `projectSources` store:

```js
{
  sourceId: uuid,
  projectId: foreign key,
  type: 'pdf' | 'url' | 'doi' | 'book' | 'interview' | 'field_note' | 'audit_data' | 'personal_writing',
  title: string,
  authors: [string],
  year: number,
  doi: string,
  url: string,
  filePath: string,
  rawText: string,
  aiSummary: string,
  methodology: string,
  keyFindings: string,
  relevanceToChapters: { chapterId: relevanceScore },
  citationKey: 'lastname_year',
  tags: [string],
  pinnedNotes: [{ note, scope }],
  verified: boolean (CRITICAL — only true when user confirms metadata)
}
```

## Verification flow

For each source in corpus:
1. Ingestion extracts metadata via AI (or manual entry)
2. Source displayed with 'Unverified' badge
3. User clicks 'Verify' → opens detail panel
4. Shows extracted fields side-by-side with raw text
5. User confirms or edits each field
6. Click 'Verified' → badge turns emerald
7. Only verified sources used in AI suggestions

## Citation insertion UX

In editor:
- "[Cite]" button in toolbar OR Cmd+K shortcut
- Opens CitationInserter modal
- Typeahead search of corpus
- Filter by: tag, year, author, type
- Preview source card (title, authors, year, summary)
- Click → inserts at cursor in active style
- AI detects grammar context: "(Cumming, 2024)" vs "Cumming (2024)"
- Page number prompt if quoting verbatim

## Bibliography view

- Live-builds at end of draft (or dedicated References section)
- Updates as citations added/removed
- Alphabetised per style
- Hanging indent in APA
- One-click style switch reformats entire bibliography
- Export as separate document
- Detect orphans (citations without bibliography entries) and vice versa

## Style formatters

```js
CitationStyleService.formatInText(source, style, options) → 
  '(Cumming, 2024)' or 'Cumming (2024)' or '(Cumming, 2024, p. 14)'

CitationStyleService.formatBibliographyEntry(source, style) → 
  'Cumming, T., Jolly, A., & Saint-James, A. (2024). Title. Frontiers in Education, 9...'

CitationStyleService.formatBibliography(sources, style) → 
  full reference list
```

## Multi-format import

Accept on ingest:
- BibTeX (.bib)
- RIS (.ris)
- Zotero JSON (.json)
- Mendeley export
- EndNote XML
- Paste reference list (AI parses each entry)
- DOI list (one per line, AI fetches metadata)
- URL list (AI extracts metadata via Crossref / DOI lookups)

## Integration with 5 Sovereign Layers

- **Layer 1 (Logic Frame):** Questions may reference cited concepts from corpus
- **Layer 2 (Faded Scaffold):** Stems can include "[CITATION FROM YOUR CORPUS]" placeholders
- **Layer 3 (Cognitive Anchor):** Sources from corpus surface as anchors per section
- **Layer 4 (Vibe Meter):** Citation density contributes to Rigour score
- **Layer 5 (History of Thought):** Citation events logged

## What this sprint should ship

1. `src/services/CitationService.js`
2. `src/services/CitationStyleService.js`
3. `src/frontend/components/CitationManager.jsx`
4. `src/frontend/components/CitationInserter.jsx`
5. `src/frontend/components/BibliographyView.jsx`
6. Corpus management UI
7. Verification flow
8. 4 style formatters minimum (APA7, Harvard, Chicago, Vancouver) for v1
9. Tests for hallucination prevention (key gate)

## Build cost

Full day sprint (6-8 hours). Highest-value foundation feature after tier system.

## Notes added

- 2026-05-15: Originally part of Sovereign Research OS sprint. Critical for credibility.
- This solves Aaron's APA 7th MRes need directly.
- Hallucination prevention is the differentiator. Grammarly doesn't do this. ChatGPT can't do this. Notion AI can't do this.
