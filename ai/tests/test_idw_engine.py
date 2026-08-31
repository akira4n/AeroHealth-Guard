import numpy as np
import pytest
from app.spatial.geometry import haversine_distance_matrix
from app.spatial.idw_engine import (
    calculate_hotspot_adjusted_idw,
    classify_ispu_category,
)
from app.models.schemas import KelurahanSpatial, StationData, HotspotData


def test_haversine_distance_accuracy():
    """
    Verify Haversine distance calculation between Palembang (-2.9909, 104.7565)
    and Indralaya (-3.2247, 104.6512). Distance is approximately ~28.3 km.
    """
    p1 = np.array([[-2.9909, 104.7565]])
    p2 = np.array([[-3.2247, 104.6512]])

    dist_matrix = haversine_distance_matrix(p1, p2)
    assert dist_matrix.shape == (1, 1)
    dist_km = dist_matrix[0, 0]
    assert 27.0 < dist_km < 30.0


def test_klhk_ispu_categories():
    """Verify official KLHK classification ranges."""
    assert classify_ispu_category(35) == "Baik"
    assert classify_ispu_category(50) == "Baik"
    assert classify_ispu_category(51) == "Sedang"
    assert classify_ispu_category(100) == "Sedang"
    assert classify_ispu_category(101) == "Tidak Sehat"
    assert classify_ispu_category(200) == "Tidak Sehat"
    assert classify_ispu_category(201) == "Sangat Tidak Sehat"
    assert classify_ispu_category(300) == "Sangat Tidak Sehat"
    assert classify_ispu_category(301) == "Berbahaya"
    assert classify_ispu_category(450) == "Berbahaya"


def test_idw_midpoint_interpolation():
    """
    Verify that a point midway between two equidistant stations
    (ISPU 40 and ISPU 80) computes to exactly 60.
    """
    kelurahan = [
        KelurahanSpatial(
            id=1,
            kode_kemendagri="16.71.01",
            nama_kelurahan="Titik Tengah",
            nama_kecamatan="Kecamatan A",
            kabupaten_kota="Kota Palembang",
            centroid_lat=0.0,
            centroid_lng=0.0,
        )
    ]

    stations = [
        StationData(
            source_id="sta:1",
            nama_stasiun="Stasiun Barat",
            latitude=0.0,
            longitude=-0.1,  # ~11.1 km west
            ispu_val=40,
        ),
        StationData(
            source_id="sta:2",
            nama_stasiun="Stasiun Timur",
            latitude=0.0,
            longitude=0.1,  # ~11.1 km east
            ispu_val=80,
        ),
    ]

    results = calculate_hotspot_adjusted_idw(
        kelurahans=kelurahan, stations=stations, hotspots=[]
    )
    assert len(results) == 1
    assert results[0].ispu_score == 60
    assert results[0].kategori == "Sedang"
    assert results[0].hotspot_penalty == 0.0


def test_hotspot_penalty_impact_and_radius():
    """
    Verify that a hotspot within R_max (e.g. 2 km) increases ISPU,
    while a hotspot beyond R_max (> 10 km) has zero effect.
    """
    kelurahan = [
        KelurahanSpatial(
            id=1,
            kode_kemendagri="16.71.01",
            nama_kelurahan="Kelurahan Target",
            nama_kecamatan="Kecamatan A",
            kabupaten_kota="Kota Palembang",
            centroid_lat=-2.9900,
            centroid_lng=104.7500,
        )
    ]

    stations = [
        StationData(
            source_id="sta:1",
            nama_stasiun="Stasiun A",
            latitude=-2.9900,
            longitude=104.7500,  # Exact distance = 0 km
            ispu_val=50,
        )
    ]

    # Hotspot 1: Very close (lat difference ~0.01 deg = ~1.1 km), FRP = 40 MW
    # Expected penalty = 1.5 * 40 / 1.11 ≈ 54
    near_hotspot = [
        HotspotData(
            latitude=-2.9800,
            longitude=104.7500,
            frp=40.0,
            confidence="high",
        )
    ]

    res_near = calculate_hotspot_adjusted_idw(
        kelurahans=kelurahan, stations=stations, hotspots=near_hotspot
    )
    assert res_near[0].hotspot_detected is True
    assert res_near[0].hotspot_penalty > 0.0
    assert res_near[0].ispu_score > 50  # Increased due to fire penalty

    # Hotspot 2: Far away (> 25 km, ~0.25 deg south)
    far_hotspot = [
        HotspotData(
            latitude=-3.2500,
            longitude=104.7500,
            frp=100.0,
            confidence="high",
        )
    ]

    res_far = calculate_hotspot_adjusted_idw(
        kelurahans=kelurahan, stations=stations, hotspots=far_hotspot
    )
    assert res_far[0].hotspot_detected is False
    assert res_far[0].hotspot_penalty == 0.0
    assert res_far[0].ispu_score == 50  # Unchanged because hotspot > 10 km


def test_hotspot_penalty_cap():
    """Verify that hotspot penalty is strictly capped at 150."""
    kelurahan = [
        KelurahanSpatial(
            id=1,
            kode_kemendagri="16.71.01",
            nama_kelurahan="Kelurahan Episentrum",
            nama_kecamatan="Kecamatan A",
            kabupaten_kota="Kota Palembang",
            centroid_lat=0.0,
            centroid_lng=0.0,
        )
    ]

    stations = [
        StationData(
            source_id="sta:1",
            nama_stasiun="Stasiun A",
            latitude=0.0,
            longitude=0.0,
            ispu_val=50,
        )
    ]

    # Giant wildfire cluster: Multiple massive FRP points at 0.5 km
    extreme_hotspots = [
        HotspotData(latitude=0.001, longitude=0.001, frp=500.0, confidence="high"),
        HotspotData(latitude=0.002, longitude=0.002, frp=500.0, confidence="high"),
        HotspotData(latitude=0.003, longitude=0.003, frp=500.0, confidence="high"),
    ]

    res = calculate_hotspot_adjusted_idw(
        kelurahans=kelurahan, stations=stations, hotspots=extreme_hotspots
    )
    assert res[0].hotspot_penalty == 150.0  # Capped at 150
    assert res[0].ispu_score == 200  # 50 baseline + 150 penalty
