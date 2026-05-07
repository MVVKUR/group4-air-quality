export type AQICategoryKey =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'veryUnhealthy'
  | 'hazardous';

export interface AQICategory {
  key: AQICategoryKey;
  label: string;
  range: [number, number];
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  ringClass: string;
  gradientClass: string;
  /** Whether the AQI hex is bright enough that black text reads better */
  preferDarkText: boolean;
  advisory: string;
  shortAdvisory: string;
}

export const AQI_CATEGORIES: AQICategory[] = [
  {
    key: 'good',
    label: 'Good',
    range: [0, 50],
    hex: '#00E400',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    ringClass: 'ring-emerald-500/40',
    gradientClass: 'from-emerald-400 via-emerald-500 to-green-600',
    preferDarkText: true,
    advisory:
      'Air quality is great. Perfect for outdoor activities — open the windows and enjoy.',
    shortAdvisory: 'Great for outdoor activities.',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    range: [51, 100],
    hex: '#FFD400',
    bgClass: 'bg-yellow-400',
    borderClass: 'border-yellow-400',
    textClass: 'text-yellow-600 dark:text-yellow-300',
    ringClass: 'ring-yellow-400/50',
    gradientClass: 'from-yellow-300 via-yellow-400 to-amber-500',
    preferDarkText: true,
    advisory:
      'Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.',
    shortAdvisory: 'Acceptable air. Sensitive groups take it easy.',
  },
  {
    key: 'sensitive',
    label: 'Unhealthy for Sensitive Groups',
    range: [101, 150],
    hex: '#FF7E00',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-500',
    textClass: 'text-orange-600 dark:text-orange-400',
    ringClass: 'ring-orange-500/40',
    gradientClass: 'from-orange-400 via-orange-500 to-red-500',
    preferDarkText: false,
    advisory:
      'Sensitive groups (children, elderly, those with respiratory conditions) should reduce outdoor activity.',
    shortAdvisory: 'Sensitive groups should reduce outdoor activity.',
  },
  {
    key: 'unhealthy',
    label: 'Unhealthy',
    range: [151, 200],
    hex: '#FF0000',
    bgClass: 'bg-red-600',
    borderClass: 'border-red-600',
    textClass: 'text-red-600 dark:text-red-400',
    ringClass: 'ring-red-500/40',
    gradientClass: 'from-red-500 via-red-600 to-rose-700',
    preferDarkText: false,
    advisory:
      'Everyone should reduce prolonged or heavy outdoor exertion. Consider wearing a mask outside.',
    shortAdvisory: 'Reduce outdoor exertion. Mask up outside.',
  },
  {
    key: 'veryUnhealthy',
    label: 'Very Unhealthy',
    range: [201, 300],
    hex: '#8F3F97',
    bgClass: 'bg-purple-700',
    borderClass: 'border-purple-700',
    textClass: 'text-purple-700 dark:text-purple-400',
    ringClass: 'ring-purple-500/40',
    gradientClass: 'from-purple-500 via-purple-700 to-fuchsia-800',
    preferDarkText: false,
    advisory:
      'Avoid outdoor activity. Keep windows closed. Use an air purifier indoors if you can.',
    shortAdvisory: 'Stay indoors. Run an air purifier.',
  },
  {
    key: 'hazardous',
    label: 'Hazardous',
    range: [301, Number.POSITIVE_INFINITY],
    hex: '#7E0023',
    bgClass: 'bg-rose-900',
    borderClass: 'border-rose-900',
    textClass: 'text-rose-700 dark:text-rose-400',
    ringClass: 'ring-rose-500/40',
    gradientClass: 'from-rose-700 via-rose-900 to-red-950',
    preferDarkText: false,
    advisory:
      'Health emergency. Stay indoors with windows closed and air purifiers running. Wear N95 masks if you must go outside.',
    shortAdvisory: 'Health emergency. Stay indoors.',
  },
];

export function getAQICategory(aqi: number | null | undefined): AQICategory {
  const value = typeof aqi === 'number' && Number.isFinite(aqi) ? aqi : 0;
  for (const cat of AQI_CATEGORIES) {
    if (value >= cat.range[0] && value <= cat.range[1]) return cat;
  }
  return AQI_CATEGORIES[0];
}

export function aqiHexFor(aqi: number | null | undefined): string {
  return getAQICategory(aqi).hex;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function timeAgo(iso: string | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const diff = Math.max(0, now - t);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.round(diff / MINUTE);
    return `${m} min ago`;
  }
  if (diff < DAY) {
    const h = Math.round(diff / HOUR);
    return `${h} hr ago`;
  }
  const d = Math.round(diff / DAY);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export function formatJakartaTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function pollutantSeverityPct(value: number, max = 300): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export function parseAQI(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export const DOMINANT_POLLUTANT_LABELS: Record<string, string> = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  o3: 'Ozone (O₃)',
  no2: 'Nitrogen dioxide (NO₂)',
  so2: 'Sulfur dioxide (SO₂)',
  co: 'Carbon monoxide (CO)',
};
