import type { NormalizedStation, WaqiFeed } from '@/types/waqi';

/**
 * Client wrapper for the ChildAir backend.
 *
 * All upstream API calls (WAQI, Open-Meteo) happen server-side. The browser
 * only ever talks to `/api/v1/*` on the same origin. Function names are kept
 * stable for backwards compatibility with the rest of the codebase.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function url(path: string): string {
  return `${API_BASE}${path}`;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url(path), {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status} ${path}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** Demo-mode banner is no longer relevant — backend handles all upstream fallbacks. */
export function isUsingMockData(): boolean {
  return false;
}

export async function fetchJakartaFeed(signal?: AbortSignal): Promise<WaqiFeed> {
  return getJson<WaqiFeed>('/api/v1/feed/jakarta', signal);
}

export async function fetchStationFeed(
  uid: number,
  signal?: AbortSignal,
): Promise<WaqiFeed> {
  return getJson<WaqiFeed>(`/api/v1/stations/${uid}`, signal);
}

export async function fetchStationsInJakarta(
  signal?: AbortSignal,
): Promise<NormalizedStation[]> {
  return getJson<NormalizedStation[]>('/api/v1/stations', signal);
}

/**
 * Used by the "Locate me" flow to snap to the nearest station. The backend
 * doesn't have a geo endpoint yet, so do the proximity lookup client-side
 * against the same list we already render.
 */
export async function fetchNearestStation(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WaqiFeed> {
  const stations = await fetchStationsInJakarta(signal);
  if (stations.length === 0) {
    throw new Error('No stations available.');
  }
  const nearest = stations.reduce((acc, st) => {
    const d = (st.lat - lat) ** 2 + (st.lon - lon) ** 2;
    return !acc || d < acc.d ? { d, st } : acc;
  }, null as { d: number; st: NormalizedStation } | null);
  if (!nearest) throw new Error('No stations available.');
  return fetchStationFeed(nearest.st.uid, signal);
}
