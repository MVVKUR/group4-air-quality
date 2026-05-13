/**
 * Backwards-compatible thin wrappers for the components that used to call
 * Open-Meteo directly. All of these now hit the ChildAir backend (`/api/v1/*`),
 * which owns the AQI breakpoint conversions and the upstream fetch.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

interface HourlyPoint {
  t: string;
  aqi: number;
}

/**
 * 24-hour history for a specific station (defaults to Jakarta's primary WAQI
 * station, uid 1 in our DB once the first ingestion run completes).
 * `lat`/`lon` are accepted for source compatibility but unused; the trend
 * chart now passes a `stationId` instead.
 */
export async function fetchOpenMeteoHourlyHistory(
  stationId: number,
  signal?: AbortSignal,
): Promise<HourlyPoint[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/stations/${stationId}/readings?hours=24`,
    { signal, headers: { Accept: 'application/json' } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  return (await res.json()) as HourlyPoint[];
}
