from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any
from datetime import datetime, timezone

from database import db
from models import UniversityUpdateRequest, NeurotypePreferenceRequest, FeedbackRequest, TextToSpeechRequest, OnboardingGoalsRequest
from utils.auth import get_current_user

router = APIRouter(prefix="/api")

AUSTRALIAN_UNIVERSITIES = [
    {"id": "unimelb", "name": "University of Melbourne", "group": "Go8"},
    {"id": "usyd", "name": "University of Sydney", "group": "Go8"},
    {"id": "anu", "name": "Australian National University", "group": "Go8"},
    {"id": "uq", "name": "University of Queensland", "group": "Go8"},
    {"id": "unsw", "name": "University of New South Wales", "group": "Go8"},
    {"id": "monash", "name": "Monash University", "group": "Go8"},
    {"id": "uwa", "name": "University of Western Australia", "group": "Go8"},
    {"id": "adelaide", "name": "University of Adelaide", "group": "Go8"},
    {"id": "uts", "name": "University of Technology Sydney", "group": "ATN"},
    {"id": "qut", "name": "Queensland University of Technology", "group": "ATN"},
    {"id": "rmit", "name": "RMIT University", "group": "ATN"},
    {"id": "curtin", "name": "Curtin University", "group": "ATN"},
    {"id": "unisa", "name": "University of South Australia", "group": "ATN"},
    {"id": "deakin", "name": "Deakin University", "group": ""},
    {"id": "griffith", "name": "Griffith University", "group": ""},
    {"id": "latrobe", "name": "La Trobe University", "group": ""},
    {"id": "macquarie", "name": "Macquarie University", "group": ""},
    {"id": "wollongong", "name": "University of Wollongong", "group": ""},
    {"id": "newcastle", "name": "University of Newcastle", "group": ""},
    {"id": "tasmania", "name": "University of Tasmania", "group": ""},
    {"id": "flinders", "name": "Flinders University", "group": ""},
    {"id": "swinburne", "name": "Swinburne University of Technology", "group": ""},
    {"id": "wsu", "name": "Western Sydney University", "group": ""},
    {"id": "jcu", "name": "James Cook University", "group": ""},
    {"id": "canberra", "name": "University of Canberra", "group": ""},
    {"id": "murdoch", "name": "Murdoch University", "group": ""},
    {"id": "ecu", "name": "Edith Cowan University", "group": ""},
    {"id": "cdu", "name": "Charles Darwin University", "group": ""},
    {"id": "csu", "name": "Charles Sturt University", "group": ""},
    {"id": "scu", "name": "Southern Cross University", "group": ""},
    {"id": "une", "name": "University of New England", "group": ""},
    {"id": "acu", "name": "Australian Catholic University", "group": ""},
    {"id": "bond", "name": "Bond University", "group": ""},
    {"id": "vic", "name": "Victoria University", "group": ""},
    {"id": "usq", "name": "University of Southern Queensland", "group": ""},
    {"id": "federation", "name": "Federation University Australia", "group": ""},
    {"id": "sunshine", "name": "University of the Sunshine Coast", "group": ""},
    {"id": "cqu", "name": "CQUniversity", "group": ""},
    {"id": "torrens", "name": "Torrens University Australia", "group": ""},
    {"id": "divinity", "name": "University of Divinity", "group": ""},
]


@router.get("/universities")
async def list_universities():
    return {"universities": AUSTRALIAN_UNIVERSITIES}


@router.post("/user/university")
async def update_university(data: UniversityUpdateRequest, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"university": data.university}}
    )
    return {"status": "success", "university": data.university}


@router.get("/user/profile")
async def get_user_profile(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    prefs = await db.user_preferences.find_one({"user_id": user.user_id}, {"_id": 0})
    return {
        "user": user_doc,
        "neurotype": prefs.get("neurotype") if prefs else None,
        "preferences": prefs.get("preferences", {}) if prefs else {},
        "university": user_doc.get("university"),
        "onboarding_complete": bool(user_doc.get("university")) and bool(prefs and prefs.get("neurotype"))
    }


@router.post("/user/neurotype")
async def save_neurotype(data: NeurotypePreferenceRequest, request: Request):
    user = await get_current_user(request)
    await db.user_preferences.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "neurotype": data.neurotype,
            "preferences": data.preferences,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"status": "success"}


TOOL_RECOMMENDATIONS = {
    "time management": {"tool": "executive-planner", "name": "Executive Function Planner", "reason": "It's built for brains that work differently with time — Pomodoro timer, weekly planning, and AI coaching."},
    "planning": {"tool": "executive-planner", "name": "Executive Function Planner", "reason": "Your planner is designed for different thinking styles — break big tasks into small wins."},
    "understanding": {"tool": "hidden-curriculum", "name": "Hidden Curriculum Decoder", "reason": "It translates academic jargon into plain English and reveals what markers really want."},
    "jargon": {"tool": "hidden-curriculum", "name": "Hidden Curriculum Decoder", "reason": "Academic language is a code, not a measure of intelligence. The Decoder cracks it for you."},
    "writing": {"tool": "essay-scorer", "name": "Essay Scorer", "reason": "Get strengths-first feedback that shows you what you're already doing well, then guides improvement."},
    "essay": {"tool": "essay-scorer", "name": "Essay Scorer", "reason": "Upload your draft and get specific, kind feedback — it leads with your strengths."},
    "structure": {"tool": "assessment-scaffolder", "name": "Assessment Scaffolder", "reason": "Upload your brief, rubric, and outline — get a full scaffold with critical thinking prompts."},
    "assessment": {"tool": "assessment-scaffolder", "name": "Assessment Scaffolder", "reason": "It maps your documents together and builds a personalised scaffold for your assignment."},
    "starting": {"tool": "brief-simplifier", "name": "Brief Simplifier", "reason": "Upload your assessment brief and get a clear, week-by-week action plan in plain English."},
    "overwhelm": {"tool": "brief-simplifier", "name": "Brief Simplifier", "reason": "Turn that overwhelming brief into bite-sized steps. One thing at a time."},
    "deadline": {"tool": "course-planner", "name": "Course Planner", "reason": "See all your deadlines in one view — no more surprises."},
    "rubric": {"tool": "rubric-simplifier", "name": "Rubric Simplifier", "reason": "Turn that confusing rubric into a clear checklist of what to do for each grade band."},
    "ai detection": {"tool": "humaniser", "name": "Humaniser", "reason": "Your writing style is valid. The Humaniser helps your authentic voice shine through."},
}

DEFAULT_RECOMMENDATION = {"tool": "brief-simplifier", "name": "Brief Simplifier", "reason": "Start by uploading your next assessment brief — we'll break it down into a clear action plan."}


def _recommend_tool(challenge: str) -> dict:
    challenge_lower = challenge.lower()
    for keyword, rec in TOOL_RECOMMENDATIONS.items():
        if keyword in challenge_lower:
            return rec
    return DEFAULT_RECOMMENDATION


@router.post("/user/onboarding-goals")
async def save_onboarding_goals(data: OnboardingGoalsRequest, request: Request):
    user = await get_current_user(request)
    recommendation = _recommend_tool(data.biggest_challenge)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "onboarding_goals": {
                "biggest_challenge": data.biggest_challenge,
                "success_vision": data.success_vision,
                "saved_at": datetime.now(timezone.utc).isoformat()
            },
            "recommended_tool": recommendation
        }}
    )
    return {"status": "success", "recommendation": recommendation}


@router.get("/user/onboarding-goals")
async def get_onboarding_goals(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {
        "goals": user_doc.get("onboarding_goals"),
        "recommendation": user_doc.get("recommended_tool")
    }



@router.get("/user/neurotype")
async def get_neurotype(request: Request):
    user = await get_current_user(request)
    prefs = await db.user_preferences.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    if not prefs:
        return {"neurotype": None, "preferences": {}}
    return prefs


NEUROTYPE_UI_CONFIGS = {
    "adhd": {
        "label": "ADHD-Optimised",
        "spacing": "relaxed",
        "animations": True,
        "chunkSize": "small",
        "colourScheme": "high-contrast",
        "fontWeight": "medium",
        "tips": [
            "Tasks are broken into smaller chunks to reduce overwhelm",
            "Colour coding helps distinguish sections quickly",
            "Timer integration for focused work sprints",
        ]
    },
    "dyslexic": {
        "label": "Dyslexia-Friendly",
        "spacing": "extra-relaxed",
        "animations": False,
        "chunkSize": "medium",
        "colourScheme": "warm",
        "fontWeight": "normal",
        "tips": [
            "Increased letter and line spacing for readability",
            "OpenDyslexic font available in accessibility settings",
            "Cream/warm backgrounds reduce visual stress",
        ]
    },
    "autistic": {
        "label": "Autism-Friendly",
        "spacing": "consistent",
        "animations": False,
        "chunkSize": "structured",
        "colourScheme": "muted",
        "fontWeight": "normal",
        "tips": [
            "Consistent, predictable layout across all pages",
            "Reduced motion and no surprise animations",
            "Clear, explicit instructions with no ambiguity",
        ]
    },
    "anxious": {
        "label": "Anxiety-Aware",
        "spacing": "comfortable",
        "animations": False,
        "chunkSize": "one-at-a-time",
        "colourScheme": "calming",
        "fontWeight": "normal",
        "tips": [
            "Progress shown gently without pressure",
            "One task at a time mode available",
            "Encouraging language throughout",
        ]
    },
    "multiple": {
        "label": "Multi-Neurotype",
        "spacing": "relaxed",
        "animations": False,
        "chunkSize": "small",
        "colourScheme": "balanced",
        "fontWeight": "medium",
        "tips": [
            "Combines best practices from multiple neurotypes",
            "Fully customisable in accessibility settings",
            "Flexible layout adapts to your preferences",
        ]
    },
}


@router.get("/user/neurotype-ui")
async def get_neurotype_ui(request: Request):
    """Get UI configuration based on user's neurotype"""
    user = await get_current_user(request)
    prefs = await db.user_preferences.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    neurotype = prefs.get("neurotype", "multiple") if prefs else "multiple"
    config = NEUROTYPE_UI_CONFIGS.get(neurotype, NEUROTYPE_UI_CONFIGS["multiple"])
    return {"neurotype": neurotype, "ui_config": config}


UNIVERSITY_INTEL = {
    "unimelb": {
        "name": "University of Melbourne",
        "grading": "H1 (80-100), H2A (75-79), H2B (70-74), H3 (65-69), P (50-64)",
        "style_guide": "Melbourne uses APA 7th or Chicago depending on faculty. Check your subject guide.",
        "tips": [
            "Melbourne marks heavily on critical analysis over description",
            "Use the Melbourne Academic Skills resources at services.unimelb.edu.au",
            "Turnitin is standard — always run a similarity check before submitting",
        ],
        "referencing": "APA 7th (most faculties), Chicago (Arts), AGLC4 (Law)",
    },
    "usyd": {
        "name": "University of Sydney",
        "grading": "HD (85-100), D (75-84), CR (65-74), P (50-64)",
        "style_guide": "Sydney generally prefers Harvard or APA depending on school.",
        "tips": [
            "Canvas submissions usually have a Turnitin report within 24 hours",
            "The Learning Hub offers free writing workshops",
            "Check the unit outline for specific referencing requirements",
        ],
        "referencing": "Harvard (Business, Arts), APA 7th (Science, Health), AGLC4 (Law)",
    },
    "unsw": {
        "name": "University of New South Wales",
        "grading": "HD (85-100), DN (75-84), CR (65-74), PS (50-64)",
        "style_guide": "UNSW uses IEEE (Engineering), APA (Social Sciences), Harvard (Business).",
        "tips": [
            "UNSW Academic Skills supports free consultations",
            "ELISe (library) has extensive guides for every referencing style",
            "Group assignments are common — use the peer assessment tools wisely",
        ],
        "referencing": "IEEE (Engineering), APA 7th (Health), Harvard (Business)",
    },
    "monash": {
        "name": "Monash University",
        "grading": "HD (80-100), D (70-79), C (60-69), P (50-59)",
        "style_guide": "Monash predominantly uses APA 7th. Check your unit guide.",
        "tips": [
            "Monash Library has excellent citation guides at guides.lib.monash.edu",
            "Assignment Calculator tool helps plan your timeline",
            "Monash uses iThenticate for thesis and dissertation checks",
        ],
        "referencing": "APA 7th (most), Vancouver (Health), AGLC4 (Law)",
    },
}

# Default intel for universities not in the database
DEFAULT_UNI_INTEL = {
    "grading": "HD (80-100), D (70-79), C (60-69), P (50-59), F (0-49)",
    "style_guide": "Check your unit outline for the required referencing style.",
    "tips": [
        "Always check your specific unit outline for assessment requirements",
        "Visit your university's Academic Skills centre for free support",
        "Use the library's referencing guides for your discipline",
    ],
    "referencing": "Check unit outline — commonly APA 7th, Harvard, or Chicago",
}


@router.get("/university/intel")
async def get_university_intel(request: Request):
    """Get university-specific intelligence for the current user"""
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    uni_id = user_doc.get("university", "")

    # Find the university name
    uni_name = uni_id
    for u in AUSTRALIAN_UNIVERSITIES:
        if u["id"] == uni_id:
            uni_name = u["name"]
            break

    intel = UNIVERSITY_INTEL.get(uni_id, None)
    if intel:
        return {"university": uni_name, "university_id": uni_id, **intel}

    return {
        "university": uni_name,
        "university_id": uni_id,
        "name": uni_name,
        **DEFAULT_UNI_INTEL,
    }


@router.post("/voice/text-to-speech")
async def generate_speech(data: TextToSpeechRequest, request: Request):
    user = await get_current_user(request)
    try:
        from gtts import gTTS
        import tempfile
        import base64

        tts = gTTS(text=data.text, lang=data.language, slow=(data.voice_speed < 1.0))

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            tts.save(fp.name)
            with open(fp.name, 'rb') as audio_file:
                audio_base64 = base64.b64encode(audio_file.read()).decode('utf-8')

        return {
            "audio_base64": audio_base64,
            "format": "mp3"
        }
    except Exception as e:
        import logging
        logging.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")


@router.post("/feedback")
async def submit_feedback(data: FeedbackRequest, request: Request):
    user = await get_current_user(request)

    await db.brief_history.update_one(
        {"brief_id": data.brief_id, "user_id": user.user_id},
        {"$set": {"rating": data.rating, "feedback_comment": data.comment}}
    )

    await db.brief_corpus.update_one(
        {"brief_id": data.brief_id},
        {"$set": {"quality_rating": data.rating}},
        upsert=True
    )

    return {"status": "success"}
