"""Data ingestion clients for external air quality and satellite hotspot APIs."""
from .waqi_client import fetch_waqi_stations
from .openaq_client import fetch_openaq_stations
from .firms_client import fetch_firms_hotspots

__all__ = [
    "fetch_waqi_stations",
    "fetch_openaq_stations",
    "fetch_firms_hotspots",
]
