# Slash Commands — Keyboard-First Command Palette [SPEC]

## What this is

Terminal-style slash commands inside the canvas. Type `/rubric` and the rubric panel opens. Type `/cite` and citation inserter appears. Type `/focus 25` and a 25-minute Pomodoro starts. Power-user interface that never requires a mouse.

## Status

[SPEC] — derived from TempleOS-inspired directive 2026-05-15. Maps to "Immediacy Sidebar" / "Live-Command parser" concept.

## Why this matters

For ADHD/dyslexic users especially, mode-switching (cursor → mouse → menu → click → return to cursor) breaks flow. Slash commands keep hands on keyboard, eyes on the work.

Terry Davis's TempleOS CmdLine was the inspiration. Same principle: powerful operations one keystroke away from the writing surface.

Existing tools that do this well: Notion, Linear, Slack. None of them have academic-writing-specific commands. We do.

## Activation

- Type `/` at start of new line OR in command palette mode
- Cmd+K opens command palette (alternative entry)
- ESC dismisses
- Tab autocompletes
- Enter executes

## Core command set (Phase 1)

### Writing
- `/h1` `/h2` `/h3` — heading levels
- `/bullet` — bulleted list
- `/number` — numbered list
- `/quote` — blockquote
- `/code` — code block
- `/divider` — horizontal rule

### Sovereign Layers
- `/logic` — open Layer 1 Logic Frame
- `/scaffold` — open Layer 2 Faded Scaffold
- `/anchor` — open Layer 3 Cognitive Anchor
- `/vibe` — show Layer 4 Vibe Meter
- `/history` — open Layer 5 History of Thought

### Citations
- `/cite` — opens citation inserter
- `/cite [author keyword]` — autocomplete search
- `/bib` — jump to bibliography section
- `/verify` — open source verification panel
- `/source` — add new source to corpus

### AI assists
- `/simplify` — Brief Simplifier on selected text
- `/translate-rubric` — Rubric Translator
- `/check` — Check Against Rubric
- `/voice` — apply Voice DNA
- `/tutor` — ask Live Tutor about selection
- `/defend` — start Defence Mode

### Modes
- `/focus 25` — start 25-min Pomodoro
- `/focus 45` — 45-min Pomodoro
- `/brain-dump` — toggle Brain Dump mode
- `/friction` — toggle Friction Mode
- `/practice` — start Practice Mode

### Research-specific
- `/method` — open Methodology Log
- `/reflex` — open Reflexivity Log
- `/feedback` — open Supervisor Feedback
- `/phase` — switch active phase
- `/strand` — switch active strand
- `/chapter` — switch active chapter

### Comms
- `/email` — open Communications Layer for email
- `/email supervisor` — pre-fill supervisor template
- `/email extension` — pre-fill extension request
- `/agenda` — generate meeting agenda
- `/meeting-notes` — start meeting mode

### Receipt
- `/receipt` — generate Receipt
- `/snapshot` — manual snapshot
- `/branch [name]` — create version branch
- `/restore` — show restore options

### Navigation
- `/goto [section]` — jump to section
- `/next` — next chapter/section
- `/prev` — previous
- `/home` — back to tier home

### System
- `/settings` — open settings
- `/help` — show all commands
- `/feedback` — send feedback to Sovereign team
- `/export` — export current chapter

## Autocomplete UX

When user types `/`:
1. Dropdown appears below cursor
2. Shows top 5 matching commands as user types more characters
3. Each shows: command, short description, keyboard shortcut if any
4. Arrow keys navigate
5. Tab autocompletes
6. Enter executes
7. ESC dismisses

Visual style: Obsidian Aesthetic, small floating panel, zinc-950 background, emerald accent for selected item, generous padding.

## Smart commands (Phase 2)

Commands that take arguments and parse intent:

### `/cite [text]`
- Searches corpus for matching source
- If exact match: inserts citation immediately
- If multiple matches: shows ranked list
- If no match: prompts to add new source

### `/find [text]`
- Searches across all chapters of current project
- Returns matches with context
- Arrow keys to navigate, Enter to jump

### `/replace [old] -> [new]`
- Find-and-replace within current chapter or project-wide
- Preview before commit

### `/format [type]`
- `/format apa` — switch citation style to APA
- `/format harvard` — switch to Harvard
- `/format word-count` — show word count panel

### `/import [type]`
- `/import pdf` — open PDF importer
- `/import url` — paste URL flow
- `/import voice` — start voice recording

### `/ask [question]`
- Free-form question to Live Tutor
- Uses current chapter as context
- Response appears inline

## Custom commands (Phase 3)

Users can define their own:
- Settings → Custom Commands
- `/aaron-greeting` → expands to "Hi Prof Cumming,"
- `/my-thesis-title` → expands to full thesis title
- `/quick-cite` → opens specific filter (e.g., only methodology papers)

Text expansion + command shortcuts. Powerful for repeated patterns.

## Tier-aware command sets

Different tiers see different default commands:

### TIER_SECONDARY (Sparq)
- Simplified set
- Hides RHD-specific commands (/reflex, /method, /phase, /strand)
- Emphasises practice + study commands

### TIER_UNDERGRAD (Compass)
- Standard set
- Course/assessment commands visible

### TIER_RHD (Bowser-OS, Aaron's tier)
- Full research command set
- Methodology, reflexivity, supervisor, phase navigation prominent

### TIER_HOMESCHOOL (Forager)
- Quest commands
- Multi-child commands
- Reporting commands

### TIER_INSTITUTIONAL (Hub)
- Dashboard navigation
- Cohort search
- Audit commands

## Accessibility

CRITICAL: slash commands could be a barrier without care.

- Cmd+K alternative entry for users unfamiliar with `/` convention
- `/help` always works to discover commands
- All commands also accessible via menu / mouse (not slash-exclusive)
- Screen reader announces command palette opening
- Keyboard navigation throughout
- Customisable shortcut for `/` activation (some users may prefer different key)
- High contrast mode supported
- Reduced motion respected

## Voice activation (Phase 4)

For users who prefer voice:
- "Hey Sovereign, focus mode 25 minutes"
- "Open methodology log"
- "Insert citation Cumming 2024"
- Maps voice intent to slash commands
- Uses Web Speech API on-device
- Privacy-respected (no voice data to servers)

This is bonus, not core. Most users want keyboard. Voice helps blind users and mobile users.

## Build cost

### Phase 1 (3-day sprint) — Core
1. CommandService.js with command registry
2. CommandPalette.jsx UI component
3. Slash activation in editor
4. Cmd+K alternative entry
5. Autocomplete dropdown
6. 30 core commands defined
7. Tier-aware command filtering

### Phase 2 (3-day sprint) — Smart commands
8. `/cite` with corpus search
9. `/find` cross-chapter search
10. `/format` style switching
11. `/import` flows
12. `/ask` Live Tutor integration

### Phase 3 (2-day sprint) — Custom
13. User-defined command UI
14. Text expansion
15. Settings → Custom Commands

### Phase 4 (1-week, optional) — Voice
16. Web Speech API integration
17. Voice-to-command intent mapping
18. Privacy controls

Total core: 6 days. With voice: 13 days.

## Dependencies

- 5 Sovereign Layers (commands trigger them)
- Citation Engine (for `/cite`)
- Comms Layer (for `/email`)
- Focus Mode (for `/focus`)
- Tier architecture (for tier-aware command sets)

## Why this is high-leverage

For Aaron specifically:
- ADHD + dyslexia = mode-switching is expensive
- Hands-on-keyboard preserves flow
- Less mouse use = less attention drift
- Slash commands as muscle memory = compound productivity gain

For all users:
- Power user retention skyrockets (Notion's slash commands are a key sticky feature)
- Demos beautifully ("watch this 10-second demo where I do 8 things")
- Marketing video gold (fast keyboard work looks impressive)
- Accessibility win for keyboard-only users

## Notes added

- 2026-05-15: Created from TempleOS-inspired "Immediacy Sidebar" directive.
- Pairs naturally with Voice DNA (slash commands respect user's tone preferences in expansions).
- Pairs with Local LLM (commands work offline once local models are set up).
- Sprint order: ship after Sovereign Research MVP + Comms Layer. Adding slash commands too early = building UI for features that don't exist yet.
