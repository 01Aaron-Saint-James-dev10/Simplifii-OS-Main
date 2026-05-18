from fastapi import APIRouter, HTTPException, Request, Form
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse
from datetime import datetime, timezone
import uuid
import os
import logging

from database import db
from utils.auth import get_current_user
from utils.tickets import TICKET_COSTS, is_owner

router = APIRouter(prefix="/api")

TICKET_PACKS = {
    "single-1":  {"tickets": 1,   "amount": 1.99,   "name": "1 Ticket"},
    "single-2":  {"tickets": 2,   "amount": 3.49,   "name": "2 Tickets"},
    "single-3":  {"tickets": 3,   "amount": 4.99,   "name": "3 Tickets"},
    "starter":   {"tickets": 10,  "amount": 14.99,  "name": "Starter"},
    "standard":  {"tickets": 30,  "amount": 38.99,  "name": "Standard"},
    "semester":  {"tickets": 75,  "amount": 89.99,  "name": "Semester"},
    "power":     {"tickets": 200, "amount": 219.99, "name": "Power"},
}


@router.get("/credits/balance")
async def get_ticket_balance(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "credits": 1, "has_purchased": 1})
    owner = await is_owner(user.user_id)
    return {
        "tickets": user_doc.get("credits", 0),
        "has_purchased": user_doc.get("has_purchased", False),
        "costs": TICKET_COSTS,
        "is_owner": owner,
    }


@router.post("/credits/purchase")
async def purchase_tickets(request: Request, package_id: str = Form(...), origin_url: str = Form(...)):
    user = await get_current_user(request)

    if package_id not in TICKET_PACKS:
        raise HTTPException(status_code=400, detail="Invalid package")

    package = TICKET_PACKS[package_id]

    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"

    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

    success_url = f"{origin_url}/credits?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/credits"

    checkout_request = CheckoutSessionRequest(
        amount=package["amount"],
        currency="aud",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user.user_id,
            "package_id": package_id,
            "tickets": str(package["tickets"])
        }
    )

    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)

    transaction_doc = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "session_id": session.session_id,
        "amount": package["amount"],
        "currency": "aud",
        "tickets": package["tickets"],
        "package_name": package["name"],
        "payment_status": "pending",
        "metadata": checkout_request.metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.payment_transactions.insert_one(transaction_doc)

    return {"url": session.url, "session_id": session.session_id}


@router.get("/credits/status/{session_id}")
async def check_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)

    transaction_doc = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user.user_id},
        {"_id": 0}
    )

    if not transaction_doc:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tickets_field = transaction_doc.get("tickets", transaction_doc.get("credits", 0))

    if transaction_doc["payment_status"] == "paid":
        return {"status": "completed", "tickets_added": tickets_field}

    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

    checkout_status = await stripe_checkout.get_checkout_status(session_id)

    if checkout_status.payment_status == "paid" and transaction_doc["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )

        await db.users.update_one(
            {"user_id": user.user_id},
            {
                "$inc": {"credits": tickets_field},
                "$set": {"has_purchased": True}
            }
        )

        user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "credits": 1})
        new_balance = user_doc.get("credits", 0) if user_doc else tickets_field

        return {
            "status": "completed",
            "tickets_added": tickets_field,
            "new_balance": new_balance,
            "has_purchased": True,
        }

    return {"status": checkout_status.payment_status}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)

        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata

            transaction_doc = await db.payment_transactions.find_one(
                {"session_id": session_id},
                {"_id": 0}
            )

            if transaction_doc and transaction_doc["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )

                tickets_to_add = int(metadata.get("tickets", transaction_doc.get("tickets", transaction_doc.get("credits", 0))))
                user_id = metadata.get("user_id")

                await db.users.update_one(
                    {"user_id": user_id},
                    {
                        "$inc": {"credits": tickets_to_add},
                        "$set": {"has_purchased": True}
                    }
                )

        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))



@router.post("/promo/create")
async def create_promo_code(request: Request):
    user = await get_current_user(request)
    if not await is_owner(user.user_id):
        raise HTTPException(status_code=403, detail="Owner only")
    body = await request.json()
    code = body.get("code", "").strip().upper()
    tickets = int(body.get("tickets", 0))
    max_uses = int(body.get("max_uses", 100))
    expiry = body.get("expiry", None)
    if not code or tickets < 1:
        raise HTTPException(status_code=400, detail="Code and tickets required")
    existing = await db.promo_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    doc = {
        "code": code,
        "tickets": tickets,
        "max_uses": max_uses,
        "uses": 0,
        "expiry": expiry,
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "active": True,
    }
    await db.promo_codes.insert_one(doc)
    return {"status": "created", "code": code, "tickets": tickets}


@router.post("/promo/redeem")
async def redeem_promo_code(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code required")
    promo = await db.promo_codes.find_one({"code": code, "active": True})
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid or expired code")
    if promo.get("max_uses") and promo.get("uses", 0) >= promo["max_uses"]:
        raise HTTPException(status_code=400, detail="Code has reached maximum uses")
    if promo.get("expiry"):
        try:
            exp = datetime.fromisoformat(promo["expiry"])
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=400, detail="Code has expired")
        except (ValueError, TypeError):
            pass
    already = await db.promo_redemptions.find_one({"user_id": user.user_id, "code": code})
    if already:
        raise HTTPException(status_code=400, detail="You have already redeemed this code")
    tickets = promo["tickets"]
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"credits": tickets}})
    await db.promo_codes.update_one({"code": code}, {"$inc": {"uses": 1}})
    await db.promo_redemptions.insert_one({
        "user_id": user.user_id,
        "code": code,
        "tickets": tickets,
        "redeemed_at": datetime.now(timezone.utc).isoformat(),
    })
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"status": "redeemed", "tickets_added": tickets, "new_balance": user_doc.get("credits", 0)}
