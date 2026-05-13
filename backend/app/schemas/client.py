"""Schemas for browser client telemetry."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientLocationIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    accuracy: float | None = Field(default=None, ge=0)
    captured_at: datetime | None = Field(default=None, alias="capturedAt")


class ClientLocationAck(BaseModel):
    ok: bool = True
