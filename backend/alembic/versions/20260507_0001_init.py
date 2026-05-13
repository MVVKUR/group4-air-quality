"""Initial schema: stations, readings, forecasts.

Revision ID: 20260507_0001
Revises:
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260507_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "stations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("source_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("source", "source_id", name="stations_source_uid_uq"),
        sa.CheckConstraint("source IN ('waqi','openmeteo')", name="stations_source_ck"),
    )
    op.create_index("stations_active_idx", "stations", ["active"])

    op.create_table(
        "readings",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column(
            "station_id",
            sa.BigInteger(),
            sa.ForeignKey("stations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column("aqi", sa.Integer(), nullable=True),
        sa.Column("pm25", sa.Numeric(6, 2), nullable=True),
        sa.Column("pm10", sa.Numeric(6, 2), nullable=True),
        sa.Column("no2", sa.Numeric(6, 2), nullable=True),
        sa.Column("o3", sa.Numeric(6, 2), nullable=True),
        sa.Column("so2", sa.Numeric(6, 2), nullable=True),
        sa.Column("co", sa.Numeric(6, 2), nullable=True),
        sa.Column("temp_c", sa.Numeric(5, 2), nullable=True),
        sa.Column("humidity", sa.Numeric(5, 2), nullable=True),
        sa.Column("wind_ms", sa.Numeric(5, 2), nullable=True),
        sa.Column("pressure_hpa", sa.Numeric(7, 2), nullable=True),
        sa.Column("dominant", sa.String(length=16), nullable=True),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column(
            "ingested_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("station_id", "ts", name="readings_station_ts_uq"),
    )
    op.create_index(
        "readings_station_ts_desc_idx",
        "readings",
        ["station_id", sa.text("ts DESC")],
    )

    op.create_table(
        "forecasts",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column(
            "station_id",
            sa.BigInteger(),
            sa.ForeignKey("stations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("pollutant", sa.String(length=16), nullable=False),
        sa.Column("avg", sa.Numeric(6, 2), nullable=True),
        sa.Column("min", sa.Numeric(6, 2), nullable=True),
        sa.Column("max", sa.Numeric(6, 2), nullable=True),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("station_id", "day", "pollutant", name="forecasts_dim_uq"),
    )


def downgrade() -> None:
    op.drop_table("forecasts")
    op.drop_index("readings_station_ts_desc_idx", table_name="readings")
    op.drop_table("readings")
    op.drop_index("stations_active_idx", table_name="stations")
    op.drop_table("stations")
