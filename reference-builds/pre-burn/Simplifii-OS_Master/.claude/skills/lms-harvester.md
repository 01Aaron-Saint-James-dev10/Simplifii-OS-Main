---
name: lms-harvester
description: Selectively harvests high-value assessment data from authenticated LMS sessions (Moodle, Canvas, Brightspace).
---

# LMS Selective Harvester

The "boss fight" skill. Pulls only the artefacts that drive marks; leaves the rest of the LMS untouched. Designed to feed the Sovereign vault, not to mirror the whole site.

## Steps

1. **The Meat filter.** Only target URLs whose path contains `Rubric`, `Assignment`, `Syllabus`, `Outline`, or `Transcript` (case-insensitive). Skip everything else, including announcement boards, forums, and grade summaries.
2. **Transcript interceptor.** When a lecture has both video and captions, fetch `.vtt` or `.srt` first; never download the raw video. Captions carry 100% of the assessable content at <1% of the bandwidth.
3. **Session handshake.** Use the student's already-authenticated browser session via cookie passthrough. Never store credentials, OAuth tokens, or API keys. If a request requires re-auth, prompt the student to refresh the session in their browser; do not attempt to re-authenticate programmatically.
4. **Sanitise and ground.** Strip all LMS chrome (sidebars, nav rails, footers, related-content widgets) before saving. Output clean Markdown to `/src/grounding/<course-id>/<artefact-name>.md`. Tag every harvested file with its source URL and fetch timestamp in front-matter so the `SovereignReconciler` Tie-Breaker rules apply (rubric beats outline beats brief on weight; syllabus beats outline beats brief on date).
5. **Local-first.** All harvested material stays on the device, encrypted at rest via the History of Thought vault when unlocked. Never upload to a remote service.
