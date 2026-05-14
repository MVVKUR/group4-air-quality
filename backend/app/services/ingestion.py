"""Ingestion orchestration: fetch upstream → normalize → upsert.

Each job is idempotent — running twice in a row produces the same DB state
because all writes go through `ON CONFLICT` upserts on natural keys.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import session_scope
from app.core.logging import get_logger
from app.models import Forecast, Reading, Station
from app.services import openmeteo, waqi
from app.services.aqi import (
    co_to_aqi,
    no2_to_aqi,
    o3_to_aqi,
    pm10_to_aqi,
    pm25_to_aqi,
    so2_to_aqi,
)

log = get_logger("ingestion")

WIB_OFFSET = timezone(timedelta(hours=7))


@dataclass
class NormalizedReading:
    """Internal shape used by the upsert path."""

    station_source: str
    station_source_id: str
    station_name: str
    lat: float
    lon: float
    ts: datetime
    aqi: int | None
    pm25: Decimal | None
    pm10: Decimal | None
    no2: Decimal | None
    o3: Decimal | None
    so2: Decimal | None
    co: Decimal | None
    temp_c: Decimal | None
    humidity: Decimal | None
    wind_ms: Decimal | None
    pressure_hpa: Decimal | None
    dominant: str | None


# ---------------------------------------------------------------------------
# Public job entry points (called by APScheduler)
# ---------------------------------------------------------------------------


async def ingest_waqi_jakarta_feed() -> int:
    """Hit /feed/jakarta, upsert one station + one reading + forecast rows."""
    async with httpx.AsyncClient() as client:
        feed = await waqi.fetch_jakarta_feed(client)
    return await _upsert_waqi_feed(feed)


async def ingest_waqi_bounds() -> int:
    """Hit /map/bounds, upsert every reachable BMKG station within the bbox."""
    async with httpx.AsyncClient() as client:
        stations = await waqi.fetch_stations_in_bounds(client)
    return await _upsert_waqi_bounds(stations)


async def ingest_openmeteo_current() -> int:
    """One batched call → upsert 24 station + reading rows for the neighborhoods."""
    async with httpx.AsyncClient() as client:
        locations = await openmeteo.fetch_batch_current(client)
    return await _upsert_openmeteo_current(locations)


async def ingest_openmeteo_history() -> int:
    """Hourly history + multi-day forecast for every Jakarta neighborhood.

    One batched Open-Meteo call covers all 24 sampling points, so every station
    detail page and the location-aware dashboard get a real forecast — not just
    Jakarta city center.
    """
    async with httpx.AsyncClient() as client:
        locations = await openmeteo.fetch_batch_hourly_with_forecast(client)
    total = 0
    for nb, loc in zip(openmeteo.JAKARTA_NEIGHBORHOODS, locations, strict=False):
        if not loc:
            continue
        total += await _upsert_openmeteo_hourly(nb, loc)
    return total


# ---------------------------------------------------------------------------
# Internal: normalize + upsert helpers
# ---------------------------------------------------------------------------


def _parse_iso(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _dec(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (ValueError, ArithmeticError):
        return None


async def _get_or_create_station(
    session: AsyncSession,
    *,
    source: str,
    source_id: str,
    name: str,
    lat: float,
    lon: float,
) -> Station:
    stmt = (
        insert(Station)
        .values(source=source, source_id=source_id, name=name, lat=lat, lon=lon)
        .on_conflict_do_update(
            index_elements=["source", "source_id"],
            set_={"name": name, "lat": lat, "lon": lon, "active": True},
        )
        .returning(Station.id)
    )
    result = await session.execute(stmt)
    sid = result.scalar_one()
    return await session.get(Station, sid)  # type: ignore[return-value]


async def _upsert_reading(session: AsyncSession, r: NormalizedReading) -> None:
    station = await _get_or_create_station(
        session,
        source=r.station_source,
        source_id=r.station_source_id,
        name=r.station_name,
        lat=r.lat,
        lon=r.lon,
    )
    payload = dict(
        station_id=station.id,
        ts=r.ts,
        aqi=r.aqi,
        pm25=r.pm25,
        pm10=r.pm10,
        no2=r.no2,
        o3=r.o3,
        so2=r.so2,
        co=r.co,
        temp_c=r.temp_c,
        humidity=r.humidity,
        wind_ms=r.wind_ms,
        pressure_hpa=r.pressure_hpa,
        dominant=r.dominant,
        source=r.station_source,
    )
    update_cols = {k: v for k, v in payload.items() if k not in ("station_id", "ts")}
    stmt = (
        insert(Reading)
        .values(**payload)
        .on_conflict_do_update(
            index_elements=["station_id", "ts"],
            set_=update_cols,
        )
    )
    await session.execute(stmt)


async def _upsert_forecast_rows(
    session: AsyncSession,
    station_id: int,
    source: str,
    rows: Iterable[dict[str, Any]],
) -> None:
    """rows: list of {day: date, pollutant: str, avg, min, max}."""
    for row in rows:
        payload = dict(
            station_id=station_id,
            day=row["day"],
            pollutant=row["pollutant"],
            avg=_dec(row.get("avg")),
            min=_dec(row.get("min")),
            max=_dec(row.get("max")),
            source=source,
        )
        stmt = (
            insert(Forecast)
            .values(**payload)
            .on_conflict_do_update(
                index_elements=["station_id", "day", "pollutant"],
                set_={
                    "avg": payload["avg"],
                    "min": payload["min"],
                    "max": payload["max"],
                    "source": source,
                },
            )
        )
        await session.execute(stmt)


# ---------------------------------------------------------------------------
# WAQI normalizers
# ---------------------------------------------------------------------------


def _waqi_feed_to_reading(feed: dict[str, Any]) -> NormalizedReading:
    iaqi = feed.get("iaqi") or {}
    geo = feed.get("city", {}).get("geo") or [0.0, 0.0]
    ts = _parse_iso(feed.get("time", {}).get("iso")) or datetime.now(WIB_OFFSET)
    aqi = feed.get("aqi") if isinstance(feed.get("aqi"), int) else None
    return NormalizedReading(
        station_source="waqi",
        station_source_id=str(feed.get("idx")),
        station_name=feed.get("city", {}).get("name", "Unknown"),
        lat=float(geo[0]),
        lon=float(geo[1]),
        ts=ts,
        aqi=aqi,
        pm25=_dec(iaqi.get("pm25", {}).get("v") if iaqi.get("pm25") else None),
        pm10=_dec(iaqi.get("pm10", {}).get("v") if iaqi.get("pm10") else None),
        no2=_dec(iaqi.get("no2", {}).get("v") if iaqi.get("no2") else None),
        o3=_dec(iaqi.get("o3", {}).get("v") if iaqi.get("o3") else None),
        so2=_dec(iaqi.get("so2", {}).get("v") if iaqi.get("so2") else None),
        co=_dec(iaqi.get("co", {}).get("v") if iaqi.get("co") else None),
        temp_c=_dec(iaqi.get("t", {}).get("v") if iaqi.get("t") else None),
        humidity=_dec(iaqi.get("h", {}).get("v") if iaqi.get("h") else None),
        wind_ms=_dec(iaqi.get("w", {}).get("v") if iaqi.get("w") else None),
        pressure_hpa=_dec(iaqi.get("p", {}).get("v") if iaqi.get("p") else None),
        dominant=feed.get("dominentpol"),
    )


async def _upsert_waqi_feed(feed: dict[str, Any]) -> int:
    reading = _waqi_feed_to_reading(feed)
    async with session_scope() as session:
        await _upsert_reading(session, reading)
        # Forecast: pm25, pm10, o3 if present
        daily = (feed.get("forecast") or {}).get("daily") or {}
        rows: list[dict[str, Any]] = []
        for pollutant in ("pm25", "pm10", "o3"):
            for point in daily.get(pollutant) or []:
                day = _parse_iso(point.get("day"))
                if not day:
                    # WAQI's day is YYYY-MM-DD only
                    try:
                        from datetime import date

                        day = datetime.strptime(point["day"], "%Y-%m-%d").date()
                    except (KeyError, ValueError):
                        continue
                else:
                    day = day.date()
                rows.append(
                    {
                        "day": day,
                        "pollutant": pollutant,
                        "avg": point.get("avg"),
                        "min": point.get("min"),
                        "max": point.get("max"),
                    }
                )
        if rows:
            station = (
                await session.execute(
                    select(Station).where(
                        Station.source == "waqi",
                        Station.source_id == reading.station_source_id,
                    )
                )
            ).scalar_one()
            await _upsert_forecast_rows(session, station.id, "waqi", rows)
    return 1


async def _upsert_waqi_bounds(stations: list[dict[str, Any]]) -> int:
    count = 0
    async with session_scope() as session:
        for s in stations:
            try:
                aqi_raw = s.get("aqi")
                aqi = int(aqi_raw) if isinstance(aqi_raw, (int, str)) and str(aqi_raw).strip().isdigit() else None
                if aqi is None:
                    continue
                ts = _parse_iso(s.get("station", {}).get("time")) or datetime.now(WIB_OFFSET)
                station = await _get_or_create_station(
                    session,
                    source="waqi",
                    source_id=str(s["uid"]),
                    name=s.get("station", {}).get("name", f"WAQI {s['uid']}"),
                    lat=float(s["lat"]),
                    lon=float(s["lon"]),
                )
                # AQI-only upsert: do NOT overwrite richer pollutant data that
                # the feed job may have already written for this (station, ts).
                payload = dict(
                    station_id=station.id,
                    ts=ts,
                    aqi=aqi,
                    source="waqi",
                )
                stmt = (
                    insert(Reading)
                    .values(**payload)
                    .on_conflict_do_update(
                        index_elements=["station_id", "ts"],
                        set_={"aqi": aqi, "source": "waqi"},
                    )
                )
                await session.execute(stmt)
                count += 1
            except (KeyError, ValueError, TypeError) as exc:
                log.warning("waqi.bounds.skip", error=str(exc), station=s.get("uid"))
    return count


# ---------------------------------------------------------------------------
# Open-Meteo normalizers
# ---------------------------------------------------------------------------


def _openmeteo_current_to_reading(
    nb: openmeteo.Neighborhood,
    loc: dict[str, Any],
) -> NormalizedReading | None:
    current = loc.get("current") or {}
    aqi_raw = current.get("us_aqi")
    if aqi_raw is None:
        return None
    ts = _parse_iso(current.get("time"))
    if not ts:
        ts = datetime.now(WIB_OFFSET)
    # Open-Meteo returns naive ISO strings in local TZ — attach WIB offset.
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=WIB_OFFSET)

    pm25_raw = current.get("pm2_5")
    pm10_raw = current.get("pm10")
    o3_raw = current.get("ozone")
    no2_raw = current.get("nitrogen_dioxide")
    so2_raw = current.get("sulphur_dioxide")
    co_raw = current.get("carbon_monoxide")

    # Translate concentrations to iAQI for per-pollutant cards.
    pm25_iaqi = pm25_to_aqi(pm25_raw) if pm25_raw is not None else None
    pm10_iaqi = pm10_to_aqi(pm10_raw) if pm10_raw is not None else None
    o3_iaqi = o3_to_aqi(o3_raw) if o3_raw is not None else None
    no2_iaqi = no2_to_aqi(no2_raw) if no2_raw is not None else None
    so2_iaqi = so2_to_aqi(so2_raw) if so2_raw is not None else None
    co_iaqi = co_to_aqi(co_raw / 1000.0) if co_raw is not None else None

    candidates = [
        (pm25_iaqi, "pm25"),
        (pm10_iaqi, "pm10"),
        (o3_iaqi, "o3"),
        (no2_iaqi, "no2"),
    ]
    dominant = max(
        (c for c in candidates if c[0] is not None),
        key=lambda c: c[0],
        default=(None, None),
    )[1]

    return NormalizedReading(
        station_source="openmeteo",
        station_source_id=str(nb.id),
        station_name=nb.name,
        lat=nb.lat,
        lon=nb.lon,
        ts=ts,
        aqi=int(round(aqi_raw)),
        pm25=_dec(pm25_iaqi),
        pm10=_dec(pm10_iaqi),
        no2=_dec(no2_iaqi),
        o3=_dec(o3_iaqi),
        so2=_dec(so2_iaqi),
        co=_dec(co_iaqi),
        temp_c=None,
        humidity=None,
        wind_ms=None,
        pressure_hpa=None,
        dominant=dominant,
    )


async def _upsert_openmeteo_current(locations: list[dict[str, Any]]) -> int:
    count = 0
    async with session_scope() as session:
        for nb, loc in zip(openmeteo.JAKARTA_NEIGHBORHOODS, locations, strict=False):
            reading = _openmeteo_current_to_reading(nb, loc)
            if reading is None:
                continue
            await _upsert_reading(session, reading)
            count += 1
    return count


async def _upsert_openmeteo_hourly(
    nb: openmeteo.Neighborhood,
    loc: dict[str, Any],
) -> int:
    """Upsert every hourly point up to `now`. Idempotent on (station_id, ts)."""
    hourly = loc.get("hourly") or {}
    times = hourly.get("time") or []
    aqi_series = hourly.get("us_aqi") or []
    pm25_series = hourly.get("pm2_5") or []
    pm10_series = hourly.get("pm10") or []
    o3_series = hourly.get("ozone") or []
    no2_series = hourly.get("nitrogen_dioxide") or []
    so2_series = hourly.get("sulphur_dioxide") or []
    co_series = hourly.get("carbon_monoxide") or []

    now = datetime.now(WIB_OFFSET)
    count = 0
    async with session_scope() as session:
        station = await _get_or_create_station(
            session,
            source="openmeteo",
            source_id=str(nb.id),
            name=nb.name,
            lat=nb.lat,
            lon=nb.lon,
        )
        for i, t in enumerate(times):
            aqi_val = aqi_series[i] if i < len(aqi_series) else None
            if aqi_val is None:
                continue
            ts = _parse_iso(t)
            if ts is None:
                continue
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=WIB_OFFSET)
            # Don't pollute the DB with future hours from the forecast horizon.
            if ts > now:
                break

            payload = dict(
                station_id=station.id,
                ts=ts,
                aqi=int(round(aqi_val)),
                pm25=_dec(pm25_to_aqi(pm25_series[i]) if i < len(pm25_series) and pm25_series[i] is not None else None),
                pm10=_dec(pm10_to_aqi(pm10_series[i]) if i < len(pm10_series) and pm10_series[i] is not None else None),
                no2=_dec(no2_to_aqi(no2_series[i]) if i < len(no2_series) and no2_series[i] is not None else None),
                o3=_dec(o3_to_aqi(o3_series[i]) if i < len(o3_series) and o3_series[i] is not None else None),
                so2=_dec(so2_to_aqi(so2_series[i]) if i < len(so2_series) and so2_series[i] is not None else None),
                co=_dec(co_to_aqi(co_series[i] / 1000.0) if i < len(co_series) and co_series[i] is not None else None),
                temp_c=None,
                humidity=None,
                wind_ms=None,
                pressure_hpa=None,
                dominant=None,
                source="openmeteo",
            )
            update_cols = {k: v for k, v in payload.items() if k not in ("station_id", "ts")}
            stmt = (
                insert(Reading)
                .values(**payload)
                .on_conflict_do_update(
                    index_elements=["station_id", "ts"],
                    set_=update_cols,
                )
            )
            await session.execute(stmt)
            count += 1

        # Also derive daily forecast points by aggregating future hours per day.
        future_rows: dict[tuple[str, str], dict[str, Any]] = {}
        for i, t in enumerate(times):
            ts = _parse_iso(t)
            if ts is None:
                continue
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=WIB_OFFSET)
            day = ts.date()
            for pollutant, series, converter in (
                ("pm25", pm25_series, pm25_to_aqi),
                ("pm10", pm10_series, pm10_to_aqi),
                ("o3", o3_series, o3_to_aqi),
            ):
                if i < len(series) and series[i] is not None:
                    key = (str(day), pollutant)
                    val = converter(series[i])
                    bucket = future_rows.setdefault(
                        key,
                        {"day": day, "pollutant": pollutant, "values": []},
                    )
                    bucket["values"].append(val)

        forecast_rows = []
        for bucket in future_rows.values():
            vals: list[int] = bucket["values"]
            if not vals:
                continue
            forecast_rows.append(
                {
                    "day": bucket["day"],
                    "pollutant": bucket["pollutant"],
                    "avg": round(sum(vals) / len(vals)),
                    "min": min(vals),
                    "max": max(vals),
                }
            )
        if forecast_rows:
            await _upsert_forecast_rows(session, station.id, "openmeteo", forecast_rows)

    return count


async def run_all_jobs() -> dict[str, int]:
    """Convenience: run every ingestor once. Used on startup."""
    results: dict[str, int] = {}
    for name, fn in (
        ("waqi_jakarta_feed", ingest_waqi_jakarta_feed),
        ("waqi_bounds", ingest_waqi_bounds),
        ("openmeteo_current", ingest_openmeteo_current),
        ("openmeteo_history", ingest_openmeteo_history),
    ):
        try:
            results[name] = await fn()
            log.info("ingest.ok", job=name, count=results[name])
        except Exception as exc:  # noqa: BLE001 — never crash the scheduler
            log.error("ingest.fail", job=name, error=str(exc))
            results[name] = -1
    return results
