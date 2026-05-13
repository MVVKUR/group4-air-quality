"""Client-originated browser telemetry endpoints."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import ClientLocation
from app.schemas.client import ClientLocationAck, ClientLocationIn

router = APIRouter()
MAX_USER_AGENT_LEN = 512


@router.post(
    "/client/location",
    response_model=ClientLocationAck,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Record browser geolocation after user consent",
)
async def record_client_location(
    payload: ClientLocationIn,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> ClientLocationAck:
    captured_at = payload.captured_at or datetime.now(timezone.utc)
    if captured_at.tzinfo is None:
        captured_at = captured_at.replace(tzinfo=timezone.utc)

    session.add(
        ClientLocation(
            lat=payload.lat,
            lon=payload.lon,
            accuracy_m=payload.accuracy,
            captured_at=captured_at,
            user_agent=(request.headers.get("user-agent") or "")[:MAX_USER_AGENT_LEN] or None,
        )
    )
    await session.commit()
    return ClientLocationAck()
