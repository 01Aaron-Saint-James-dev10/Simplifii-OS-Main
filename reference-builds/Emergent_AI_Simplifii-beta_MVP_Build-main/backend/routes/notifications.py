from fastapi import APIRouter, Request
from datetime import datetime, timezone
import random

from database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api")

TOOL_VERBS = {
    "brief": "simplified a brief for",
    "rubric": "decoded a rubric for",
    "essay": "scored an essay for",
    "humanise": "humanised text for",
    "scaffold": "scaffolded",
    "concept": "visualised a concept in",
    "planner": "planned a semester for",
    "jargon": "decoded jargon for",
}

ANONYMOUS_PREFIXES = [
    "A student", "Someone", "A learner", "A fellow student",
]


@router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    briefs = await db.brief_history.find(
        {"user_id": user.user_id},
        {"_id": 0, "brief_id": 1, "assessment_title": 1, "assessment_type": 1, "output_json": 1, "progress": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(20)

    notifications = []
    seen_titles = set()
    for brief in briefs:
        output = brief.get("output_json", {})
        progress = brief.get("progress", {})
        weeks = output.get("weeks", [])
        weekly_plan = output.get("weeklyPlan", {})
        if weeks:
            total_tasks = sum(len(w.get("beginning", [])) + len(w.get("throughout", [])) + len(w.get("end", [])) for w in weeks)
        else:
            total_tasks = sum(len(tasks) for tasks in weekly_plan.values())
        completed = sum(1 for v in progress.values() if v)
        pct = (completed / total_tasks * 100) if total_tasks > 0 else 0

        # Deduplicate: normalize title by stripping whitespace, case, and OCR artefacts
        raw_title = brief.get("assessment_title", "")
        title_key = ''.join(c for c in raw_title.lower() if c.isalnum() or c == ' ').strip()
        if not title_key or title_key in seen_titles:
            continue
        seen_titles.add(title_key)

        if pct == 0 and total_tasks > 0:
            notifications.append({
                "type": "nudge",
                "priority": "medium",
                "title": f"Haven't started '{brief['assessment_title']}' yet",
                "message": f"You have {total_tasks} tasks waiting. Start with just one — you've got this.",
                "brief_id": brief["brief_id"],
                "progress_pct": 0,
                "icon": "alert"
            })
        elif 0 < pct < 50:
            notifications.append({
                "type": "encouragement",
                "priority": "low",
                "title": f"Keep going on '{brief['assessment_title']}'",
                "message": f"You're {pct:.0f}% done — {completed} of {total_tasks} tasks completed. Almost halfway!",
                "brief_id": brief["brief_id"],
                "progress_pct": pct,
                "icon": "progress"
            })
        elif 50 <= pct < 100:
            notifications.append({
                "type": "celebration",
                "priority": "low",
                "title": f"Over halfway on '{brief['assessment_title']}'!",
                "message": f"Amazing — {pct:.0f}% done! Just {total_tasks - completed} tasks left.",
                "brief_id": brief["brief_id"],
                "progress_pct": pct,
                "icon": "star"
            })
        elif pct == 100:
            notifications.append({
                "type": "complete",
                "priority": "low",
                "title": f"'{brief['assessment_title']}' is all done!",
                "message": "Brilliant work — you completed every task. Time to celebrate.",
                "brief_id": brief["brief_id"],
                "progress_pct": 100,
                "icon": "check"
            })

    if not notifications:
        notifications.append({
            "type": "welcome",
            "priority": "low",
            "title": "Welcome to Simplifii",
            "message": "Upload your first assessment brief to get started with a personalised action plan.",
            "brief_id": None,
            "progress_pct": 0,
            "icon": "wave"
        })

    return {"notifications": notifications[:10]}



@router.get("/activity/feed")
async def get_activity_feed():
    """Public anonymised feed of recent platform activity for social proof"""
    feed_items = []

    # Pull recent briefs from ALL users (anonymised)
    recent_briefs = await db.brief_history.find(
        {},
        {"_id": 0, "assessment_type": 1, "created_at": 1, "user_id": 1, "output_json.assessment": 1}
    ).sort("created_at", -1).limit(15).to_list(15)

    # Get university lookup for users
    user_ids = list(set(b.get("user_id", "") for b in recent_briefs))
    user_docs = {}
    if user_ids:
        users_cursor = db.users.find(
            {"user_id": {"$in": user_ids}},
            {"_id": 0, "user_id": 1, "university": 1}
        )
        async for u in users_cursor:
            user_docs[u["user_id"]] = u.get("university", "")

    for brief in recent_briefs:
        uni = user_docs.get(brief.get("user_id", ""), "")
        a_type = brief.get("assessment_type", "assessment")
        created = brief.get("created_at", "")
        prefix = random.choice(ANONYMOUS_PREFIXES)
        location = f" at {uni}" if uni else ""

        message = f"{prefix}{location} just simplified a {a_type.lower()} brief"
        feed_items.append({
            "message": message,
            "tool": "brief",
            "type": a_type,
            "created_at": created,
        })

    # Pull recent checkins (mood activity)
    recent_checkins = await db.checkins.find(
        {},
        {"_id": 0, "mood": 1, "created_at": 1, "user_id": 1}
    ).sort("created_at", -1).limit(5).to_list(5)

    for ci in recent_checkins:
        uni = user_docs.get(ci.get("user_id", ""), "")
        prefix = random.choice(ANONYMOUS_PREFIXES)
        location = f" at {uni}" if uni else ""
        mood = ci.get("mood", "okay")
        mood_msgs = {
            "great": "is feeling great about their progress",
            "okay": "checked in on their study plan",
            "struggling": "is working through a tough week",
            "overwhelmed": "is taking things one step at a time",
        }
        message = f"{prefix}{location} {mood_msgs.get(mood, 'checked in')}"
        feed_items.append({
            "message": message,
            "tool": "checkin",
            "type": mood,
            "created_at": ci.get("created_at", ""),
        })

    # Sort all by created_at descending
    def sort_key(item):
        ts = item.get("created_at", "")
        if isinstance(ts, str) and ts:
            try:
                return datetime.fromisoformat(ts)
            except (ValueError, TypeError):
                pass
        if isinstance(ts, datetime):
            return ts
        return datetime.min.replace(tzinfo=timezone.utc)

    feed_items.sort(key=sort_key, reverse=True)

    # Convert timestamps to relative strings
    now = datetime.now(timezone.utc)
    for item in feed_items[:12]:
        ts = item.get("created_at", "")
        if isinstance(ts, str) and ts:
            try:
                dt = datetime.fromisoformat(ts)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                diff = now - dt
                mins = int(diff.total_seconds() / 60)
                if mins < 1:
                    item["time_ago"] = "just now"
                elif mins < 60:
                    item["time_ago"] = f"{mins}m ago"
                elif mins < 1440:
                    item["time_ago"] = f"{mins // 60}h ago"
                else:
                    item["time_ago"] = f"{mins // 1440}d ago"
            except (ValueError, TypeError):
                item["time_ago"] = "recently"
        else:
            item["time_ago"] = "recently"

    return {"feed": feed_items[:12]}
