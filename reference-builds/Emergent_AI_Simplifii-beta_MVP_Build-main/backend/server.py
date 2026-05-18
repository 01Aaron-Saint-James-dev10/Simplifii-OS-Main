from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from database import client
from routes.auth import router as auth_router
from routes.briefs import router as briefs_router
from routes.tools import router as tools_router
from routes.payments import router as payments_router
from routes.user import router as user_router
from routes.planner import router as planner_router
from routes.chat import router as chat_router
from routes.notifications import router as notifications_router
from routes.digest import router as digest_router
from routes.share import router as share_router
from routes.history import router as history_router
from routes.feedback import router as feedback_router
from routes.analytics import router as analytics_router
from routes.showcase import router as showcase_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(briefs_router)
app.include_router(tools_router)
app.include_router(payments_router)
app.include_router(user_router)
app.include_router(planner_router)
app.include_router(chat_router)
app.include_router(notifications_router)
app.include_router(digest_router)
app.include_router(share_router)
app.include_router(history_router)
app.include_router(feedback_router)
app.include_router(analytics_router)
app.include_router(showcase_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
