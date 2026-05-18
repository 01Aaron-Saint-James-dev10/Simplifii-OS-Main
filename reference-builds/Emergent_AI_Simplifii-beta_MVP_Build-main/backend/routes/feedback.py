from fastapi import APIRouter, Request, HTTPException
from database import db
from utils.auth import get_current_user
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api")

OWNER_EMAIL = "aaronbugge@gmail.com"


@router.post("/feedback/tool")
async def save_tool_feedback(request: Request):
    body = await request.json()
    user = await get_current_user(request)
    reaction = body.get("reaction")
    if reaction not in ("positive", "neutral", "negative"):
        raise HTTPException(status_code=400, detail="Invalid reaction")

    score_map = {"positive": 3, "neutral": 2, "negative": 1}
    doc = {
        "userId": user.user_id,
        "toolName": body.get("toolName", ""),
        "sessionId": body.get("sessionId", ""),
        "university": getattr(user, "university", None) or "",
        "faculty": getattr(user, "faculty", None) or "",
        "studyYear": getattr(user, "studyYear", None) or "",
        "reaction": reaction,
        "followUpAnswer": body.get("followUpAnswer", ""),
        "openText": body.get("openText", ""),
        "interestedInCoDesign": body.get("interestedInCoDesign", False),
        "outputQualityScore": score_map[reaction],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.feedback.insert_one(doc)
    return {"success": True}


@router.post("/feedback/codesign")
async def codesign_join(request: Request):
    body = await request.json()
    try:
        user = await get_current_user(request)
        user_id = user.user_id
    except Exception:
        user_id = "anonymous"
    doc = {
        "userId": user_id,
        "name": body.get("name", ""),
        "email": body.get("email", ""),
        "university": body.get("university", ""),
        "toolIdea": body.get("toolIdea", ""),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.codesign_waitlist.insert_one(doc)
    return {"success": True}


@router.get("/feedback/summary")
async def feedback_summary(request: Request):
    user = await get_current_user(request)
    if user.email.lower() != OWNER_EMAIL.lower():
        raise HTTPException(status_code=403, detail="Admin only")

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    week_str = week_ago.isoformat()
    two_week_str = two_weeks_ago.isoformat()

    this_week = await db.feedback.count_documents({"createdAt": {"$gte": week_str}})
    last_week = await db.feedback.count_documents({"createdAt": {"$gte": two_week_str, "$lt": week_str}})
    trend = 0
    if last_week > 0:
        trend = round(((this_week - last_week) / last_week) * 100)

    all_fb = []
    async for doc in db.feedback.find({}, {"_id": 0}).sort("createdAt", -1).limit(500):
        all_fb.append(doc)

    pos = sum(1 for f in all_fb if f.get("reaction") == "positive")
    neu = sum(1 for f in all_fb if f.get("reaction") == "neutral")
    neg = sum(1 for f in all_fb if f.get("reaction") == "negative")

    # Per-tool satisfaction as percentage
    tool_scores = {}
    for f in all_fb:
        tn = f.get("toolName", "Unknown")
        if tn not in tool_scores:
            tool_scores[tn] = {"sum": 0, "count": 0}
        tool_scores[tn]["sum"] += f.get("outputQualityScore", 0)
        tool_scores[tn]["count"] += 1
    per_tool = [
        {"tool": k, "score": round((v["sum"] / (v["count"] * 3)) * 100)}
        for k, v in tool_scores.items() if v["count"] > 0
    ]
    per_tool.sort(key=lambda x: -x["score"])

    recent_texts = [
        {"text": f.get("openText"), "toolName": f.get("toolName"), "reaction": f.get("reaction"), "createdAt": f.get("createdAt")}
        for f in all_fb if f.get("openText")
    ][:5]

    uni_counts = {}
    for f in all_fb:
        uni = f.get("university", "Unknown") or "Unknown"
        uni_counts[uni] = uni_counts.get(uni, 0) + 1
    uni_breakdown = [{"university": k, "count": v} for k, v in uni_counts.items()]
    uni_breakdown.sort(key=lambda x: -x["count"])

    waitlist_count = await db.codesign_waitlist.count_documents({})

    words = {}
    stop = {"this", "that", "with", "from", "have", "been", "would", "could", "should", "more", "very", "just", "also", "really", "still", "didn", "wasn", "were", "they", "their", "there", "about", "what", "when", "some", "your", "them"}
    for f in all_fb:
        txt = (f.get("openText") or "") + " " + (f.get("followUpAnswer") or "")
        for w in txt.lower().split():
            w = w.strip(".,!?;:\"'()[]")
            if len(w) > 3 and w not in stop:
                words[w] = words.get(w, 0) + 1
    top_words = [{"word": w, "count": c} for w, c in sorted(words.items(), key=lambda x: -x[1])[:10]]

    return {
        "totalThisWeek": this_week,
        "weekTrend": trend,
        "reactionBreakdown": {"positive": pos, "neutral": neu, "negative": neg},
        "perToolSatisfaction": per_tool,
        "recentOpenTexts": recent_texts,
        "universityBreakdown": uni_breakdown,
        "waitlistCount": waitlist_count,
        "topWords": top_words,
        "corpus": await _get_corpus_stats(week_str),
    }


@router.post("/lab")
async def lab_submit(request: Request):
    body = await request.json()
    user = await get_current_user(request)
    sub_type = body.get("type")
    if sub_type not in ("suggestion", "problem", "vote"):
        raise HTTPException(status_code=400, detail="Invalid submission type")
    doc = {
        "userId": user.user_id,
        "type": sub_type,
        "content": body.get("content", ""),
        "toolName": body.get("toolName", ""),
        "university": getattr(user, "university", None) or "",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.lab_submissions.insert_one(doc)
    return {"success": True}


@router.get("/lab/votes")
async def lab_votes(request: Request):
    user = await get_current_user(request)
    idea_ids = ["citation-formatter", "exam-predictor", "group-coordinator", "presentation-builder"]
    votes = {}
    for idea_id in idea_ids:
        count = await db.lab_votes.count_documents({"ideaId": idea_id})
        votes[idea_id] = count
    my_votes = {}
    async for doc in db.lab_votes.find({"userId": user.user_id}, {"_id": 0}):
        my_votes[doc.get("ideaId", "")] = True
    return {"votes": votes, "myVotes": my_votes}


@router.post("/lab/vote")
async def lab_vote(request: Request):
    body = await request.json()
    user = await get_current_user(request)
    idea_id = body.get("ideaId", "")
    if not idea_id:
        raise HTTPException(status_code=400, detail="ideaId required")
    existing = await db.lab_votes.find_one({"userId": user.user_id, "ideaId": idea_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already voted")
    await db.lab_votes.insert_one({
        "userId": user.user_id,
        "ideaId": idea_id,
        "createdAt": datetime.now(timezone.utc).isoformat()
    })
    return {"success": True}



async def _get_corpus_stats(week_str: str):
    total_week = await db.brief_corpus.count_documents({"createdAt": {"$gte": week_str}})
    total_all = await db.brief_corpus.count_documents({})
    success = await db.brief_corpus.count_documents({"processingSuccess": True})
    rate = round((success / total_all) * 100) if total_all > 0 else 0

    by_uni = {}
    by_type = {}
    by_tool = {}
    async for doc in db.brief_corpus.find({}, {"_id": 0, "university": 1, "documentType": 1, "toolName": 1}):
        u = doc.get("university", "Unknown") or "Unknown"
        by_uni[u] = by_uni.get(u, 0) + 1
        dt = doc.get("documentType", "unknown")
        by_type[dt] = by_type.get(dt, 0) + 1
        tn = doc.get("toolName", "unknown")
        by_tool[tn] = by_tool.get(tn, 0) + 1

    return {
        "totalThisWeek": total_week,
        "totalAll": total_all,
        "successRate": rate,
        "byUniversity": [{"university": k, "count": v} for k, v in sorted(by_uni.items(), key=lambda x: -x[1])],
        "byDocumentType": [{"type": k, "count": v} for k, v in sorted(by_type.items(), key=lambda x: -x[1])],
        "byTool": [{"tool": k, "count": v} for k, v in sorted(by_tool.items(), key=lambda x: -x[1])],
    }


@router.post("/corpus/log")
async def log_corpus_entry(request: Request):
    body = await request.json()
    try:
        user = await get_current_user(request)
        user_data = {"userId": user.user_id, "university": getattr(user, "university", "") or "", "faculty": getattr(user, "faculty", "") or "", "studyYear": getattr(user, "studyYear", "") or ""}
    except Exception:
        user_data = {"userId": "anonymous", "university": "", "faculty": "", "studyYear": ""}

    doc = {
        **user_data,
        "toolName": body.get("toolName", ""),
        "documentType": body.get("documentType", "unknown"),
        "extractedTextLength": body.get("extractedTextLength", 0),
        "assessmentType": body.get("assessmentType", ""),
        "courseCode": body.get("courseCode", ""),
        "processingSuccess": body.get("processingSuccess", True),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.brief_corpus.insert_one(doc)
    return {"success": True}
