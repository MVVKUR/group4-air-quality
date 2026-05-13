"""Station endpoints: list, detail, hourly readings, forecast."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Forecast, Reading, Station
from app.schemas.feed import (
    ForecastDailyEntry,
    HourlyPoint,
    IAQIValue,
    StationSummary,
    WaqiAttribution,
    WaqiCity,
    WaqiFeed,
    WaqiForecastDaily,
    WaqiForecastPoint,
    WaqiTime,
)

router = APIRouter()


@router.get(
    "/stations",
    response_model=list[StationSummary],
    summary="All active stations with their latest AQI",
)
async def list_stations(session: AsyncSession = Depends(get_session)) -> list[StationSummary]:
    # Latest reading per station via a window-y approach using DISTINCT ON.
    # SQLAlchemy 2.0: select Station + the most-recent Reading.
    latest_subq = (
        select(
            Reading.station_id,
            Reading.aqi,
            Reading.ts,
        )
        .order_by(Reading.station_id, desc(Reading.ts))
        .distinct(Reading.station_id)
        .subquery()
    )
    stmt = (
        select(
            Station.id,
            Station.source_id,
            Station.name,
            Station.lat,
            Station.lon,
            latest_subq.c.aqi,
            latest_subq.c.ts,
        )
        .join(latest_subq, latest_subq.c.station_id == Station.id)
        .where(Station.active.is_(True))
        .order_by(Station.name)
    )
    rows = (await session.execute(stmt)).all()

    out: list[StationSummary] = []
    for row in rows:
        out.append(
            StationSummary(
                uid=row.id,
                name=row.name,
                lat=row.lat,
                lon=row.lon,
                aqi=row.aqi,
                updatedAt=row.ts.astimezone().isoformat() if row.ts else "",
            )
        )
    return out


@router.get(
    "/stations/{station_id}",
    response_model=WaqiFeed,
    summary="Station detail in WaqiFeed shape",
)
async def get_station(
    station_id: int,
    session: AsyncSession = Depends(get_session),
) -> WaqiFeed:
    station = await session.get(Station, station_id)
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found.")

    # Most recent reading
    latest_stmt = (
        select(Reading)
        .where(Reading.station_id == station_id)
        .order_by(desc(Reading.ts))
        .limit(1)
    )
    reading = (await session.execute(latest_stmt)).scalars().first()
    if reading is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No readings yet for this station.",
        )

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

    fc_stmt = (
        select(Forecast)
        .where(Forecast.station_id == station_id)
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

    source_label = "WAQI / BMKG" if station.source == "waqi" else "Open-Meteo (CAMS)"
    source_url = "https://aqicn.org" if station.source == "waqi" else "https://open-meteo.com/en/docs/air-quality-api"

    return WaqiFeed(
        aqi=reading.aqi if reading.aqi is not None else "-",
        idx=station_id,
        city=WaqiCity(name=station.name, geo=(station.lat, station.lon)),
        dominentpol=reading.dominant,
        iaqi=iaqi,
        time=WaqiTime(iso=reading.ts.astimezone().isoformat(), tz="+07:00"),
        forecast={
            "daily": WaqiForecastDaily(
                pm25=by_pollutant.get("pm25"),
                pm10=by_pollutant.get("pm10"),
                o3=by_pollutant.get("o3"),
            )
        },
        attributions=[WaqiAttribution(name=source_label, url=source_url)],
    )


@router.get(
    "/stations/{station_id}/readings",
    response_model=list[HourlyPoint],
    summary="Hourly AQI history (default 24h)",
)
async def get_station_readings(
    station_id: int,
    hours: int = Query(default=24, ge=1, le=168, description="Lookback window in hours"),
    session: AsyncSession = Depends(get_session),
) -> list[HourlyPoint]:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    stmt = (
        select(Reading.ts, Reading.aqi)
        .where(Reading.station_id == station_id)
        .where(Reading.ts >= since)
        .where(Reading.aqi.isnot(None))
        .order_by(Reading.ts.asc())
    )
    rows = (await session.execute(stmt)).all()
    return [HourlyPoint(t=ts.astimezone().isoformat(), aqi=int(aqi)) for ts, aqi in rows]


@router.get(
    "/stations/{station_id}/forecast",
    response_model=list[ForecastDailyEntry],
    summary="Daily per-pollutant forecast",
)
async def get_station_forecast(
    station_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[ForecastDailyEntry]:
    stmt = (
        select(Forecast)
        .where(Forecast.station_id == station_id)
        .order_by(Forecast.day.asc(), Forecast.pollutant.asc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [
        ForecastDailyEntry(
            day=f.day,
            pollutant=f.pollutant,
            avg=float(f.avg) if f.avg is not None else None,
            min=float(f.min) if f.min is not None else None,
            max=float(f.max) if f.max is not None else None,
        )
        for f in rows
    ]
