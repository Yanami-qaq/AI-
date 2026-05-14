from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.user import User
from app.models.interview import InterviewSession, Evaluation
from app.api.deps import get_current_user

router = APIRouter(prefix="/report", tags=["报告与统计"])


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用户整体面试统计数据，用于首页仪表盘"""
    sessions_result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "completed"
        )
    )
    sessions = sessions_result.scalars().all()
    session_ids = [s.id for s in sessions]

    if not session_ids:
        return {
            "total_sessions": 0,
            "avg_scores": None,
            "growth_curve": [],
            "position_distribution": {},
        }

    evals_result = await db.execute(
        select(Evaluation).where(Evaluation.session_id.in_(session_ids))
    )
    evals = evals_result.scalars().all()

    if not evals:
        return {"total_sessions": len(sessions), "avg_scores": None, "growth_curve": [], "position_distribution": {}}

    avg_scores = {
        "overall": round(sum(e.overall_score for e in evals) / len(evals), 1),
        "technical": round(sum(e.technical_score for e in evals) / len(evals), 1),
        "expression": round(sum(e.expression_score for e in evals) / len(evals), 1),
        "logic": round(sum(e.logic_score for e in evals) / len(evals), 1),
        "position_match": round(sum(e.position_match_score for e in evals) / len(evals), 1),
    }

    # 成长曲线：按时间排序的历次综合分
    session_map = {s.id: s for s in sessions}
    growth_curve = sorted([
        {
            "date": session_map[e.session_id].started_at.strftime("%Y-%m-%d"),
            "position": session_map[e.session_id].position,
            "overall_score": e.overall_score,
        }
        for e in evals if e.session_id in session_map
    ], key=lambda x: x["date"])

    # 各岗位面试次数分布
    position_dist: dict = {}
    for s in sessions:
        position_dist[s.position] = position_dist.get(s.position, 0) + 1

    return {
        "total_sessions": len(sessions),
        "avg_scores": avg_scores,
        "growth_curve": growth_curve,
        "position_distribution": position_dist,
    }
