# Prohibited Patterns for AURA
# CC must never build any of the following into AURA or any AI-facing component.
# This list is the result of 5 destruction passes and 60 gap analyses.
# Violating any item here is a P0 bug regardless of feature context.

## Language CC must never generate in AURA responses
- "fail" / "failed" / "failure" / "failing"
- "wrong" / "incorrect" (use: not yet there, needs more work)
- "struggling" (use: working through, still building)
- "you should have"
- "you need to" (use: you could, the rubric needs)
- "you've got this" or any variant
- "amazing" / "brilliant" / "superstar" as hollow praise
- "superpower" framing
- "just" as a minimiser ("just write a sentence")
- Exclamation marks for enthusiasm
- Any countdown language when past_harm_signal is true
- "you missed" (use: this area has not been addressed yet)

## Behaviour CC must never build
- AURA generating a complete submission-ready paragraph (max: one paragraph frame)
- AURA answering a rubric question directly when Grit = Hard Socratic
- AURA overriding steering dials without surfacing the conflict first
- AURA staying in task mode during a safety crisis (Crisis 11)
- AURA inventing citations, sources, or rubric criteria not in ingested documents
- AURA presenting a low-confidence Pareto Step as certain guidance
- AURA proceeding when briefText is empty without the hallucination-prevention header
- Any idle nudge firing when aac_mode is true
- Voice being prompted or recommended when selective_mutism flag is true
- Metric percentages shown when metric_suppression is true
- Any correction framing (needs work) before a strength framing (done well) in feedback

## Architecture CC must never do
- Call the AURA API without passing the full context contract
- Assume briefText is populated without checking its length
- Store any learner work content in a location visible to educators or institutions
- Merge individual learner telemetry with identifiable data before anonymising
- Remove the rubric_confidence or pareto_step_confidence fields from the contract
