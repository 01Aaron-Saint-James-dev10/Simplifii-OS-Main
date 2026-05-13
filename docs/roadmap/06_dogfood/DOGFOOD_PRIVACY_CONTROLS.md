# Dogfood Privacy Controls [SPEC]

## What this is

How Aaron uses Sovereign in public WITHOUT exposing thesis content, supervisor confidences, participant data, or vulnerable reflexivity material.

## Status

[SPEC] — critical infrastructure for the build-in-public narrative.

## The tension

Public dogfooding builds Sovereign's narrative. But thesis IP, supervisor relationships, ethics commitments, and Aaron's psychological safety all require privacy. The tension must be resolved feature-by-feature.

## Default privacy posture

**Everything in Sovereign is private by default. Public sharing is an explicit, conscious action with friction built in.**

This is the opposite of social-by-default platforms. The privacy posture is closer to a personal journal than a public profile.

## What CAN go public

### Process insights (always shareable with care)
- "Wrote 800 words this morning"
- "Methodology log entry: realised X about my framing"
- "Today's session: 90 minutes, 3 Pomodoros, ended on Chapter 2 outline"
- "Feature shipped: Brain Dump mode"

### Aggregate stats (always shareable)
- Total hours worked across MRes
- Number of sessions
- Number of citations in corpus
- Average session length
- Receipt summary at submission (with content withheld)

### Reflexive process (shareable with editorial control)
- "What I noticed about my positioning this week"
- "A reflexivity tension I'm sitting with"
- "How my dual UNSW role affects this chapter"
- Specific entries: NO. Themes: YES.

### Public verification (Receipt feature)
- Receipt hash + verification page
- Aggregate authenticity stats
- Process metadata (time, sessions, edits)
- NEVER the content itself

### Sector commentary
- "AI submission detection is broken because..."
- "UDL 3.0 adoption depends on..."
- Drawing on MRes findings without revealing data prematurely

## What CANNOT go public

### Thesis content
- Draft chapters: NEVER until published
- Methodology specifics: only after publication
- Findings: only after publication
- Quotes from interviews: only after publication

### Supervisor relationship
- Specific feedback content: NEVER without explicit consent
- Meeting discussions: NEVER
- Tensions or disagreements: NEVER
- Relationship dynamics: NEVER

### Participant data
- Any data from ethics-approved research: NEVER publicly
- Interview content, even anonymised: NEVER
- Survey responses: NEVER
- This is non-negotiable ethics compliance

### Sensitive reflexivity
- Personal vulnerabilities expressed in Reflexivity Log: NEVER without re-reading 24 hours later and explicit decision
- Mental health content: NEVER without explicit decision and trusted-friend review
- Family or relationship content: rarely, with extreme care
- Trauma-related entries: NEVER publicly

### Corpus details
- Specific source citations: only after thesis published
- Reading lists: only after thesis published (could reveal research direction)
- Personal notes on sources: NEVER

### Specific user data
- Other Sovereign users' data: NEVER
- Beta testers' feedback: only with explicit consent
- Even aggregate data revealing user patterns: care required

## The "24 hour rule"

Before publishing anything personal:
1. Draft in private
2. Wait 24 hours
3. Re-read with fresh eyes
4. Ask: "Will I regret this in 5 years?"
5. Ask: "Does this hurt anyone?"
6. Ask: "Is this necessary?"
7. If yes-yes-yes-no, publish. Otherwise, keep private.

For most days, the answer is: "No, this is too vulnerable, keep it private."

Aaron's wellbeing is more important than any narrative.

## Sovereign features that enforce this

### Private-by-default storage
- All Sovereign data in IndexedDB (local-first)
- No cloud sync without explicit user opt-in
- No analytics that capture content
- No telemetry beyond aggregate (session count, feature usage)

### Receipt without content
- Receipt PDF shows process and metadata
- Content stays in local IndexedDB
- Public verification works on hash, not content
- Receipt is shareable; thesis is not

### Public sharing prompts
When user clicks "Share this" (Reflexivity entry, Methodology entry, Receipt):
- Modal: "What are you sharing?"
- Preview shown
- Privacy warnings flagged (e.g. "This contains specific reflexive content. Are you sure?")
- 24-hour delay option ("Save to drafts, decide tomorrow")
- Final confirmation

### Auto-redaction
When sharing methodology / reflexivity entries:
- Auto-redact named people (supervisor names, participants)
- Auto-redact specific institutions where inappropriate
- Auto-redact dates that could identify
- User approves redactions

### "Don't share" tags
Aaron can tag specific entries "private only":
- Visible in Sovereign always
- Never appear in share modals
- Locked behind extra friction

## Specific posting protocols

### Before posting on LinkedIn

Checklist:
- [ ] Have I waited 24 hours since drafting?
- [ ] Does this expose thesis IP?
- [ ] Does this expose supervisor confidences?
- [ ] Does this expose participant data (NEVER)?
- [ ] Does this expose other Sovereign users' data?
- [ ] Would Prof Cumming be comfortable reading this?
- [ ] Would my future self be comfortable reading this?
- [ ] Is this necessary or am I posting from anxiety / hyperactivity?
- [ ] Does Voice DNA approve the tone?

If ANY checkbox fails: don't post. Iterate.

### Before podcast appearance

Pre-recording prep:
- [ ] Topics agreed with host in advance
- [ ] Sensitive areas explicitly off-limits
- [ ] Discussed any potentially identifying anecdotes
- [ ] Verified host's editing practices
- [ ] Have ability to retract before publication

### Before conference talk

Pre-submission check:
- [ ] Slides reviewed by Aaron 48 hours before
- [ ] Sensitive content removed
- [ ] Recording / sharing policy known
- [ ] Q&A boundaries planned in advance

## Specific risk scenarios

### Scenario: Someone asks Aaron about his thesis findings in a podcast
**Response:** "I'm not ready to share findings publicly yet. They'll be in my MRes thesis when published. Happy to talk about methodology and process."

### Scenario: Reviewer of a paper Aaron submitted asks if his work is informed by lived experience
**Response:** Aaron has documented this in Reflexivity Log. Can share that he discusses positionality in the paper. Doesn't expose specifics of lived experience beyond what paper says.

### Scenario: A potential investor asks for Aaron's full Sovereign usage data
**Response:** "I can share aggregate stats: hours worked, sessions, milestones. Content is private. That's the product promise."

### Scenario: A potential B2B customer (university) wants to see Aaron's MRes-in-progress as proof
**Response:** Share Receipt summary, aggregate stats, process narrative. Never share content. The Receipt IS the proof.

### Scenario: Aaron's supervisor asks Aaron to be more public about their collaboration
**Response:** Honour the request within boundaries. Co-authored work IS public via publications. Day-to-day supervisor relationship stays private.

### Scenario: A Sovereign user (paying customer) wants Aaron to publicly endorse their use
**Response:** Aaron's role is product builder, not endorser. Aggregate testimonials curated by Sovereign team, not Aaron personally.

## Aaron's mental health protection

Critical: Aaron's public profile growth must not exceed his psychological capacity to handle it.

Indicators that Aaron should reduce public profile:
- Sleeping poorly
- Increased anxiety about online responses
- Feeling like he must post
- DMs becoming overwhelming
- Imposter syndrome flaring
- Family relationships strained

Mitigation tools:
- Posting limits (max 3/week non-negotiable)
- DM batching (specific time, not all day)
- Notification controls (most off, batched check-ins)
- Therapy / coaching support
- Explicit permission to step back without explanation

## What this sprint should ship

Not a sprint. A discipline + Sovereign features that support it:
1. Sovereign builds the "24-hour delay" option in share modals
2. Sovereign builds auto-redaction for shared entries
3. Sovereign builds "private only" tag enforcement
4. Aaron commits to the 24-hour rule in writing
5. Aaron identifies 2-3 trusted reviewers for sensitive content

## Dependencies

- Sovereign sharing features built (currently NOT built — shipping is part of this)
- Aaron's mental health monitoring
- Trusted reviewer network

## Notes added

- 2026-05-15: Privacy is not optional. It's the differentiation AND the ethics AND the safety.
- Build-in-public works when boundaries are clear. Without boundaries, it destroys founders.
- Aaron's psychological safety is more important than any narrative or revenue.
