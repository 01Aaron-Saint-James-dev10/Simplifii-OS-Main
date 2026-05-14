# Tomorrow's First Sprint

## Phase 1: Sovereign-OS v3 Theme System (2-3 hrs)

Extract 4 theme definitions from the Claude Design prototype into the live app:
1. Obsidian (current default)
2. Vaporwave (magenta + cyan)
3. Surreal (cream + ink, Caveat font)
4. Minimal (white + black + teal)

Implement via CSS custom properties on `html[data-theme]`.
Add theme switcher (T key + button).
Restyle top bar to match prototype.

See full plan in docs/BACKLOG.md under "Sovereign-OS v3 Visual Overhaul".

## Then: Tester Feedback Processing

Once testers have been using the app for a few hours:
1. Check /app?admin=feedback for incoming reports
2. Triage: bug vs idea vs general
3. Fix any blocking bugs immediately
4. Log enhancement requests to BACKLOG.md
