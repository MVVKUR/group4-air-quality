"""Open-Meteo Air Quality HTTP client.

Ported from src/lib/openmeteo-api.ts. Hits the public CAMS endpoint — no key
required. Returns raw JSON for the ingestion service to normalize.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


@dataclass(frozen=True)
class Neighborhood:
    """Hard-coded sampling point inside Greater Jakarta.

    Synthetic ids in 1001-1099 keep them distinct from WAQI uids (8000+).
    """

    id: int
    name: str
    lat: float
    lon: float


JAKARTA_NEIGHBORHOODS: tuple[Neighborhood, ...] = (
    Neighborhood(1001, "Bundaran HI", -6.1944, 106.8229),
    Neighborhood(1002, "Kuningan", -6.2351, 106.8307),
    Neighborhood(1003, "Senayan", -6.2256, 106.8019),
    Neighborhood(1004, "Pondok Indah", -6.2649, 106.7842),
    Neighborhood(1005, "Cilandak", -6.2884, 106.7993),
    Neighborhood(1006, "Kelapa Gading", -6.1513, 106.9046),
    Neighborhood(1007, "Cempaka Putih", -6.1716, 106.8689),
    Neighborhood(1008, "Tanjung Priok", -6.1066, 106.8814),
    Neighborhood(1009, "Pluit", -6.1265, 106.7894),
    Neighborhood(1010, "Slipi", -6.1864, 106.7976),
    Neighborhood(1011, "Jatinegara", -6.2287, 106.8702),
    Neighborhood(1012, "Cawang", -6.244, 106.8717),
    Neighborhood(1013, "Pasar Minggu", -6.2855, 106.8451),
    Neighborhood(1014, "Mangga Dua", -6.1387, 106.8276),
    Neighborhood(1015, "Sunter", -6.1494, 106.8717),
    Neighborhood(1016, "Lebak Bulus", -6.2904, 106.7755),
    Neighborhood(1017, "Cibubur", -6.3678, 106.8898),
    Neighborhood(1018, "Bekasi (Bantar Gebang)", -6.3119, 106.9899),
    Neighborhood(1019, "Tangerang (Karawaci)", -6.2257, 106.6034),
    Neighborhood(1020, "Depok (Margonda)", -6.3927, 106.8225),
    Neighborhood(1021, "BSD", -6.2926, 106.6717),
    Neighborhood(1022, "Cilincing", -6.1097, 106.9322),
    Neighborhood(1023, "Ancol", -6.1225, 106.8408),
    Neighborhood(1024, "Cikarang", -6.2659, 107.1518),
)

CURRENT_FIELDS = (
    "us_aqi",
    "pm2_5",
    "pm10",
    "ozone",
    "nitrogen_dioxide",
    "sulphur_dioxide",
    "carbon_monoxide",
)
HOURLY_FIELDS = CURRENT_FIELDS


async def fetch_batch_current(
    client: httpx.AsyncClient,
) -> list[dict[str, Any]]:
    """One batched request returning current readings for every neighborhood.

    Open-Meteo accepts comma-separated lat/lon pairs and returns a list of
    location objects in the same order.
    """
    lats = ",".join(str(n.lat) for n in JAKARTA_NEIGHBORHOODS)
    lons = ",".join(str(n.lon) for n in JAKARTA_NEIGHBORHOODS)
    params = {
        "latitude": lats,
        "longitude": lons,
        "current": ",".join(CURRENT_FIELDS),
        "timezone": "Asia/Jakarta",
    }
    resp = await client.get(settings.openmeteo_base_url, params=params, timeout=15.0)
    resp.raise_for_status()
    body = resp.json()
    return body if isinstance(body, list) else [body]


async def fetch_hourly_with_forecast(
    client: httpx.AsyncClient,
    lat: float,
    lon: float,
    *,
    past_days: int = 1,
    forecast_days: int = 5,
) -> dict[str, Any]:
    """Returns hourly history + multi-day forecast for one coordinate."""
    params = {
        "latitude": str(lat),
        "longitude": str(lon),
        "current": ",".join(CURRENT_FIELDS),
        "hourly": ",".join(HOURLY_FIELDS),
        "past_days": str(past_days),
        "forecast_days": str(forecast_days),
        "timezone": "Asia/Jakarta",
    }
    resp = await client.get(settings.openmeteo_base_url, params=params, timeout=15.0)
    resp.raise_for_status()
    body = resp.json()
    return body[0] if isinstance(body, list) else body


def find_neighborhood(neighborhood_id: int) -> Neighborhood | None:
    for n in JAKARTA_NEIGHBORHOODS:
        if n.id == neighborhood_id:
            return n
    return None
