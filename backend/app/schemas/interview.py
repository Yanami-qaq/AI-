from pydantic import BaseModel
from datetime import datetime


class StartSessionRequest(BaseModel):
    position: str  # java_backend | web_frontend | python_algorithm


class ChatRequest(BaseModel):
    content: str


class SessionResponse(BaseModel):
    id: str
    position: str
    status: str
    started_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationResponse(BaseModel):
    id: str
    session_id: str
    overall_score: float
    technical_score: float
    expression_score: float
    logic_score: float
    position_match_score: float
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
    detailed_report: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionDetailResponse(BaseModel):
    session: SessionResponse
    messages: list[MessageResponse]
    evaluation: EvaluationResponse | None

    class Config:
        from_attributes = True
