from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    credits: int = 3
    has_purchased: bool = False
    hasCompletedOnboarding: bool = False
    painPoint: Optional[str] = None
    university: Optional[str] = None
    studyYear: Optional[str] = None
    faculty: Optional[str] = None
    referralCode: Optional[str] = None
    referredBy: Optional[str] = None
    is_owner: bool = False
    created_at: datetime


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SessionExchange(BaseModel):
    session_id: str


class BriefHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    brief_id: str
    user_id: str
    assessment_title: str
    assessment_type: str
    output_json: Dict[str, Any]
    progress: Dict[str, bool] = Field(default_factory=dict)
    created_at: datetime


class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    user_id: str
    session_id: str
    amount: float
    currency: str
    credits: int
    payment_status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class BreakDownRequest(BaseModel):
    task: str


class UpdateProgressRequest(BaseModel):
    brief_id: str
    task_key: str
    completed: bool


class UniversityUpdateRequest(BaseModel):
    university: str


class NeurotypeUpdateRequest(BaseModel):
    neurotype: str
    preferences: Dict[str, Any] = Field(default_factory=dict)


class HiddenCurriculumRequest(BaseModel):
    text: str


class TranslateRequest(BaseModel):
    text: str
    target_language: str


class CheckInRequest(BaseModel):
    brief_id: str
    mood: str
    note: str = ""


class ConceptRequest(BaseModel):
    concept: str
    simple_mode: bool = False


class StudyBuddyMessage(BaseModel):
    message: str
    session_id: str


class RubricSimplifyRequest(BaseModel):
    rubric_text: str
    brief_text: Optional[str] = None


class EssayScorerRequest(BaseModel):
    essay_text: str
    rubric_text: str = ""
    brief_text: str = ""


class EssayDeepFeedbackRequest(BaseModel):
    essay_text: str
    rubric_text: str = ""
    brief_text: str = ""
    initial_scores: str = ""


class HumaniserRequest(BaseModel):
    text: str


class ScaffolderRequest(BaseModel):
    assignment_type: str
    topic: str
    word_count: int
    level: str
    brief_text: str = ""
    rubric_text: str = ""
    outline_text: str = ""
    slides_text: str = ""


class AIGuidanceRequest(BaseModel):
    task: str
    assessment_title: str
    assessment_type: str


class TextToSpeechRequest(BaseModel):
    text: str
    language: str = "en"
    voice_speed: float = 1.0


class NeurotypePreferenceRequest(BaseModel):
    neurotype: str
    preferences: Dict[str, Any]


class FeedbackRequest(BaseModel):
    brief_id: str
    rating: str
    comment: Optional[str] = None



class OnboardingGoalsRequest(BaseModel):
    biggest_challenge: str
    success_vision: str
