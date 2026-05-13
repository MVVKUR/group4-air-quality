# ChildAir backend

FastAPI + PostgreSQL + APScheduler. Ingests WAQI + Open-Meteo every 10 min
and serves `/api/v1/*` with auto-generated Swagger UI.

## Local dev

```bash
# Python 3.12+ recommended
cd backend
pip install -e .                              # or: uv pip install -e .

# Spin up a throwaway Postgres
podman run --rm -d --name childair-db \
  -e POSTGRES_USER=childair -e POSTGRES_PASSWORD=childair -e POSTGRES_DB=childair \
  -p 5432:5432 docker.io/library/postgres:16-alpine

# Configure
cp .env.example .env
# edit .env to set WAQI_TOKEN

# Apply schema
alembic upgrade head

# Run the API
uvicorn app.main:app --reload
```

Swagger UI: <http://localhost:8000/api/v1/docs>

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/v1/health` | DB ping + scheduler status |
| `GET` | `/api/v1/feed/jakarta` | Latest WAQI city reading (WaqiFeed shape) |
| `GET` | `/api/v1/stations` | All active stations + latest AQI |
| `GET` | `/api/v1/stations/{id}` | Single station detail |
| `GET` | `/api/v1/stations/{id}/readings?hours=24` | Hourly history |
| `GET` | `/api/v1/stations/{id}/forecast` | Daily per-pollutant forecast |

## Scheduler

Single `AsyncIOScheduler` with 4 jobs running every `SCHEDULER_INTERVAL_MIN`
minutes (default 10):

- `waqi_jakarta_feed` — `/feed/jakarta` → 1 reading + 3 forecast rows
- `waqi_bounds` — `/map/bounds` → upsert every BMKG sensor in the bbox
- `openmeteo_current` — batched current AQI for 24 Jakarta neighborhoods
- `openmeteo_history` — hourly past 24h + 5-day forecast for Jakarta center

Each job is idempotent (upsert on natural keys) and never crashes the scheduler.
Status is exposed at `/api/v1/health` for monitoring.
