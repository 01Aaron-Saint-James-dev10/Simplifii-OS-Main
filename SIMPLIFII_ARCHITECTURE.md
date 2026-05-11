# SIMPLIFII-OS: MASTER SYSTEM ARCHITECTURE
Version: 1.0.0
Status: Target Specification (Pending Implementation)

## 1. THE CORE MANDATE
Simplifii-OS is a scale-agnostic Educational OS engineered as a high-end precision tool. Its primary function is to provide Cognitive Sovereignty and manage functional variability for university navigation and Master of Research tasks. The system prioritises clarity, literal terminology, and high-yield actions over gamification or visual noise.

## 2. THE SOVEREIGN CONSTRAINTS (GLOBAL RULES)
All agents operating on this codebase MUST adhere to the following rules without exception:
* **Language:** Strictly Australian-English spelling (e.g., Initialise, Organise, Synthesise, Colour).
* **Punctuation:** ABSOLUTELY ZERO em dashes are permitted in UI text or code comments. Use colons or parentheses for separation.
* **Tone:** Academic-Minimalist, Literal, and High-Yield. No toxic positivity. No "superpower" narratives.
* **Privacy (Zero-Disclosure):** All data processing is strictly local. No data leaves the device. Use IndexedDB for storage and local LLMs (e.g., Ollama) for extraction. 
* **Design Framework:** The "Calm Dashboard System" (UDL 3.0 aligned). 

## 3. THE CALM DASHBOARD SYSTEM (UI/UX)
Built using React 18, Tailwind CSS, and shadcn/ui (Radix primitives).
* **High-Contrast Minimalist:** Light theme primary (zinc-50 background, zinc-900 text) unless overridden by specific terminal views.
* **Keyboard & Focus:** Every interactive element MUST have a visible 3px emerald-500 focus ring (`focus-visible:ring-3 focus-visible:ring-emerald-500`). Keyboard-first Tab order is mandatory.
* **Shallow Navigation:** Left rail names every destination. No hamburger menus. No crowded control panels. 
* **Flat Hierarchy:** No nested tiers. Cards do not contain other cards. Lists do not contain sub-lists.
* **Explicit Labelling:** Icons must always be paired with explicit text labels. Colour is never used alone to convey meaning.
* **Hidden by Default:** Notification counts, deep history, and full rubric criteria are collapsed or hidden to protect focus.

## 4. THE 5-STAGE SYSTEM ARCHITECTURE

### STAGE 01: THE SOVEREIGN HANDSHAKE (Gateway)
* **Function:** The local encryption gateway and entry point.
* **Location:** `src/frontend/LandingPage.js`
* **Visuals:** Center-aligned, terminal-minimalist. Zinc-950 background with JetBrains Mono typography.
* **Mechanics:** * Single password input. Requires a minimum 4-character passphrase.
    * Passphrase decrypts the local `HistoryOfThought` AES-GCM-256 vault.
    * Features the 'Siltbrand Pulse' (a 1px emerald-500 perimeter border animation on focus).
    * UDL Toggle: High-contrast 'Focus Mode' (Compass LOD) vs 'Clarity Mode' (Map LOD).
    * Footer permanently pins the Zero-Disclosure banner.

### STAGE 02: THE INGESTION DRIVE (Data Processing)
* **Function:** Document ingestion, parsing, and automated sorting.
* **Location:** `src/frontend/UniversalOnboarding.js` & `src/frontend/MasterDashboard.js`
* **Visuals:** The 'Gravity Well' (a centered, minimalist dropzone).
* **Mechanics:**
    * Accepts PDF uploads or pasted text.
    * Dynamic terminal feedback during processing (e.g., "Initialising Grouping...", "Neural Map Ready").
    * Automated Unit Code Detection: Scans filenames for university codes (e.g., BABS1201) to automatically create distinct Course Pillars.
    * Academic Tier Detection: `BriefService.js` scans content to identify if the unit is Lab, Research, or Practical.

### STAGE 03: THE PILLAR GALLERY (Course Selection)
* **Function:** The primary navigation hub for selecting active coursework.
* **Location:** `src/frontend/MasterDashboard.js` (PillarGallery & CoursePillar components)
* **Visuals:** High-contrast grid (max 6 items: 5 courses, 1 'Add Course' dashed tile).
* **Mechanics:**
    * Hover state scales cards by 1.02 with subtle emerald glow.
    * Displays Unit Code (JetBrains Mono) and Course Name (Inter).
    * Biomorphic Tier Icons: Beaker (Lab), BookOpen (Research), Layout (Practical).
    * Zen Empty State: If no pillars exist, the gallery collapses to a centered "Initialise Grounding" action.

### STAGE 04: THE AUTHORING COCKPIT (Active Workspace)
* **Function:** The distraction-free zone for executing assessments.
* **Location:** `src/frontend/MasterDashboard.js` (AuthoringCockpit component)
* **Visuals:** Center column layout only. Left navigation sidebar auto-collapses on entry.
* **Mechanics:**
    * Header: Displays course name, task title, and a pinned 'Weight Badge' (e.g., 25% Weight) in the top right.
    * 5 Pareto Steps: A flat, un-nested list defining the workflow (e.g., Analyse, Organise, Synthesise).
    * Active Step: Highlighted with an emerald circle and an explicit "Current step" label.
    * Action Route: Features a primary button to launch the full "Authoring Canvas".

### STAGE 05: THE AURA LAYER (AI Multimodal Feedback)
* **Function:** The overarching, context-aware AI assistant layer.
* **Location:** `src/frontend/AuraLayer.js`
* **Visuals:** Minimalist overlay (zinc-50) that slides up from the bottom. Triggered via the `AskAura` pill.
* **Mechanics:**
    * The Neural Dot: A biomorphic indicator with three states: Idle (static), Listening (pulse), Processing (emerald glow).
    * Audio Hooks: Structural functions (`onIdle`, `onListening`, `onProcessing`) wired for future Web Audio API integration.
    * Dispatch Bar: Clean command input fixed to the bottom.
    * Citation Pills: Emerald badges that dynamically extract and display `[Source: filename]` markers to guarantee factual grounding.

## 5. DATA STATE & BACKEND CONTRACT
* **State Management:** React `useState` and Context API (`ProjectContext`, `SettingsContext`).
* **Storage:** IndexedDB via local wrapper. No external databases.
* **LLM Integration:** Designed to route extraction and synthesis tasks to a local Ollama instance running on the host machine.

## 6. CURRENT IMPLEMENTATION STATUS

Snapshot of how each Target Stage maps to the live codebase. Status values: **Pending** (no code yet), **In Progress** (partial), **Shipped** (matches the spec).

| Stage | Target Location | Status | Notes |
|---|---|---|---|
| STAGE 01: Sovereign Handshake | `src/frontend/LandingPage.js` | Shipped | Terminal-minimalist zinc-950 gateway wired to `HistoryOfThought.unlockWithPassphrase`. 4-char minimum, Siltbrand Pulse on focus, UDL toggle persists to `SettingsContext.lodLevel`, Zero-Disclosure footer banner. Skip path enters Ghost Mode and the `NOT VERIFIED` badge surfaces downstream. |
| STAGE 02: Ingestion Drive | `src/frontend/UniversalOnboarding.js` + `src/frontend/MasterDashboard.js` | Pending | Onboarding accepts PDFs and pasted text. Unit-code auto-detection that creates distinct Course Pillars does not yet exist; current behaviour aggregates all PDFs into one course. |
| STAGE 03: Pillar Gallery | `src/frontend/MasterDashboard.js` (PillarGallery, CoursePillar) | Pending | Components named in the spec do not exist. Course selector is currently a `<select>` dropdown in the left rail. |
| STAGE 04: Authoring Cockpit | `src/frontend/MasterDashboard.js` (AuthoringCockpit) | Pending | `AuthoringCockpit` component does not exist by that name. Closest equivalents are `LinearCanvas` and `SimplifiiStudio`. |
| STAGE 05: AURA Layer | `src/frontend/AuraLayer.js` | Pending | File does not exist. AURA chat is split across `AskAura.js` and the `AuraPanel` inside `SimplifiiStudio.js`. |

This table is the source of truth for build progress. Update it as each stage moves from Pending to Shipped, with a one-line note on what changed.
