import pytest
from app.ingestion.waqi_client import fetch_waqi_stations, _get_fallback_stations
from app.ingestion.firms_client import fetch_firms_hotspots, _get_fallback_hotspots


@pytest.mark.asyncio
async def test_waqi_fallback_dataset():
    """Verify WAQI fallback helper returns calibrated South Sumatra stations."""
    fallback_stations = _get_fallback_stations()
    assert len(fallback_stations) >= 5
    for st in fallback_stations:
        assert st.source_id.startswith("waqi:")
        assert st.latitude != 0.0
        assert st.longitude != 0.0
        assert st.ispu_val >= 0


@pytest.mark.asyncio
async def test_waqi_ingestion_execution():
    """Verify WAQI client execution (either live API or fallback)."""
    stations = await fetch_waqi_stations()
    assert len(stations) >= 1
    for st in stations:
        assert st.source_id.startswith("waqi:")
        assert -90.0 <= st.latitude <= 90.0
        assert -180.0 <= st.longitude <= 180.0


@pytest.mark.asyncio
async def test_firms_fallback_dataset():
    """Verify NASA FIRMS fallback helper returns active hotspots in South Sumatra."""
    fallback_hotspots = _get_fallback_hotspots()
    assert len(fallback_hotspots) >= 3
    for hs in fallback_hotspots:
        assert hs.frp > 0.0
        assert hs.latitude != 0.0
        assert hs.longitude != 0.0
        assert hs.confidence in ["nominal", "high"]


@pytest.mark.asyncio
async def test_firms_ingestion_execution():
    """Verify NASA FIRMS client execution (either live API or fallback)."""
    hotspots = await fetch_firms_hotspots()
    assert len(hotspots) >= 1
    for hs in hotspots:
        assert hs.frp >= 0.0
        assert -90.0 <= hs.latitude <= 90.0
        assert -180.0 <= hs.longitude <= 180.0
