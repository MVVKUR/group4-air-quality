"""Reading model — one row per (station, observation timestamp)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.station import Station


class Reading(Base):
    __tablename__ = "readings"
    __table_args__ = (
        UniqueConstraint("station_id", "ts", name="readings_station_ts_uq"),
        Index("readings_station_ts_desc_idx", "station_id", "ts", postgresql_using="btree"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    station_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("stations.id", ondelete="CASCADE"),
        nullable=False,
    )
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    aqi: Mapped[int | None] = mapped_column(Integer)
    pm25: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    pm10: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    no2: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    o3: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    so2: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    co: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))

    temp_c: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    humidity: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    wind_ms: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    pressure_hpa: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))

    dominant: Mapped[str | None] = mapped_column(String(16))
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    station: Mapped[Station] = relationship(back_populates="readings")
