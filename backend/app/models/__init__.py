"""ORM models — imported here so Alembic autogenerate sees all tables."""

from app.models.client_location import ClientLocation
from app.models.forecast import Forecast
from app.models.reading import Reading
from app.models.station import Station

__all__ = ["ClientLocation", "Forecast", "Reading", "Station"]
