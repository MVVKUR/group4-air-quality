"""Pydantic response models.

Shapes intentionally mirror the existing TypeScript `WaqiFeed` interface
(`src/types/waqi.ts`) so the frontend keeps its types verbatim.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class _CamelModel(BaseModel):
    """Base — extra fields tolerated for forward-compat."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class IAQIValue(_CamelModel):
    v: float


class WaqiCity(_CamelModel):
    name: str
    geo: tuple[float, float]


class WaqiTime(_CamelModel):
    iso: str | None = None
    tz: str | None = None


class WaqiForecastPoint(_CamelModel):
    avg: float
    day: str
    max: float
    min: float


class WaqiForecastDaily(_CamelModel):
    pm25: list[WaqiForecastPoint] | None = Field(default=None)
    pm10: list[WaqiForecastPoint] | None = Field(default=None)
    o3: list[WaqiForecastPoint] | None = Field(default=None)


class WaqiAttribution(_CamelModel):
    name: str
    url: str | None = None


class WaqiFeed(_CamelModel):
    """Matches the existing frontend `WaqiFeed` shape."""

    aqi: int | str
    idx: int
    city: WaqiCity
    dominentpol: str | None = None  # mis-spelling preserved to match upstream + frontend
    iaqi: dict[str, IAQIValue]
    time: WaqiTime
    forecast: dict[str, WaqiForecastDaily] | None = None
    attributions: list[WaqiAttribution] = Field(default_factory=list)


class StationSummary(_CamelModel):
    uid: int
    name: str
    lat: float
    lon: float
    aqi: int | None
    updated_at: str = Field(alias="updatedAt")


class HourlyPoint(_CamelModel):
    t: str
    aqi: int


class ForecastDailyEntry(_CamelModel):
    day: date
    pollutant: str
    avg: float | None = None
    min: float | None = None
    max: float | None = None


class HealthResponse(_CamelModel):
    status: str
    db: str
    last_fetch_at: datetime | None = Field(default=None, alias="lastFetchAt")
    scheduler_started: bool = Field(default=False, alias="schedulerStarted")
    jobs: dict[str, dict[str, object]] = Field(default_factory=dict)
