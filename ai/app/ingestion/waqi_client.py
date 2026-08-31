import logging
from datetime import datetime
from typing import List, Optional
import httpx
from app.config import get_settings
from app.models.schemas import StationData

logger = logging.getLogger("aerohealth.ingestion.waqi")

# Calibrated South Sumatra ground stations dataset (fallback/simulation)
MOCK_SOUTH_SUMATRA_STATIONS = [
    {
        "source_id": "waqi:palembang_simpang_lima",
        "nama_stasiun": "Stasiun Palembang Simpang Lima",
        "latitude": -2.9765,
        "longitude": 104.7558,
        "ispu_val": 58,
        "pm25_val": 16.2,
    },
    {
        "source_id": "waqi:palembang_jakabaring",
        "nama_stasiun": "Stasiun Palembang Jakabaring Sport City",
        "latitude": -3.0189,
        "longitude": 104.7892,
        "ispu_val": 46,
        "pm25_val": 11.5,
    },
    {
        "source_id": "waqi:palembang_plaju",
        "nama_stasiun": "Stasiun Udara Industri Plaju",
        "latitude": -2.9972,
        "longitude": 104.8214,
        "ispu_val": 72,
        "pm25_val": 22.8,
    },
    {
        "source_id": "waqi:ogan_ilir_indralaya",
        "nama_stasiun": "Stasiun Pemantau Ogan Ilir - Indralaya",
        "latitude": -3.2247,
        "longitude": 104.6512,
        "ispu_val": 52,
        "pm25_val": 14.0,
    },
    {
        "source_id": "waqi:banyuasin_pangkalan_balai",
        "nama_stasiun": "Stasiun Banyuasin - Pangkalan Balai",
        "latitude": -2.8872,
        "longitude": 104.3821,
        "ispu_val": 64,
        "pm25_val": 18.7,
    },
    {
        "source_id": "waqi:oki_kayuagung",
        "nama_stasiun": "Stasiun Ogan Komering Ilir - Kayuagung",
        "latitude": -3.3951,
        "longitude": 104.8456,
        "ispu_val": 85,
        "pm25_val": 28.3,
    },
    {
        "source_id": "waqi:muara_enim_tanjung_enim",
        "nama_stasiun": "Stasiun Muara Enim - Tanjung Enim",
        "latitude": -3.7381,
        "longitude": 103.8012,
        "ispu_val": 68,
        "pm25_val": 20.4,
    },
]


async def fetch_waqi_stations(
    token: Optional[str] = None,
    bbox: Optional[tuple[float, float, float, float]] = None
) -> List[StationData]:
    """
    Fetch ground air quality monitoring stations from WAQI API.
    Falls back gracefully to calibrated South Sumatra baseline stations if token is missing or network fails.
    """
    settings = get_settings()
    api_token = token or settings.WAQI_API_TOKEN
    bounding_box = bbox or settings.PILOT_BBOX  # (min_lon, min_lat, max_lon, max_lat)

    if not api_token or api_token == "your_waqi_api_token":
        logger.info("WAQI_API_TOKEN not configured. Using calibrated South Sumatra stations dataset.")
        return [
            StationData(
                source_id=item["source_id"],
                nama_stasiun=item["nama_stasiun"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                ispu_val=item["ispu_val"],
                pm25_val=item["pm25_val"],
                last_synced=datetime.utcnow(),
            )
            for item in MOCK_SOUTH_SUMATRA_STATIONS
        ]

    min_lon, min_lat, max_lon, max_lat = bounding_box
    url = f"https://api.waqi.info/map/bounds/?latlng={min_lat},{min_lon},{max_lat},{max_lon}&token={api_token}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning(f"WAQI API returned status {response.status_code}. Falling back to baseline dataset.")
                return _get_fallback_stations()

            data = response.json()
            if data.get("status") != "ok" or "data" not in data:
                logger.warning(f"WAQI API response invalid: {data.get('data')}. Falling back to baseline dataset.")
                return _get_fallback_stations()

            stations: List[StationData] = []
            for item in data["data"]:
                try:
                    aqi_str = item.get("aqi")
                    if aqi_str == "-" or aqi_str is None:
                        continue
                    
                    aqi_val = int(aqi_str)
                    station_name = item.get("station", {}).get("name", "Stasiun Pemantau Udara")
                    lat = float(item["lat"])
                    lon = float(item["lon"])
                    uid = item.get("uid")

                    stations.append(
                        StationData(
                            source_id=f"waqi:{uid}",
                            nama_stasiun=station_name,
                            latitude=lat,
                            longitude=lon,
                            ispu_val=aqi_val,
                            pm25_val=round(aqi_val * 0.35, 1),
                            last_synced=datetime.utcnow(),
                        )
                    )
                except Exception as parse_err:
                    logger.debug(f"Skipping malformed WAQI station record: {parse_err}")
                    continue

            if stations:
                logger.info(f"Successfully ingested {len(stations)} ground stations from WAQI API.")
                return stations
            else:
                logger.info("No active stations found in WAQI response for bbox. Using fallback dataset.")
                return _get_fallback_stations()

    except Exception as exc:
        logger.error(f"Error fetching data from WAQI API: {exc}. Utilizing fallback dataset.")
        return _get_fallback_stations()


def _get_fallback_stations() -> List[StationData]:
    """Helper to return fallback stations list."""
    return [
        StationData(
            source_id=item["source_id"],
            nama_stasiun=item["nama_stasiun"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            ispu_val=item["ispu_val"],
            pm25_val=item["pm25_val"],
            last_synced=datetime.utcnow(),
        )
        for item in MOCK_SOUTH_SUMATRA_STATIONS
    ]
