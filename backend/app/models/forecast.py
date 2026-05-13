"""Forecast model — one row per (station, day, pollutant)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.station import Station


class Forecast(Base):
    __tablename__ = "forecasts"
    __table_args__ = (
        UniqueConstraint("station_id", "day", "pollutant", name="forecasts_dim_uq"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    station_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("stations.id", ondelete="CASCADE"),
        nullable=False,
    )
    day: Mapped[date] = mapped_column(Date, nullable=False)
    pollutant: Mapped[str] = mapped_column(String(16), nullable=False)

    avg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    min: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    max: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))

    source: Mapped[str] = mapped_column(String(16), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    station: Mapped[Station] = relationship(back_populates="forecasts")
