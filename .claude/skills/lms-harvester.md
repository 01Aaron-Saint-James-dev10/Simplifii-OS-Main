---
name: lms-harvester
description: TODO - awaiting spec. Pulls course material from Moodle / Canvas / Brightspace into the Sovereign vault.
---

# LMS Harvester (stub)

**Status:** spec not yet supplied. Do not invoke until the body of this file lists the steps and guardrails.

Likely shape (to be confirmed by Aaron):

1. Authenticate against the institutional LMS (sovereign credential store, not OAuth-against-third-party).
2. Pull syllabus, assessment briefs, rubrics into the local vault as raw text + the original file blob.
3. Hand off to `RewriteService.extractAssessmentBriefs` and `SovereignReconciler.reconcile` for canonicalisation.
4. Tag every harvested artefact with its source document so the Tie-Breaker rules apply (rubric beats outline beats brief).
