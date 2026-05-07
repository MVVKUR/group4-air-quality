import type {
  IAQIMap,
  NormalizedStation,
  WaqiFeed,
  WaqiForecastDaily,
  WaqiForecastPoint,
} from '@/types/waqi';

const BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const HOURLY_POLLUTANTS = [
  'us_aqi',
  'pm2_5',
  'pm10',
  'ozone',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'carbon_monoxide',
] as const;

const CURRENT_FIELDS = [
  'us_aqi',
  'pm2_5',
  'pm10',
  'ozone',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'carbon_monoxide',
] as const;

interface OpenMeteoCurrent {
  time: string;
  us_aqi?: number;
  pm2_5?: number;
  pm10?: number;
  ozone?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  carbon_monoxide?: number;
}

interface OpenMeteoHourly {
  time: string[];
  us_aqi?: (number | null)[];
  pm2_5?: (number | null)[];
  pm10?: (number | null)[];
  ozone?: (number | null)[];
  nitrogen_dioxide?: (number | null)[];
  sulphur_dioxide?: (number | null)[];
  carbon_monoxide?: (number | null)[];
}

interface OpenMeteoLocation {
  latitude: number;
  longitude: number;
  utc_offset_seconds: number;
  timezone: string;
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
}

export interface JakartaNeighborhood {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

// Synthetic IDs in 1001-1099 range — distinct from WAQI uids (8000+).
// Coordinates chosen to spread coverage across Greater Jakarta neighborhoods.
export const JAKARTA_NEIGHBORHOODS: JakartaNeighborhood[] = [
  { id: 1001, name: 'Bundaran HI', lat: -6.1944, lon: 106.8229 },
  { id: 1002, name: 'Kuningan', lat: -6.2351, lon: 106.8307 },
  { id: 1003, name: 'Senayan', lat: -6.2256, lon: 106.8019 },
  { id: 1004, name: 'Pondok Indah', lat: -6.2649, lon: 106.7842 },
  { id: 1005, name: 'Cilandak', lat: -6.2884, lon: 106.7993 },
  { id: 1006, name: 'Kelapa Gading', lat: -6.1513, lon: 106.9046 },
  { id: 1007, name: 'Cempaka Putih', lat: -6.1716, lon: 106.8689 },
  { id: 1008, name: 'Tanjung Priok', lat: -6.1066, lon: 106.8814 },
  { id: 1009, name: 'Pluit', lat: -6.1265, lon: 106.7894 },
  { id: 1010, name: 'Slipi', lat: -6.1864, lon: 106.7976 },
  { id: 1011, name: 'Jatinegara', lat: -6.2287, lon: 106.8702 },
  { id: 1012, name: 'Cawang', lat: -6.244, lon: 106.8717 },
  { id: 1013, name: 'Pasar Minggu', lat: -6.2855, lon: 106.8451 },
  { id: 1014, name: 'Mangga Dua', lat: -6.1387, lon: 106.8276 },
  { id: 1015, name: 'Sunter', lat: -6.1494, lon: 106.8717 },
  { id: 1016, name: 'Lebak Bulus', lat: -6.2904, lon: 106.7755 },
  { id: 1017, name: 'Cibubur', lat: -6.3678, lon: 106.8898 },
  { id: 1018, name: 'Bekasi (Bantar Gebang)', lat: -6.3119, lon: 106.9899 },
  { id: 1019, name: 'Tangerang (Karawaci)', lat: -6.2257, lon: 106.6034 },
  { id: 1020, name: 'Depok (Margonda)', lat: -6.3927, lon: 106.8225 },
  { id: 1021, name: 'BSD', lat: -6.2926, lon: 106.6717 },
  { id: 1022, name: 'Cilincing', lat: -6.1097, lon: 106.9322 },
  { id: 1023, name: 'Ancol', lat: -6.1225, lon: 106.8408 },
  { id: 1024, name: 'Cikarang', lat: -6.2659, lon: 107.1518 },
];

export function isOpenMeteoStationId(id: number): boolean {
  return id >= 1000 && id < 2000;
}

export function findNeighborhood(id: number): JakartaNeighborhood | undefined {
  return JAKARTA_NEIGHBORHOODS.find((n) => n.id === id);
}

async function fetchOpenMeteo(
  url: string,
  signal?: AbortSignal,
): Promise<OpenMeteoLocation[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as OpenMeteoLocation | OpenMeteoLocation[];
  return Array.isArray(json) ? json : [json];
}

export async function fetchOpenMeteoStations(
  signal?: AbortSignal,
): Promise<NormalizedStation[]> {
  const lats = JAKARTA_NEIGHBORHOODS.map((n) => n.lat).join(',');
  const lons = JAKARTA_NEIGHBORHOODS.map((n) => n.lon).join(',');
  const url = `${BASE_URL}?latitude=${lats}&longitude=${lons}&current=${CURRENT_FIELDS.join(
    ',',
  )}&timezone=Asia%2FJakarta`;
  const locations = await fetchOpenMeteo(url, signal);

  return JAKARTA_NEIGHBORHOODS.map((nb, i) => {
    const loc = locations[i];
    const aqi =
      typeof loc?.current?.us_aqi === 'number' ? Math.round(loc.current.us_aqi) : null;
    return {
      uid: nb.id,
      name: nb.name,
      lat: nb.lat,
      lon: nb.lon,
      aqi,
      updatedAt: loc?.current?.time
        ? `${loc.current.time}${formatOffset(loc.utc_offset_seconds)}`
        : new Date().toISOString(),
    };
  });
}

export async function fetchOpenMeteoStationFeed(
  id: number,
  signal?: AbortSignal,
): Promise<WaqiFeed> {
  const nb = findNeighborhood(id);
  if (!nb) throw new Error(`Unknown Jakarta station id: ${id}`);
  const url =
    `${BASE_URL}?latitude=${nb.lat}&longitude=${nb.lon}` +
    `&current=${CURRENT_FIELDS.join(',')}` +
    `&hourly=${HOURLY_POLLUTANTS.join(',')}` +
    `&past_days=1&forecast_days=5&timezone=Asia%2FJakarta`;
  const [loc] = await fetchOpenMeteo(url, signal);
  if (!loc?.current) throw new Error('Open-Meteo returned no current reading');

  const iaqi = currentToIaqi(loc.current);
  const dominent = pickDominant(loc.current);
  const forecast = hourlyToDailyForecast(loc.hourly);
  const aqi =
    typeof loc.current.us_aqi === 'number' ? Math.round(loc.current.us_aqi) : 0;

  return {
    aqi,
    idx: id,
    city: { name: nb.name, geo: [nb.lat, nb.lon] },
    dominentpol: dominent,
    iaqi,
    time: {
      iso: `${loc.current.time}${formatOffset(loc.utc_offset_seconds)}`,
      tz: formatOffset(loc.utc_offset_seconds),
    },
    forecast: { daily: forecast },
    attributions: [
      {
        name: 'Open-Meteo (CAMS air quality model)',
        url: 'https://open-meteo.com/en/docs/air-quality-api',
      },
    ],
  };
}

export async function fetchOpenMeteoHourlyHistory(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<{ t: string; aqi: number }[]> {
  const url =
    `${BASE_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=us_aqi&past_days=1&forecast_days=1&timezone=Asia%2FJakarta`;
  const [loc] = await fetchOpenMeteo(url, signal);
  const times = loc?.hourly?.time ?? [];
  const values = loc?.hourly?.us_aqi ?? [];

  // Restrict to the most recent 24 hours up to "now".
  const now = Date.now();
  const points: { t: string; aqi: number }[] = [];
  const offset = formatOffset(loc?.utc_offset_seconds ?? 7 * 3600);
  for (let i = 0; i < times.length; i++) {
    const v = values[i];
    if (typeof v !== 'number') continue;
    const iso = `${times[i]}${offset}`;
    const ts = Date.parse(iso);
    if (Number.isFinite(ts) && ts <= now) {
      points.push({ t: iso, aqi: Math.round(v) });
    }
  }
  return points.slice(-24);
}

function currentToIaqi(current: OpenMeteoCurrent): IAQIMap {
  // Open-Meteo returns raw concentrations (µg/m³ for particulates and gases,
  // mg/m³ × 1000 for CO). The dashboard cards expect EPA "iAQI" 0–500. We
  // approximate using simplified linear scales — close enough for visual
  // severity; the headline number stays us_aqi from the model.
  const out: IAQIMap = {};
  if (typeof current.us_aqi === 'number') out.pm25 = { v: Math.round(current.us_aqi) };
  if (typeof current.pm10 === 'number') {
    out.pm10 = { v: Math.round(pm10ToAqi(current.pm10)) };
  }
  if (typeof current.ozone === 'number') {
    out.o3 = { v: Math.round(o3ToAqi(current.ozone)) };
  }
  if (typeof current.nitrogen_dioxide === 'number') {
    out.no2 = { v: Math.round(no2ToAqi(current.nitrogen_dioxide)) };
  }
  if (typeof current.sulphur_dioxide === 'number') {
    out.so2 = { v: Math.round(so2ToAqi(current.sulphur_dioxide)) };
  }
  if (typeof current.carbon_monoxide === 'number') {
    out.co = { v: Math.round(coToAqi(current.carbon_monoxide / 1000)) };
  }
  if (typeof current.pm2_5 === 'number') {
    out.pm25 = { v: Math.round(pm25ToAqi(current.pm2_5)) };
  }
  return out;
}

function pickDominant(current: OpenMeteoCurrent): string {
  const candidates: { key: string; aqi: number }[] = [];
  if (typeof current.pm2_5 === 'number') candidates.push({ key: 'pm25', aqi: pm25ToAqi(current.pm2_5) });
  if (typeof current.pm10 === 'number') candidates.push({ key: 'pm10', aqi: pm10ToAqi(current.pm10) });
  if (typeof current.ozone === 'number') candidates.push({ key: 'o3', aqi: o3ToAqi(current.ozone) });
  if (typeof current.nitrogen_dioxide === 'number')
    candidates.push({ key: 'no2', aqi: no2ToAqi(current.nitrogen_dioxide) });
  if (candidates.length === 0) return 'pm25';
  return candidates.sort((a, b) => b.aqi - a.aqi)[0].key;
}

function hourlyToDailyForecast(hourly?: OpenMeteoHourly): WaqiForecastDaily {
  if (!hourly?.time?.length) return {};
  const buckets = new Map<
    string,
    { pm25: number[]; pm10: number[]; o3: number[] }
  >();
  for (let i = 0; i < hourly.time.length; i++) {
    const day = hourly.time[i].slice(0, 10);
    const bucket =
      buckets.get(day) ?? { pm25: [], pm10: [], o3: [] };
    const pm25 = hourly.pm2_5?.[i];
    const pm10 = hourly.pm10?.[i];
    const o3 = hourly.ozone?.[i];
    if (typeof pm25 === 'number') bucket.pm25.push(pm25ToAqi(pm25));
    if (typeof pm10 === 'number') bucket.pm10.push(pm10ToAqi(pm10));
    if (typeof o3 === 'number') bucket.o3.push(o3ToAqi(o3));
    buckets.set(day, bucket);
  }
  const days = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const point = (day: string, values: number[]): WaqiForecastPoint | null => {
    if (values.length === 0) return null;
    const min = Math.round(Math.min(...values));
    const max = Math.round(Math.max(...values));
    const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    return { day, min, max, avg };
  };
  const pm25: WaqiForecastPoint[] = [];
  const pm10: WaqiForecastPoint[] = [];
  const o3: WaqiForecastPoint[] = [];
  for (const [day, b] of days) {
    const p25 = point(day, b.pm25);
    const p10 = point(day, b.pm10);
    const po3 = point(day, b.o3);
    if (p25) pm25.push(p25);
    if (p10) pm10.push(p10);
    if (po3) o3.push(po3);
  }
  return { pm25, pm10, o3 };
}

function formatOffset(seconds: number): string {
  if (!seconds) return '+00:00';
  const sign = seconds >= 0 ? '+' : '-';
  const abs = Math.abs(seconds);
  const hh = String(Math.floor(abs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

// US EPA AQI breakpoint conversions (simplified — concentration → iAQI 0–500).
// References: https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf
function piecewise(
  c: number,
  bp: ReadonlyArray<readonly [number, number, number, number]>,
): number {
  for (const [cLow, cHigh, iLow, iHigh] of bp) {
    if (c <= cHigh) {
      return ((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow;
    }
  }
  const last = bp[bp.length - 1];
  return last[3];
}

const PM25_BP = [
  [0.0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 500.4, 301, 500],
] as const;

const PM10_BP = [
  [0, 54, 0, 50],
  [55, 154, 51, 100],
  [155, 254, 101, 150],
  [255, 354, 151, 200],
  [355, 424, 201, 300],
  [425, 604, 301, 500],
] as const;

// Ozone (µg/m³ → ppb at 25°C, 1 atm — divide by 1.96 — but Open-Meteo µg/m³
// for O₃ is already comparable to PM scales for visual severity.
const O3_BP = [
  [0, 54, 0, 50],
  [55, 124, 51, 100],
  [125, 164, 101, 150],
  [165, 204, 151, 200],
  [205, 404, 201, 300],
  [405, 604, 301, 500],
] as const;

const NO2_BP = [
  [0, 53, 0, 50],
  [54, 100, 51, 100],
  [101, 360, 101, 150],
  [361, 649, 151, 200],
  [650, 1249, 201, 300],
  [1250, 2049, 301, 500],
] as const;

const SO2_BP = [
  [0, 35, 0, 50],
  [36, 75, 51, 100],
  [76, 185, 101, 150],
  [186, 304, 151, 200],
  [305, 604, 201, 300],
  [605, 1004, 301, 500],
] as const;

const CO_BP = [
  [0.0, 4.4, 0, 50],
  [4.5, 9.4, 51, 100],
  [9.5, 12.4, 101, 150],
  [12.5, 15.4, 151, 200],
  [15.5, 30.4, 201, 300],
  [30.5, 50.4, 301, 500],
] as const;

function pm25ToAqi(c: number): number {
  return piecewise(Math.max(0, c), PM25_BP);
}
function pm10ToAqi(c: number): number {
  return piecewise(Math.max(0, c), PM10_BP);
}
function o3ToAqi(c: number): number {
  return piecewise(Math.max(0, c), O3_BP);
}
function no2ToAqi(c: number): number {
  return piecewise(Math.max(0, c), NO2_BP);
}
function so2ToAqi(c: number): number {
  return piecewise(Math.max(0, c), SO2_BP);
}
function coToAqi(ppm: number): number {
  return piecewise(Math.max(0, ppm), CO_BP);
}
