"""APScheduler bootstrap.

Single AsyncIOScheduler running 4 ingestion jobs every N minutes. Status is
exposed via /api/v1/health so we can tell whether the last run succeeded
without opening logs.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Awaitable, Callable

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.logging import get_logger
from app.services import ingestion

log = get_logger("scheduler")


@dataclass
class JobStatus:
    name: str
    last_run_at: datetime | None = None
    last_success_at: datetime | None = None
    last_error: str | None = None
    runs: int = 0


@dataclass
class SchedulerState:
    started: bool = False
    jobs: dict[str, JobStatus] = field(default_factory=dict)

    def record_run(self, name: str, *, ok: bool, error: str | None = None) -> None:
        st = self.jobs.setdefault(name, JobStatus(name=name))
        now = datetime.now(timezone.utc)
        st.last_run_at = now
        st.runs += 1
        if ok:
            st.last_success_at = now
            st.last_error = None
        else:
            st.last_error = error


state = SchedulerState()
_scheduler: AsyncIOScheduler | None = None


def _wrap(name: str, fn: Callable[[], Awaitable[int]]) -> Callable[[], Awaitable[None]]:
    """Wrap a coroutine so failures don't bubble out of the scheduler."""

    async def runner() -> None:
        try:
            count = await fn()
            state.record_run(name, ok=True)
            log.info("scheduler.job.ok", job=name, count=count)
        except Exception as exc:  # noqa: BLE001
            state.record_run(name, ok=False, error=str(exc))
            log.error("scheduler.job.fail", job=name, error=str(exc))

    return runner


def start() -> AsyncIOScheduler:
    """Start the scheduler if not already running. Returns the singleton instance."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    sched = AsyncIOScheduler(timezone="UTC")
    interval = settings.scheduler_interval_min
    trigger = CronTrigger.from_crontab(f"*/{interval} * * * *")
    common_kwargs = dict(
        trigger=trigger,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
    )

    sched.add_job(
        _wrap("waqi_jakarta_feed", ingestion.ingest_waqi_jakarta_feed),
        id="waqi_jakarta_feed",
        **common_kwargs,
    )
    sched.add_job(
        _wrap("waqi_bounds", ingestion.ingest_waqi_bounds),
        id="waqi_bounds",
        **common_kwargs,
    )
    sched.add_job(
        _wrap("openmeteo_current", ingestion.ingest_openmeteo_current),
        id="openmeteo_current",
        **common_kwargs,
    )
    sched.add_job(
        _wrap("openmeteo_history", ingestion.ingest_openmeteo_history),
        id="openmeteo_history",
        **common_kwargs,
    )

    sched.start()
    _scheduler = sched
    state.started = True
    log.info("scheduler.started", interval_min=interval)

    if settings.scheduler_run_on_startup:
        # Fire-and-forget the first run so the DB has data immediately.
        asyncio.create_task(_initial_run())

    return sched


async def _initial_run() -> None:
    log.info("scheduler.initial_run.start")
    results = await ingestion.run_all_jobs()
    for name, count in results.items():
        state.record_run(name, ok=count >= 0, error=None if count >= 0 else "see logs")
    log.info("scheduler.initial_run.done", results=results)


async def shutdown() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None
    state.started = False
    log.info("scheduler.stopped")
