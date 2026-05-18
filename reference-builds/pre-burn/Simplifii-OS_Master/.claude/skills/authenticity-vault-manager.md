---
name: authenticity-vault-manager
description: Manages the History of Thought (HoT) log and integrity reports.
---

# Authenticity Vault Manager

1. **Encryption First.** Ensure all event logs are encrypted via AES-GCM before storage in IndexedDB. Vault-locked sessions soft-drop events; never throw.
2. **The Pedigree Report.** Generate a Cognitive Pedigree PDF. It must show:
   - The evolution of a thought from Brain Dump to Socratic Link to Final Synthesis.
   - Timestamps of Active Retrieval checks.
3. **Source priority.** Authenticity claims rely on the cross-document reconciler (`SovereignReconciler.js`): rubric beats outline beats brief on weight; syllabus beats outline beats brief on date. Never assert a fact whose source is the LLM alone.
