# Simplifii-OS Backlog

---

## Post-Testing Sprint L+

### Study Pattern Tracking (location + time + session telemetry)

**Goal:** Understand WHERE, WHEN, and HOW LONG learners study so the OS can adapt (e.g. quieter UI when studying at home late at night, fuller scaffolding when studying at the library mid-afternoon).

**Why it matters:** Personalisation profile (Stage 01 Step 4 full version) needs behavioural data to refine over time. Self-reported "energy and load pattern" gets us a starting point; observed patterns refine it.

**Three signals to capture:**

1. **Time-of-day patterns**
   - Browser-native, no permission needed
   - Capture: session start timestamp, session duration, time-of-day band (morning/afternoon/evening/late-night)
   - Inferred: chronotype (early bird vs night owl), peak focus windows

2. **Location patterns (TIERED: user controls precision)**
   - Three opt-in tiers, user picks at onboarding (Sprint K) or in Settings:
     - **None (default):** no location captured
     - **Country only:** IP-based, no permission prompt, no precise location
     - **Place tags:** user manually tags "Home", "Library", "Uni Campus", "Other" before each session: full user control, no GPS
   - DO NOT use browser Geolocation API (precise lat/long). Privacy risk too high for the brand positioning.
   - Place tags are stored as opaque labels, no addresses, no coordinates

3. **Session telemetry**
   - Time on task per assessment
   - Tasks switched per session
   - Idle time between actions
   - Focus session length before break

**Architecture decisions to make:**
- Where does this data live? (HistoryOfThought local + Layer 2 telemetry per architecture doc)
- Aggregation interval (real-time vs hourly batch)
- User-facing surface (a "your patterns" panel showing trends, never raw data)
- Institutional dashboards: aggregated only, never identifiable
- Privacy posture: explicit consent screen at onboarding, settings to revoke anytime, full export + delete in line with Australian Privacy Act 1988

**Privacy compliance checklist before building:**
- [ ] Privacy Act 1988 APP 3 (collection of personal info): explicit consent
- [ ] APP 5 (notification): clear at-collection notice
- [ ] APP 11 (security): encrypted at rest
- [ ] APP 12 (access): user can view their own data
- [ ] APP 13 (correction): user can delete their data
- [ ] GDPR Article 7 (consent): granular opt-in per signal type
- [ ] GDPR Article 17 (right to erasure): one-click delete

**Estimated effort:** 6-10 hours including the privacy UX. Not a one-sprint job.

**Sprint allocation:** Post-testing Sprint L or M. Pair with personalisation profiler (Sprint K) so the data has somewhere meaningful to live.

---

### Voice Input + Output

**Goal:** Speech-to-text for editor input. Text-to-speech for AI responses and BionicText-flagged passages. Aligns with UDL 3.0 "Voice input where the underlying API allows" commitment.

**MVP scope (Sprint L):**
- Web Speech API only (free, browser-native, no API keys)
- Mic button in CanvasEditor: transcript inserted at cursor
- Language: en-AU
- First-run permission modal with honest disclosure about browser-side processing
- Privacy: no recordings stored, no transcripts sent to Supabase, no logging

**Full scope (Sprint M):**
- Whisper API for premium accuracy (paid, opt-in)
- Text-to-speech via SpeechSynthesis API
- Voice control of nav (e.g. "open feedback", "switch to assessment 2")
- Read-aloud of AI responses with adjustable speed
- Read-aloud of BionicText passages
- Mobile voice (currently desktop-only in MVP)

**Out of scope:**
- Speaker diarisation
- Custom vocabulary training
- Real-time meeting transcription

**Estimated effort:** MVP 45 min. Full scope 4-8 hours.

---

### Full Personalisation Profiler

**Goal:** Stage 01 Step 4 from Simplifii-OS_Architecture.docx: the world-class profiler that captures learning style, communication style, memory profile, processing style, accessibility prefs, energy/load pattern, strengths, past educational harm signal.

**Currently shipped:** MVP slice only (4 accessibility toggles). The other 7 dimensions are not collected.

**Sprint K (post-testing):** Build all 8 dimensions via scenario-based prompts (not Likert quizzes). Mirror profile back, allow adjustments. Wire profile into SteeringDrawer defaults and AURA prompt construction.

**Estimated effort:** 8-12 hours including writing trauma-informed prompts.

---

### BrOWSER 2.0 Sophistication

**Goal:** Evolve the existing BrOWSER avatar (Sprint H spec mentioned 5 states, eye-tracking, Apple Siri-orb-level polish).

**STRICT CONSTRAINT:** Original character only. No reference to Nintendo IP (Bowser, Mario, any character). The BrOWSER name is intentional wordplay on "browser" + "BrOWSER" the OS companion. The visual must be original: green emerald-line creature, antennae, friendly menace. Iterate the existing direction; never reference licensed characters as styling targets.

**Sprint M scope:** 5 states (idle, listening, thinking, speaking, resting), micro-animations, optional eye-tracking responding to cursor.

**Estimated effort:** 4-6 hours.

---

### Display Name Personalisation (extension of tonight's basic greeting)

**Currently shipped:** "Welcome back, [name]" on /app.

**Future additions:**
- Time-of-day awareness: "Good morning, Aaron" / "Working late, Aaron?"
- Streak awareness: "Welcome back, Aaron. Day 3 of your assessment sprint."
- Context awareness: "Picking up where you left off in Chapter 5"
- All optional, all dismissible, never patronising

**Estimated effort:** 2 hours.
