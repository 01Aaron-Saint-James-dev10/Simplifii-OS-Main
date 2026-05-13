# Multi-Modal Ingestion Engine [SPEC]

## What this is

Accept any input format: photos, voice memos, video, web URLs, pasted text, slides, notes app exports, Word documents, PDFs, Discord chats, lecture recordings. Process intelligently. Surface as structured material in the user's container.

## Status

[SPEC] — file plan was approved by Aaron, never coded. Ready to execute.

## Why this is foundation

Most users don't have neat PDFs. They have scattered chaos:
- Year 12 student: phone photos of notes, voice memos on the bus, screenshots of slides
- Equity pathway student: Discord study group chats, lecture recordings, scrawled notes
- Researcher: interview transcripts, field notes, audit spreadsheets, supervisor emails
- Senior academic: peer review PDFs, journal submission guidelines, co-author tracked changes

Without ingestion, the product only serves users with neat document workflows. That's a small slice.

## Input types supported

### Photos (jpg, png, heic, webp)
- Use cases: handwritten notes, whiteboard, textbook page, screenshot of lecture slide
- Processing: preprocessing (deskew, contrast) → OCR (Tesseract.js, browser-native) → structure detection → AI summary → user verification step
- Output: extracted text with confidence markers per segment

### Voice memos (m4a, mp3, wav, webm)
- Use cases: bus thoughts, supervisor meeting (with consent), interview, brainstorm
- Processing: Web Speech API on-device where available, fallback to API → transcript with speaker diarisation if multi-speaker → punctuation restoration → AI summary
- Output: transcript with timestamps, speaker labels, confidence markers

### Video and YouTube
- Use cases: lecture recordings, Panopto links, YouTube tutorials, conference talks
- Processing: extract audio → audio handler. YouTube: fetch transcript if available.
- Output: transcript + key moment timestamps + AI-generated chapters

### Web URLs
- Use cases: news article, journal article webpage, blog post, government policy
- Processing: Readability.js to strip chrome → clean markdown → AI summary
- Output: clean text, source URL preserved, citation-ready

### Text paste
- Use cases: Discord exports, email chains, ChatGPT conversations, pasted lecture notes
- Processing: format detection → structure extraction → AI organisation
- Output: structured chunks, conversation participants if applicable

### Slides (pptx, keynote, pdf-slides)
- Use cases: lecturer's slides, conference deck
- Processing: extract text per slide + image descriptions of figures
- Output: slide-by-slide content with notes

### Notes apps
- Apple Notes export (.zip)
- Notion export (.zip with markdown + media)
- Obsidian vault (markdown files)
- Roam Research export
- Processing: maintain structure, follow internal links

### Word documents (.docx)
- Processing: mammoth.js extracts HTML preserving structure
- Output: extractedHtml, extractedText, metadata

## Critical: Review step

Before ANY ingested content commits to corpus/draft, user reviews:
- Extracted text shown
- Confidence markers highlighted (yellow uncertain OCR, red unclear transcription)
- AI summary shown
- Suggested classification
- Suggested target (which container, chapter, section)
- User accepts, edits, or rejects

This prevents bad OCR/transcription corrupting research records.

## Privacy model

All processing on-device where possible:
- OCR: Tesseract.js (browser-native)
- Transcription: Web Speech API where supported, else explicit consent for API
- All stored locally in IndexedDB
- API calls flagged to user with privacy note
- "Process this locally only" option fails closed if API needed

## Routing per tier

Once reviewed, content routes based on container:
- Secondary: → assessment brief, study notes, exemplar
- Undergrad: → assessment brief, reading, lecture notes
- Research: → projectSources, fieldData, supervisor feedback, methodology log, reflexivity log
- Academic: → publication source, manuscript draft, peer-review comment

User picks target. AI suggests best fit.

## Integration with Citation Engine

If ingested content includes citations (Discord chat mentioning a paper, voice memo citing an author), Citation Service identifies potential corpus additions but marks them 'unverified, needs metadata'. Never auto-adds.

## File structure to build

```
src/services/IngestionService.js (orchestrator)
src/services/handlers/PdfHandler.js (refactor existing)
src/services/handlers/ImageHandler.js (Tesseract.js OCR)
src/services/handlers/AudioHandler.js (Web Speech API)
src/services/handlers/VideoHandler.js (extract audio)
src/services/handlers/WebHandler.js (URL fetch + clean)
src/services/handlers/TextPasteHandler.js
src/services/handlers/SlideHandler.js (pptx)
src/services/handlers/NotesAppHandler.js
src/services/handlers/DocxHandler.js (mammoth.js)
src/frontend/screens/IngestScreen.jsx
src/frontend/components/IngestReview.jsx
```

## API contracts

```js
IngestionService.ingestFile({ file, type, targetProjectId }) → {
  ingestId, processingStatus, estimatedSeconds
}

IngestionService.reviewIngest(ingestId) → {
  extractedText, confidence, aiSummary, 
  suggestedClassification, suggestedTarget, flaggedSegments
}

IngestionService.commitIngest(ingestId, userEdits, finalTarget) → 
  routes to appropriate store
```

## Build cost

2-day sprint. Foundation for everything else.

## Notes added

- 2026-05-15: Original sprint file plan approved by Aaron, abandoned when CC got confused by stacked sprints.
- Tesseract.js + mammoth.js are the two new dependencies.
- This must ship before Sovereign Home, HSC, Equity Pathways (all depend on multi-modal input).
