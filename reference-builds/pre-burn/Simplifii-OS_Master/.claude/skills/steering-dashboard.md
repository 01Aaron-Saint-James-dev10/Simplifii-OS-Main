---
name: steering-dashboard
description: Mechanistic interpretability and steering for the AI's persona, scaffolding density, and probe duration.
---

# Sovereign Steering Dashboard (skill layer)

Not the React component (that lives at `src/frontend/SteeringDrawer.js`). This skill governs how Claude Code itself reads the student-set dials and adjusts its output.

## Steps

1. **Read the dials first.** Before composing any micro-step, scaffold, or rubric explanation, read the four steering values from `SettingsContext` (or the equivalent settings store):
   - `isLiteralMode` (Persona: Literal vs Academic)
   - `scaffoldingLevel` (Heavy / Balanced / Light)
   - `gritLevel` (Direct / Balanced / Socratic)
   - `lodLevel` (Compass / Sprint / Map)
2. **Logic Trace on every step.** Every generated step must include a one-sentence rationale that quotes or paraphrases a rubric criterion (the Pedagogical Why field). Surface in the UI via the existing `Why?` toggle on each micro-step in `SimplifiiStudio.js`.
3. **Grit slider behaviour.**
   - `Direct`: lead with the answer. One sentence of context, then the literal next action.
   - `Balanced`: one Socratic probe ("What feels like a wall right now?"); if the student names the block, give the literal next action; if they don't, escalate to direct.
   - `Socratic`: up to ten minutes of probing. Use the three-layer pivot from `socratic-concept-bridge` (Literal, Analogous, Technical). Do not surface the canvas action until the student paraphrases the concept back.
4. **Persona toggle.**
   - `Literal`: re-voice schema-anchored output through `LiteralMode.literalise()`. No discipline jargon, no Latin abbreviations, sentence length kept under 18 words.
   - `Academic`: discipline register intact. Cite by author-year. Permitted to assume domain vocabulary the student has already encountered in the syllabus.
5. **Steering Guardrails.** Never assume intent. If the student's request is ambiguous, ask "What is the real problem?" before generating. Never override a dial silently; if a dial setting blocks a useful response, surface the conflict ("Grit is set to Socratic, so I won't give the answer outright — want to flip it for one prompt?").
