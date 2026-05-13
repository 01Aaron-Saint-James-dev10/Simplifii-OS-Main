# Co-Writing Rooms — Synchronised Body Doubling [SPEC]

## What this is

Real-time shared writing rooms where two or more users see the same canvas, share Pomodoro timer, share ambient audio, optionally share voice channel. Built-in body doubling for ADHD users. Solves the loneliness of writing.

## Status

[BACKLOG → SPEC] — sketched in Elon Mode discussion.

## Why this matters

ADHD writers thrive with body doubling. Existing tools:
- Discord study servers (work, but split attention)
- Focusmate (1-on-1 video, scheduled, free)
- Flow Club (group video focus sessions, paid)
- Cozy / Caveday (paid, video-based)

None of them integrate with the writing tool. You write in Word + body double in Discord = two contexts, both shallow.

Co-Writing Rooms inside Sovereign means body doubling IS the writing environment. Same canvas. Same audio. Same timer. Same panels. Same vibe.

The "47 students writing now" indicator in the BottomStrip becomes real, not hardcoded.

## Core flow

### Open a room

User clicks "Open writing room" in canvas:
- Generates shareable URL
- Defaults: private (invite only), 2-hour session, focus mode auto-engaged
- User selects audio preset (LoFi / rain / café / silence)
- Pomodoro length confirmed (25 / 45 / 90 min)

### Invite

Share URL via:
- Email (composed via Communications Layer)
- Slack / Discord / Teams
- QR code (in-person)
- Direct invite to known contact

### Join

Invitee clicks URL:
- Brief identity confirmation
- "What are you working on?" optional
- Camera/mic permission (camera optional, mic optional)
- Joins room

### Inside the room

Each participant has:
- Their own canvas (private writing, separate documents)
- Shared timer (synchronised Pomodoro)
- Shared audio (synchronised LoFi / ambient)
- Live presence indicator (gentle dot, no constant video pressure)
- Optional webcam (small thumbnails, can toggle on/off anytime)
- Optional voice channel (push-to-talk during breaks, never during focus)
- Chat (text only during focus blocks, voice during breaks)

### During focus block

- All participants in deep work
- Webcam thumbnails dim
- No text chat allowed (system enforces)
- Audio synchronised
- Timer countdown visible
- Quiet presence indicator (you're not alone)

### Break

When Pomodoro ends:
- Gentle sound (configurable)
- All participants prompted: "5-minute break"
- Text chat opens
- Voice channel opens (push-to-talk)
- Webcams brighten if on
- Movement reminder
- Optional shared stretch / breath activity

### Resume

After break:
- Timer restarts
- Audio resumes
- Focus mode re-engages
- Participants ready

## Room types

### Pair Rooms (2 people)
- 1-on-1 deep focus
- Best for ADHD body doubling
- Existing relationship recommended
- Recurring schedule supported

### Group Rooms (3-8 people)
- Study groups, lab meetings, writing groups
- Shared topic / project optional
- Light social presence between blocks

### Public Rooms (8-50 people)
- Drop-in any time
- Topic-themed: "PhD writing", "HSC prep", "Creative writing"
- Curated by Simplifii or community
- Anonymous handles option

### Cohort Rooms (50+, institutional)
- For schools, universities running write-ins
- Lecturer / supervisor monitors
- Office hours integrated
- B2B feature

### Supervisor Office Hours
- Specific room type for academic supervision
- Supervisor opens room weekly
- Students drop in, work, ask quick questions during breaks
- Reduces formal meeting overhead
- B2B feature

## Privacy and consent

CRITICAL: synchronous tools require strong consent.

- Camera off by default
- Mic off by default (push-to-talk during breaks only)
- Recording NEVER without all participants' explicit consent
- Anyone can leave any time
- Anyone can mute / hide anyone for themselves
- Block / report features prominent
- Children under 18: parental consent required, room operator verified
- Universities: institutional account verified before opening public cohort rooms

## Audio synchronisation

LoFi / ambient audio synchronised across all participants:
- Same track at same timestamp
- Volume per participant
- Track switching by host or vote
- Library:
  - Lofi hip hop
  - Rain (heavy / light / thunder)
  - Coffee shop ambient
  - Forest / nature
  - Brown noise / pink noise / white noise
  - Train ambient
  - Library quiet
  - Bookshop ambient (with paper rustling)

All royalty-free or licensed. No ads. No videos. No surprise.

## Body presence (the gentle bit)

Not video conferencing. Not constant pressure.

- Optional small webcam thumbnails (200x150px max)
- Frame freezes during deep focus (only updates every 30s)
- Becomes live during breaks
- Off entirely supported
- Audio of room available (ambient breathing / typing optional)

For autistic users especially, the "constant face" pressure of Zoom is exhausting. Co-Writing Rooms optimise for the OPPOSITE: presence without surveillance.

## Integration with existing features

- HistoryOfThought logs co-writing sessions as `co_writing_room_joined` events
- Provenance Receipt notes time spent in body-doubled sessions
- Focus Mode auto-engages when joining a room
- 5 Sovereign Layers work normally per participant
- Vibe Meter respects participant's tier (a Year 12 in a PhD room sees their own sweet spot)

## Technical implementation

### Infrastructure
- WebRTC for peer-to-peer video/audio
- WebSockets for timer sync, audio sync, presence
- TURN server (own hosted, low cost)
- Server-side: minimal — just rendezvous, not media relay
- All writing remains local (canvas content not transmitted)

### Cost per user
- WebRTC: free (peer-to-peer)
- TURN bandwidth: ~$0.50 per user per month at scale
- Server: minimal

Pricing absorbs cost easily within existing tier prices.

## Use cases

### Use Case 1: Aaron and a peer working on their thesis

Aaron and his peer in another state both writing chapters.
They open a Pair Room weekly, 2-hour sessions.
Same Pomodoro, same LoFi, gentle webcam thumbnails.
Their separate chapters, shared environment.
Both reduce procrastination, both feel less isolated.

### Use Case 2: HSC English Extension 2 cohort

5 Year 12 students all writing their major works.
Weekly Pair Rooms.
Supportive peer presence.
Higher completion rates than working alone.

### Use Case 3: Open PhD writing room

Public room, themed "Australian PhD writing".
30-40 candidates drop in across the day.
Body double with strangers.
Lower commitment than formal study group.

### Use Case 4: UNSW write-in event

Library hosts "Thesis Write-in" using Sovereign.
50 students, supervised by HDR support staff.
Shared 4-hour block with breaks.
B2B / institutional feature.

### Use Case 5: Supervisor office hours

Aaron's supervisor Prof Cumming opens a room Mondays 10-12.
Aaron and other students drop in.
Work quietly, ask quick questions in breaks.
Reduces formal 1-hour meeting overhead.

## Pricing

- Pair Rooms: included in Standard tier ($25/month)
- Group Rooms (up to 8): included in Standard tier
- Public Rooms: free for all users (curated by Simplifii)
- Cohort Rooms / Institutional: B2B pricing (covered in B2B docs)

## What this sprint should ship

Minimum viable (2-week sprint):
1. WebRTC infrastructure
2. Pair Rooms (2 people)
3. Synchronised Pomodoro
4. Shared audio library (5 tracks)
5. Optional webcam thumbnails
6. Push-to-talk voice during breaks
7. Privacy / consent flows

Enhanced (4-week sprint):
8. Group Rooms (3-8)
9. Public Rooms (curated)
10. Recording with consent (for archival sessions)
11. Cohort Rooms (institutional)
12. Supervisor Office Hours room type
13. Mobile app support

## Dependencies

- Focus Mode (Pomodoro infrastructure)
- Tier architecture (different room access per tier)
- Comms Layer (room invitations)
- Privacy infrastructure (consent flows)

## Risk: server infrastructure costs

WebRTC peer-to-peer means most traffic doesn't hit our servers. But TURN relay needed for ~10-15% of connections (NAT/firewall issues). At scale this needs proper infrastructure planning. Cost: ~$0.50 per user per month average.

For 5,000 active users at any given time: ~$2,500/month TURN costs. Manageable.

## Notes added

- 2026-05-15: This solves the loneliness problem. Massive for ADHD users.
- Pricing covered in B2C tiers; institutional cohort rooms become B2B feature.
- The "47 students writing now" indicator becomes REAL data, not hardcoded.
- Privacy-first design is critical — body doubling with surveillance is anti-feature.
