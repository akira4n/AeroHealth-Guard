import logging
from datetime import datetime
from typing import List, Optional
import httpx
from app.config import get_settings
from app.models.schemas import StationData

logger = logging.getLogger("aerohealth.ingestion.openaq")


async def fetch_openaq_stations(
    api_key: Optional[str] = None,
    bbox: Optional[tuple[float, float, float, float]] = None
) -> List[StationData]:
    """
    Fetch ground air monitoring stations from OpenAQ API v2.
    """
    settings = get_settings()
    key = api_key or settings.OPENAQ_API_KEY
    bounding_box = bbox or settings.PILOT_BBOX  # (min_lon, min_lat, max_lon, max_lat)

    if not key or key == "your_openaq_api_key":
        logger.info("OPENAQ_API_KEY not provided. Skipping OpenAQ ingestion.")
        return []

    min_lon, min_lat, max_lon, max_lat = bounding_box
    url = "https://api.openaq.org/v2/locations"
    headers = {"X-API-Key": key}
    params = {
        "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        "limit": 50,
        "parameter": ["pm25", "pm10"],
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, params=params)
            if response.status_code != 200:
                logger.warning(f"OpenAQ API returned status {response.status_code}.")
                return []

            data = response.json()
            results = data.get("results", [])
            stations: List[StationData] = []

            for loc in results:
                try:
                    coords = loc.get("coordinates")
                    if not coords:
                        continue

                    lat = coords["latitude"]
                    lon = coords["longitude"]
                    name = loc.get("name", "OpenAQ Station")
                    loc_id = loc.get("id")

                    # Extract latest PM2.5 or PM10 value
                    pm25_val = 0.0
                    for param in loc.get("parameters", []):
                        if param.get("parameter") == "pm25":
                            pm25_val = float(param.get("lastValue", 0.0))

                    # Rough conversion of PM2.5 to ISPU
                    ispu_val = int(pm25_val * 2.8) if pm25_val > 0 else 50

                    stations.append(
                        StationData(
                            source_id=f"openaq:{loc_id}",
                            nama_stasiun=name,
                            latitude=lat,
                            longitude=lon,
                            ispu_val=ispu_val,
                            pm25_val=pm25_val,
                            last_synced=datetime.utcnow(),
                        )
                    )
                except Exception as parse_err:
                    logger.debug(f"Skipping malformed OpenAQ record: {parse_err}")
                    continue

            logger.info(f"Ingested {len(stations)} stations from OpenAQ.")
            return stations

    except Exception as exc:
        logger.error(f"Error connecting to OpenAQ API: {exc}")
        return []
