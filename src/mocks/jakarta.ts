import type { WaqiBoundsStation, WaqiFeed } from '@/types/waqi';

// Realistic mock data anchored to typical Jakarta dry-season conditions.
// Used when no VITE_WAQI_TOKEN is configured, or to keep dev free of rate limits.

export const MOCK_JAKARTA_FEED: WaqiFeed = {
  aqi: 158,
  idx: 8294,
  city: {
    name: 'Jakarta (Aggregate)',
    geo: [-6.2088, 106.8456],
  },
  dominentpol: 'pm25',
  iaqi: {
    pm25: { v: 158 },
    pm10: { v: 71 },
    o3: { v: 18 },
    no2: { v: 14 },
    so2: { v: 4 },
    co: { v: 7 },
    t: { v: 30 },
    h: { v: 74 },
    p: { v: 1009 },
    w: { v: 2.6 },
  },
  time: {
    iso: new Date().toISOString(),
    tz: '+07:00',
  },
  forecast: {
    daily: {
      pm25: buildForecast([158, 145, 162, 173, 168, 152, 140]),
      pm10: buildForecast([72, 68, 80, 86, 79, 71, 64]),
      o3: buildForecast([18, 22, 26, 28, 24, 20, 19]),
    },
  },
  attributions: [
    { name: 'BMKG', url: 'https://www.bmkg.go.id/' },
    { name: 'World Air Quality Index Project', url: 'https://aqicn.org' },
  ],
};

function buildForecast(values: number[]) {
  const today = new Date();
  return values.map((avg, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    return {
      avg,
      day: iso,
      max: Math.round(avg * 1.12),
      min: Math.round(avg * 0.78),
    };
  });
}

export const MOCK_JAKARTA_STATIONS: WaqiBoundsStation[] = [
  ['Bundaran HI', -6.1944, 106.8229, 158, 8294],
  ['Kemayoran', -6.1631, 106.8493, 142, 8295],
  ['Kelapa Gading', -6.1513, 106.9046, 137, 8298],
  ['Kuningan', -6.2351, 106.8307, 165, 8296],
  ['Pondok Indah', -6.2649, 106.7842, 124, 8299],
  ['Senayan', -6.2256, 106.8019, 149, 8297],
  ['Cilandak', -6.2884, 106.7993, 118, 8300],
  ['Cempaka Putih', -6.1716, 106.8689, 152, 8301],
  ['Tanjung Priok', -6.1066, 106.8814, 171, 8302],
  ['Pluit', -6.1265, 106.7894, 161, 8303],
  ['Slipi', -6.1864, 106.7976, 138, 8304],
  ['Jatinegara', -6.2287, 106.8702, 167, 8305],
  ['Cawang', -6.2440, 106.8717, 174, 8306],
  ['Pasar Minggu', -6.2855, 106.8451, 129, 8307],
  ['Mangga Dua', -6.1387, 106.8276, 156, 8308],
  ['Sunter', -6.1494, 106.8717, 145, 8309],
  ['Lebak Bulus', -6.2904, 106.7755, 112, 8310],
  ['Cibubur', -6.3678, 106.8898, 98, 8311],
  ['Bekasi (Bantar Gebang)', -6.3119, 106.9899, 132, 8312],
  ['Tangerang (Karawaci)', -6.2257, 106.6034, 121, 8313],
  ['Depok (Margonda)', -6.3927, 106.8225, 116, 8314],
  ['BSD', -6.2926, 106.6717, 104, 8315],
  ['Cilincing', -6.1097, 106.9322, 168, 8316],
  ['Ancol', -6.1225, 106.8408, 162, 8317],
].map(([name, lat, lon, aqi, uid]) => ({
  uid: uid as number,
  lat: lat as number,
  lon: lon as number,
  aqi: String(aqi),
  station: {
    name: name as string,
    time: new Date().toISOString(),
  },
}));

export function buildMockStationFeed(uid: number): WaqiFeed {
  const station = MOCK_JAKARTA_STATIONS.find((s) => s.uid === uid);
  const aqi = station ? Number(station.aqi) : 150;
  const pm25 = aqi;
  const pm10 = Math.round(aqi * 0.6);
  return {
    aqi,
    idx: uid,
    city: {
      name: station?.station.name ?? 'Jakarta Station',
      geo: [station?.lat ?? -6.2, station?.lon ?? 106.84],
    },
    dominentpol: 'pm25',
    iaqi: {
      pm25: { v: pm25 },
      pm10: { v: pm10 },
      o3: { v: 18 },
      no2: { v: 14 },
      so2: { v: 4 },
      co: { v: 7 },
      t: { v: 30 },
      h: { v: 74 },
      p: { v: 1009 },
      w: { v: 2.6 },
    },
    time: { iso: new Date().toISOString(), tz: '+07:00' },
    forecast: {
      daily: {
        pm25: (() => {
          const values = [pm25, pm25 - 10, pm25 + 8, pm25 + 14, pm25 + 4, pm25 - 5, pm25 - 12];
          const today = new Date();
          return values.map((avg, i) => {
            const day = new Date(today);
            day.setDate(today.getDate() + i);
            return {
              avg,
              day: day.toISOString().slice(0, 10),
              max: Math.round(avg * 1.12),
              min: Math.round(avg * 0.78),
            };
          });
        })(),
      },
    },
    attributions: [{ name: 'BMKG', url: 'https://www.bmkg.go.id/' }],
  };
}

/**
 * Synthetic 24-hour AQI history. Real WAQI doesn't expose hourly history on
 * the free endpoint, so we generate a smooth curve around the current value.
 */
export function buildSyntheticHourlyHistory(currentAqi: number) {
  const now = Date.now();
  const points: { t: string; aqi: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const variance = Math.sin((i / 23) * Math.PI * 2) * 18;
    const noise = (Math.cos(i * 1.7) + Math.sin(i * 0.9)) * 6;
    const value = Math.max(10, Math.round(currentAqi + variance + noise - 6));
    points.push({
      t: new Date(now - i * 3600_000).toISOString(),
      aqi: value,
    });
  }
  return points;
}
