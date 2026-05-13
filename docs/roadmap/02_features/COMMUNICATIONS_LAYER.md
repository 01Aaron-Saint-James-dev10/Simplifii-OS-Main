# Communications Layer [SPEC]

## What this is

A persistent helper that drafts emails, agendas, meeting notes, supervisor updates, peer review responses, scholarship paragraphs, slack messages, text messages. Available everywhere. Knows the user's context, recipient, register. Never auto-sends.

## Status

[SPEC] — was part of Ingestion+Comms sprint. Never built. The "supportive email drafting thing we had in the previous build that we discarded and saved, then rebuilt/redesigned with Claude design" Aaron referenced.

## Why this is cross-cutting

Every tier needs to draft messages:
- Year 12 student: email to teacher requesting clarification
- Bachelor's student: email to lecturer requesting extension
- Honours student: email to supervisor about chapter
- PhD candidate: email to ethics committee, peer reviewer responses
- Academic: cover letters to journals, grant follow-ups, co-author negotiation
- Homeschool parent: state registrar correspondence

A standalone messaging tool doesn't make sense. This sits ABOVE everything as a cross-cutting layer.

## Entry points

1. Persistent floating button bottom-right (collapsible)
2. Keyboard shortcut: Cmd+Shift+E
3. Context menus when text selected: "Draft email about this"
4. Within supervisor panel: "Reply to supervisor"
5. Within reflexivity log: "Email this insight to supervisor"
6. Within methodology log: "Email decision to supervisor"

## Message types

### Email drafts
- To supervisor (research check-in, extension, feedback response, meeting request)
- To examiner / marker (extension request, clarification, submission)
- To co-author (revision, contribution discussion, submission decision)
- To ethics committee (amendment, query response, approval thanks)
- To scholarship committee (application, follow-up)
- To peer reviewer (response to review, revision letter)
- To student (teacher mode)
- To parent / family (life update)
- Cold outreach (researcher, conference organiser, journal editor)

### Messages
- Slack / Teams / Discord text
- Quick text message (SMS, WhatsApp)
- LinkedIn message

### Meeting artefacts
- Meeting agenda (before)
- Meeting notes (during, with live capture)
- Meeting summary (after)
- Action items extraction

### Documents
- Supervisor update doc (weekly/monthly)
- Progress report
- Ethics amendment request
- Conference abstract
- Peer review response letter
- Grant scheme paragraphs

## Context awareness

CommunicationsService knows:
- Current user (Aaron, his roles, his Voice DNA from prior writing)
- Current container (which project, chapter, phase)
- Recent activity (what user has been working on)
- Recipient context (if known: supervisor name, role, communication preferences)
- Relationship history (past emails to this recipient if stored)
- Cultural context (Australian English, Aboriginal protocols if relevant)

## UX Flow

Click "Draft a message" →

Modal opens:
1. **Type:** [dropdown of message types]
2. **Recipient:** [autocomplete from contacts, or type new]
3. **Context:** "What's this about?" [single-line or paste in]
4. **Tone:** [Direct / Warm / Formal / Casual] (defaults based on relationship)
5. **Length:** [Brief / Standard / Detailed]
6. **Strategic intent:** What outcome you want
7. **Notes:** [optional, specific points to include]
8. **Generate variants** button

AI generates 2-3 variants with different strategic angles:
- "Direct request" version
- "Warm relationship-build" version
- "Strategic delay" version (if extension request, etc)

User selects, edits inline, copies to clipboard or opens via mailto:.

**NEVER auto-sends.** Privacy and agency preserved.

## Voice DNA applied

Every draft matches user's Voice DNA:
- Australian English enforced
- No em-dashes
- User's typical phrasings
- Tone calibrated to recipient
- Avoids AI-tell words user marked banned ("delve", "tapestry", "navigate")
- Length / brevity matches user's pattern

## Template library

Pre-built starting templates for common scenarios:

### Extension Request (Student → Lecturer)
```
Dear [Lecturer],

I'd like to request an extension on [deliverable]. 

The reason is [reason — be specific].

My current progress: [progress].

The revised timeline I'm proposing: [timeline].

I understand if this isn't possible. Please let me know.

Thanks for your time.

[User]
```

### Supervisor Check-in (Research student → Supervisor)
```
Hi [Supervisor],

Quick update on [project component].

Progress this week:
- [item]
- [item]

What's working:
- [item]

What I'm stuck on:
- [item — be specific]

Questions for you:
- [question]
- [question]

Could we meet [proposed time] for [proposed duration]?

[User]
```

### Ethics Amendment Request
```
Dear Ethics Committee,

I'm writing to request an amendment to ethics approval [number].

The change I'm proposing: [change]

The rationale: [rationale]

The implications for participants: [implications — be honest about any new risks]

Attached: [revised participant info sheet / consent form / etc]

Please let me know what next steps you require.

[User]
```

### Scholarship Paragraph
```
My research [describes — 1 sentence].

This matters because [significance — concrete, not abstract].

The Fellowship would enable [specific use — be concrete].

Beyond the Fellowship, this contributes to [field / sector / community].
```

### Peer Review Response
```
We thank Reviewer [N] for their thoughtful comments. We have addressed each as follows:

R[N].1: [reviewer comment summarised]
Response: [your response]
Changes made: [what changed in manuscript, with line numbers]

R[N].2: [next comment]
Response: ...
```

### Conference Abstract (250 words, structured)
- Background (2-3 sentences)
- Aim (1 sentence)
- Method (2-3 sentences)
- Results (3-4 sentences)
- Conclusion (1-2 sentences)
- Implications (1-2 sentences)

### Cover Letter (journal submission)
```
Dear [Editor],

We submit [paper title] for consideration in [journal].

This work [significance — why this journal, why now].

Our findings [headline result, 1-2 sentences].

We believe this is suitable because [fit with journal scope].

Co-authors: [names with contribution statements].
Conflicts of interest: [statement].
Funding: [statement].

We confirm this work is not under consideration elsewhere.

[Corresponding author]
```

### Cold Outreach (researcher / mentor request)
```
Dear [Name],

My name is [name]. I'm [role / context].

I've been reading your work on [specific paper / topic]. [What resonated — be specific, not generic.]

I'm currently [your work — connection point]. 

[Concrete ask — coffee chat, advice on X, supervision interest, etc.]

I understand you're busy. Even a brief response, or a 'no thanks', would be appreciated.

Thanks for your time.

[User]
```

## Agenda Generation

Click 'Generate agenda for next supervisor meeting':
- Pulls unaddressed supervisor feedback items
- Pulls methodology decisions needing approval
- Pulls reflexivity tensions to discuss
- Pulls progress to report
- Generates timed agenda (15min / 30min / 1hr meeting)
- Exports as PDF or text

## Meeting Notes Mode

During meetings, click 'Meeting mode':
- Audio recording (with consent prompt) OR
- Type notes quickly
- 'Decision' / 'Action' / 'Question' / 'Quote' quick-tag buttons
- AI structures into outcomes after meeting:
  - Decisions made
  - Action items (with owners and due dates)
  - Open questions
  - Quotes worth saving
- Generates follow-up email summary to send to participants

## Privacy and Safety

- All drafts CLEARLY marked as drafts
- 'Edit before sending' reminder
- User edits captured for Voice DNA refinement over time
- NO auto-send capability EVER
- Sensitive contexts flagged (e.g. drafting email to abuser, drafting email under emotional duress) → gentle pause prompt
- All comms logged to HistoryOfThought as `comms_draft_generated` events (not the content, just the event)

## Integration with project context

When drafting supervisor email, AI knows:
- Current chapter status
- Recent supervisor feedback (addressed/unaddressed)
- Methodology decisions made recently
- Next deliverable
- Pending ethics status
- Aaron's recent reflexivity entries

So generated drafts are contextually grounded, not generic.

## Accessibility

- Modal keyboard navigable
- Drafts can be read aloud (TTS)
- Voice input for context/notes field
- Screen reader friendly variant generation
- Reduced motion respected
- Confidence-first language for equity pathway users

## What this sprint should ship

Minimum viable (3-day sprint):
1. CommunicationsService with 5 message types
2. CommsLauncher floating button
3. CommsModal UI
4. 5 templates (extension, supervisor check-in, ethics, scholarship, peer review)
5. Voice DNA matching
6. Context awareness for current project

Full v1 (6-day sprint):
7. All 15+ message types
8. Agenda generation
9. Meeting notes mode
10. Audio recording with consent flow
11. Full template library (30+)
12. Multi-variant generation

## Dependencies

- Tier architecture (for tier-appropriate register defaults)
- Voice DNA service (for voice matching)
- Project context (for grounding)

## Why this is essential

Communications are the biggest cause of research student stress. Drafting an email to a supervisor can take an ADHD student 90 minutes of staring. Sovereign Comms turns that into 5 minutes of editing.

For autistic users especially, decoding the right register / tone / formality for different recipients is genuinely hard. The Communications Layer makes it explicit and supportive.

## Notes added

- 2026-05-15: This is the "supportive email drafting thing" Aaron referenced from the previous build. Lives at this layer above all products.
- Was in Ingestion+Comms sprint. Belongs in its own dedicated sprint.
