from sqlalchemy import String, DateTime, Integer, Float, Text, ForeignKey, JSON, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid
import enum


class PositionType(str, enum.Enum):
    java_backend = "java_backend"
    web_frontend = "web_frontend"
    python_algorithm = "python_algorithm"


class SessionStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    position: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    ended_at: Mapped[DateTime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")
    messages: Mapped[list["InterviewMessage"]] = relationship("InterviewMessage", back_populates="session")
    evaluation: Mapped["Evaluation"] = relationship("Evaluation", back_populates="session", uselist=False)


class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("interview_sessions.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "interviewer" | "candidate"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(30), nullable=True)  # technical/behavioral/scenario
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="messages")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("interview_sessions.id"), unique=True)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    expression_score: Mapped[float] = mapped_column(Float, nullable=False)
    logic_score: Mapped[float] = mapped_column(Float, nullable=False)
    position_match_score: Mapped[float] = mapped_column(Float, nullable=False)
    strengths: Mapped[list] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)
    suggestions: Mapped[list] = mapped_column(JSON, default=list)
    detailed_report: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="evaluation")
