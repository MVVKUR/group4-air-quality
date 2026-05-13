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
 * Jakarta dashboard trend history. The backend serves this from the fixed
 * Open-Meteo Bundaran HI hourly-ingestion station, not the latest WAQI feed
 * station, because WAQI only gives us the current observation.
 */
export async function fetchOpenMeteoHourlyHistory(
  signal?: AbortSignal,
): Promise<HourlyPoint[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/feed/jakarta/readings?hours=25`,
    { signal, headers: { Accept: 'application/json' } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  return (await res.json()) as HourlyPoint[];
}
