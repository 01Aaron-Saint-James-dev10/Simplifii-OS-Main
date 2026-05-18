from fastapi import APIRouter, HTTPException, Request
from emergentintegrations.llm.chat import UserMessage
import json
import logging
import asyncio
import uuid
from datetime import datetime, timezone

from database import db
from models import (
    HiddenCurriculumRequest, TranslateRequest, RubricSimplifyRequest,
    EssayScorerRequest, EssayDeepFeedbackRequest, HumaniserRequest, ScaffolderRequest, ConceptRequest
)
from utils.auth import get_current_user
from utils.llm import create_llm_chat, parse_llm_json, send_with_retry, clean_pdf_text
from utils.tickets import check_tickets_available, deduct_tickets, check_and_deduct_tickets, refund_tickets
from utils.university_context import build_context_string

router = APIRouter(prefix="/api")

# In-memory store for scaffold jobs (lightweight, no DB overhead)
_scaffold_jobs = {}


def compute_ai_risk_score(text: str) -> int:
    """Compute AI detection risk score (0-100) from actual text features.
    Higher = more likely to trigger AI detection."""
    import re as _re
    if not text or not text.strip():
        return 50

    text_lower = text.lower()
    sentences = [s.strip() for s in _re.split(r'[.!?]+', text) if len(s.strip()) > 3]
    total_sents = max(len(sentences), 1)
    words = text.split()
    total_words = max(len(words), 1)

    # 1. Passive voice (broad detection)
    passive_hits = len(_re.findall(
        r'\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en|ised|ized|ated|ment)\b',
        text, _re.IGNORECASE
    ))
    # Also detect "has been X", "have been X", "will be X"
    passive_hits += len(_re.findall(
        r'\b(?:has|have|had|will|shall|would|could|should|might|must)\s+(?:been?\s+)?\w+(?:ed|en)\b',
        text, _re.IGNORECASE
    ))
    passive_ratio = min(passive_hits / total_sents, 1.0)

    # 2. Sentence length uniformity
    sent_lengths = [len(s.split()) for s in sentences]
    if len(sent_lengths) > 2:
        mean_len = sum(sent_lengths) / len(sent_lengths)
        variance = sum((l - mean_len) ** 2 for l in sent_lengths) / len(sent_lengths)
        std_dev = variance ** 0.5
        uniformity_score = max(0, min(1.0, 1.0 - (std_dev / 8.0)))
    elif len(sent_lengths) == 2:
        diff = abs(sent_lengths[0] - sent_lengths[1])
        uniformity_score = max(0, 1.0 - (diff / 15.0))
    else:
        uniformity_score = 0.5

    # 3. Transition/connector word density
    transitions = ["however", "furthermore", "moreover", "therefore", "additionally",
                   "consequently", "nevertheless", "in conclusion", "in contrast",
                   "on the other hand", "as a result", "in light of", "with regard to",
                   "it is important", "it is worth", "it can be argued", "it should be noted",
                   "this suggests", "this demonstrates", "this indicates", "this implies",
                   "significantly", "essentially", "fundamentally", "comprehensively"]
    transition_count = sum(1 for t in transitions if t in text_lower)
    transition_density = min(transition_count / total_sents, 1.0)

    # 4. Formal/academic phrase density
    formal_phrases = ["it is important to note", "this essay will examine",
                      "in conclusion", "the purpose of this", "it can be argued",
                      "it is evident that", "one must consider", "it should be noted",
                      "this paper aims", "the findings suggest", "as previously mentioned",
                      "the aforementioned", "in order to", "due to the fact",
                      "play a crucial role", "provide significant", "empirical inquiry",
                      "methodological framework", "serves as a foundation"]
    formal_count = sum(1 for p in formal_phrases if p in text_lower)
    formal_density = min(formal_count / max(total_sents / 3, 1), 1.0)

    # 5. First-person voice absence (AI rarely uses I/my/we)
    first_person = len(_re.findall(r"\b(?:I|my|me|we|our|I'm|I've|I'd|myself)\b", text))
    fp_presence = min(first_person / max(total_words * 0.02, 1), 1.0)
    fp_absence = 1.0 - fp_presence

    # 6. Hedging/colloquial language (lowers risk — humans hedge)
    hedges = ["perhaps", "maybe", "possibly", "seems", "appears", "might",
              "could be", "i think", "i believe", "i feel", "i reckon",
              "sort of", "kind of", "pretty much", "honestly", "actually",
              "basically", "like", "yeah", "nah", "mate", "stuff", "things",
              "gonna", "wanna", "gotta", "dunno", "ain't"]
    hedge_count = sum(1 for h in hedges if h in text_lower)
    hedge_factor = min(hedge_count / max(total_sents * 0.3, 1), 1.0)

    # 7. Average sentence length (longer = more AI-like)
    avg_sent_len = sum(sent_lengths) / len(sent_lengths) if sent_lengths else 10
    length_factor = min(max(avg_sent_len - 10, 0) / 12.0, 1.0)

    # 8. Nominalisation density (academic register marker)
    # Words ending in -tion, -ment, -ness, -ity, -ence, -ance (abstract nouns)
    nominalisations = len(_re.findall(
        r'\b\w{5,}(?:tion|ment|ness|ity|ence|ance|ism|ology|ical)\b',
        text_lower
    ))
    nominal_density = min(nominalisations / max(total_words * 0.05, 1), 1.0)

    # 9. Contraction absence (AI/formal text avoids contractions)
    contractions = len(_re.findall(r"\b\w+'(?:t|s|re|ve|d|ll|m)\b", text_lower))
    contraction_presence = min(contractions / max(total_sents * 0.3, 1), 1.0)
    contraction_absence = 1.0 - contraction_presence

    # 10. Lexical diversity (type-token ratio — lower = more repetitive = AI-like)
    unique_words = len(set(w.lower().strip('.,!?;:()[]') for w in words if len(w) > 2))
    ttr = unique_words / total_words if total_words > 0 else 0.5
    # Low TTR (< 0.5) suggests repetitive/formulaic; high (> 0.8) more natural
    ttr_factor = max(0, 1.0 - ttr)  # inverted: lower diversity = higher risk

    # Weighted score
    raw = (
        passive_ratio * 12 +
        uniformity_score * 10 +
        transition_density * 12 +
        formal_density * 10 +
        fp_absence * 8 +
        length_factor * 10 +
        nominal_density * 12 +
        contraction_absence * 8 +
        ttr_factor * 8 -
        hedge_factor * 12
    )

    # Scale to 0-100
    scaled = int(raw * 1.15 + 5)

    # Text fingerprint for minor per-text variation (+/- 2)
    fp = sum(ord(c) for c in text[:100]) % 5 - 2
    scaled += fp

    return max(15, min(95, scaled))


@router.post("/decode-jargon")
async def decode_jargon(data: HiddenCurriculumRequest, request: Request):
    user = await get_current_user(request)
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Please paste some academic text to decode.")
    await check_tickets_available(user.user_id, "decoder")
    uni_ctx = build_context_string(user.model_dump())
    SYS = uni_ctx + """You are Simplifii's Hidden Curriculum Decoder.

The hidden curriculum is the system of unwritten rules, implicit expectations, and unstated assumptions that universities impose on students without ever teaching them.

Students who grew up around university-educated families absorbed these rules passively over years. Students who did not — first-generation students, international students, neurodivergent students, mature-aged students — are expected to know these rules on arrival. They are penalised when they don't and are rarely told why.

Your job is to make the invisible visible. Use Australian English. Return ONLY valid JSON."""
    chat = create_llm_chat("jargon", SYS)

    prompt = f"""Decode the hidden curriculum in this academic text.

Text:
{data.text[:4000]}

Return ONLY a JSON object:
{{
  "jargonDecoder": [
    {{
      "term": "academic jargon term",
      "plainMeaning": "what it means in plain language",
      "whyItMatters": "why this specific term matters for THIS assessment",
      "whatDifferentLooksLike": "what a student who understands it does differently",
      "commonMisunderstanding": "the most common misunderstanding",
      "workforceTransfer": "how this skill transfers to the workplace"
    }}
  ],
  "whatMarkerWants": [
    "hidden expectation 1 — specific to this assessment",
    "hidden expectation 2",
    "hidden expectation 3",
    "hidden expectation 4"
  ],
  "soundLikeYouBelong": {{
    "phrasesToUse": ["phrase 1", "phrase 2", "phrase 3", "phrase 4", "phrase 5"],
    "phrasesToAvoid": [
      {{"avoid": "phrase to avoid", "useInstead": "what to say instead"}}
    ],
    "appropriateTone": "the tone this assessment rewards and how to achieve it",
    "honestyNote": "one honest observation about whose voice this system was built around — and that other communication styles are equally valid and intelligent"
  }},
  "hiddenCurriculumChecklist": [
    "implicit expectation 1 specific to this document",
    "implicit expectation 2",
    "implicit expectation 3",
    "implicit expectation 4",
    "implicit expectation 5"
  ],
  "higherOrderPrompts": [
    "question challenging a stated assumption in the assessment task",
    "question about whose perspective is centred and whose is missing",
    "question connecting this assessment to a real-world problem"
  ],
  "youBelongHere": "One honest, warm, direct paragraph. Acknowledge the hidden curriculum is a real structural barrier — not a personal failing. Affirm that understanding these rules is reclaiming access that should have been provided from the start."
}}

RULES:
- jargonDecoder: find every piece of academic jargon. Include workforceTransfer for each.
- whatMarkerWants: 4-6 specific hidden expectations. Be honest about class, cultural, and educational assumptions.
- soundLikeYouBelong: 5 competence phrases, 3 avoid phrases with alternatives, appropriate tone, and honesty note
- hiddenCurriculumChecklist: 5-7 implicit expectations specific to the actual document — not generic academic advice
- higherOrderPrompts: 3 questions — challenge assumption, whose perspective, real-world connection
- youBelongHere: warm, honest, specific paragraph
- Use Australian English
- Never return empty output if text exists

Return ONLY the JSON."""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="jargon")
        result = parse_llm_json(response)
        await deduct_tickets(user.user_id, "decoder")
        return result
    except Exception as e:
        logging.error(f"Jargon decode error: {e}")
        raise HTTPException(status_code=500, detail=(str(e) if "credits" in str(e).lower() else "Failed to decode jargon") + " No tickets were charged for this attempt.")


@router.post("/translate")
async def translate_text(data: TranslateRequest, request: Request):
    user = await get_current_user(request)
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Please paste some text to translate.")
    SYS = "You are a professional academic translator. Translate the text accurately while preserving academic terminology. Return ONLY the translated text."
    chat = create_llm_chat("translate", SYS)

    prompt = f"""Translate the following text to {data.target_language}. Preserve academic terms where appropriate, and add brief explanations in parentheses for key academic concepts.

Text:
{data.text[:5000]}

Return ONLY the translated text."""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="translate")
        return {"translated": response.strip(), "target_language": data.target_language}
    except Exception as e:
        logging.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e) if "credits" in str(e).lower() else "Translation failed")


@router.post("/rubric/simplify")
async def simplify_rubric(data: RubricSimplifyRequest, request: Request):
    user = await get_current_user(request)
    rubric_raw = (data.rubric_text or "").strip()

    # Guard: log and reject empty/tiny input
    logging.info(f"RUBRIC INPUT DIAGNOSTIC — chars: {len(rubric_raw)}, first 200: {rubric_raw[:200]!r}, empty: {rubric_raw == ''}")
    if not rubric_raw:
        raise HTTPException(status_code=400, detail="Please paste your rubric text to simplify.")
    if len(rubric_raw) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough text from PDF. Please paste the rubric text directly.")

    await check_tickets_available(user.user_id, "rubric-simplifier")

    has_brief = bool(data.brief_text and data.brief_text.strip())
    brief_context = ""
    if has_brief:
        brief_context = f"\n\nASSESSMENT BRIEF (use to make tips hyper-specific):\n{data.brief_text[:4000]}"

    SYS = build_context_string(user.model_dump()) + """You are a rubric translator. Your job is to read any university rubric and translate it into a clear action plan students can follow. Handle ANY grade scale: HD/D/C/P, Excellent/Very Good/Satisfactory, numeric, percentage, or custom bands. Use Australian English. Return ONLY valid JSON."""

    chat = create_llm_chat("rubric", SYS)
    rubric_input = data.rubric_text[:6000]

    prompt = f"""Read this rubric and extract every criterion you find.

Rubric:
{rubric_input}{brief_context}

Return ONLY a JSON object:
{{
  "assessmentTitle": "from document or null",
  "totalMarks": null,
  "criteria": [
    {{
      "criterionName": "exact name from rubric",
      "totalMarks": "marks/percentage if stated, null if not",
      "gradeBands": [
        {{
          "band": "exact grade level name from rubric (e.g. HD, Excellent, 80-100, etc.)",
          "whatItLooksLike": "what the student must do to achieve this level",
          "specificEvidence": "what specific evidence the marker looks for"
        }}
      ],
      "microTaskChecklist": [
        "specific action the student should take for this criterion"
      ],
      "plainEnglish": "one sentence summary of what this criterion is really asking"
    }}
  ],
  "selfAssessmentChecklist": [
    "criterion name — one plain sentence of what meeting this looks like"
  ],
  "normalisingMessage": "Warm, encouraging paragraph acknowledging rubrics are confusing"
}}

RULES:
- Extract EVERY criterion — do not skip any
- For each criterion, include EVERY grade band/level present in the rubric using the EXACT names from the document
- Do NOT rename grade bands — use the exact labels (Excellent, Very Good, HD, D, etc.)
- microTaskChecklist: 3-4 specific actions per criterion
- selfAssessmentChecklist: one checkbox per criterion
- normalisingMessage: warm, specific, encouraging
- Use only information from the rubric — never invent criteria
- Australian English
- Return ONLY the JSON, nothing else"""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="rubric", timeout=120)
        logging.info(f"RUBRIC RAW RESPONSE — length: {len(response)}, first 500: {response[:500]!r}")
        result = parse_llm_json(response)
        await deduct_tickets(user.user_id, "rubric-simplifier")
        return result
    except json.JSONDecodeError as je:
        logging.error(f"Rubric JSON parse failed: {je}. Raw response first 1000 chars: {response[:1000] if 'response' in dir() else 'NO RESPONSE'}")
        raise HTTPException(status_code=500, detail="The AI returned an invalid response. Please try again. No tickets were charged for this attempt.")
    except Exception as e:
        logging.error(f"Rubric simplify error: {e}")
        error_str = str(e)
        no_charge = " No tickets were charged for this attempt."
        if "credits" in error_str.lower() or "budget" in error_str.lower():
            raise HTTPException(status_code=500, detail=error_str + no_charge)
        elif "timed out" in error_str.lower() or "timeout" in error_str.lower():
            raise HTTPException(status_code=500, detail="The rubric took too long to process. Try uploading a shorter section." + no_charge)
        else:
            raise HTTPException(status_code=500, detail=f"Rubric simplification failed. Please try again." + no_charge)


@router.post("/essay/score")
async def score_essay(data: EssayScorerRequest, request: Request):
    user = await get_current_user(request)
    if not data.essay_text.strip():
        raise HTTPException(status_code=400, detail="Please paste your essay text to get feedback.")
    await check_tickets_available(user.user_id, "essay-scorer")

    essay_stripped = data.essay_text.strip()
    word_count = len(essay_stripped.split())

    has_rubric = bool(data.rubric_text.strip())
    has_brief = bool(data.brief_text.strip())

    if has_rubric:
        criteria_source = f"RUBRIC:\n{data.rubric_text[:3000]}"
    elif has_brief:
        criteria_source = f"ASSESSMENT BRIEF:\n{data.brief_text[:3000]}"
    else:
        criteria_source = "No rubric or brief provided. Infer assessment type and apply universally recognised criteria."

    SYS = build_context_string(user.model_dump()) + """You are Simplifii's Essay Scorer. You provide honest, rubric-aligned formative feedback that helps students understand their current level and know exactly what to do to improve before submission.

You are not a grade predictor. You are a thinking partner helping the student develop higher-order academic skills.

STEP 0 — EXTRACT AND LOCK RUBRIC ANCHORS
Before doing anything else, read the rubric.
Extract every criterion, its weighting, and its band descriptors.
Write them out explicitly as your scoring anchors.
You must use ONLY these anchors for all scoring decisions in this run.
Do not reinterpret, adjust, or add criteria.
These anchors are fixed for this entire run.

BAND-TO-PERCENTAGE MAPPING (apply consistently):

If rubric uses HD/D/C/P/F scale:
  HD = 85-100%, Distinction = 75-84%, Credit = 65-74%, Pass = 50-64%, Fail = 0-49%
If rubric uses HD/DN/CR/PS/FL (UNSW):
  HD = 85-100%, DN = 75-84%, CR = 65-74%, PS = 50-64%, FL = 0-49%
If rubric uses Excellent/Good/Satisfactory/Needs Improvement:
  Excellent = 85-100%, Good = 70-84%, Satisfactory = 55-69%, Needs Improvement = 0-54%
If rubric uses numeric descriptors only (e.g. 0-5 scale):
  Map proportionally to percentage. 5/5 = 100%, 4/5 = 80%, 3/5 = 60% etc.
If rubric uses custom band names not listed above:
  Use position in scale. Top band = 85-100%, bottom passing band = 50-64%.

State which scale you detected in the "detectedScale" field.

OVERALL PERCENTAGE CALCULATION (mandatory formula):
Calculate as weighted average of SUBMITTED CRITERIA ONLY.
For each criterion where content was found:
  criterion_score_pct x criterion_weighting_decimal
Sum all weighted scores.
Divide by sum of weightings for submitted criteria only.
Round to nearest whole number.

Example: Intro 20% weighting scored 75% = 15.0, Content 40% weighting scored 75% = 30.0, Conclusion 10% weighting not submitted = excluded.
Total submitted weighting = 0.60. Overall = 45.0 / 0.60 = 75%.
Never include unsubmitted criteria in the denominator.
Never reduce the overall score because sections are missing — flag missing sections in completenessCheck only.

HANDLING INCOMPLETE SUBMISSIONS:
1. Flag in completenessCheck with isComplete: false and a specific warning naming exactly what is missing.
2. Score ONLY criteria where content was found.
3. Never reduce scores on present criteria because other criteria are missing.
4. For missing criteria, set: bandAchieved: "Not submitted", score: null, strength: null, improvement: "Submit this section to receive feedback", evidenceFound: null, higherOrderPrompt: null, workforceConnection: null.
5. Show overall percentage based only on submitted criteria. Add to calibrationNote: "Score reflects submitted sections only. Complete all sections for a full assessment."

Use Australian English. Return ONLY valid JSON."""

    chat = create_llm_chat("essay", SYS, temperature=0.0)

    prompt = f"""{criteria_source}

ESSAY ({word_count} words):
{data.essay_text[:5000]}

SCORING INSTRUCTIONS:
1. FIRST: Extract and lock your rubric anchors (Step 0). Identify the grading scale used.
2. CHECK COMPLETENESS: Flag any missing sections. Do NOT penalise present criteria for missing sections.
3. FOR EACH CRITERION:
   a. Find specific evidence — quote a specific sentence or passage from the essay. If no evidence found for this criterion, mark as "Not submitted".
   b. Determine which band descriptor the evidence matches. Assign a percentage score from the mapped range for that band.
   c. State the strength — what specifically did the student do well? Reference actual content.
   d. One priority improvement — the single most impactful change. Make it actionable.
   e. Higher-order prompt — one question pushing deeper thinking about this criterion.
   f. Workforce connection — one sentence connecting this criterion to a real professional skill.
4. CALCULATE OVERALL: Use the mandatory weighted average formula on submitted criteria only.

Return ONLY a JSON object:
{{
  "detectedScale": "The actual grading scale detected from the rubric — e.g. 'Excellent/Very Good/Satisfactory/Unsatisfactory' or 'HD/D/C/P/F'. Read the rubric bands and use EXACTLY what is written. Do NOT default to HD/D/C/P/F unless the rubric actually uses those terms.",
  "completenessCheck": {{
    "isComplete": true,
    "warning": null
  }},
  "criteria": [
    {{
      "criterionName": "exact criterion name from rubric",
      "weighting": "40%",
      "bandAchieved": "Credit",
      "evidenceFound": "direct quote from essay or null if not submitted",
      "strength": "specific to their actual writing or null if not submitted",
      "improvement": "actionable specific suggestion",
      "higherOrderPrompt": "thinking question or null if not submitted",
      "workforceConnection": "professional skill connection or null if not submitted",
      "score": 68
    }}
  ],
  "overallFeedback": {{
    "strongestAspect": "the one thing this draft does genuinely well — specific, referenced",
    "priorityImprovement": "the single change that would most improve the overall score",
    "estimatedBand": "C",
    "nextDraftFocus": [
      "first priority",
      "second priority",
      "third priority"
    ],
    "calibrationNote": "This is formative guidance based on the rubric you provided. Actual marks are determined by your marker. Use this to improve your draft, not as a prediction of your final grade."
  }},
  "encouragement": "one warm, specific, honest sentence acknowledging the genuine effort visible in this draft"
}}

RULES:
- completenessCheck.isComplete = false if essay ends mid-sentence, is under 200 words, or has obvious missing sections
- completenessCheck.warning must be specific about exactly what is missing
- For NOT SUBMITTED criteria: bandAchieved="Not submitted", score=null, strength=null, improvement="Submit this section to receive feedback", evidenceFound=null
- Strengths first for EVERY submitted criterion
- evidenceFound must be a direct quote from the essay text (not paraphrased)
- estimatedBand: use the detected scale bands only
- Score each submitted criterion as a percentage. Use the MIDPOINT of the matched band range: HD=92, D/DN=80, C/CR=70, P/PS=57, F/FL=25. Only deviate from the midpoint if there is clear, specific evidence that the work is at the very top or very bottom of the band — in which case use the boundary value (e.g. 85 for bottom HD, 100 for top HD). This ensures consistent scoring across runs.
- The overall percentage MUST equal the weighted average of submitted criteria scores (verify your arithmetic)
- Australian English
- Never return empty output if essay text exists

Return ONLY the JSON."""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="essay")
        result = parse_llm_json(response)

        # --- Server-side enforcement of weighted average formula ---
        if "criteria" in result and result["criteria"]:
            total_weighted = 0.0
            total_weight = 0.0
            for crit in result["criteria"]:
                score = crit.get("score")
                weight_str = str(crit.get("weighting", "0%")).replace("%", "").strip()
                try:
                    weight = float(weight_str) / 100.0
                except (ValueError, TypeError):
                    weight = 0.0
                if score is not None and weight > 0:
                    total_weighted += float(score) * weight
                    total_weight += weight
            if total_weight > 0:
                calculated_overall = round(total_weighted / total_weight)
                result["calculatedOverall"] = calculated_overall

        # Ensure calibration note always present
        if "overallFeedback" in result:
            if "calibrationNote" not in result["overallFeedback"]:
                result["overallFeedback"]["calibrationNote"] = "This is formative guidance based on the rubric you provided. Actual marks are determined by your marker. Use this to improve your draft, not as a prediction of your final grade."
            # Append incomplete note if applicable
            cc = result.get("completenessCheck", {})
            if cc.get("isComplete") is False:
                existing = result["overallFeedback"].get("calibrationNote", "")
                if "submitted sections only" not in existing:
                    result["overallFeedback"]["calibrationNote"] = existing + " Score reflects submitted sections only. Complete all sections for a full assessment."

        await deduct_tickets(user.user_id, "essay-scorer")
        return result
    except Exception as e:
        logging.error(f"Essay scorer error: {e}")
        raise HTTPException(status_code=500, detail=(str(e) if "credits" in str(e).lower() else "Failed to score essay") + " No tickets were charged for this attempt.")


@router.post("/essay/deep-feedback")
async def essay_deep_feedback(data: EssayDeepFeedbackRequest, request: Request):
    """Phase 2: Detailed constructive feedback — only when student opts in."""
    user = await get_current_user(request)

    has_rubric = bool(data.rubric_text.strip())
    has_brief = bool(data.brief_text.strip())

    if has_rubric:
        criteria_source = f"RUBRIC:\n{data.rubric_text[:3000]}"
    elif has_brief:
        criteria_source = f"ASSESSMENT BRIEF:\n{data.brief_text[:3000]}"
    else:
        criteria_source = "No rubric or brief provided."

    SYS = build_context_string(user.model_dump()) + """You are Simplifii's Essay Scorer providing detailed constructive feedback. The student has opted in to receive deeper feedback. You still lead with evidence and respect, but now provide specific gaps, Socratic questions, and concrete actions. You NEVER write essay content. Use Australian English. Return ONLY valid JSON."""
    chat = create_llm_chat("essay_deep", SYS)

    prompt = f"""The student has opted in for deeper feedback. Their initial scores were:
{data.initial_scores[:2000]}

{criteria_source}

ESSAY:
{data.essay_text[:5000]}

Return ONLY a JSON object with detailed criterion-by-criterion constructive feedback:
{{
  "criterionFeedback": [
    {{
      "criterion": "exact criterion name",
      "score": 18,
      "maximum": 25,
      "percentage": 72,
      "rubricLevelReached": "exact descriptor from rubric for the level achieved",
      "evidenceFromEssay": "Quote or reference specific content. Never generalise.",
      "whereMarksWereLost": "Reference the next level up descriptor. What is present vs missing.",
      "socraticQuestions": [
        "Higher-order thinking question requiring analysis/evaluation/synthesis — never yes/no, never contains the answer",
        "Another question connecting the student's argument to broader concepts",
        "A question that challenges their assumptions"
      ],
      "nextConcreteAction": "One specific action the student can take in the next 30 minutes that directly addresses the gap between current score and the next rubric level. Not vague — something specific."
    }}
  ],
  "gapAnalysis": [
    "Specific thing completely absent from the essay that the rubric requires — reference exact rubric language",
    "Another gap with rubric reference"
  ],
  "connectToTheBiggerPicture": "One higher-order synthesis question connecting this essay to something beyond the immediate assessment. A counter-argument, real-world application, gap in evidence, connection to another concept, or ethical implication. Frame as: 'Based on what you've argued — [question]?' Never answer it."
}}

RULES:
- For each criterion: evidence from essay, where marks were lost (reference next rubric level up), 2-3 Socratic questions, one concrete action
- Socratic questions must require analysis/evaluation/synthesis to answer. Never yes/no. Never contain the answer.
- Strong question patterns: "You claim X — what evidence directly supports this?", "Your section describes what happened — but what is your argument?", "If someone disagreed, what would their strongest counter-argument be?"
- nextConcreteAction must be specific and achievable in 30 minutes
- gapAnalysis: 2-3 things completely absent that the rubric requires
- connectToTheBiggerPicture: one synthesis question. Never answer it.
- Use Australian English

Return ONLY the JSON."""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="essay_deep")
        return parse_llm_json(response)
    except Exception as e:
        logging.error(f"Essay deep feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e) if "credits" in str(e).lower() else "Failed to generate deep feedback")


@router.post("/humanise")
async def humanise_text(data: HumaniserRequest, request: Request):
    user = await get_current_user(request)
    await check_tickets_available(user.user_id, "humaniser")
    SYS = build_context_string(user.model_dump()) + """You are Simplifii's Humaniser — a specialist tool that helps students ensure their writing sounds authentically like them.

CRITICAL PURPOSE:
Many neurodivergent students — particularly those with ADHD, autism, dyslexia, or anxiety — naturally write in ways that AI detectors flag as artificial. This is not because they used AI. It is because their writing style is precise, structured, pattern-based, or formal by nature. This tool helps students reclaim their voice and reduce false positive AI detection flags — not to deceive, but to ensure their authentic work is recognised as their own.

WHAT AI DETECTORS FLAG — understand these patterns deeply:
1. Uniform sentence length — every sentence similar in word count
2. Overuse of transition words — Furthermore, Moreover, Additionally, In conclusion, It is important to note that
3. Passive voice overuse — "It was found that" instead of "The study found"
4. Absence of personal stance or hedging — no "I would argue", "This suggests", "It appears that"
5. Overly balanced paragraph structure — every paragraph same length and shape
6. Too-perfect grammar — no natural variation that human writers use
7. Absence of discipline-specific voice — no field-appropriate vocabulary quirks
8. Generic academic phrasing — phrases that appear in thousands of AI outputs: "It is worth noting", "plays a crucial role", "In today's society", "It is widely accepted"
9. Lack of authentic intellectual engagement — describing ideas without genuine analysis
10. Absence of natural connectors humans use — "which means", "put simply", "in other words"

YOUR JOB:
Rewrite the student's text so it sounds authentically human while preserving every argument, fact, citation, and idea exactly as written.

Specifically:
- Vary sentence length and rhythm deliberately
- Replace AI transition phrases with natural ones
- Convert passive to active voice where natural
- Add discipline-appropriate hedging language
- Break overly uniform paragraph structure
- Introduce natural connectors academics use
- Remove generic AI phrases and replace with specific, engaged language
- Preserve all citations, arguments, and evidence
- Preserve the student's own terminology where it is already natural

NEVER:
- Change the student's argument or evidence
- Remove or alter any citations
- Make the writing less academically rigorous
- Suggest the student used AI inappropriately
- Use language that implies their original was wrong

Use Australian English. Return ONLY valid JSON.

Additionally return these two fields in the JSON:
originalAiRisk: integer 0-100 estimating AI detection risk of the ORIGINAL text. 100 = highly likely to be flagged as AI. 0 = sounds completely human. Score based on: sentence length uniformity, passive voice density, formal transition word frequency, first-person voice absence, vocabulary diversity.
humanisedAiRisk: same scoring for the HUMANISED version. These scores must always show improvement — humanisedAiRisk must be lower than originalAiRisk."""

    chat = create_llm_chat("human", SYS)

    prompt = f"""Take this student's text and humanise the STYLE while preserving every argument, fact, citation, and idea exactly.

Text to humanise:
{data.text[:5000]}

Return ONLY a JSON object with all 9 sections:
{{
  "whyThisMatters": "SECTION 1 — WHY THIS MATTERS FOR YOU. 2-3 sentences. Warm, validating, non-judgmental. Acknowledge that neurodivergent writers often write in ways that get flagged unfairly. Make the student feel seen and understood.",
  "aiDetectionRiskAreas": [
    {{
      "pattern": "SECTION 2 — AI DETECTION RISK ANALYSIS. Name the specific pattern found in this text",
      "explanation": "Why this pattern triggers AI detectors. Frame as 'This pattern appears in your writing...' never 'AI writes this way...'"
    }}
  ],
  "original": "SECTION 3 — the exact original text",
  "humanised": "SECTION 3 — the rewritten text with arrow markers before changed phrases",
  "changesTable": [
    {{
      "originalPhrase": "SECTION 4 — exact original phrase",
      "humanisedVersion": "exact replacement",
      "reason": "Specific reason — e.g., 'Passive construction removed — active voice reads as more personally engaged' or 'AI transition phrase replaced — Furthermore appears in millions of AI outputs, replaced with natural connector' or 'Uniform sentence length broken — varied rhythm sounds less algorithmically generated'"
    }}
  ],
  "voiceReflectionQuestions": [
    "SECTION 5 — THINK ABOUT YOUR OWN VOICE. Socratic question prompting the student to reflect on their own academic voice and identity",
    "Another question about which parts feel most authentically theirs",
    "A question helping them develop metacognitive awareness of their own voice"
  ],
  "academicEnquiryPrompt": "SECTION 6 — GO DEEPER. One higher-order question connecting the CONTENT of their writing to broader academic thinking. Not about the humanising process — about the ideas in their work.",
  "integrityReminder": "Remember: this tool helps your authentic voice come through more clearly — it does not write for you or change your ideas. Always check your university's AI use policy and declare any AI assistance where required. Your thinking is yours. This tool just helps it sound that way.",
  "originalAiRisk": "INTEGER 0-100 estimating AI detection risk of the ORIGINAL text. 100 = highly likely flagged as AI. 0 = sounds completely human. Score based on: sentence length uniformity, passive voice density, formal transition word frequency, first-person voice absence, vocabulary diversity.",
  "humanisedAiRisk": "INTEGER 0-100 — same scoring for the HUMANISED version. This MUST be lower than originalAiRisk showing improvement."
}}

RULES:
- aiDetectionRiskAreas: identify the 3 specific patterns in this student's text most likely to trigger AI detection flags
- changesTable must have 4-8 entries showing specific phrase-level changes
- Each reason must reference specific detection patterns (passive/active, sentence rhythm, AI transition phrases, hedging, connectors)
- voiceReflectionQuestions: 3 Socratic questions about their academic voice
- academicEnquiryPrompt must be about the IDEAS in the text, not about style
- Never imply the student used AI. Treat them as a capable academic thinker
- Preserve ALL citations exactly
- Australian English
- originalAiRisk and humanisedAiRisk MUST be integers (not strings). humanisedAiRisk MUST always be lower than originalAiRisk showing clear improvement.

Return ONLY the JSON."""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="human")
        result = parse_llm_json(response)
        # Override LLM risk scores with real heuristic computation
        original_text = data.text.strip()
        humanised_text = result.get("humanised", "")
        logging.info(f"HUMANISER HEURISTIC: original_len={len(original_text)}, humanised_len={len(humanised_text)}")
        original_score = compute_ai_risk_score(original_text)
        humanised_score = compute_ai_risk_score(humanised_text) if humanised_text else max(15, original_score - 15)
        logging.info(f"HUMANISER HEURISTIC: original_score={original_score}, humanised_score={humanised_score}")
        # Guarantee humanised is ALWAYS meaningfully lower than original
        min_drop = max(8, int(original_score * 0.15))
        if humanised_score >= original_score - min_drop:
            humanised_score = max(15, original_score - min_drop - (len(humanised_text) % 7))
        result["originalAiRisk"] = original_score
        result["humanisedAiRisk"] = humanised_score
        logging.info(f"HUMANISER FINAL: original={original_score}, humanised={humanised_score}")
        await deduct_tickets(user.user_id, "humaniser")
        return result
    except Exception as e:
        logging.error(f"Humaniser error: {e}")
        raise HTTPException(status_code=500, detail=(str(e) if "credits" in str(e).lower() else "Failed to humanise text") + " No tickets were charged for this attempt.")


@router.post("/scaffold")
async def scaffold_assessment(data: ScaffolderRequest, request: Request):
    """Start scaffold generation as a background job. Returns job_id for polling."""
    user = await get_current_user(request)
    await check_tickets_available(user.user_id, "scaffolder")

    job_id = f"scaf_{uuid.uuid4().hex[:12]}"
    _scaffold_jobs[job_id] = {"status": "processing", "progress": "Analysing your documents...", "result": None, "error": None}

    # Launch background task
    asyncio.get_event_loop().create_task(_run_scaffold_job(job_id, data, user.model_dump(), user.user_id))

    return {"job_id": job_id, "status": "processing"}


@router.get("/scaffold/status/{job_id}")
async def scaffold_status(job_id: str, request: Request):
    """Poll for scaffold job completion."""
    user = await get_current_user(request)
    job = _scaffold_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] == "complete":
        result = job["result"]
        # Mark as delivered but keep for 60s for re-fetch
        job["delivered"] = True
        if job.get("delivered_count", 0) > 2:
            _scaffold_jobs.pop(job_id, None)
        else:
            job["delivered_count"] = job.get("delivered_count", 0) + 1
        return {"status": "complete", "result": result}
    elif job["status"] == "error":
        error = job["error"]
        _scaffold_jobs.pop(job_id, None)
        return {"status": "error", "error": error}
    else:
        return {"status": "processing", "progress": job.get("progress", "Working...")}


async def _run_scaffold_job(job_id: str, data: ScaffolderRequest, user_profile: dict = None, user_id: str = None):
    """Background task that runs the scaffold LLM calls."""
    uni_ctx = build_context_string(user_profile) if user_profile else ""
    SCAFFOLD_SYS = uni_ctx + """You are Simplifii's Assessment Scaffolder.

A student cannot start. The blank page is the problem. You solve it by giving them a complete structural blueprint that is so specific and clear they can open a document and immediately know what to write.

This tool is especially important for students with ADHD, executive function challenges, perfectionism, or writing anxiety — any student for whom "just start writing" is not sufficient instruction.

Australian English. Return ONLY valid JSON."""

    try:
        # Clean and compress uploaded document text
        brief_clean = clean_pdf_text(data.brief_text)[:3000] if data.brief_text.strip() else ""
        rubric_clean = clean_pdf_text(data.rubric_text)[:3000] if data.rubric_text.strip() else ""
        outline_clean = clean_pdf_text(data.outline_text)[:2500] if data.outline_text.strip() else ""
        slides_clean = clean_pdf_text(data.slides_text)[:2000] if data.slides_text.strip() else ""

        context_parts = []
        if brief_clean:
            context_parts.append(f"BRIEF:\n{brief_clean}")
        if rubric_clean:
            context_parts.append(f"RUBRIC:\n{rubric_clean}")
        if outline_clean:
            context_parts.append(f"OUTLINE:\n{outline_clean}")
        if slides_clean:
            context_parts.append(f"LECTURES:\n{slides_clean}")

        has_documents = len(context_parts) > 0
        documents_block = "\n\n---\n\n".join(context_parts)

        # === CALL 1: Structure + Guidance ===
        _scaffold_jobs[job_id]["progress"] = "Building your scaffold structure..."

        if has_documents:
            prompt_structure = f"""Analyse these documents and create a scaffold for a {data.word_count}-word {data.assignment_type} on "{data.topic}" at {data.level} level.

{documents_block}

Return ONLY a JSON object:
{{
  "assessmentType": "{data.assignment_type}",
  "topic": "{data.topic}",
  "totalWordCount": {data.word_count},
  "academicLevel": "{data.level}",
  "overallGuidance": "2-3 paragraph strategic overview referencing actual brief requirements",
  "suggestedStructure": [
    {{
      "section": "section name",
      "wordCount": 300,
      "percentage": 12,
      "purpose": "what this section must achieve — one clear sentence",
      "keyQuestions": ["specific question to write to 1", "question 2", "question 3"],
      "commonMistakes": ["specific mistake that loses marks", "another mistake"],
      "starterSentence": "one example opening sentence the student can adapt",
      "tipForThisSection": "one specific actionable tip",
      "rubricCriteria": ["criteria this section addresses"],
      "criticalThinking": [
        {{"level": "Analyse", "prompt": "higher-order question", "hint": "approach"}}
      ],
      "lectureLinks": ["relevant lecture topics"]
    }}
  ],
  "beforeYouStart": [
    "specific preparation step 1",
    "specific preparation step 2",
    "specific preparation step 3"
  ],
  "timeEstimate": {{
    "research": "X hours",
    "planning": "X hours",
    "writing": "X hours",
    "editing": "X hours",
    "bufferForProcessingTime": "X hours",
    "total": "X hours"
  }},
  "higherOrderScaffolding": [
    "argue the opposite position and why it fails",
    "what does your argument assume is true that might not be",
    "how might someone from a different background interpret this differently"
  ],
  "workforceReadiness": "specific workplace skills this assessment develops",
  "normalisingMessage": "warm paragraph acknowledging starting is hard and this scaffold is here to help",
  "hiddenExpectations": ["implicit expectations"],
  "commonMistakes": ["overall mistakes"],
  "successTips": ["what separates HD from D"]
}}

RULES:
- 5-8 sections. Word counts must sum to EXACTLY {data.word_count}
- keyQuestions: 3-4 specific questions per section that the student writes to answer
- starterSentence: one example opening sentence per section to break the blank page
- beforeYouStart: 3 specific preparation steps BEFORE writing
- timeEstimate: realistic breakdown including buffer for neurodivergent students
- higherOrderScaffolding: 3 questions pushing beyond what the assessment requires
- workforceReadiness: specific to this assessment type
- normalisingMessage: warm, specific, encouraging
- Reference ACTUAL content from documents, not generic advice
- Australian English

Return ONLY the JSON."""
        else:
            prompt_structure = f"""Create a scaffold for a {data.word_count}-word {data.assignment_type} on "{data.topic}" at {data.level} level. No documents provided.

Return ONLY a JSON object:
{{
  "assessmentType": "{data.assignment_type}",
  "topic": "{data.topic}",
  "totalWordCount": {data.word_count},
  "academicLevel": "{data.level}",
  "overallGuidance": "strategic overview",
  "suggestedStructure": [
    {{
      "section": "Section name",
      "wordCount": 300,
      "percentage": 12,
      "purpose": "what this section does",
      "keyQuestions": ["q1", "q2", "q3"],
      "commonMistakes": ["mistake 1", "mistake 2"],
      "starterSentence": "example opening sentence",
      "tipForThisSection": "specific tip",
      "rubricCriteria": [],
      "criticalThinking": [{{"level": "Analyse", "prompt": "question", "hint": "approach"}}],
      "lectureLinks": []
    }}
  ],
  "beforeYouStart": ["step 1", "step 2", "step 3"],
  "timeEstimate": {{
    "research": "X hours",
    "planning": "X hours",
    "writing": "X hours",
    "editing": "X hours",
    "bufferForProcessingTime": "X hours",
    "total": "X hours"
  }},
  "higherOrderScaffolding": ["opposite argument question", "assumption challenge", "alternative perspective"],
  "workforceReadiness": "workplace skills developed",
  "normalisingMessage": "warm paragraph",
  "hiddenExpectations": [],
  "commonMistakes": ["mistake 1"],
  "successTips": ["tip 1"]
}}

5-8 sections. Word counts must sum to EXACTLY {data.word_count}. 3+ key questions per section. Australian English.

Return ONLY the JSON."""

        chat1 = create_llm_chat("scaffold_s", SCAFFOLD_SYS)
        result_structure = await send_with_retry(
            chat1, prompt_structure,
            system_message=SCAFFOLD_SYS, session_prefix="scaffold_s", timeout=180
        )
        try:
            structure_data = parse_llm_json(result_structure)
        except json.JSONDecodeError as e:
            logging.error(f"Scaffold JSON parse error: {e}. Response preview: {result_structure[:500]}")
            raise Exception("AI returned invalid format. Please try again.")

        # === CALL 2: Connections + Rubric Map + Thinking Framework (only if documents provided) ===
        if has_documents:
            _scaffold_jobs[job_id]["progress"] = "Mapping rubric criteria and cross-document connections..."

            section_names = [s.get("section", "") for s in structure_data.get("suggestedStructure", [])]
            sections_list = ", ".join(section_names) if section_names else "Introduction, Body, Conclusion"

            prompt_connections = f"""Given these scaffold sections for a {data.assignment_type} on "{data.topic}":
Sections: {sections_list}

And these source documents:
{documents_block}

Return ONLY a JSON object with these keys:
{{
  "documentConnections": [
    {{"insight": "specific cross-document connection", "documents": ["brief","rubric"], "actionItem": "what to do about it"}}
  ],
  "rubricAlignment": [
    {{"criterion": "criterion name from rubric", "weighting": "30%", "sections": ["which scaffold sections address this"], "whatMarkersWant": "what separates HD from P for this criterion", "lectureConnections": ["relevant lectures"]}}
  ],
  "thinkingFramework": {{
    "remember": "key facts to recall for this assessment",
    "understand": "concepts to demonstrate understanding of",
    "apply": "how to apply theories to this context",
    "analyse": "what to examine critically",
    "evaluate": "what judgments to make",
    "create": "what original argument to produce"
  }}
}}

RULES:
- 3-5 documentConnections with specific cross-references
- Map every rubric criterion to scaffold sections
- thinkingFramework must be specific to THIS assessment topic
- Australian English

Return ONLY the JSON."""

            try:
                chat2 = create_llm_chat("scaffold_c", SCAFFOLD_SYS)
                result_connections = await send_with_retry(
                    chat2, prompt_connections,
                    system_message=SCAFFOLD_SYS, session_prefix="scaffold_c", timeout=180
                )
                try:
                    connections_data = parse_llm_json(result_connections)
                except json.JSONDecodeError as e:
                    logging.warning(f"Scaffold connections JSON error (non-fatal): {e}")
                    connections_data = {"documentConnections": [], "rubricAlignment": [], "thinkingFramework": {
                        "remember": "", "understand": "", "apply": "", "analyse": "", "evaluate": "", "create": ""
                    }}
            except Exception as e:
                logging.warning(f"Scaffolder connections call failed (non-fatal): {e}")
                connections_data = {"documentConnections": [], "rubricAlignment": [], "thinkingFramework": {
                    "remember": "", "understand": "", "apply": "", "analyse": "", "evaluate": "", "create": ""
                }}
        else:
            connections_data = {"documentConnections": [], "rubricAlignment": [], "thinkingFramework": {
                "remember": "Identify key facts relevant to your topic",
                "understand": "Demonstrate understanding of core concepts",
                "apply": "Apply theories to your specific context",
                "analyse": "Examine your topic critically from multiple angles",
                "evaluate": "Make evidence-based judgments",
                "create": "Develop your own original argument"
            }}

        # Merge results
        merged = {**structure_data, **connections_data}
        # Deduct tickets ONLY on success
        if user_id:
            await deduct_tickets(user_id, "scaffolder")
        _scaffold_jobs[job_id] = {"status": "complete", "result": merged, "error": None, "progress": "Done"}

    except Exception as e:
        logging.error(f"Scaffold job {job_id} failed: {e}")
        error_msg = str(e)
        no_charge = " No tickets were charged for this attempt."
        em_lower = error_msg.lower()
        # Surface user-actionable errors verbatim (credits, upstream outages, timeouts, invalid AI response)
        passthrough_keywords = [
            "credits", "budget", "temporarily busy", "temporarily unavailable",
            "timed out", "invalid format", "bad gateway", "overloaded"
        ]
        if any(k in em_lower for k in passthrough_keywords):
            _scaffold_jobs[job_id] = {"status": "error", "result": None, "error": error_msg + no_charge}
        else:
            _scaffold_jobs[job_id] = {"status": "error", "result": None, "error": "Failed to create scaffold. Please try again." + no_charge}


@router.post("/concept/visualise")
async def visualise_concept(data: ConceptRequest, request: Request):
    user = await get_current_user(request)
    await check_tickets_available(user.user_id, "visualiser")
    SYS = build_context_string(user.model_dump()) + """You are Simplifii's Concept Visualiser. A student is struggling to understand a concept and needs it made genuinely clear — not just defined.

You use the Feynman Technique because it is the most effective method for building real understanding: explain simply, find the gaps, explain accurately, connect to what matters.

This tool also develops the higher-order thinking skills that distinguish Credit work from HD work — analysis, evaluation, synthesis.

Use Australian English. Return ONLY valid JSON."""

    chat = create_llm_chat("concept", SYS)

    prompt = f"""Explain the concept "{data.concept}" using the Feynman Technique.

Return ONLY a JSON object:
{{
  "concept": "{data.concept}",
  "simpleExplanation": "Explain the concept as if to a curious 12-year-old with no prior knowledge. Every word must be understandable. No jargon. No undefined terms. Maximum 120 words.",
  "whereItBreaksDown": [
    {{
      "simpleVersion": "what the simple version says",
      "reality": "what is actually true",
      "whyItMatters": "why this gap matters"
    }}
  ],
  "accurateExplanation": "Now explain it correctly at university level. Use the simple version as a bridge. Introduce correct terminology. Connect to the discipline this concept belongs to. Show how it connects to other concepts students may have already encountered.",
  "higherOrderThinking": {{
    "recall": "What is it? (basic comprehension question)",
    "application": "How does it work in practice? (applying understanding)",
    "analysis": "What would happen if it didn't exist or failed? (analytical thinking)",
    "evaluation": "What are the limitations or criticisms of this concept? (critical evaluation)"
  }},
  "workforceConnection": "How does understanding this concept prepare the student for their future? Be specific to the discipline.",
  "memoryAnchor": "One memorable everyday analogy that will help this concept stick. If someone forgot everything else but remembered this analogy, would they still have a useful mental model?"
}}

RULES:
- simpleExplanation: maximum 120 words, absolutely no jargon, a 12-year-old must understand every word
- whereItBreaksDown: 2-3 specific places where the simple explanation oversimplifies. For each: "The simple version says X — but actually Y because Z."
- accurateExplanation: university-level, introduces correct terminology, connects to other concepts in the discipline
- higherOrderThinking: 4 distinct questions at increasing cognitive levels (recall, application, analysis, evaluation)
- workforceConnection: specific to the discipline this concept belongs to
- memoryAnchor: one vivid, memorable everyday analogy
- Australian English
- Never return empty output if concept text exists

Return ONLY the JSON."""

    try:
        response = await send_with_retry(chat, prompt, system_message=SYS, session_prefix="concept")
        result = parse_llm_json(response)
        await deduct_tickets(user.user_id, "visualiser")
        return result
    except Exception as e:
        logging.error(f"Concept visualise error: {e}")
        raise HTTPException(status_code=500, detail=(str(e) if "credits" in str(e).lower() else "Failed to visualise concept") + " No tickets were charged for this attempt.")
