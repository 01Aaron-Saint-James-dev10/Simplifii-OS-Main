from fastapi import APIRouter, Request
from datetime import datetime, timezone
from database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api")


@router.post("/analytics/pathway")
async def log_pathway_event(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    doc = {
        "userId": user.user_id,
        "fromTool": body.get("fromTool", ""),
        "toTool": body.get("toTool", ""),
        "assessmentName": body.get("assessmentName", ""),
        "university": user.university if hasattr(user, 'university') else "",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.tool_pathway_events.insert_one(doc)
    return {"status": "logged"}


@router.post("/analytics/error")
async def log_tool_error(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    doc = {
        "userId": user.user_id,
        "toolName": body.get("toolName", ""),
        "errorType": body.get("errorType", "unknown"),
        "errorMessage": (body.get("errorMessage", ""))[:200],
        "inputType": body.get("inputType", "text"),
        "university": user.university if hasattr(user, 'university') else "",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.tool_errors.insert_one(doc)
    return {"status": "logged"}


@router.post("/analytics/session")
async def log_tool_session(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    doc = {
        "userId": user.user_id,
        "toolName": body.get("toolName", ""),
        "sessionStart": body.get("sessionStart", ""),
        "inputProvided": body.get("inputProvided", False),
        "outputGenerated": body.get("outputGenerated", False),
        "outputViewed": body.get("outputViewed", False),
        "pdfDownloaded": body.get("pdfDownloaded", False),
        "feedbackGiven": body.get("feedbackGiven", False),
        "nextStepClicked": body.get("nextStepClicked", False),
        "sessionEnd": body.get("sessionEnd", ""),
        "sessionDurationSeconds": body.get("sessionDurationSeconds", 0),
        "university": user.university if hasattr(user, 'university') else "",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.tool_sessions.insert_one(doc)
    return {"status": "logged"}


@router.post("/analytics/funnel")
async def log_funnel_event(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    doc = {
        "userId": user.user_id,
        "event": body.get("event", ""),
        "toolName": body.get("toolName", ""),
        "ticketsRemaining": body.get("ticketsRemaining", 0),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.funnel_events.insert_one(doc)
    return {"status": "logged"}


@router.post("/analytics/outcome")
async def log_outcome_report(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    doc = {
        "userId": user.user_id,
        "toolName": body.get("toolName", ""),
        "assessmentName": body.get("assessmentName", ""),
        "outcome": body.get("outcome", ""),
        "daysAfterSession": body.get("daysAfterSession", 0),
        "university": user.university if hasattr(user, 'university') else "",
        "faculty": user.faculty if hasattr(user, 'faculty') else "",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.outcome_reports.insert_one(doc)
    return {"status": "logged"}


@router.post("/analytics/checkin")
async def log_checkin(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    doc = {
        "userId": user.user_id,
        "toolName": body.get("toolName", ""),
        "feeling": body.get("feeling", ""),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.checkins.insert_one(doc)
    return {"status": "logged"}
