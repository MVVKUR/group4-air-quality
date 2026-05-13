"""US EPA AQI breakpoint conversions.

Ported from src/lib/openmeteo-api.ts. Inputs are raw concentrations in
the canonical units below; outputs are 0-500 iAQI integers.

References:
- https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf
"""

from __future__ import annotations

# (concentration_low, concentration_high, iAQI_low, iAQI_high)
_PM25_BP: tuple[tuple[float, float, int, int], ...] = (
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 500.4, 301, 500),
)
_PM10_BP: tuple[tuple[float, float, int, int], ...] = (
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 604, 301, 500),
)
_O3_BP: tuple[tuple[float, float, int, int], ...] = (
    (0, 54, 0, 50),
    (55, 124, 51, 100),
    (125, 164, 101, 150),
    (165, 204, 151, 200),
    (205, 404, 201, 300),
    (405, 604, 301, 500),
)
_NO2_BP: tuple[tuple[float, float, int, int], ...] = (
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 2049, 301, 500),
)
_SO2_BP: tuple[tuple[float, float, int, int], ...] = (
    (0, 35, 0, 50),
    (36, 75, 51, 100),
    (76, 185, 101, 150),
    (186, 304, 151, 200),
    (305, 604, 201, 300),
    (605, 1004, 301, 500),
)
_CO_BP: tuple[tuple[float, float, int, int], ...] = (
    (0.0, 4.4, 0, 50),
    (4.5, 9.4, 51, 100),
    (9.5, 12.4, 101, 150),
    (12.5, 15.4, 151, 200),
    (15.5, 30.4, 201, 300),
    (30.5, 50.4, 301, 500),
)


def _piecewise(c: float, bp: tuple[tuple[float, float, int, int], ...]) -> int:
    """Linear interpolation across breakpoint segments."""
    c = max(0.0, c)
    for c_low, c_high, i_low, i_high in bp:
        if c <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (c - c_low) + i_low)
    return bp[-1][3]


def pm25_to_aqi(c: float) -> int:
    """µg/m³ → iAQI."""
    return _piecewise(c, _PM25_BP)


def pm10_to_aqi(c: float) -> int:
    """µg/m³ → iAQI."""
    return _piecewise(c, _PM10_BP)


def o3_to_aqi(c: float) -> int:
    """µg/m³ (8h avg) → iAQI."""
    return _piecewise(c, _O3_BP)


def no2_to_aqi(c: float) -> int:
    """µg/m³ → iAQI."""
    return _piecewise(c, _NO2_BP)


def so2_to_aqi(c: float) -> int:
    """µg/m³ → iAQI."""
    return _piecewise(c, _SO2_BP)


def co_to_aqi(ppm: float) -> int:
    """ppm → iAQI. Open-Meteo returns µg/m³; divide by 1000 before calling."""
    return _piecewise(ppm, _CO_BP)
