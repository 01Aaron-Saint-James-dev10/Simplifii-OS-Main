from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone

from database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api")


@router.get("/share/card/{brief_id}")
async def get_share_card_data(brief_id: str, request: Request):
    """Generate data for a shareable progress card"""
    user = await get_current_user(request)
    brief = await db.brief_history.find_one(
        {"brief_id": brief_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    output = brief.get("output_json", {})
    progress = brief.get("progress", {})
    weeks = output.get("weeks", [])
    weekly_plan = output.get("weeklyPlan", {})
    if weeks:
        total = sum(len(w.get("beginning", [])) + len(w.get("throughout", [])) + len(w.get("end", [])) for w in weeks)
    else:
        total = sum(len(tasks) for tasks in weekly_plan.values())
    completed = sum(1 for v in progress.values() if v)
    pct = round(completed / total * 100) if total > 0 else 0

    badges = []
    if pct == 100:
        badges.append({"name": "Completed", "icon": "trophy", "colour": "emerald"})
    if pct >= 50:
        badges.append({"name": "Halfway Hero", "icon": "star", "colour": "amber"})
    if completed >= 10:
        badges.append({"name": "Task Machine", "icon": "zap", "colour": "cyan"})

    return {
        "title": brief.get("assessment_title", "Assessment"),
        "type": brief.get("assessment_type", ""),
        "progress_pct": pct,
        "tasks_done": completed,
        "tasks_total": total,
        "badges": badges,
        "student_name": user.name.split(" ")[0],
        "share_text": f"I'm {pct}% through my {brief.get('assessment_type', 'assessment')} plan on Simplifii-B! {completed}/{total} tasks done.",
    }
