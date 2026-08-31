import pytest
from app.config import get_settings
from app.models.schemas import (
    StationData,
    HotspotData,
    KelurahanSpatial,
    IdwResult,
    HealthResponse,
)


def test_settings_load():
    """Verify that settings can be loaded with default values."""
    settings = get_settings()
    assert settings.AI_PORT == 8000
    assert settings.CRON_INTERVAL_HOURS == 3
    assert settings.PILOT_BBOX == (98.0, -5.0, 107.0, -1.5)


def test_station_data_schema():
    """Verify StationData validation."""
    station = StationData(
        source_id="waqi:9101",
        nama_stasiun="Stasiun Palembang Ilir",
        latitude=-2.9833,
        longitude=104.7558,
        ispu_val=65,
        pm25_val=18.5,
    )
    assert station.source_id == "waqi:9101"
    assert station.ispu_val == 65
    assert station.latitude == -2.9833


def test_hotspot_data_schema():
    """Verify HotspotData validation."""
    hotspot = HotspotData(
        latitude=-3.1200,
        longitude=104.8100,
        frp=45.2,
        confidence="high",
    )
    assert hotspot.frp == 45.2
    assert hotspot.confidence == "high"


def test_kelurahan_spatial_schema():
    """Verify KelurahanSpatial validation."""
    kel = KelurahanSpatial(
        id=1,
        kode_kemendagri="16.71.01.1001",
        nama_kelurahan="16 Ilir",
        nama_kecamatan="Ilir Timur I",
        kabupaten_kota="Kota Palembang",
        centroid_lat=-2.9902,
        centroid_lng=104.7612,
    )
    assert kel.id == 1
    assert kel.nama_kelurahan == "16 Ilir"


def test_idw_result_schema():
    """Verify IdwResult validation."""
    res = IdwResult(
        kelurahan_id=1,
        ispu_score=85,
        kategori="Sedang",
        primary_pollutant="PM2.5",
        hotspot_detected=True,
        hotspot_penalty=20.5,
    )
    assert res.ispu_score == 85
    assert res.kategori == "Sedang"
    assert res.hotspot_detected is True
