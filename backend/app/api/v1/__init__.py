"""v1 API router aggregator."""

from fastapi import APIRouter

from app.api.v1 import feed, health, stations

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(feed.router, tags=["feed"])
router.include_router(stations.router, tags=["stations"])
