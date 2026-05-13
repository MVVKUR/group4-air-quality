"""Runtime configuration loaded from environment variables.

All settings come from the process environment (or a .env file in dev).
Production passes them via podman-compose `environment:` block.
"""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Container for application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Database ----------------------------------------------------------
    database_url: str = Field(
        default="postgresql+asyncpg://childair:childair@localhost:5432/childair",
        description="SQLAlchemy async URL. Use asyncpg driver.",
    )

    # --- Upstream APIs -----------------------------------------------------
    waqi_token: str = Field(
        default="",
        description="WAQI API token. Get one at https://aqicn.org/data-platform/token/",
    )
    waqi_base_url: str = Field(default="https://api.waqi.info")
    openmeteo_base_url: str = Field(
        default="https://air-quality-api.open-meteo.com/v1/air-quality",
    )

    # --- Scheduling --------------------------------------------------------
    scheduler_interval_min: int = Field(
        default=10,
        description="How often to run ingestion jobs (minutes).",
    )
    scheduler_run_on_startup: bool = Field(
        default=True,
        description="Trigger jobs immediately on boot so the DB has data without waiting.",
    )

    # --- Region (Jakarta bounding box) ------------------------------------
    jakarta_bounds: str = Field(
        default="-6.55,106.55,-5.95,107.15",
        description="south,west,north,east — used by WAQI bounds endpoint.",
    )

    # --- App ---------------------------------------------------------------
    app_name: str = "ChildAir API"
    api_v1_prefix: str = "/api/v1"
    log_level: str = "info"
    cors_origins: str = Field(
        default="",
        description=(
            "Comma-separated list of allowed origins. Empty disables CORS — fine when "
            "served from the same domain via nginx reverse proxy."
        ),
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def jakarta_bounds_tuple(self) -> tuple[float, float, float, float]:
        parts = [float(p) for p in self.jakarta_bounds.split(",")]
        if len(parts) != 4:
            raise ValueError("JAKARTA_BOUNDS must be 'south,west,north,east'.")
        return (parts[0], parts[1], parts[2], parts[3])


settings = Settings()
