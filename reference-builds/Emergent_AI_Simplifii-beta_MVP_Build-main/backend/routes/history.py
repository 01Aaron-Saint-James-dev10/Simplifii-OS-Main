from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api")


class SaveToolOutput(BaseModel):
    tool_name: str
    input_summary: str
    output_summary: str
    full_output: dict
    ticket_cost: int = 1


@router.post("/history/save")
async def save_tool_output(data: SaveToolOutput, request: Request):
    user = await get_current_user(request)
    entry = {
        "history_id": f"hist_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "tool_name": data.tool_name,
        "input_summary": data.input_summary[:100],
        "output_summary": data.output_summary[:200],
        "full_output": data.full_output,
        "ticket_cost": data.ticket_cost,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tool_history.insert_one(entry)
    return {"status": "saved", "history_id": entry["history_id"]}


@router.get("/history")
async def get_tool_history(request: Request, limit: int = 10, skip: int = 0, tool: Optional[str] = None):
    user = await get_current_user(request)
    query = {"user_id": user.user_id}
    if tool:
        query["tool_name"] = tool

    entries = await db.tool_history.find(
        query, {"_id": 0, "full_output": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    total = await db.tool_history.count_documents(query)
    return {"entries": entries, "total": total}



@router.get("/history/recent/{tool_name}")
async def get_recent_by_tool(tool_name: str, request: Request, limit: int = 3):
    user = await get_current_user(request)
    entries = await db.tool_history.find(
        {"user_id": user.user_id, "tool_name": tool_name},
        {"_id": 0, "history_id": 1, "input_summary": 1, "created_at": 1, "tool_name": 1}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"entries": entries}


@router.get("/history/{history_id}")
async def get_history_entry(history_id: str, request: Request):
    user = await get_current_user(request)
    entry = await db.tool_history.find_one(
        {"history_id": history_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return entry


@router.delete("/history/{history_id}")
async def delete_history_entry(history_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.tool_history.delete_one(
        {"history_id": history_id, "user_id": user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"status": "deleted"}
