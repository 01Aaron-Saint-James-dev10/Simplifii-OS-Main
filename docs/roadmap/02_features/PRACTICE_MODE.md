# Practice Mode — Performance Coaching [SPEC]

## What this is

Webcam + microphone-based practice for presentations, pitches, vivas, interviews, mock trials, mock consultations, teaching demos. Real-time feedback on pace, filler words, eye contact, presence. Strength-based, neuroaffirming framing.

The Microsoft Teams Speaker Coach killer.

## Status

[BACKLOG → SPEC] — sketched earlier, ready for proper specification.

## Why this is differentiated

Microsoft Teams Speaker Coach exists. It's corrective ("you said um too much"). It's tied to PowerPoint / Teams. It's generic. It treats neurodivergent presentation style as deficit.

Sovereign Practice Mode is:
- **Tied to YOUR assessment** (knows your rubric, time limit, topic)
- **Strength-based** ("you reduced filler words 40% from your first practice")
- **Privacy-first** (all on-device where possible, recordings never leave your browser)
- **Mode-specific** (pitch coaching ≠ interview prep ≠ viva defence)
- **Neuroaffirming** (variation in presentation style framed as expression, not problem)
- **Built into your study workflow** (the canvas where you wrote the speech is where you practise it)
- **Tracks progress over time** as Provenance moments — your "presence improvement" curve becomes part of the Authenticity Receipt

## Practice modes

### Presentation Mode
- For oral presentations, conference talks, seminar presentations
- Teleprompter scrolling from canvas notes
- Slide timing tracking
- Section pacing analysis

### Pitch Mode
- 60s / 90s / 3min / 5min countdown
- Structured feedback per pitch element: hook / problem / solution / market / ask / close
- "What is the single number you want them to remember?"
- Energy curve analysis (did you build to crescendo?)

### Interview Mode
- AI-generated mock questions based on assessment / job role / scholarship
- You respond verbally or text
- AI follows up with deeper probing
- After 10 questions: transcript of weakest answers, confidence score, suggested practice areas

### Viva Mode (RHD tier specific)
- AI plays examiner
- Asks the hardest possible question about your thesis
- Probes methodology, theoretical framework, contributions, limitations
- Specifically targets weaknesses Aaron has flagged in reflexivity log
- Builds confidence for actual viva
- Submission anxiety relief

### Mock Trial Mode (law tier)
- AI plays opposing counsel
- Cross-examination practice
- Statutory argument practice
- Builds AGLC citation under pressure

### Mock Consultation (medicine, social work)
- AI plays patient / client
- Empathy probing
- Diagnostic reasoning under uncertainty
- Ethics dilemma scenarios

### Teaching Demo Mode (education)
- AI plays disengaged Year 9 class
- Practice classroom management
- Pacing for diverse learners
- Inclusive practice in real time

### Debate Mode
- AI argues opposing position aggressively
- You practise rebuttal under time pressure
- Argument structure analysis

## Browser-native capabilities (no external services for v1)

Available without external API:
- **MediaRecorder API** — record video + audio
- **Web Speech API** — speech-to-text on-device in Chrome/Edge
- **Face Detection API** (Chrome experimental) — basic face presence
- **WebRTC** — live video stream for analysis
- **MediaDevices.getUserMedia** — webcam + mic access

Browser-only metrics (free, fast, private):
- Filler word counting (regex on transcript)
- Pace WPM
- Pause patterns (silence detection)
- Audio level / volume variation
- "Are you in frame" via face detection
- Word count vs target
- Time elapsed

API-enhanced metrics (with user consent):
- Eye contact heatmap (gaze tracking model)
- Gesture analysis
- Tone / emotion analysis
- Strength-based personalised feedback
- Question follow-ups (for interview / viva modes)

## Setup flow

1. Click "Practice this" in CanvasNav (visible when assessment format is presentation/pitch/viva/interview)
2. Camera + microphone permission prompt
3. Target time selection
4. Practice mode selector (Presentation / Pitch / Interview / Viva / Speech / Debate / Mock Trial / Mock Consultation / Teaching Demo)
5. Privacy notice ("All analysis on-device. Recordings stay in your browser. You control what's saved.")
6. Start

## Practice surface UI

```
┌──────────────────────────────────────────────┐
│  [Webcam feed top-right, 200x150]            │
│                                              │
│  TELEPROMPTER                                │
│  [Notes from canvas scroll here, sized for   │
│  reading at distance, font size adjustable]  │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  LIVE METRICS                                │
│  Pace: 134 wpm  Filler: 3  Time: 02:34/05:00 │
│                                              │
│  [Audio level visualiser at bottom]          │
│                                              │
│  [Big red RECORDING dot]                     │
└──────────────────────────────────────────────┘
```

## During practice

Real-time tips appear subtly (top of screen, optional):
- "Slow down a bit"
- "Try a pause here"
- "You said 'um' three times"
- "Move a bit closer to camera"
- "Look up from your notes"

Tips dismissible. Frequency adjustable. Off by default if user prefers.

For ADHD users, fewer interruptions option. For autistic users, predictable feedback patterns.

## Post-practice report

After session ends:
- Recording playback (locally stored, user controls retention)
- Annotated transcript (filler words highlighted, repetitive phrases flagged)
- Pace graph over time
- Strengths section (specific moments, e.g., "Your eye contact improved during the second key point")
- Growth areas (framed neuroaffirmatively, e.g., "When discussing methodology, your pace increased — consider pre-deep-breaths before this section")
- Comparison to previous attempts (improvement curve over sessions)
- "Practice again" button
- Export as PDF rehearsal report
- Add to Provenance Receipt

## Mode-specific reports

**Pitch Mode report:**
- Hook strength (did first 10 seconds engage?)
- Problem clarity
- Solution differentiation
- Market validation
- Ask specificity
- Close memorability
- Energy curve diagram

**Viva Mode report:**
- Questions handled confidently
- Questions that need more rehearsal
- Methodological gaps surfaced
- Reflexivity moments well-articulated
- Examiner-perspective critique

**Interview Mode report:**
- Question response patterns
- Behavioural example structure (STAR analysis)
- Strengths/weaknesses narrative
- Confidence trajectory through session

## Privacy model

CRITICAL: Recordings are sensitive.

- Webcam + mic only activated on explicit user click
- One-time first-use deep consent flow:
  - "Practice Mode uses your webcam and microphone."
  - "Analysis happens on your device. Recordings stay in your browser."
  - "You control retention: delete after each practice, keep last 5, keep forever."
  - "You can revoke camera/mic permission anytime in browser settings."
- Default retention: delete after practice (only metrics saved)
- Opt-in to save recordings for review
- NEVER transmits video/audio to any server without explicit user action
- API-enhanced features (eye contact heatmap) require separate consent
- All recordings encrypted at rest in IndexedDB

## Accessibility

- Captions live during playback
- Adjustable teleprompter speed
- Font size adjustable for teleprompter
- Colour-coded feedback (emerald positive, amber growth, never red shame)
- Screen reader support
- Reduced motion respected (no jarring animations)
- ASL / Auslan recognition for non-verbal practice modes (future)

## Personas

### Persona 1: The Anxious Honours Student preparing presentation (Eva, 22)
- 15-minute presentation, 1 week away
- Has done none, terrified
- ADHD, freezes when watched
- Needs: low-stakes practice, gentle feedback, confidence building

### Persona 2: The PhD Candidate preparing viva (Aaron's future)
- 3 weeks from viva
- Knows thesis inside out, performance anxiety
- Needs: hardest-question generator, examiner simulation, confidence calibration

### Persona 3: The Pitch Comp Entrant (Suresh, 27)
- 90-second elevator pitch competition
- 30 entries to practise against
- Needs: timing precision, hook optimisation, energy curve coaching

### Persona 4: The Job-Interviewing Graduate (Tom, 24)
- Just finished honours, applying for jobs
- Behavioural interviews terrify him
- Needs: STAR-method coaching, anxiety-aware practice, transcript review

### Persona 5: The Med Student preparing OSCE (Priya, 23)
- Mock consultations critical
- Patient communication assessed
- Needs: AI patient roleplay, empathy probing, time-pressure practice

## Pricing

- Included with Standard tier ($25/month)
- Practice Mode recordings retention add-on $5/month
- Pro tier with unlimited practice + API-enhanced feedback $40/month

## What this sprint should ship

Minimum viable (5-day sprint):
1. Practice Mode entry from CanvasNav
2. Camera + mic permissions
3. Teleprompter
4. Live pace, filler, time metrics (browser-only)
5. Post-practice transcript with annotations
6. Presentation Mode only (one mode)

Full v1 (3-week sprint):
7. All 8 practice modes
8. API-enhanced metrics (eye contact, gestures)
9. Multi-session improvement tracking
10. Export PDF rehearsal report
11. Provenance Receipt integration
12. Mobile camera support

## Dependencies

- Tier architecture
- 5 Sovereign Layers (for context awareness)
- Provenance Service (for receipt integration)

## Notes added

- 2026-05-15: Researched Microsoft Teams Speaker Coach. Confirmed differentiation strategy.
- This is the performance side of the Authenticity Moat.
- Aaron's viva (2027 PhD entry or 2028 MRes defence) is the dogfood moment.
