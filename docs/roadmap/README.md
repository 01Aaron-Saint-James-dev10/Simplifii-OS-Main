# Sovereign OS Roadmap

This folder holds every product idea, feature spec, and sprint plan we have NOT yet built. Each file is a self-contained spec that can be handed to Claude Code as a sprint prompt when foundations are ready.

## Rules

1. **We add to these files. We do not build from them yet.**
2. Every new idea Aaron raises goes into the relevant file, dated.
3. When we finish a foundation sprint and have capacity, we open the file, refine the spec, and execute.
4. Nothing gets lost. Nothing gets built before its time.

## Folder Structure

### 00_foundation
Things that must ship before anything else can work. Tier system, citation engine, ingestion engine.

### 01_products
Distinct product lines that share infrastructure but serve different audiences. Research, HSC, Maths Homework, Homeschool, Equity Pathways.

### 02_features
Cross-cutting features that enhance every product. Communications layer, practice mode, brain dump, defence mode, version history, the Receipt.

### 03_b2b
Institutional Command Centre, LMS submission, cohort analytics, university sales infrastructure.

### 04_design
Design system decisions. Mario Kart tier characters, Open design migration, login routing, visual identity per mode. **Contains `MOCKUPS/` subfolder with one mockup spec per tier** — these are the visual+layout specs that inform each tier's build sprint.

### 05_business
Pricing tiers, go-to-market, target segments, revenue model. Not code, but as important as code.

### 06_dogfood
Aaron's MRes as the working case study. His PhD plan. His career arc. The narrative.

### 07_meta
This roadmap structure, sprint priority queue, sprint history, post-mortems.

### 08_elon_mode
Raw strategic directives from parallel "Elon-mode" AI conversations. Captured verbatim for traceability. Linked to buildable specs elsewhere in this roadmap. The energy is preserved; the marketing language matures when these become real sprints.

## How to Use

When Aaron has an idea that's not ready to build:
1. Find the right file (or create one in the right folder)
2. Add the idea with today's date
3. If it's substantial, sketch the spec inline
4. If it's a small note, add to the "Backlog notes" section at the top of the file

When Aaron is ready to build:
1. Open SPRINT_PRIORITY_QUEUE.md in 07_meta
2. Pick the next sprint
3. Open the relevant spec file
4. Refine it into a final Claude Code prompt
5. Execute one sprint at a time

## Status Markers

Use these throughout the docs:

- `[BACKLOG]` — captured idea, not yet a spec
- `[SPEC]` — full spec, ready to become a sprint prompt with minor refinement
- `[QUEUED]` — next 1-2 sprints
- `[BUILDING]` — currently in progress
- `[SHIPPED]` — landed in main repo
- `[DEFERRED]` — was queued, pushed back, see notes for why
- `[KILLED]` — explicitly decided not to pursue
