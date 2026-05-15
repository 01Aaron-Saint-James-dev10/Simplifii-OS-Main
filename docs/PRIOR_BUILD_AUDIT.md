# Prior Build Audit

**Date:** 2026-05-15
**Repos analysed:** 4 of 6 (UDL3.0-EduTransform and NeuroSparq-Homeschooling were empty)

---

## Repo: Simplifii-MVP (Vite + React, Base44 SDK)

### Reusable code
- `src/components/brief/FileClassifier.jsx` (239 lines): Two-tier document classifier (heuristic-first, LLM fallback). Scores by filename (10pts), content keywords (1.5-3pts each). Classes: ASSESSMENT_BRIEF, COURSE_OUTLINE, RUBRIC, LECTURE_NOTES, UNKNOWN. Port: adapt keyword arrays, wire to `/api/classify-document`.
- `src/utils/llm.js` (120 lines): JSON parsing from LLM output with markdown fence stripping, smart quote repair, trailing comma fixes, longest-valid-object extraction. Port: drop into `src/utils/` as `llmJsonParser.js`.
- `src/components/brief/UploadSection.jsx` (218 lines): Multi-language selector (9 languages), complexity selector (Maximum/Balanced/Minimal), context file upload (rubric, slides, outline). Reference: UX patterns.

### System prompts worth porting
None unique; generic Base44 SDK wrappers.

---

## Repo: neural-docs_base44 (Vite + React, Supabase, React Quill)

### Reusable code
- `src/lib/aiPromptHelper.js` (195 lines): Regional prompt templates with AU/UK/US English variants. 8 functions: Block Analysis, Key Terms, Concept Map, Outline, Bibliography, Maths. Each parameterised by year level and region. Port: adapt as prompt library for tools.
- `src/components/editor/RightPanel.jsx` (80 lines): Tab architecture (Suggestions, Chat, History, Materials). Quick prompts: "Improve my argument", "Fix grammar in this block", "Make this simpler", "Add a topic sentence", "Check my logic". Reference: matches existing PanelRail pattern.

### System prompts worth porting
- **Key Terms Extraction:** "Extract key academic vocabulary appropriate for Year {level}. For each: simple definition (2 sentences max), real-world example, memory tip or mnemonic."
- **Concept Map:** "Identify main concepts, relationships (cause-effect, part-whole, example), logical hierarchy."
- **Outline Generation:** Returns JSON with title, summary, sections[{heading, key_points[], next_steps[]}].

---

## Repo: Cognition-OS (Next.js 14, TypeScript, Prisma, Vercel AI SDK)

### Reusable code
- `lib/ai/document-actions.ts` (99 lines): Vercel AI SDK pattern with GPT-4.1-mini. Functions: `suggestDocumentGuidance()`, `getLanguageSupport()`. Returns JSON with mode/guidance/explanation. Has mock fallback when API key missing. Reference: pattern for future Vercel AI SDK migration.
- `lib/planning/outline-generator.ts` (50 lines): Heuristic sentence bucketing into 5 categories (Introduction, Core argument, Evidence, Counterpoints, Conclusion) by keyword matching. Port: add as offline fallback for section generation.
- `lib/academic/` directory: APA7 citation rule engine. Reference: future citation tooling.

### System prompts worth porting
- **Ethical AI guidance:** "Do not ghostwrite assignments, do not provide submission-ready rewrites, do not help users evade detector systems. Instead, provide rigorous critique, structure suggestions, questions to answer next, and concise improvement guidance."
- **Clarification prompt:** "Rewrite into clearer, easier English for an international student while preserving meaning and academic intent. Do not ghostwrite beyond the supplied content."

---

## Repo: Emergent_AI_Simplifii-beta_MVP_Build (FastAPI + React)

### Reusable code
- `backend/routes/tools.py` (1,053 lines): Full tool suite with production system prompts. Hidden Curriculum Decoder, Essay Scorer, Humaniser, Rubric Simplifier, Scaffolder, Concept Visualiser. Port: translate Python prompts to Node.js API endpoints.
- `backend/routes/tools.py` lines 25-142: AI Risk Scoring algorithm. 10 dimensions (passive voice, sentence uniformity, transition density, formal phrase density, first-person absence, hedging, nominalisation, contraction absence, lexical diversity). Returns 0-100 score. Port: exact JS translation for authenticity checking.
- `backend/routes/briefs.py` (810 lines): Depth-level instructions (V1 Quick Scan, V2 Deep Dive, V3 Expert Analysis) for varying cognitive load. Week-by-week task structure with 3 phases (beginning/throughout/end). Port: add depth selector to Brief Simplifier.

### System prompts worth porting
- **Hidden Curriculum Decoder:** Returns jargonDecoder[{term, plainMeaning, whyItMatters, whatDifferentLooksLike, commonMisunderstanding, workforceTransfer}], whatMarkerWants[4], soundLikeYouBelong{phrasesToUse, phrasesToAvoid, appropriateTone}, hiddenCurriculumChecklist[5], higherOrderPrompts[].
- **Essay Scorer:** "You are not a grade predictor. You are a thinking partner helping the student develop higher-order academic skills."
- **Humaniser:** Ensures student writing sounds authentically like them (not AI-generated).
- **V1/V2/V3 depth instructions:** V1: 2-3 weeks, minimal glossary. V2: 3-5 weeks, 2-3 tasks with subtasks, 5-8 terms. V3: 4-6 weeks, grade-band advice (HD/D/C), 8+ terms, estimated time per task.

---

## Synthesis

### Top 5 things to port immediately
1. **AI Risk Scoring algorithm** (Emergent_AI tools.py): 10-dimension text authenticity checker. Directly supports the Authenticity Report.
2. **Hidden Curriculum Decoder structured output** (Emergent_AI tools.py): Current `/api/decode-hidden` returns free text. The structured JSON schema (jargon + expectations + tone + checklist) is more actionable.
3. **V1/V2/V3 depth levels** (Emergent_AI briefs.py): Let students choose complexity. Quick Scan for overwhelmed students, Expert Analysis for high performers.
4. **Key Terms extraction prompt** (neural-docs_base44): "For each term: definition, real-world example, memory tip." Directly supports the Tutor panel.
5. **Heuristic outline bucketing** (Cognition-OS): 5-category sentence classifier as offline fallback when `/api/generate-sections` fails.

### Top 5 architectural lessons
1. **Heuristic-first, LLM-fallback** pattern saves API costs and provides instant results.
2. **Structured JSON output** from LLM calls (not free text) makes downstream rendering reliable.
3. **Depth levels** (V1/V2/V3) let users control cognitive load without dumbing down the product.
4. **Regional parameterisation** in prompts (AU/UK/US English) prepares for international expansion.
5. **Ethical framing in system prompts** ("never ghostwrite") should be in every AI endpoint.

### Things to NOT repeat
1. Base44 SDK dependency (Simplifii-MVP): vendor lock-in, no longer maintained.
2. Python FastAPI backend (Emergent_AI): unnecessary complexity for a JS-first stack.
3. Storing prompts in route handlers (all repos): should be a shared prompt library.
4. No rate limiting (all repos): Simplifii-OS-main already fixed this.
5. Client-side AI calls (Simplifii-MVP, neural-docs_base44): already eliminated in current build.
