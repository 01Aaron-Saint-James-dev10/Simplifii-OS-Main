import os
from fastapi import HTTPException
from database import db

TESTING_MODE = False
OWNER_EMAIL = "aaronbugge@gmail.com"

# Ticket costs per tool — single source of truth
TICKET_COSTS = {
    "brief-simplifier": 3,
    "course-planner": 3,
    "essay-scorer": 2,
    "rubric-simplifier": 2,
    "humaniser": 2,
    "scaffolder": 3,
    "decoder": 2,
    "planner": 1,
    "visualiser": 1,
}


async def is_owner(user_id: str) -> bool:
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 1})
    return user_doc.get("email", "").lower() == OWNER_EMAIL.lower() if user_doc else False


async def check_tickets_available(user_id: str, tool_key: str) -> int:
    """Check user has enough tickets WITHOUT deducting. Returns current balance.
    Owner bypass: returns 999.
    Raises HTTPException(402) if insufficient."""

    if await is_owner(user_id):
        return 999

    cost = TICKET_COSTS.get(tool_key, 1)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "credits": 1})
    balance = user_doc.get("credits", 0) if user_doc else 0

    if balance < cost:
        raise HTTPException(
            status_code=402,
            detail=f"You're out of tickets — grab more to keep going. You need {cost} ticket{'s' if cost > 1 else ''} but have {balance}."
        )

    return balance


async def deduct_tickets(user_id: str, tool_key: str) -> int:
    """Deduct tickets AFTER successful tool execution. Returns new balance.
    Owner bypass: returns 999."""

    if await is_owner(user_id):
        return 999

    cost = TICKET_COSTS.get(tool_key, 1)
    result = await db.users.find_one_and_update(
        {"user_id": user_id, "credits": {"$gte": cost}},
        {"$inc": {"credits": -cost}},
        return_document=True,
        projection={"_id": 0, "credits": 1}
    )

    if not result:
        return 0

    return result["credits"]


async def refund_tickets(user_id: str, tool_key: str) -> int:
    """Refund tickets after a failed tool execution. Returns new balance.
    Owner bypass: returns 999."""

    if await is_owner(user_id):
        return 999

    cost = TICKET_COSTS.get(tool_key, 1)
    result = await db.users.find_one_and_update(
        {"user_id": user_id},
        {"$inc": {"credits": cost}},
        return_document=True,
        projection={"_id": 0, "credits": 1}
    )

    return result["credits"] if result else 0


# Keep legacy function for background jobs that deduct upfront
async def check_and_deduct_tickets(user_id: str, tool_key: str) -> int:
    """Legacy: Check and deduct in one step. Used by background jobs that refund on failure."""

    if await is_owner(user_id):
        return 999

    cost = TICKET_COSTS.get(tool_key, 1)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "credits": 1})
    balance = user_doc.get("credits", 0) if user_doc else 0

    if balance < cost:
        raise HTTPException(
            status_code=402,
            detail=f"You're out of tickets — grab more to keep going. You need {cost} ticket{'s' if cost > 1 else ''} but have {balance}."
        )

    result = await db.users.find_one_and_update(
        {"user_id": user_id, "credits": {"$gte": cost}},
        {"$inc": {"credits": -cost}},
        return_document=True,
        projection={"_id": 0, "credits": 1}
    )

    if not result:
        raise HTTPException(
            status_code=402,
            detail="You're out of tickets — grab more to keep going."
        )

    return result["credits"]


async def get_ticket_balance(user_id: str) -> int:
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "credits": 1})
    return user_doc.get("credits", 0) if user_doc else 0
