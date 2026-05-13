# Specialised Writing Modes [SPEC]

## What this is

Four writing modes that genuinely don't exist elsewhere. Each one designed for specific neurodivergent or research workflows.

## Status

[BACKLOG → SPEC] — sketched earlier, ready for definition.

## The four modes

### 1. Brain Dump Mode

**For:** ADHD writers whose ideas come out non-linearly. Anyone who can't outline first.

**How it works:**
- Toggle "Brain Dump" in any chapter
- Editor goes minimal: no formatting, no structure, no rules
- Voice input encouraged (rambling welcome)
- Type or speak whatever comes
- Word count off by default (no pressure)
- No Vibe Meter (no judgement)
- No Logic Frame (no boundaries)

When done, click "Organise this":
- AI separates content by theme
- Suggests where each chunk fits in:
  - Current chapter structure
  - Other chapters in the project
  - Methodology log
  - Reflexivity log
  - Future research questions
- User accepts each suggestion individually
- Original brain dump preserved as snapshot

**Why this matters:**
Existing tools assume linear writing. ADHD writers think laterally. Brain Dump matches actual cognition. Idea capture happens at the speed of thinking, not at the speed of "where does this paragraph go?"

**Build cost:** 3 days

---

### 2. Defence Mode

**For:** Anxious researchers preparing for viva, examiners, scholarship interviews, peer review. Submission-anxiety relief.

**How it works:**
- Click "Defence Mode" from any chapter
- AI plays the hardest examiner imaginable
- Asks the worst possible question about your work, methodology, contributions
- You respond verbally (mic) or text
- AI follows up with deeper probing — "But how do you respond to X?"
- "Why didn't you do Y instead?"
- "What if a reviewer says your sample is biased?"
- After 10 minutes: transcript of your weakest points
- Confidence score
- Specific suggestions for strengthening

**Specific use cases:**

**Viva preparation:**
- AI knows your thesis, methodology, theoretical framework
- Targets weaknesses you've flagged in reflexivity log
- Simulates examiners with different theoretical positions
- Practises responses to "What's your contribution?" "Why this method?" "How does this differ from existing work?"

**Pre-submission stress:**
- AI plays harshest reviewer
- "What if Reviewer 2 says this is undertheorised?"
- "What if they reject for sample size?"
- You practise responses, build confidence

**Scholarship interview prep:**
- AI plays panel
- Asks about your research vision, plans, why you deserve funding
- Probes weakness honestly
- Strengths-based feedback after

**Why this matters:**
Researchers' biggest fear: someone smarter than them finding the flaw. Defence Mode finds the flaw FIRST, in a low-stakes setting, so the real defence doesn't surprise them. Anxiety lifts.

**Build cost:** 5 days

---

### 3. Friction Mode

**For:** ADHD writers who go too fast, miss meaning, write 2000 words that say 500 words' worth of content.

**How it works (the anti-Grammarly):**
- Toggle "Friction Mode" — opposite of speed
- After every 100 words, mini-pause:
  - "Read what you just wrote."
  - "Does it say what you meant?"
- AI summarises last paragraph in 1 sentence
- If summary differs from user's stated intent → prompts revision
- Forces metacognition

**Optional features:**
- Sentence-by-sentence approval mode (ultra-friction)
- Word limit before pause (50 / 100 / 200 words)
- Voice prompt: "Read your last paragraph aloud. Does it sound right?"
- Required summary-of-summary every 500 words

**Why this matters:**
Most writing tools accelerate. Friction Mode decelerates. Less words, more meaning, higher grades. For ADHD writers especially, Friction Mode short-circuits the typing-faster-than-thinking trap.

**Build cost:** 2 days

---

### 4. Focus Mode

**For:** Anyone who needs structured focus blocks. Pomodoro replacement built into the canvas.

**How it works:**

**Pomodoro integration:**
- Click "Focus Block" → 25-minute timer
- Built-in 5-minute break after
- 4 blocks = long break (15 min)
- Section-locked during focus block (can't switch)
- Notifications muted
- Distraction-free UI auto-engaged

**LoFi audio integration:**
- Built-in ambient audio library:
  - Rain (heavy, light, with thunder)
  - Brown noise
  - White noise
  - Pink noise
  - LoFi hip-hop (curated, no ads, no vocals)
  - Café ambient
  - Forest / nature
  - Coffee shop chatter (just enough)
  - Library quiet
  - Train ambient (favourite of trains-special-interest users)
- All royalty-free or licensed
- Synchronised across co-writing rooms (shared listening)
- Volume control
- Crossfade between tracks

**Body doubling integration:**
- Optional: "Find a body double" → matches with another user in Focus Mode
- Shared Pomodoro
- Synchronised audio
- Webcam optional (gentle presence, no pressure)
- Chat between blocks only (not during work)

**Session logging:**
- Total focus blocks per day
- Streak (optional, can be disabled — streaks can be anxiety-inducing)
- Words written per block
- Snapshots taken at start of each block
- All logged to HistoryOfThought for Provenance Receipt

**Why this matters:**
Existing tools (Forest, Focus Keeper, Be Focused) are standalone. Splitting attention between focus app and writing app is itself friction. Focus Mode inside the canvas removes that.

LoFi sites (Lofi Girl, Chillhop) have ads, autoplay videos, distraction risk. Built-in audio without leaving the canvas eliminates that.

Body doubling via Discord study servers or apps like Flow Club / Focusmate exists but is separate from the writing tool. Integrated body doubling = revolutionary for ADHD users.

**Build cost:** 4 days

## How these four modes interact

All four can be active simultaneously:
- Brain Dump → captures lateral thinking
- Focus Mode → contains the brain dump within a Pomodoro
- (Defence Mode used after Brain Dump to test the captured ideas)
- Friction Mode → for the next session, when refining the organised output

Different users use different modes:
- Aaron: Brain Dump + Focus Mode constantly
- Equity Pathway student: Friction Mode + Focus Mode for confidence
- PhD candidate: Defence Mode pre-submission

## Settings per mode

Each mode is opt-in, configurable:
- Brain Dump: word-trigger or time-trigger for "Organise" prompt
- Defence Mode: difficulty (gentle / standard / brutal)
- Friction Mode: word interval for pauses
- Focus Mode: Pomodoro length (15/25/45/90 minutes)

## Build cost total

- Brain Dump: 3 days
- Defence Mode: 5 days  
- Friction Mode: 2 days
- Focus Mode: 4 days

Total if shipped together: 2-week sprint
If sequenced: 4 separate sprints over a month

## Dependencies

- 5 Sovereign Layers (Focus Mode toggles them)
- Practice Mode (Defence Mode shares infrastructure)
- Voice DNA (Defence Mode questions match user's voice)
- Communications Layer (Defence Mode post-session generates email-to-supervisor summary)

## Why these features differentiate Simplifii

Notion has none of these.
Word has none of these.
Grammarly has none of these.
ChatGPT has none of these.
Microsoft Loop has none of these.

These are the features that come from talking to actual neurodivergent researchers about what they actually need. The mainstream productivity industry assumes neurotypical cognition. Simplifii doesn't.

## Notes added

- 2026-05-15: All four sketched in earlier "Elon mode" discussion. Now properly specified.
- Focus Mode is the most universally applicable. Ship first.
- Defence Mode is the most differentiated. Ship for the moat.
- Brain Dump is the most loved by ADHD users. Ship for delight.
- Friction Mode is the most counter-intuitive. Ship for quirk.
