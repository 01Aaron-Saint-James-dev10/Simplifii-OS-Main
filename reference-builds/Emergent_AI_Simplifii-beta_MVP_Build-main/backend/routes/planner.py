from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List
from emergentintegrations.llm.chat import UserMessage
from datetime import datetime, timezone, timedelta
import uuid
import io
import json
import asyncio
import logging

from database import db
from utils.auth import get_current_user
from utils.pdf import extract_text_from_pdf
from utils.llm import create_llm_chat, parse_llm_json, send_with_retry, clean_pdf_text
from utils.tickets import check_and_deduct_tickets, refund_tickets
from utils.university_context import build_context_string

router = APIRouter(prefix="/api")

# In-memory job store for planner extraction/generation
_planner_jobs = {}

EXTRACT_SYS = """You are a document data extractor. You extract ONLY information that is explicitly written in the provided documents. You NEVER invent, fabricate, or assume any data. If a document does not contain course information, return empty arrays. Return ONLY valid JSON."""


@router.post("/course-planner/extract")
async def extract_course_data(request: Request, files: List[UploadFile] = File(...)):
    """Phase 1: Extract all academic data from uploaded documents."""
    user = await get_current_user(request)
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed")

    await check_and_deduct_tickets(user.user_id, "course-planner")

    all_texts = []
    filenames = []
    for file in files:
        content = await file.read()
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            text = content.decode('utf-8', errors='ignore')
        cleaned = clean_pdf_text(text)
        if cleaned.strip():
            all_texts.append({"filename": file.filename, "text": cleaned})
            filenames.append(file.filename)

    if not all_texts:
        raise HTTPException(status_code=400, detail="We couldn't extract course information from your document. Please check you've uploaded a course outline and try again.")

    job_id = f"plan_{uuid.uuid4().hex[:12]}"
    _planner_jobs[job_id] = {
        "status": "processing",
        "progress": "Reading your documents...",
        "result": None,
        "error": None
    }

    asyncio.get_event_loop().create_task(_run_extraction(job_id, all_texts, user.user_id))
    return {"job_id": job_id, "status": "processing", "files_accepted": filenames}


@router.get("/course-planner/extract/status/{job_id}")
async def extraction_status(job_id: str, request: Request):
    user = await get_current_user(request)
    job = _planner_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] == "complete":
        result = job["result"]
        job["delivered_count"] = job.get("delivered_count", 0) + 1
        if job["delivered_count"] > 2:
            _planner_jobs.pop(job_id, None)
        return {"status": "complete", "result": result}
    elif job["status"] == "error":
        error = job["error"]
        _planner_jobs.pop(job_id, None)
        return {"status": "error", "error": error}
    else:
        return {"status": "processing", "progress": job.get("progress", "Working...")}


async def _run_extraction(job_id: str, doc_texts: list, user_id: str):
    """Background task: extract all academic data from documents."""
    try:
        combined_context = ""
        for i, doc in enumerate(doc_texts):
            # Use up to 8000 chars per file to capture full assessment schedules
            # that often appear in the second half of course outlines
            doc_text = doc["text"][:8000]
            combined_context += f"\n\n=== DOCUMENT {i+1}: {doc['filename']} ===\n{doc_text}"

        logging.info(f"Planner extraction: {len(doc_texts)} file(s), {len(combined_context)} chars total")

        _planner_jobs[job_id]["progress"] = "Extracting assessments, dates, and classes..."

        prompt = f"""Extract academic data from ALL of the documents below. There are {len(doc_texts)} document(s). You must extract assessments from EVERY document, not just the first.

CRITICAL RULE: Extract ONLY what is explicitly written in these documents. Do NOT invent, fabricate, generate, or assume ANY data. If the document does not contain assessable items, return empty arrays.

{combined_context}

Return ONLY a JSON object with this exact structure:
{{
  "assessments": [
    {{
      "assessment_title": "exact name from document",
      "course_code": "exact code from document or Not stated in document",
      "course_name": "exact name from document or Not stated in document",
      "university": "exact name from document or Not stated in document",
      "due_date": "exactly as written in document or Not stated in document",
      "week_number": null,
      "weighting": "exactly as written or Not stated in document",
      "assessment_type": "essay/report/exam/quiz/presentation/lab/reflection/portfolio/participation/group/other",
      "is_ongoing": false,
      "is_group_work": false,
      "submission_format": "exactly as written or Not stated in document",
      "notes": "any additional context from the document"
    }}
  ],
  "scheduled_classes": [
    {{
      "class_type": "Lecture/Tutorial/Lab/Workshop/Online",
      "course_code": "exact course code or Not stated in document",
      "day_of_week": "Monday/Tuesday/etc or Not stated in document",
      "time": "time range or Not stated in document",
      "duration": "duration or Not stated in document",
      "location": "location or Not stated in document",
      "frequency": "Weekly/Fortnightly/Once-off or Not stated in document",
      "attendance_required": true,
      "week_range": "e.g. Weeks 1-13 or Weeks 2-6 or Not stated in document",
      "notes": ""
    }}
  ],
  "important_dates": [
    {{
      "event": "event name exactly as written",
      "date": "date exactly as written or Not stated in document",
      "week_number": null,
      "notes": ""
    }}
  ],
  "document_intelligence": {{
    "semester_start": "detected start date or Not stated in document",
    "semester_end": "detected end date or Not stated in document",
    "total_weeks": null,
    "university": "detected university name or Not stated in document",
    "term_label": "detected term label or Not stated in document",
    "needs_semester_start_confirmation": true
  }}
}}

RULES:
- Process ALL {len(doc_texts)} documents. Merge all assessments into ONE assessments array.
- Every value you return MUST come directly from the document text above
- If a field cannot be found in the document, write "Not stated in document" — never leave it blank or null for string fields
- If the document contains NO assessments, return an empty assessments array []
- Do NOT generate example, sample, or placeholder data under any circumstances
- due_date: Copy the date EXACTLY as written. Dates may appear in any format: "Week 7", "Monday Week 4", "17 October", "Oct 17", "17/10/2025", "end of Week 5", "Friday Week 5 5pm", "Due date: TBA". Copy whatever the document says.
- week_number: Set as integer only if explicitly stated or clearly calculable (e.g. "Week 5" = 5). Otherwise null.
- Set is_ongoing=true only if the document explicitly states it spans multiple weeks
- Set is_group_work=true only if the document explicitly mentions group/team/collaborative
- Set needs_semester_start_confirmation=true unless an exact start date appears in the document

Return ONLY the JSON."""

        chat = create_llm_chat("plan_ext", EXTRACT_SYS)
        response = await send_with_retry(
            chat, prompt,
            system_message=EXTRACT_SYS, session_prefix="plan_ext", timeout=180
        )

        try:
            extraction = parse_llm_json(response)
        except json.JSONDecodeError as e:
            logging.error(f"Planner extraction JSON error: {e}. Response: {response[:500]}")
            raise Exception("AI returned invalid format. Please try again.")

        if isinstance(extraction, list):
            extraction = extraction[0] if extraction else {}

        # Ensure top-level keys exist (empty arrays, not invented data)
        extraction.setdefault("assessments", [])
        extraction.setdefault("scheduled_classes", [])
        extraction.setdefault("important_dates", [])
        extraction.setdefault("document_intelligence", {
            "semester_start": "Not stated in document",
            "semester_end": "Not stated in document",
            "total_weeks": None,
            "university": "Not stated in document",
            "term_label": "Not stated in document",
            "needs_semester_start_confirmation": True
        })

        # Save extraction to DB for Quick Win and future use
        await db.planner_extractions.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "extraction": extraction,
                "source_files": [d["filename"] for d in doc_texts],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )

        _planner_jobs[job_id] = {"status": "complete", "result": extraction, "error": None, "progress": "Done"}

    except Exception as e:
        logging.error(f"Planner extraction job {job_id} failed: {e}")
        # Refund tickets on failure
        await refund_tickets(user_id, "course-planner")
        error_msg = str(e)
        no_charge = " No tickets were charged for this attempt."
        if "credits" in error_msg.lower() or "budget" in error_msg.lower():
            _planner_jobs[job_id] = {"status": "error", "result": None, "error": error_msg + no_charge}
        else:
            _planner_jobs[job_id] = {"status": "error", "result": None, "error": "We couldn't extract course information from your document. Please check you've uploaded a course outline and try again." + no_charge}


@router.post("/course-planner/confirm")
async def confirm_extraction(request: Request):
    """Save confirmed Phase 1 data (possibly edited by student) + semester start date."""
    user = await get_current_user(request)
    body = await request.json()
    extraction = body.get("extraction", {})
    semester_start = body.get("semester_start")

    if semester_start:
        extraction.setdefault("document_intelligence", {})
        extraction["document_intelligence"]["semester_start"] = semester_start
        extraction["document_intelligence"]["needs_semester_start_confirmation"] = False

    await db.planner_extractions.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "user_id": user.user_id,
            "extraction": extraction,
            "semester_start": semester_start,
            "confirmed": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    return {"status": "confirmed"}


@router.post("/course-planner/study-plan")
async def generate_study_plan(request: Request):
    """Generate AI study plan from confirmed extraction data."""
    user = await get_current_user(request)
    body = await request.json()
    assessments = body.get("assessments", [])
    semester_start = body.get("semester_start", "")

    if not assessments:
        raise HTTPException(status_code=400, detail="No assessments to plan around. Upload your documents first.")

    assessment_summary = "\n".join([
        f"- {a.get('assessment_title','?')} ({a.get('course_code','?')}) — {a.get('weighting','?')} — Due: {a.get('due_date','?')}"
        for a in assessments if not a.get("is_ongoing")
    ])

    ongoing_summary = "\n".join([
        f"- {a.get('assessment_title','?')} ({a.get('course_code','?')}) — {a.get('weighting','?')} — Ongoing"
        for a in assessments if a.get("is_ongoing")
    ])

    SYS_PLAN = build_context_string(user.model_dump()) + "You are Simplifii's AI Study Coach — strengths-first, neuroaffirming. You create practical, kind study plans from real assessment data. Australian English. Return ONLY valid JSON."
    prompt = f"""Create a personalised study plan based on these real assessments.
Semester starts: {semester_start or 'Not confirmed'}

UPCOMING ASSESSMENTS:
{assessment_summary or 'None found'}

ONGOING ASSESSMENTS:
{ongoing_summary or 'None found'}

Return ONLY a JSON object:
{{
  "weeklyPlan": [
    {{
      "week": "Week 1",
      "focus": "what to prioritise this week",
      "tasks": ["specific task 1", "specific task 2"],
      "tip": "a kind, practical tip for this week"
    }}
  ],
  "priorityOrder": ["assessment title in order of urgency"],
  "overallAdvice": "2-3 sentences of warm, practical advice for managing this workload"
}}

RULES:
- Use ONLY the real assessments listed above — no placeholder or example courses
- Plan around actual due dates
- Front-load high-weight assessments
- Include buffer weeks before major deadlines
- Be encouraging, not overwhelming
- If only 1-2 assessments, keep the plan short (3-4 weeks)
- If many assessments, plan up to 12 weeks

Return ONLY the JSON."""

    chat = create_llm_chat("studyplan", SYS_PLAN)
    try:
        response = await send_with_retry(
            chat, prompt,
            system_message=SYS_PLAN, session_prefix="studyplan", timeout=60
        )
        result = parse_llm_json(response)
        if not result or not isinstance(result, dict):
            raise ValueError("Empty or invalid study plan response")
        return result
    except Exception as e:
        logging.error(f"Study plan error: {e}")
        # Return a graceful fallback instead of 500
        return {
            "weeklyPlan": [{"week": "This week", "focus": "Start with your most urgent deadline", "tasks": [a.get("assessment_title", "Assessment") + " — begin research" for a in assessments[:3]], "tip": "One step at a time. Start with the assessment due soonest."}],
            "priorityOrder": [a.get("assessment_title", "") for a in sorted(assessments, key=lambda x: x.get("due_date", "z"))[:5]],
            "overallAdvice": "We couldn't generate a full study plan right now, but here's a quick priority list based on your deadlines. Try again shortly for a detailed plan.",
            "_partial": True
        }


@router.post("/course-planner/export-ics")
async def export_ics(request: Request):
    """Export assessments as .ics calendar file."""
    user = await get_current_user(request)
    body = await request.json()
    assessments = body.get("assessments", [])

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Simplifii//Course Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    for a in assessments:
        title = a.get("assessment_title", "Assessment")
        due = a.get("due_date", "")
        course = a.get("course_code", "")
        weight = a.get("weighting", "")
        notes = a.get("notes", "")

        event_uid = f"simplifii-{uuid.uuid4().hex[:8]}@simplifii.com"
        now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        desc = f"Course: {course}. Weighting: {weight}. Due: {due}."
        if notes:
            desc += f" Notes: {notes}"

        ics_lines.extend([
            "BEGIN:VEVENT",
            f"UID:{event_uid}",
            f"DTSTAMP:{now}",
            f"DTSTART:{now}",
            f"SUMMARY:[{course}] {title}",
            f"DESCRIPTION:{desc}",
            "CATEGORIES:Assessment",
            "END:VEVENT",
        ])

    ics_lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(ics_lines)

    return StreamingResponse(
        io.BytesIO(ics_content.encode("utf-8")),
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=simplifii_semester.ics"}
    )


@router.get("/user/quick-win")
async def get_quick_win(request: Request):
    """Recommend the best next tool based on nearest deadline."""
    user = await get_current_user(request)
    planner = await db.planner_extractions.find_one({"user_id": user.user_id}, {"_id": 0})

    if not planner or not planner.get("extraction", {}).get("assessments"):
        return {"has_data": False, "message": "Upload your course outlines in the Course Planner to get personalised recommendations."}

    assessments = planner["extraction"]["assessments"]
    # Find the nearest non-ongoing assessment
    nearest = None
    for a in assessments:
        if a.get("is_ongoing"):
            continue
        if a.get("week_number") is not None:
            if nearest is None or (a["week_number"] < nearest.get("week_number", 999)):
                nearest = a

    if not nearest:
        # Fall back to first non-ongoing assessment
        for a in assessments:
            if not a.get("is_ongoing"):
                nearest = a
                break

    if not nearest:
        return {"has_data": True, "message": "All your assessments are ongoing. Keep up the great work!"}

    atype = (nearest.get("assessment_type", "") or "").lower()
    tool_map = {
        "essay": {"tool": "essay-scorer", "name": "Essay Scorer", "action": "Get strengths-first feedback on your draft"},
        "report": {"tool": "assessment-scaffolder", "name": "Assessment Scaffolder", "action": "Build a scaffold for your report structure"},
        "exam": {"tool": "hidden-curriculum", "name": "Hidden Curriculum Decoder", "action": "Decode what your examiners really want"},
        "test": {"tool": "hidden-curriculum", "name": "Hidden Curriculum Decoder", "action": "Decode what your examiners really want"},
        "quiz": {"tool": "concept-visualiser", "name": "Concept Visualiser", "action": "Visualise key concepts before your quiz"},
        "presentation": {"tool": "assessment-scaffolder", "name": "Assessment Scaffolder", "action": "Scaffold your presentation structure"},
        "lab": {"tool": "rubric-simplifier", "name": "Rubric Simplifier", "action": "Simplify the rubric for your lab report"},
        "reflection": {"tool": "humaniser", "name": "Humaniser", "action": "Make sure your reflective voice shines through"},
    }

    rec = tool_map.get(atype, {"tool": "assessment-scaffolder", "name": "Assessment Scaffolder", "action": "Build a scaffold for your next assessment"})

    return {
        "has_data": True,
        "assessment": nearest.get("assessment_title", "Upcoming Assessment"),
        "course": nearest.get("course_code", ""),
        "due": nearest.get("due_date", ""),
        "weighting": nearest.get("weighting", ""),
        "recommended_tool": rec["tool"],
        "recommended_name": rec["name"],
        "action": rec["action"]
    }
