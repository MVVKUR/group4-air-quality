import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';

export const JAKARTA_CENTER: LatLngExpression = [-6.2088, 106.8456];
export const JAKARTA_DEFAULT_ZOOM = 11;

// Greater Jakarta bounding box for Leaflet maxBounds — south,west / north,east
export const JAKARTA_BOUNDS: LatLngBoundsExpression = [
  [-6.55, 106.55],
  [-5.95, 107.15],
];

// Refresh cadence (ms) — WAQI updates ~hourly so 5 min is plenty
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const STALE_TIME_MS = 5 * 60 * 1000;

export const POLLUTANT_LABELS: Record<
  'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co',
  { label: string; unit: string; full: string }
> = {
  pm25: { label: 'PM2.5', unit: 'AQI', full: 'Fine particulate matter' },
  pm10: { label: 'PM10', unit: 'AQI', full: 'Coarse particulate matter' },
  o3: { label: 'O₃', unit: 'AQI', full: 'Ozone' },
  no2: { label: 'NO₂', unit: 'AQI', full: 'Nitrogen dioxide' },
  so2: { label: 'SO₂', unit: 'AQI', full: 'Sulfur dioxide' },
  co: { label: 'CO', unit: 'AQI', full: 'Carbon monoxide' },
};

// US EPA "hazardous" upper bound for converted iAQI
export const POLLUTANT_HAZARDOUS_THRESHOLD = 300;

export const TILE_LAYERS = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
    maxZoom: 19,
  },
} as const;

export type TileLayerKey = keyof typeof TILE_LAYERS;
