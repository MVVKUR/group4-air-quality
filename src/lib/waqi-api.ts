import type {
  NormalizedStation,
  WaqiBoundsStation,
  WaqiFeed,
  WaqiResponse,
} from '@/types/waqi';
import { JAKARTA_BOUNDS_TUPLE, JAKARTA_FEED_KEY } from './constants';
import { parseAQI } from './aqi-utils';
import {
  MOCK_JAKARTA_FEED,
  MOCK_JAKARTA_STATIONS,
  buildMockStationFeed,
} from '@/mocks/jakarta';
import {
  fetchOpenMeteoStationFeed,
  fetchOpenMeteoStations,
  isOpenMeteoStationId,
} from './openmeteo-api';

const BASE_URL = 'https://api.waqi.info';

function getToken(): string {
  return import.meta.env.VITE_WAQI_TOKEN ?? '';
}

export function isUsingMockData(): boolean {
  return !getToken();
}

async function waqiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('WAQI token missing. Set VITE_WAQI_TOKEN in .env.local.');
  }
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${sep}token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`WAQI request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as WaqiResponse<T>;
  if (json.status !== 'ok') {
    const detail = typeof json.data === 'string' ? json.data : 'unknown error';
    throw new Error(`WAQI API error: ${detail}`);
  }
  return json.data;
}

export async function fetchJakartaFeed(signal?: AbortSignal): Promise<WaqiFeed> {
  if (isUsingMockData()) return MOCK_JAKARTA_FEED;
  return waqiFetch<WaqiFeed>(`/feed/${JAKARTA_FEED_KEY}/`, signal);
}

export async function fetchStationFeed(
  uid: number,
  signal?: AbortSignal,
): Promise<WaqiFeed> {
  // Open-Meteo synthetic ids (1000-1999) → live model readings per coordinate.
  if (isOpenMeteoStationId(uid)) return fetchOpenMeteoStationFeed(uid, signal);
  // Negative ids reserved for legacy demo fallback.
  if (uid < 0) return buildMockStationFeed(-uid);
  if (isUsingMockData()) return buildMockStationFeed(uid);
  // Real WAQI station uid.
  return waqiFetch<WaqiFeed>(`/feed/@${uid}/`, signal);
}

export async function fetchStationsInJakarta(
  signal?: AbortSignal,
): Promise<NormalizedStation[]> {
  // Always pull the 24 Open-Meteo neighborhood readings — these are live.
  // In parallel, try WAQI's bounds endpoint for any official BMKG stations.
  const [openMeteoStations, waqiStations] = await Promise.all([
    fetchOpenMeteoStations(signal),
    fetchWaqiBoundsStations(signal).catch(() => [] as NormalizedStation[]),
  ]);

  // Prefer WAQI when a live station is close to a neighborhood — it's the
  // official BMKG sensor reading. Drop the colocated Open-Meteo point so we
  // don't show two markers on top of each other.
  const merged: NormalizedStation[] = [...waqiStations];
  for (const om of openMeteoStations) {
    const tooClose = waqiStations.some(
      (w) => Math.hypot(w.lat - om.lat, w.lon - om.lon) < 0.025,
    );
    if (!tooClose) merged.push(om);
  }
  return merged;
}

async function fetchWaqiBoundsStations(
  signal?: AbortSignal,
): Promise<NormalizedStation[]> {
  if (isUsingMockData()) return [];
  const [s, w, n, e] = JAKARTA_BOUNDS_TUPLE;
  const path = `/map/bounds/?latlng=${s},${w},${n},${e}`;
  const stations = await waqiFetch<WaqiBoundsStation[]>(path, signal);
  return stations.map(normalizeStation).filter((st) => st.aqi !== null);
}

export async function fetchNearestStation(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WaqiFeed> {
  if (isUsingMockData()) {
    const nearest = MOCK_JAKARTA_STATIONS.reduce((acc, st) => {
      const d = (st.lat - lat) ** 2 + (st.lon - lon) ** 2;
      return !acc || d < acc.d ? { d, st } : acc;
    }, null as { d: number; st: WaqiBoundsStation } | null);
    return buildMockStationFeed(nearest?.st.uid ?? MOCK_JAKARTA_STATIONS[0].uid);
  }
  return waqiFetch<WaqiFeed>(`/feed/geo:${lat};${lon}/`, signal);
}

function normalizeStation(s: WaqiBoundsStation): NormalizedStation {
  return {
    uid: s.uid,
    name: s.station.name,
    lat: s.lat,
    lon: s.lon,
    aqi: parseAQI(s.aqi),
    updatedAt: s.station.time,
  };
}
