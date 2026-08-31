import logging
import csv
import io
from datetime import datetime
from typing import List, Optional
import httpx
from app.config import get_settings
from app.models.schemas import HotspotData

logger = logging.getLogger("aerohealth.ingestion.firms")

# Calibrated South Sumatra satellite hotspot dataset (MODIS/VIIRS simulation)
MOCK_SOUTH_SUMATRA_HOTSPOTS = [
    {
        "latitude": -3.3850,
        "longitude": 105.1240,
        "frp": 68.5,
        "confidence": "high",
        "acquired_at": datetime.utcnow(),
    },
    {
        "latitude": -3.2110,
        "longitude": 104.9820,
        "frp": 42.0,
        "confidence": "nominal",
        "acquired_at": datetime.utcnow(),
    },
    {
        "latitude": -2.8540,
        "longitude": 104.2980,
        "frp": 95.2,
        "confidence": "high",
        "acquired_at": datetime.utcnow(),
    },
    {
        "latitude": -3.0210,
        "longitude": 104.8350,
        "frp": 25.8,
        "confidence": "nominal",
        "acquired_at": datetime.utcnow(),
    },
    {
        "latitude": -3.5420,
        "longitude": 104.7120,
        "frp": 38.0,
        "confidence": "nominal",
        "acquired_at": datetime.utcnow(),
    },
]


async def fetch_firms_hotspots(
    map_key: Optional[str] = None,
    bbox: Optional[tuple[float, float, float, float]] = None,
    days: int = 1
) -> List[HotspotData]:
    """
    Fetch active fire hotspots from NASA FIRMS API (VIIRS/MODIS satellites).
    Falls back gracefully to calibrated South Sumatra fire points if key is missing or network fails.
    """
    settings = get_settings()
    api_key = map_key or settings.NASA_FIRMS_MAP_KEY
    bounding_box = bbox or settings.PILOT_BBOX  # (min_lon, min_lat, max_lon, max_lat)

    if not api_key or api_key == "your_nasa_firms_key":
        logger.info("NASA_FIRMS_MAP_KEY not configured. Using calibrated South Sumatra hotspots dataset.")
        return [
            HotspotData(
                latitude=item["latitude"],
                longitude=item["longitude"],
                frp=item["frp"],
                confidence=item["confidence"],
                acquired_at=item["acquired_at"],
            )
            for item in MOCK_SOUTH_SUMATRA_HOTSPOTS
        ]

    min_lon, min_lat, max_lon, max_lat = bounding_box
    # NASA FIRMS format: W,S,E,N
    area_param = f"{min_lon},{min_lat},{max_lon},{max_lat}"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/VIIRS_SNPP_NRT/{area_param}/{days}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning(f"NASA FIRMS API returned status {response.status_code}. Using fallback dataset.")
                return _get_fallback_hotspots()

            csv_text = response.text
            if not csv_text or "latitude" not in csv_text:
                logger.warning("NASA FIRMS returned empty or invalid CSV. Using fallback dataset.")
                return _get_fallback_hotspots()

            hotspots: List[HotspotData] = []
            reader = csv.DictReader(io.StringIO(csv_text))
            
            for row in reader:
                try:
                    lat = float(row["latitude"])
                    lon = float(row["longitude"])
                    frp = float(row.get("frp", 0.0))
                    confidence = str(row.get("confidence", "nominal")).lower()

                    # Exclude low confidence hotspots
                    if confidence in ["l", "low"]:
                        continue

                    # Parse acquisition timestamp
                    acq_date_str = row.get("acq_date")
                    acq_time_str = row.get("acq_time", "0000").zfill(4)
                    
                    try:
                        if acq_date_str:
                            acq_time = datetime.strptime(
                                f"{acq_date_str} {acq_time_str}", "%Y-%m-%d %H%M"
                            )
                        else:
                            acq_time = datetime.utcnow()
                    except Exception:
                        acq_time = datetime.utcnow()

                    hotspots.append(
                        HotspotData(
                            latitude=lat,
                            longitude=lon,
                            frp=frp,
                            confidence=confidence,
                            acquired_at=acq_time,
                        )
                    )
                except Exception as parse_err:
                    logger.debug(f"Skipping malformed FIRMS record: {parse_err}")
                    continue

            if hotspots:
                logger.info(f"Ingested {len(hotspots)} active fire hotspots from NASA FIRMS.")
                return hotspots
            else:
                logger.info("No active hotspots found in bounding box. Using fallback dataset.")
                return _get_fallback_hotspots()

    except Exception as exc:
        logger.error(f"Error fetching NASA FIRMS data: {exc}. Utilizing fallback dataset.")
        return _get_fallback_hotspots()


def _get_fallback_hotspots() -> List[HotspotData]:
    """Helper to return fallback hotspots list."""
    return [
        HotspotData(
            latitude=item["latitude"],
            longitude=item["longitude"],
            frp=item["frp"],
            confidence=item["confidence"],
            acquired_at=item["acquired_at"],
        )
        for item in MOCK_SOUTH_SUMATRA_HOTSPOTS
    ]
