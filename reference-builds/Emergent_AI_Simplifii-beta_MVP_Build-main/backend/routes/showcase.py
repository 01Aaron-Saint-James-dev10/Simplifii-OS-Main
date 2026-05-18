from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone
from database import db
from utils.auth import get_current_user
from utils.tickets import is_owner

router = APIRouter(prefix="/api")


@router.get("/showcase/videos")
async def get_showcase_videos():
    """Public endpoint — no auth required."""
    videos = []
    async for doc in db.showcase_videos.find({}, {"_id": 0}).sort("position", 1).limit(6):
        videos.append(doc)
    # Pad to 3 if fewer exist
    while len(videos) < 3:
        idx = len(videos)
        videos.append({
            "id": f"placeholder-{idx}",
            "title": ["How I decoded a 15-page brief in 90 seconds", "Planning my entire semester in one upload", "From a Credit to a Distinction in one draft"][idx] if idx < 3 else f"Video {idx + 1}",
            "description": ["Watch a real student upload their assessment brief and get a complete week-by-week action plan.", "See how Course Planner turns five course outlines into one clear semester timeline.", "Essay Scorer gave feedback that changed everything. Here's the before and after."][idx] if idx < 3 else "Coming soon",
            "duration": ["90 sec", "2 min", "3 min"][idx] if idx < 3 else "TBC",
            "video_url": "",
            "position": idx,
            "placeholder": True,
        })
    return {"videos": videos}


@router.put("/showcase/videos/{video_id}")
async def update_showcase_video(video_id: str, request: Request):
    user = await get_current_user(request)
    if not await is_owner(user.user_id):
        raise HTTPException(status_code=403, detail="Owner only")
    body = await request.json()
    video_url = body.get("video_url", "").strip()
    title = body.get("title", "").strip()
    description = body.get("description", "").strip()
    duration = body.get("duration", "").strip()
    existing = await db.showcase_videos.find_one({"id": video_id})
    if existing:
        update = {}
        if video_url: update["video_url"] = video_url
        if title: update["title"] = title
        if description: update["description"] = description
        if duration: update["duration"] = duration
        update["placeholder"] = False
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.showcase_videos.update_one({"id": video_id}, {"$set": update})
    else:
        doc = {
            "id": video_id,
            "title": title or "Untitled",
            "description": description or "",
            "duration": duration or "",
            "video_url": video_url,
            "position": int(video_id.replace("placeholder-", "")) if "placeholder" in video_id else 0,
            "placeholder": not bool(video_url),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.showcase_videos.insert_one(doc)
    return {"status": "updated"}
