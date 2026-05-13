"""WAQI (aqicn.org) HTTP client.

Ported from src/lib/waqi-api.ts. Returns plain dicts so the ingestion service
owns normalization — keeps the client thin and easy to test.
"""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("waqi")


class WaqiError(RuntimeError):
    """Raised when WAQI returns status != 'ok' or HTTP fails."""


async def _get(client: httpx.AsyncClient, path: str) -> Any:
    if not settings.waqi_token:
        raise WaqiError("WAQI_TOKEN is empty — set it in the environment.")
    sep = "&" if "?" in path else "?"
    url = f"{settings.waqi_base_url}{path}{sep}token={settings.waqi_token}"
    resp = await client.get(url, timeout=15.0)
    resp.raise_for_status()
    body = resp.json()
    if body.get("status") != "ok":
        raise WaqiError(f"WAQI error for {path}: {body.get('data')}")
    return body["data"]


async def fetch_jakarta_feed(client: httpx.AsyncClient) -> dict[str, Any]:
    """Returns the WAQI city feed for Jakarta (currently the Kemayoran sensor)."""
    return await _get(client, "/feed/jakarta/")


async def fetch_station_feed(client: httpx.AsyncClient, uid: int) -> dict[str, Any]:
    return await _get(client, f"/feed/@{uid}/")


async def fetch_stations_in_bounds(
    client: httpx.AsyncClient,
) -> list[dict[str, Any]]:
    """Lists stations within the configured Jakarta bounding box."""
    south, west, north, east = settings.jakarta_bounds_tuple
    path = f"/map/bounds/?latlng={south},{west},{north},{east}"
    data = await _get(client, path)
    return data if isinstance(data, list) else []
