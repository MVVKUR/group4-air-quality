"""Health endpoint — DB ping + scheduler last-run status."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.scheduler import jobs as scheduler_jobs
from app.schemas.feed import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Liveness + ingestion status")
async def health(session: AsyncSession = Depends(get_session)) -> HealthResponse:
    try:
        await session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:  # noqa: BLE001
        db_status = f"error: {exc}"

    last_success = None
    for st in scheduler_jobs.state.jobs.values():
        if st.last_success_at and (last_success is None or st.last_success_at > last_success):
            last_success = st.last_success_at

    job_payload = {
        name: {
            "lastRunAt": st.last_run_at.isoformat() if st.last_run_at else None,
            "lastSuccessAt": st.last_success_at.isoformat() if st.last_success_at else None,
            "lastError": st.last_error,
            "runs": st.runs,
        }
        for name, st in scheduler_jobs.state.jobs.items()
    }

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        db=db_status,
        lastFetchAt=last_success,
        schedulerStarted=scheduler_jobs.state.started,
        jobs=job_payload,
    )
