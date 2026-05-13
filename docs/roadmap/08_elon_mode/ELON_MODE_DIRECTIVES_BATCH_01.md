# Elon-Mode Considerations [BACKLOG — Source Material]

## What this is

Raw strategic directives from the "Elon-mode" parallel AI conversation. These are framing prompts, not specs. They feed into existing spec files in this roadmap. Captured verbatim here for traceability so nothing is lost.

Three directives in this batch, plus the TempleOS-inspired architectural overlay.

## Status

[BACKLOG] — source material. The actual buildable specs live in:
- `01_products/SOVEREIGN_HOME_HOMESCHOOL.md` (Homeschool Annexation)
- `03_b2b/INSTITUTIONAL_COMMAND_CENTRE.md` (Institutional Handshake)
- This file holds the original framings + the TempleOS Live Integration concept which is new

---

## Directive 1: Homeschool Annexation Protocol (Sprint 9.1 frame)

### Core insight
We are moving from a "Service" to a Standard. Other homeschool apps (Euka, Simply Homeschool, etc.) become Raw Material Providers. Sovereign OS is the Refinery.

### Three pillars of the takeover

**1. The LMS Scraper (The Refinery)**
- Parent uploads Euka PDF or LMS screenshot
- OS extracts Learning Outcomes via Deep Syllabus Sweep (Sprint 8.1 logic)
- Discards source's content
- Uses Simplifiied Translator to redesign the lesson from scratch around the child's interests

**2. UDL 3.0 Re-Architecting (The Fun)**
- Multiple Means of Engagement: same concept available as Podcast Script, Minecraft Challenge, or Socratic Debate
- Engagement Engine: Vibe Meter + Haptic Pulse
- When a kid finishes a maths problem, trackpad pulses, they earn "Neural Playtime"

**3. Institutional Bridge (Reporting)**
- Automate the compliance nightmare for parents
- One-Click HEA / Department Registration Reports
- Authenticity Report for Kids using History of Thought and Biometric Hashes
- Tracks HRV (stress levels during hard tasks)
- Maps every action directly to Australian Curriculum v9.0

### CC sprint directive (from source)
```
Protocol: Homeschool Annexation // Sprint 9.1.
Musk Question: Why are parents paying for static PDFs?

Action 1: Legacy Ingest Parser (useIngestion.js)
- Add HOMESCHOOL_LEGACY mode
- Identify headers from Euka/LMS exports
- Isolate Outcome Code (e.g., ACARA English)
- Rewrite the lesson using UDL 3.0: no jargon, high engagement, 3 choice-paths

Action 2: Progress Report Generator (ExportService.js)
- Implement generateEducationalProgressReport()
- Looks like a formal Institutional Report
- Includes Bio-Metrics (Focus % and Stress levels)

Action 3: Fun Factor (LinearCanvas.js)
- Implement Quest Mode for Stage roadmap
- Replace "Stage A: Foundation" with "Quest 1: The Discovery" for homeschool accounts

Constraint: Australian-English. No em-dashes. Use "simplifiied" branding.
```

### Where this lives in the roadmap
Full buildable spec at `01_products/SOVEREIGN_HOME_HOMESCHOOL.md` — the Curriculum Alchemist concept, persona library, pricing, state reporting, all there. This Elon-mode framing is the marketing/strategic energy that informs the build.

---

## Directive 2: Institutional Handshake Protocol (Sprint 10.1 frame)

### Core insight
Turn a student tool into B2B Infrastructure Monopoly. Build an Intellectual Supply Chain. Academics pay a Forensic Access Fee to tap into the Sovereign Aggregate.

### Three pillars

**1. UDL 3.0 Curriculum Optimizer**
- Academics upload Old-World syllabi
- OS refactors via Translator Ring
- Output: Ready-to-Teach package mapped to Australian Curriculum v9.0 or AQF Level 7-9

**2. Cohort Forensic Analytics (The Hefty Fee)**
- Academics search by Course Code (e.g., BABS1201) or Term
- See De-Identified Heatmaps of student stress
- Example: "70% of your students triggered Rose-Red Stress in ToneHUD when reading week 4 lab instructions"
- System suggests UDL-rewrite for those specific instructions

**3. Institutional Vault (B2B)**
- Individual student vaults remain private
- Aggregate Metadata (stress levels, time-on-task, logic block usage) sold back to university as Educational Health Report
- Zero-knowledge cohort data architecture

### CC sprint directive (from source)
```
Protocol: Institutional Command // Sprint 10.1.
Musk Question: Why are we only helping students? The institutions have the budgets.

Action 1: Institutional Portal (InstitutionalDashboard.js)
- Create route /institution
- Search Bar for Course Codes
- Pull aggregate metadata for that code

Action 2: Curriculum Alchemist (useIngestion.js)
- Add ACADEMIC_UPLOAD mode
- AI Audits, not just extracts
- Output: UDL 3.0 Gap Analysis

Action 3: Cohort Tag (ProjectContext.js)
- Add cohort_tag field to project state (e.g., "T2_2026_UNSW")
- Student opt-in for institutional support in exchange for Neural Playtime bonus

Constraint: Australian-English. No em-dashes. Use "simplifiied" branding.
```

### Where this lives in the roadmap
Full buildable spec at `03_b2b/INSTITUTIONAL_COMMAND_CENTRE.md` — pricing tiers, sales targets, Aaron's relationship leverage, privacy architecture, all there.

---

## Directive 3: TempleOS-Inspired Live Integration Layer (Sprint 8.4 frame) — NEW

### Core insight
This one is genuinely new and goes beyond what's already in the roadmap. Captures Terry Davis's architectural philosophy and adapts it for Sovereign OS.

Terry Davis built TempleOS with three principles worth borrowing:
- **DolDoc:** documents contained code, sprites, links — content and execution were the same thing
- **HolyC + JIT compilation:** code in documents executed inside the document
- **Ring 0 access:** zero abstraction between user intent and hardware

### How this maps to Sovereign

**A. Live Instruction Mapping (HolyC adaptation)**
- Terry's way: JIT compilation inside documents
- Sovereign moat: when a student types, OS doesn't just store text — it "compiles" intent against the Pillar Syllabus in real-time
- If student writes a goal, system instantly executes a search for relevant rubric criteria
- This already exists partially in Live Tutor spec; this framing makes it more ambitious

**B. The Multi-Modal Canvas (DolDoc adaptation)**
- Terry's way: documents containing 3D meshes, sprites, live code
- Sovereign moat: every essay section is a "DolDoc"
- Contains text PLUS live PDF snippet pins, live stress data, AI scaffolds as active tools (not text)
- This refines the 5 Sovereign Layers architecture

**C. User-Centric Ring 0 (Privacy adaptation)**
- Terry's way: no security, total hardware access
- Sovereign moat: total access to user's context without cloud interference
- AI sits directly on local hardware (Ollama/Llama 3 path)
- Can "see" across all 16 PDFs at once without server latency
- This is the local-first promise made architecturally concrete

### CC sprint directive (from source)
```
Directive: Live Integration Layer // Sprint 8.4 (TempleOS Mode)
Musk Question: Why is the document separate from the intelligence? The document IS the intelligence.

Action 1: Live-Syllabus Hook (useIngestion.js)
- DolDoc-inspired state manager for writing sections
- Every section.content update triggers low-latency context-check against active Course Pillar
- If student mentions a rubric keyword, surface [G] pin for that criteria next to cursor

Action 2: Immediacy Sidebar (LinearCanvas.js)
- Side-rail acts like Terry's CmdLine
- Student types /rubric or /scaffold to trigger AI transformation without leaving flow

Action 3: Hardware-Direct Privacy (NeuralService.js)
- ToneHUD Rose-Red pulse rendered with zero abstraction
- Device GPU directly via local CSS/JS
- Zero lag between stress detection and visual feedback

Constraint: Australian-English. No em-dashes. Use "simplifiied" branding.
```

### Where this lives in the roadmap
**This is partially new.** Elements feed into:
- `02_features/LIVE_TUTOR.md` — the live context-checking concept
- `00_foundation/INGESTION_ENGINE.md` — the DolDoc multi-modal canvas
- The local LLM (Ollama) path is NEW and needs its own spec

### NEW spec required: Local LLM Path
TODO: create `00_foundation/LOCAL_LLM_PATH.md` covering:
- Ollama integration for users who want zero-cloud
- Llama 3 / Mistral local model support
- Tier-aware: RHD users likely care most about this
- Privacy moat: "AI that never leaves your machine"
- Performance considerations (works on Mac M-series, less well on older hardware)
- Cost model: free local OR paid cloud, user chooses

### NEW spec required: Slash Commands
TODO: create `02_features/SLASH_COMMANDS.md` covering:
- Terminal-style command palette
- /rubric, /scaffold, /cite, /receipt, /focus, /defence
- Keyboard-first power-user interface
- Aaron's ADHD/dyslexia benefits hugely from this (no mouse-mode-switching)

---

## What we DO NOT take from Elon-mode

The Elon-mode prompts are dramatic. "Annexation". "Hefty Fees". "Shit content". "Forensic Access". This rhetorical style is fine for energy but NOT for product copy or customer conversations.

When these become real CC sprints, the framing softens to:
- "Homeschool Annexation" → "Homeschool Refactor Engine"
- "Institutional Handshake" → "Institutional Insights Dashboard"
- "Hefty Fee" → "Faculty Subscription"
- "Shit content" → "legacy content" or just "existing materials"
- "Cohort Forensic Analytics" → "Cohort Wellbeing Analytics"

The strategy stays. The marketing language matures.

## Aaron's instruction (2026-05-15)

"Going forward, anything extra gets stored/updated in docs/folders, then we continue on to the build, only interject if you don't think it is needed."

**Interpretation:**
- Aaron's creative directives → captured here (or in relevant spec file)
- New architectural ideas → become their own spec files
- Builds proceed via sprint priority queue
- I (Claude) only push back when the directive contradicts an existing roadmap decision OR would break a current build

This is the right model. Roadmap is the channel. Sprints are the execution. Pushback is rare.

## Action items from this batch

- [x] Capture all 3 Elon-mode directives here verbatim
- [x] Link to existing roadmap files where buildable specs already live
- [ ] Create `00_foundation/LOCAL_LLM_PATH.md` (NEW — Ollama/Llama path)
- [ ] Create `02_features/SLASH_COMMANDS.md` (NEW — keyboard-first command palette)
- [ ] Update `02_features/LIVE_TUTOR.md` with DolDoc adaptation notes
- [ ] Update `SPRINT_PRIORITY_QUEUE.md` to include these new specs in backlog

## Notes added

- 2026-05-15: First batch of Elon-mode directives captured. Energy preserved, language matured, builds queued via priority list.
- The TempleOS framing is genuinely useful architectural inspiration. Local-first AI + DolDoc-style live documents = real moat.
- Will continue to capture Elon-mode prompts here as Aaron generates them. This folder is the channel.
