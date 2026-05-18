from fastapi import APIRouter, Request
from datetime import datetime, timezone, timedelta

from database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api")


@router.get("/digest/weekly")
async def get_weekly_digest(request: Request):
    """Get weekly summary of user's activity and progress"""
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    week_ago_str = week_ago.isoformat()

    # Briefs created this week
    briefs = await db.brief_history.find(
        {"user_id": user.user_id},
        {"_id": 0, "brief_id": 1, "assessment_title": 1, "assessment_type": 1, "progress": 1, "output_json": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)

    new_briefs_this_week = []
    all_briefs_progress = []
    for b in briefs:
        created = b.get("created_at", "")
        if isinstance(created, str) and created >= week_ago_str:
            new_briefs_this_week.append({
                "title": b.get("assessment_title", "Untitled"),
                "type": b.get("assessment_type", ""),
            })

        # Calculate progress for all briefs
        output = b.get("output_json", {})
        progress = b.get("progress", {})
        weeks = output.get("weeks", [])
        weekly_plan = output.get("weeklyPlan", {})
        if weeks:
            total = sum(len(w.get("beginning", [])) + len(w.get("throughout", [])) + len(w.get("end", [])) for w in weeks)
        else:
            total = sum(len(tasks) for tasks in weekly_plan.values())
        completed = sum(1 for v in progress.values() if v)
        pct = round(completed / total * 100) if total > 0 else 0
        all_briefs_progress.append({
            "title": b.get("assessment_title", "Untitled"),
            "brief_id": b.get("brief_id"),
            "progress_pct": pct,
            "tasks_done": completed,
            "tasks_total": total,
        })

    # Checkins this week
    checkins = await db.checkins.find(
        {"user_id": user.user_id},
        {"_id": 0, "mood": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(100)

    week_checkins = []
    mood_counts = {"great": 0, "okay": 0, "struggling": 0, "overwhelmed": 0}
    for ci in checkins:
        created = ci.get("created_at", "")
        if isinstance(created, str) and created >= week_ago_str:
            week_checkins.append(ci)
            mood = ci.get("mood", "okay")
            if mood in mood_counts:
                mood_counts[mood] += 1

    # Dominant mood
    dominant_mood = max(mood_counts, key=mood_counts.get) if any(mood_counts.values()) else None

    # Streak data
    from datetime import date as date_type
    checkin_dates = set()
    for ci in checkins:
        ts = ci.get("created_at", "")
        if isinstance(ts, str) and ts:
            try:
                checkin_dates.add(datetime.fromisoformat(ts).date())
            except (ValueError, TypeError):
                pass

    today = now.date()
    checked_in_today = today in checkin_dates
    current_streak = 0
    check_date = today if checked_in_today else today - timedelta(days=1)
    while check_date in checkin_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Total tasks completed across all briefs
    total_tasks_done = sum(b["tasks_done"] for b in all_briefs_progress)
    total_tasks = sum(b["tasks_total"] for b in all_briefs_progress)

    # Motivational message
    if total_tasks_done > 10:
        message = "Incredible week! You're absolutely smashing it. Keep this energy going."
    elif total_tasks_done > 5:
        message = "Solid progress this week. You're building great momentum."
    elif total_tasks_done > 0:
        message = "Every step counts. You showed up and that matters."
    else:
        message = "New week, fresh start. Pick one small task and let's go."

    return {
        "period": f"{week_ago.strftime('%d %b')} — {now.strftime('%d %b %Y')}",
        "new_briefs": new_briefs_this_week,
        "briefs_progress": all_briefs_progress,
        "checkins_count": len(week_checkins),
        "mood_summary": mood_counts,
        "dominant_mood": dominant_mood,
        "current_streak": current_streak,
        "tasks_completed_this_week": total_tasks_done,
        "total_tasks": total_tasks,
        "motivational_message": message,
    }
