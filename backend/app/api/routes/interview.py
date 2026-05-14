from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from app.core.database import get_db
from app.models.user import User
from app.models.interview import InterviewSession, InterviewMessage, Evaluation
from app.schemas.interview import (
    StartSessionRequest, ChatRequest, SessionResponse, SessionDetailResponse, EvaluationResponse
)
from app.api.deps import get_current_user
from app.services.llm.interviewer import get_interviewer_reply, evaluate_interview
from app.services.rag.retriever import retrieve_context
from app.services.speech.transcriber import transcribe_audio

router = APIRouter(prefix="/interview", tags=["面试"])

VALID_POSITIONS = {"java_backend", "web_frontend", "python_algorithm"}


@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def create_session(
    body: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.position not in VALID_POSITIONS:
        raise HTTPException(status_code=400, detail="无效的岗位类型")

    session = InterviewSession(user_id=current_user.id, position=body.position)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/sessions/{session_id}/start")
async def start_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """触发 AI 面试官发出开场白（新会话建立后调用一次）"""
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")
    if session.messages:
        # 已有消息说明开场白已生成，直接返回第一条
        first = sorted(session.messages, key=lambda m: m.created_at)[0]
        return {"reply": first.content, "session_id": session_id}

    # 用隐藏触发语唤起开场白，不存入数据库
    opening, _ = await get_interviewer_reply(
        session.position,
        [{"role": "user", "content": "请开始面试"}],
    )
    ai_msg = InterviewMessage(session_id=session_id, role="interviewer", content=opening)
    db.add(ai_msg)
    await db.commit()
    return {"reply": opening, "session_id": session_id}


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .options(selectinload(InterviewSession.messages), selectinload(InterviewSession.evaluation))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")
    return {"session": session, "messages": session.messages, "evaluation": session.evaluation}


@router.post("/sessions/{session_id}/chat")
async def send_message(
    session_id: str,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if not session or session.status != "in_progress":
        raise HTTPException(status_code=400, detail="面试会话无效或已结束")

    user_content = body.content.strip()
    if not user_content:
        raise HTTPException(status_code=400, detail="消息内容不能为空")

    user_msg = InterviewMessage(session_id=session_id, role="candidate", content=user_content)
    db.add(user_msg)

    # RAG：根据候选人回答内容检索相关知识点作为参考上下文
    rag_context = retrieve_context(session.position, user_content)

    history = [
        {"role": "assistant" if m.role == "interviewer" else "user", "content": m.content}
        for m in sorted(session.messages, key=lambda x: x.created_at)
    ]
    history.append({"role": "user", "content": user_content})

    reply, is_end = await get_interviewer_reply(session.position, history, rag_context)

    ai_msg = InterviewMessage(session_id=session_id, role="interviewer", content=reply)
    db.add(ai_msg)

    if is_end:
        session.status = "completed"
        session.ended_at = datetime.utcnow()
        session.total_questions = sum(1 for m in session.messages if m.role == "interviewer")

    await db.commit()
    return {"reply": reply, "is_end": is_end, "session_id": session_id}


@router.post("/sessions/{session_id}/voice")
async def voice_message(
    session_id: str,
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read()
    text = await transcribe_audio(audio_bytes)
    if not text:
        raise HTTPException(status_code=422, detail="语音识别失败，请重新录音")

    result = await send_message(session_id, ChatRequest(content=text), current_user, db)
    result["transcribed_text"] = text
    return result


@router.post("/sessions/{session_id}/finish")
async def finish_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """候选人主动结束面试（不依赖 AI 输出标记）"""
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")
    if session.status != "in_progress":
        return {"status": session.status, "session_id": session_id}

    session.status = "completed"
    session.ended_at = datetime.utcnow()
    session.total_questions = sum(1 for m in session.messages if m.role == "interviewer")
    await db.commit()
    return {"status": "completed", "session_id": session_id}


@router.post("/sessions/{session_id}/evaluate", response_model=EvaluationResponse)
async def trigger_evaluation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")

    messages_data = [
        {"role": "assistant" if m.role == "interviewer" else "user", "content": m.content}
        for m in sorted(session.messages, key=lambda x: x.created_at)
    ]
    eval_data = await evaluate_interview(session.position, messages_data)

    existing = await db.execute(select(Evaluation).where(Evaluation.session_id == session_id))
    evaluation = existing.scalar_one_or_none()
    if evaluation:
        for k, v in eval_data.items():
            setattr(evaluation, k, v)
    else:
        evaluation = Evaluation(session_id=session_id, **eval_data)
        db.add(evaluation)

    await db.commit()
    await db.refresh(evaluation)
    return evaluation
