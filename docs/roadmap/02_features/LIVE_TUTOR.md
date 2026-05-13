# Live Tutor — Proactive AI Writing Companion [SPEC]

## What this is

A canvas-aware AI that watches what you're writing in real time and offers feedback like a human supervisor would. Not when you click a button — proactively. With user-controlled intensity.

## Status

[BACKLOG → SPEC] — sketched in Elon Mode discussion.

## Why this differentiates

The current Simplifii Tutor panel is stubbed and reactive. Click button → get feedback. That's the same model as Grammarly, ChatGPT.

Live Tutor is proactive but consensual. It watches, notices patterns, surfaces feedback at the right moment. Like a body double that gives reactions, not a tool you ask.

For ADHD users especially, the right cue at the right moment is more valuable than any amount of feedback you have to seek out.

## How it works

### Proactive interventions (examples)

**Contradiction detection:**
> "Your third paragraph contradicts what you said in the intro. Want me to flag both?"

**Repetition flagging:**
> "You used 'demonstrates' four times in this section. Consider 'shows', 'reveals', 'establishes'."

**Sentence length:**
> "This sentence is 47 words. Try splitting at the semicolon."

**Pace coaching:**
> "You've been on this paragraph for 38 minutes. Want to skip to the next section and come back fresh?"

**Logical gaps:**
> "You introduced X earlier but haven't returned to it. Want to address it here?"

**Citation density:**
> "This is a strong claim with no citation. Want to add support from your corpus?"

**Methodology consistency:**
> "Your method earlier was qualitative, but you're using quantitative language here. Worth checking."

**Reflexivity prompts:**
> "You're describing UNSW practices in critical terms. Your reflexivity log notes your role at UNSW. Want to acknowledge this here?"

**Energy / pacing:**
> "You haven't taken a break in 90 minutes. Your writing pace has slowed 40%. Quick walk?"

**Voice DNA enforcement:**
> "This phrase doesn't sound like you. Your usual phrasing would be [X]. Keep or change?"

**Submission anxiety:**
> "You've revised this sentence 7 times in the last 10 minutes. Is something specific bothering you?"

## Intensity settings (user-controlled)

Critical: this can be experienced as interruption. User controls.

**Silent Mode:**
- No proactive interventions
- All Tutor interactions are user-initiated only
- For deep flow states

**Subtle Mode:**
- Maximum 1 intervention per 30 minutes
- Only highest-priority issues (contradictions, factual errors, critical methodology concerns)
- Appears as small icon in margin, dismissible

**Standard Mode (default for most users):**
- Maximum 1 intervention per 15 minutes
- High and medium priority
- Visible but not intrusive

**Active Mode:**
- Proactive suggestions every paragraph
- For users who want a hands-on coach
- For pre-submission revision sprints

**Body Double Mode:**
- Constant gentle presence
- Comments on flow, energy, milestones
- "Good paragraph"
- "You've written for an hour, want a break?"
- For ADHD users who need company while writing

## When to suppress

Even at high intensity, the Tutor suppresses interventions:
- During Brain Dump mode (Tutor off entirely)
- During Focus Mode within a Pomodoro block (waits for break)
- During Practice Mode
- When user has dismissed similar intervention twice (learns user preferences)
- During first 10 minutes of session (cold start grace)
- When user is in Defence Mode (don't double-team)

## Settings UI

```
TUTOR INTENSITY

[Silent] [Subtle] [Standard] [Active] [Body Double]

Active intervention types (toggle each):
☑ Contradictions
☑ Repetition
☑ Sentence length
☑ Logical gaps
☑ Citation density
☑ Methodology consistency
☐ Reflexivity prompts (auto-enable for RHD)
☑ Pacing and energy
☐ Voice DNA enforcement (auto-enable when Voice DNA built)
☑ Submission anxiety
☐ Body doubling comments
```

## Selected-text "Ask tutor" action

In addition to proactive mode, manual:
- Select any text
- Right-click → "Ask tutor about this"
- Tutor responds in side panel
- Maintains conversation history per chapter

## Conversation history persistence

All Tutor interactions logged per chapter:
- Searchable
- Exportable
- Part of Provenance Receipt (transparent log of AI assists)
- User can review their own pattern of questions

## Technical implementation

### Detection engine
Browser-side analysis (debounced, every 30s when typing pauses):
- Sentence length: simple regex
- Repetition: word frequency in last 500 words
- Citation density: regex for (Author, Year) patterns
- Time on paragraph: timestamp tracking
- Revision frequency: edit count per sentence over time

AI-enhanced detection (less frequent, every 5min or on demand):
- Contradiction detection
- Logical gaps
- Methodology consistency
- Voice DNA matching

### Intervention queue
- Detected issues queued
- Priority sorted
- Rate limited per intensity setting
- Surfaced in subtle UI (margin icon, gentle slide-in)
- User dismisses or acts

### Learning user preferences
- Track dismissal rates per intervention type
- Suppress types with high dismissal rate
- Surface types with high engagement rate
- User can manually toggle

## Build cost

Minimum viable (1-week sprint):
1. TutorService backend
2. 4 detection types (sentence length, repetition, citation density, time on paragraph)
3. Intervention queue
4. UI for surfacing interventions
5. Intensity settings
6. Conversation history

Full v1 (3-week sprint):
7. All 11 intervention types
8. AI-enhanced contradiction / gap detection
9. Voice DNA enforcement
10. Body double mode
11. Selected-text ask flow
12. Learning user preferences
13. Suppress conditions across modes

## Dependencies

- 5 Sovereign Layers (Tutor reads context)
- Voice DNA (for voice enforcement)
- Reflexivity Log (for positionality prompts)
- HistoryOfThought (for time / edit tracking)

## Why this matters

The single most valuable feature for ADHD writers: an external nudge at the right moment. Internal cues fail; external cues work.

The single most valuable feature for academic writers: someone who notices the contradiction or gap before the supervisor does.

The single most valuable feature for autistic writers: explicit feedback on rules that neurotypical writers absorb intuitively (sentence length, paragraph flow, transition logic).

Live Tutor serves all three.

## Notes added

- 2026-05-15: Sketched in Elon Mode. High differentiation potential.
- Critical to get the intensity settings right — proactive AI that interrupts wrongly is hated.
- Body Double Mode might be the most loved feature for ADHD users.
- Selected-text ask is the minimum viable feature.
