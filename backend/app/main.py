"""FastAPI application entry point.

- Configures structured logging at import time
- Mounts /api/v1 router
- Manages scheduler lifecycle via lifespan context
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.api.v1 import router as api_v1_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.scheduler import jobs as scheduler_jobs

configure_logging()
log = get_logger("main")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    scheduler_jobs.start()
    log.info("app.started", interval_min=settings.scheduler_interval_min)
    try:
        yield
    finally:
        await scheduler_jobs.shutdown()
        log.info("app.stopped")


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "ChildAir backend. Ingests WAQI + Open-Meteo on a 10-minute schedule "
        "and serves the React frontend through `/api/v1/*`."
    ),
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    docs_url=f"{settings.api_v1_prefix}/docs",
    redoc_url=f"{settings.api_v1_prefix}/redoc",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
)


if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )


app.include_router(api_v1_router, prefix=settings.api_v1_prefix)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {"name": settings.app_name, "docs": f"{settings.api_v1_prefix}/docs"}
