# ChildAir · Live AQI

Real-time air quality dashboard and interactive station map for Jakarta, Indonesia —
positioned around protecting children and other sensitive groups.
Built with Vite + React + TypeScript, Tailwind CSS, Leaflet, Recharts, TanStack Query,
and a FastAPI + PostgreSQL backend with scheduled ingestion.

## Features

- **Dashboard** with hero AQI card, US EPA category color, dominant pollutant, plain-language
  health advisory, weather context strip, 24-hour AQI trend chart with color-band
  background, and 3-day forecast.
- **Interactive map** of monitoring stations across Greater Jakarta with custom
  AQI-colored markers, pulsing highlight on the worst station, click popups,
  search, locate-me, layer toggle (street / satellite), and AQI legend.
- **Station detail page** with hero AQI, weather, embedded location map, full pollutant
  table with WHO/ISPU thresholds, 7-day per-pollutant forecast chart, and source
  attribution.
- **Auto-refresh** every 5 minutes via TanStack Query with stale-while-revalidate caching.
- **Dark / light mode** with localStorage persistence and system-preference fallback.
- **Mobile-first responsive** layout — tested at 375px, 768px, 1280px.
- **Skeleton loaders** and error states with retry — never a blank or spinning screen.
- **Demo mode** — runs on bundled mock Jakarta data when no API token is configured.

## Quick start

```bash
npm install
cp .env.example .env.local   # add your free WAQI token (optional)
npm run dev
```

Get a free token at <https://aqicn.org/data-platform/token/> and set
`VITE_WAQI_TOKEN` in `.env.local`. Without a token the app runs in demo mode
on bundled mock data so it works out of the box.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — production build (type-check + bundle)
- `npm run preview` — preview the production build

## Project structure

```
src/
├── pages/
│   ├── DashboardPage.tsx       # Home / live Jakarta aggregate
│   ├── MapPage.tsx             # Interactive station map
│   └── StationPage.tsx         # /station/:id detail view
├── components/
│   ├── dashboard/              # HeroAQI, PollutantCard, TrendChart, …
│   ├── map/                    # JakartaMap, StationPopup, MapControls, MapLegend
│   ├── shared/                 # AQIBadge, ThemeToggle, HealthAdvisory, …
│   └── layout/                 # AppHeader, AppFooter, AppLayout
├── lib/
│   ├── waqi-api.ts             # Typed WAQI fetch client (with mock fallback)
│   ├── aqi-utils.ts            # US EPA AQI categories, colors, advisories
│   ├── constants.ts            # Jakarta bounds, refresh cadence, tile layers
│   └── cn.ts                   # Tailwind class merge helper
├── hooks/
│   ├── useAQIData.ts           # React Query wrappers
│   ├── useGeolocation.ts       # navigator.geolocation hook
│   └── useTheme.ts             # Dark mode toggle + persistence
├── mocks/jakarta.ts            # Mock data + synthetic 24h history
└── types/waqi.ts               # WAQI response interfaces
```

## Data sources

The app uses two complementary live sources, both refreshed every 5 minutes:

- **WAQI** ([aqicn.org](https://aqicn.org)) — official sensor data (BMKG in Jakarta's
  case). Used for the headline Jakarta city AQI on the dashboard and for any
  active stations returned by `/map/bounds/`. Requires a free token.
- **Open-Meteo Air Quality** ([air-quality-api.open-meteo.com](https://open-meteo.com/en/docs/air-quality-api))
  — Copernicus CAMS model output, no key required. Powers the 24-hour trend chart
  and the 24 neighborhood station markers across Greater Jakarta. Per-coordinate,
  hourly, with past 7 days + 5-day forecast.

Map tiles: [OpenStreetMap](https://www.openstreetmap.org/copyright) (street)
and [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9)
(satellite). Both free.

## Why two sources

WAQI's free tier exposes very few active stations in Jakarta (typically just
Kemayoran). To deliver the spec's "20+ markers across Jakarta" we supplement
with Open-Meteo readings at 24 fixed neighborhood coordinates. Every visible
number is a live reading — there is no synthetic or demo data when a token
is configured.

Tradeoff to be aware of: Open-Meteo readings are CAMS model output (interpolated
from satellite + ground sensors at ~10 km grid resolution), not direct sensor
readings. They reflect regional air quality faithfully but won't capture
sensor-level micro-variation. The headline Jakarta AQI on the dashboard
remains the official WAQI/BMKG sensor reading.

## Notes

- Some stations don't report every pollutant — missing fields are gracefully
  omitted rather than rendering broken cards.
- Token is exposed client-side, which is acceptable for personal use under
  WAQI's terms. For production, proxy through a backend route.
- Without a token the app falls back to bundled mock Jakarta data for the WAQI
  hero card; Open-Meteo still powers the map and trend chart.
