from fastapi import APIRouter, Request
from emergentintegrations.llm.chat import UserMessage
from datetime import datetime, timezone
import uuid
import logging

from database import db
from models import StudyBuddyMessage, CheckInRequest
from utils.auth import get_current_user
from utils.llm import create_llm_chat, send_with_retry

router = APIRouter(prefix="/api")


@router.post("/study-buddy/chat")
async def study_buddy_chat(data: StudyBuddyMessage, request: Request):
    user = await get_current_user(request)

    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})

    if not user_doc.get("has_purchased", False):
        return {"response": "Study Buddy is unlocked with any ticket purchase. Grab a ticket pack to start chatting with your AI study coach!"}
    university = user_doc.get("university", "")
    neurotype = user_doc.get("preferences", {}).get("neurotype", "")

    recent_briefs = await db.brief_history.find(
        {"user_id": user.user_id},
        {"_id": 0, "assessment_title": 1, "assessment_type": 1}
    ).sort("created_at", -1).to_list(5)
    brief_context = ", ".join([b.get("assessment_title", "") for b in recent_briefs]) if recent_briefs else "No recent assessments"

    llm_key = __import__('os').environ.get("EMERGENT_LLM_KEY")
    from emergentintegrations.llm.chat import LlmChat
    study_buddy_sys = f"""You are Study Buddy, a warm, encouraging AI study coach inside Simplifii. You help university students with their studies.

CONTEXT:
- Student's university: {university or 'Unknown'}
- Student's neurotype: {neurotype or 'Not specified'}
- Recent assessments: {brief_context}

RULES:
- Use Australian English (e.g., organisation, analyse, colour)
- Be warm, encouraging, and non-judgmental
- If the student seems stressed, acknowledge it and offer practical advice
- Break complex advice into small, actionable steps
- Use grade bands: HD (High Distinction), D (Distinction), C (Credit), P (Pass)
- Keep responses concise (2-4 paragraphs max) unless detailed help is requested
- If asked about the app, explain Simplifii's tools
- Never write essays or assignments for the student — guide them instead
- Include a disclaimer if giving academic advice: "Remember to check with your unit coordinator for specific requirements."
- Be positive and celebrate small wins"""

    chat = LlmChat(
        api_key=llm_key,
        session_id=data.session_id,
        system_message=study_buddy_sys
    ).with_model("anthropic", "claude-sonnet-4-20250514")

    try:
        response = await send_with_retry(chat, data.message, system_message=study_buddy_sys, session_prefix="buddy")
        return {"response": response, "session_id": data.session_id}
    except Exception as e:
        logging.error(f"Study Buddy error: {e}")
        return {"response": "I'm having a bit of trouble right now. Try again in a moment?", "session_id": data.session_id}


@router.post("/checkin")
async def submit_checkin(data: CheckInRequest, request: Request):
    user = await get_current_user(request)
    checkin = {
        "checkin_id": f"ci_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "brief_id": data.brief_id,
        "mood": data.mood,
        "note": data.note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.checkins.insert_one(checkin)

    mood_responses = {
        "great": "Awesome! You're doing brilliantly. Keep up the amazing momentum!",
        "okay": "That's perfectly fine! Progress is progress, no matter the pace. You've got this.",
        "struggling": "It's okay to find things tough sometimes. Try focusing on just one small step today. You don't need to do everything at once.",
        "overwhelmed": "Take a deep breath. You're not alone in feeling this way. Let's break things into smaller pieces. What's the ONE thing you could do in the next 15 minutes?"
    }

    return {
        "checkin_id": checkin["checkin_id"],
        "message": mood_responses.get(data.mood, "Thanks for checking in! Keep going."),
        "suggestion": "Try the Interactive mode — it shows you just one task at a time." if data.mood in ["struggling", "overwhelmed"] else None
    }


@router.get("/checkins/{brief_id}")
async def get_checkins(brief_id: str, request: Request):
    user = await get_current_user(request)
    checkins = await db.checkins.find(
        {"user_id": user.user_id, "brief_id": brief_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return {"checkins": checkins}



@router.get("/streak")
async def get_streak(request: Request):
    """Get user's current study streak and stats"""
    user = await get_current_user(request)

    # Get all checkins for this user, sorted by date
    checkins = await db.checkins.find(
        {"user_id": user.user_id},
        {"_id": 0, "created_at": 1}
    ).sort("created_at", -1).to_list(365)

    if not checkins:
        return {"current_streak": 0, "longest_streak": 0, "total_checkins": 0, "checked_in_today": False, "streak_dates": []}

    # Convert to date objects
    from datetime import date
    checkin_dates = set()
    for ci in checkins:
        ts = ci.get("created_at", "")
        if isinstance(ts, str) and ts:
            try:
                dt = datetime.fromisoformat(ts)
                checkin_dates.add(dt.date())
            except (ValueError, TypeError):
                pass
        elif isinstance(ts, datetime):
            checkin_dates.add(ts.date())

    today = datetime.now(timezone.utc).date()
    checked_in_today = today in checkin_dates

    # Calculate current streak
    current_streak = 0
    check_date = today if checked_in_today else today - __import__('datetime').timedelta(days=1)
    while check_date in checkin_dates:
        current_streak += 1
        check_date -= __import__('datetime').timedelta(days=1)

    # Calculate longest streak
    sorted_dates = sorted(checkin_dates)
    longest_streak = 0
    temp_streak = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
    longest_streak = max(longest_streak, temp_streak)

    # Last 14 days for heatmap
    streak_dates = []
    for i in range(13, -1, -1):
        d = today - __import__('datetime').timedelta(days=i)
        streak_dates.append({
            "date": d.isoformat(),
            "active": d in checkin_dates
        })

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_checkins": len(checkin_dates),
        "checked_in_today": checked_in_today,
        "streak_dates": streak_dates
    }
