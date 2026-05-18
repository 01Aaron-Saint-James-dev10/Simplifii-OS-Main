from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone
import uuid
import logging

from database import db
from models import User, UserCreate, UserLogin, SessionExchange
from utils.auth import hash_password, verify_password, get_current_user, create_session
from utils.tickets import OWNER_EMAIL

router = APIRouter(prefix="/api")


@router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pwd = hash_password(user_data.password)

    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "picture": None,
        "password_hash": hashed_pwd,
        "credits": 5,
        "has_purchased": False,
        "referralCode": f"SIM-{uuid.uuid4().hex[:6].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.users.insert_one(user_doc)

    session_token = await create_session(user_id)

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )

    user_doc.pop("password_hash")
    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return User(**user_doc)


@router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_token = await create_session(user_doc["user_id"])

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )

    user_doc.pop("password_hash", None)
    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    user_doc["is_owner"] = user_doc.get("email", "").lower() == OWNER_EMAIL.lower()
    return User(**user_doc)


@router.post("/auth/session")
async def exchange_session(data: SessionExchange, response: Response):
    import requests

    try:
        emergent_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id},
            timeout=10
        )

        if emergent_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")

        oauth_data = emergent_response.json()
        email = oauth_data["email"]
        name = oauth_data["name"]
        picture = oauth_data.get("picture")

        user_doc = await db.users.find_one({"email": email}, {"_id": 0})

        if not user_doc:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "credits": 5,
                "has_purchased": False,
                "referralCode": f"SIM-{uuid.uuid4().hex[:6].upper()}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
        else:
            update_set = {"name": name, "picture": picture}
            if not user_doc.get("referralCode"):
                update_set["referralCode"] = f"SIM-{uuid.uuid4().hex[:6].upper()}"
            await db.users.update_one(
                {"user_id": user_doc["user_id"]},
                {"$set": update_set}
            )
            if "referralCode" not in user_doc:
                user_doc["referralCode"] = update_set.get("referralCode")

        session_token = await create_session(user_doc["user_id"])

        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )

        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
        user_doc.pop("password_hash", None)
        user_doc["is_owner"] = user_doc.get("email", "").lower() == OWNER_EMAIL.lower()
        return User(**user_doc)

    except requests.RequestException as e:
        logging.error(f"Emergent Auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error")


@router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user.referralCode:
        code = f"SIM-{uuid.uuid4().hex[:6].upper()}"
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"referralCode": code}})
        user.referralCode = code
    data = user.model_dump()
    data["is_owner"] = user.email.lower() == OWNER_EMAIL.lower()
    return data


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})

    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


@router.post("/user/complete-onboarding")
async def complete_onboarding(request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"hasCompletedOnboarding": True}}
    )
    return {"success": True}


@router.post("/user/pain-point")
async def save_pain_point(request: Request):
    body = await request.json()
    pain_point = body.get("painPoint", "")
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"painPoint": pain_point}}
    )
    return {"success": True}


@router.put("/user/profile")
async def update_profile(request: Request):
    body = await request.json()
    user = await get_current_user(request)
    update_fields = {}
    for field in ["name", "university", "studyYear", "faculty"]:
        if field in body:
            update_fields[field] = body[field]
    if not update_fields:
        return {"success": True}
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update_fields}
    )
    return {"success": True}


@router.post("/user/redeem-referral")
async def redeem_referral(request: Request):
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Referral code is required")

    user = await get_current_user(request)

    if user.referredBy:
        raise HTTPException(status_code=400, detail="You've already used a referral code")

    referrer = await db.users.find_one({"referralCode": code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")

    if referrer["user_id"] == user.user_id:
        raise HTTPException(status_code=400, detail="You can't use your own referral code")

    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"referredBy": code}, "$inc": {"credits": 1}},
    )
    await db.users.update_one(
        {"user_id": referrer["user_id"]},
        {"$inc": {"credits": 1}},
    )
    return {"success": True, "message": "Referral applied! You and your mate both got 1 bonus ticket."}
