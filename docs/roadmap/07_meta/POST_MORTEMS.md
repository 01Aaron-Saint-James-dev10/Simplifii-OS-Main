# Post-Mortems

## Purpose

Lessons learned, captured immediately after each event, so we don't repeat them. Brutally honest. Aimed at future-Aaron.

## 2026-05-15: The Sprint Stacking Failure

### What happened
Over the course of one morning, Aaron sent 6+ major product direction prompts:
1. Build Sovereign Research OS (13 parts)
2. Build Ingestion + Communications + Equity Pathways (Part 1 file plan only)
3. Think about HSC practice exams
4. Think about maths for autistic learners
5. Build Homeschool Annexation
6. Build Institutional Command Centre with cohort analytics
7. Plus: login routing, Mario Kart tier characters, open design migration

CC created 2 sprint branches with zero commits each. Real product work continued only on the original v2-rebuild-canvas-first branch.

### Why it happened
**Aaron's side:**
- ADHD hyperfocus + creative explosion (day 4 of intense sprint)
- Another AI (Elon-mode) fed dopamine-rich "Annexation Protocol" framing
- Each new idea felt essential because dopamine spike was real
- Sleep deficit reducing executive function
- Founder anxiety: "every idea must ship today"

**Claude's side:**
- Initially accommodated the velocity ("yes, here's the prompt")
- Should have intervened earlier (at idea 2, not idea 6)
- Eventually intervened with "Stop. Audit. Reset." — correct but late

**System side:**
- CC doesn't push back on stacked sprints
- No native sprint-tracking infrastructure
- Multiple branches created without merge ceremony

### Cost
- 3-4 hours of CC time spent on audits and confused starts
- Two empty branches consuming mental bandwidth
- Aaron's sense of progress decoupled from actual commits
- Repository state confused (2 commits unmerged, work scattered)

### What we learned

**Discipline lessons:**
- Maximum ONE sprint in CC at any time
- Multi-part sprints require approval gates that are HONOURED
- New product ideas go into roadmap markdown files, NOT into prompts to CC
- "Building" and "brainstorming" must be temporally separated

**Architectural lessons:**
- The roadmap folder structure (this docs/roadmap/) is the smarter workaround
- Ideas in markdown files = captured but not executed
- Sprints execute from spec files when capacity allows
- Specs are 80% complete prompts ready to refine

**Self-knowledge lessons:**
- Aaron's creative explosions are real but require channel
- "I'm in the zone" is sometimes signal, sometimes mania
- 6 product directions in one morning = mania, not strategy
- Body cues (sleep deficit, prolonged screen time) precede the mania

**Relational lessons:**
- Claude must be allowed to be the friend who says "stop"
- Aaron must distinguish "Claude is shutting me down" from "Claude is protecting me"
- Pushback from a thinking companion is the value, not the obstruction

### What we changed
- Created `/docs/roadmap/` folder structure with 8 categories
- Captured all 6+ product directions as spec files
- Wrote sprint priority queue (07_meta/SPRINT_PRIORITY_QUEUE.md)
- Established "one sprint at a time" rule
- Established "ideas → markdown, builds → sprints" rule

### What we'd do differently
If Aaron is mid-creative-explosion and Claude notices stacking:
- Intervene at the SECOND new direction, not the sixth
- Offer roadmap-markdown immediately as the channel
- Validate the idea is captured before building anything
- Trust Aaron to accept the friction (he did, eventually)

### Action items for future Aaron
- [ ] Read SPRINT_PRIORITY_QUEUE.md every morning before coding
- [ ] Send Claude cleanup prompt immediately after stacked sprints detected
- [ ] If "I have so many ideas" → open roadmap folder, NOT CC
- [ ] Body cues check before opening CC: enough sleep? enough food? walked today?
- [ ] If frustrated by Claude declining: trust it. Roadmap files are the smarter workaround.

---

## Template for future post-mortems

```
## YYYY-MM-DD: [Event name]

### What happened
[Description, factual]

### Why it happened
[Multiple-perspective analysis]

### Cost
[Time, energy, repo state, sanity]

### What we learned
[Specific insights]

### What we changed
[Tangible changes made]

### What we'd do differently
[If we faced this again]

### Action items
- [ ] Specific changes to behaviour or systems
```

---

## Pattern recognition (update over time)

After 5+ post-mortems, look for patterns:
- Time of day failures happen
- Day of week failures happen
- Pre-event indicators (sleep, food, stress)
- Failure modes that recur
- Successful interventions

These patterns become Aaron's personal flight-check list.

## Notes added

- 2026-05-15: First post-mortem. The failure that triggered this entire roadmap folder.
- Future-Aaron: read this when about to stack sprints in CC. The lesson is paid for already.
