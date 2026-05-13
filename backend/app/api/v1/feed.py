"""GET /api/v1/feed/jakarta — latest WAQI city reading + forecast.

The response shape mirrors the original WAQI JSON so the frontend's existing
`WaqiFeed` interface still works after re-pointing the URL.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Forecast, Reading, Station
from app.schemas.feed import (
    HourlyPoint,
    IAQIValue,
    WaqiAttribution,
    WaqiCity,
    WaqiFeed,
    WaqiForecastDaily,
    WaqiForecastPoint,
    WaqiTime,
)
from app.services import openmeteo

router = APIRouter()


def _maybe(value: float | None, key: str) -> tuple[str, IAQIValue] | None:
    return (key, IAQIValue(v=float(value))) if value is not None else None


@router.get(
    "/feed/jakarta",
    response_model=WaqiFeed,
    summary="Latest WAQI Jakarta city reading",
)
async def get_jakarta_feed(
    session: AsyncSession = Depends(get_session),
) -> WaqiFeed:
    # WAQI Jakarta city aggregate is whichever station ingested under "/feed/jakarta"
    # (currently Kemayoran). We pick the latest WAQI reading whose station name
    # looks like the city aggregate, or fall back to the most recent WAQI reading.
    stmt = (
        select(Reading, Station)
        .join(Station, Reading.station_id == Station.id)
        .where(Station.source == "waqi")
        .order_by(Reading.ts.desc())
        .limit(1)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No WAQI readings ingested yet — scheduler hasn't completed first run.",
        )
    reading, station = row

    iaqi: dict[str, IAQIValue] = {}
    for value, key in (
        (reading.pm25, "pm25"),
        (reading.pm10, "pm10"),
        (reading.no2, "no2"),
        (reading.o3, "o3"),
        (reading.so2, "so2"),
        (reading.co, "co"),
        (reading.temp_c, "t"),
        (reading.humidity, "h"),
        (reading.wind_ms, "w"),
        (reading.pressure_hpa, "p"),
    ):
        if value is not None:
            iaqi[key] = IAQIValue(v=float(value))

    # Forecast
    fc_stmt = (
        select(Forecast)
        .where(Forecast.station_id == station.id)
        .order_by(Forecast.day.asc())
    )
    forecasts = (await session.execute(fc_stmt)).scalars().all()
    by_pollutant: dict[str, list[WaqiForecastPoint]] = {}
    for f in forecasts:
        by_pollutant.setdefault(f.pollutant, []).append(
            WaqiForecastPoint(
                avg=float(f.avg or 0),
                day=f.day.isoformat(),
                max=float(f.max or 0),
                min=float(f.min or 0),
            )
        )
    daily = WaqiForecastDaily(
        pm25=by_pollutant.get("pm25"),
        pm10=by_pollutant.get("pm10"),
        o3=by_pollutant.get("o3"),
    )

    return WaqiFeed(
        aqi=reading.aqi if reading.aqi is not None else "-",
        # idx is the *DB* id so the frontend can use it to call our other
        # `/stations/{id}/...` endpoints. The upstream WAQI uid is hidden.
        idx=station.id,
        city=WaqiCity(name=station.name, geo=(station.lat, station.lon)),
        dominentpol=reading.dominant,
        iaqi=iaqi,
        time=WaqiTime(iso=_iso(reading.ts), tz="+07:00"),
        forecast={"daily": daily},
        attributions=[
            WaqiAttribution(name="BMKG / WAQI", url="https://aqicn.org"),
        ],
    )


@router.get(
    "/feed/jakarta/readings",
    response_model=list[HourlyPoint],
    summary="Jakarta hourly AQI trend history",
)
async def get_jakarta_feed_readings(
    hours: int = Query(default=25, ge=1, le=168, description="Lookback window in hours"),
    session: AsyncSession = Depends(get_session),
) -> list[HourlyPoint]:
    """Return the Open-Meteo hourly history used by the dashboard trend chart."""
    trend_station = openmeteo.JAKARTA_NEIGHBORHOODS[0]
    station_stmt = select(Station.id).where(
        Station.source == "openmeteo",
        Station.source_id == str(trend_station.id),
    )
    station_id = (await session.execute(station_stmt)).scalar_one_or_none()
    if station_id is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No Open-Meteo history ingested yet — scheduler hasn't completed first run.",
        )

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    reading_stmt = (
        select(Reading.ts, Reading.aqi)
        .where(Reading.station_id == station_id)
        .where(Reading.ts >= since)
        .where(Reading.aqi.isnot(None))
        .order_by(Reading.ts.asc())
    )
    rows = (await session.execute(reading_stmt)).all()
    return [HourlyPoint(t=_iso(ts), aqi=int(aqi)) for ts, aqi in rows]


def _iso(dt: datetime) -> str:
    return dt.astimezone().isoformat()
