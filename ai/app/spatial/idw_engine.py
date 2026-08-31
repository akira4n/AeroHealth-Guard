import logging
from datetime import datetime
from typing import List
import numpy as np
from app.models.schemas import KelurahanSpatial, StationData, HotspotData, IdwResult
from app.spatial.geometry import haversine_distance_matrix

logger = logging.getLogger("aerohealth.spatial.idw")


def classify_ispu_category(score: int) -> str:
    """
    Classify numerical ISPU score according to official Indonesian KLHK standards:
    - 0 to 50: Baik (Good)
    - 51 to 100: Sedang (Moderate)
    - 101 to 200: Tidak Sehat (Unhealthy)
    - 201 to 300: Sangat Tidak Sehat (Very Unhealthy)
    - > 300: Berbahaya (Hazardous)
    """
    if score <= 50:
        return "Baik"
    elif score <= 100:
        return "Sedang"
    elif score <= 200:
        return "Tidak Sehat"
    elif score <= 300:
        return "Sangat Tidak Sehat"
    else:
        return "Berbahaya"


def calculate_hotspot_adjusted_idw(
    kelurahans: List[KelurahanSpatial],
    stations: List[StationData],
    hotspots: List[HotspotData],
    power: float = 2.0,
    r_max_km: float = 10.0,
    alpha: float = 1.5,
    penalty_cap: float = 150.0,
) -> List[IdwResult]:
    """
    Compute hyperlocal ISPU estimations for all kelurahan centroids using Hotspot-Adjusted IDW.

    Mathematical Formula:
        ISPU_final(s0) = round(ISPU_IDW(s0) + Delta_hotspot(s0))

        1. Baseline IDW:
           ISPU_IDW(s0) = Σ(1 / d(s0, si)^p * Z(si)) / Σ(1 / d(s0, si)^p)

        2. Hotspot Penalty:
           Delta_hotspot(s0) = min(penalty_cap, Σ (alpha * FRP_j / max(d(s0, hj), 0.5)))
           for all hotspots hj within distance d <= r_max_km.

    Returns:
        List[IdwResult] with calculated ISPU scores, categories, and hotspot penalty info.
    """
    if not kelurahans:
        logger.warning("No kelurahans provided for IDW calculation.")
        return []

    if not stations:
        logger.warning("No ground stations available. Returning fallback score 50 (Baik) for all kelurahans.")
        now = datetime.utcnow()
        return [
            IdwResult(
                kelurahan_id=k.id,
                ispu_score=50,
                kategori="Baik",
                primary_pollutant="PM2.5",
                hotspot_detected=False,
                hotspot_penalty=0.0,
                calculated_at=now,
            )
            for k in kelurahans
        ]

    # Extract coordinate matrices
    # kel_coords shape: (N, 2)
    kel_coords = np.array(
        [[k.centroid_lat, k.centroid_lng] for k in kelurahans], dtype=float
    )

    # sta_coords shape: (M, 2), sta_values shape: (M,)
    sta_coords = np.array(
        [[s.latitude, s.longitude] for s in stations], dtype=float
    )
    sta_values = np.array([float(s.ispu_val or 50) for s in stations], dtype=float)

    # Step 1: Calculate pairwise distance matrix between kelurahan centroids and stations
    # dist_stations shape: (N, M)
    dist_stations = haversine_distance_matrix(kel_coords, sta_coords)

    # Step 2: Compute Baseline IDW with exact coincidence handling
    # If centroid coincides with a station (d < 0.001 km / 1 meter), use that station value directly
    is_exact_match = dist_stations < 0.001
    has_exact_match = np.any(is_exact_match, axis=1)

    # Standard IDW weights: 1 / d^p
    with np.errstate(divide="ignore", invalid="ignore"):
        safe_dist_sta = np.where(dist_stations < 0.001, 1.0, dist_stations)
        weights = 1.0 / (safe_dist_sta ** power)
        sum_weights = np.sum(weights, axis=1)
        weighted_values = np.sum(weights * sta_values[np.newaxis, :], axis=1)
        ispu_idw = np.where(sum_weights > 0, weighted_values / sum_weights, 50.0)

    # For exact matches, take the coincident station value
    for i in range(len(kelurahans)):
        if has_exact_match[i]:
            match_idx = np.where(is_exact_match[i])[0][0]
            ispu_idw[i] = sta_values[match_idx]

    # Step 3: Compute Hotspot Impact Penalty (Delta_hotspot)
    n_kel = len(kelurahans)
    total_penalties = np.zeros(n_kel, dtype=float)
    hotspot_flags = np.zeros(n_kel, dtype=bool)

    if hotspots:
        # hot_coords shape: (K, 2), hot_frp shape: (K,)
        hot_coords = np.array(
            [[h.latitude, h.longitude] for h in hotspots], dtype=float
        )
        hot_frp = np.array([float(h.frp) for h in hotspots], dtype=float)

        # dist_hotspots shape: (N, K)
        dist_hotspots = haversine_distance_matrix(kel_coords, hot_coords)

        # Filter hotspots within R_max (10 km)
        mask_within_rmax = dist_hotspots <= r_max_km
        hotspot_flags = np.any(mask_within_rmax, axis=1)

        # Minimum distance floor 0.5 km to prevent extreme spikes on direct hotspot overlay
        clamped_hot_dist = np.maximum(dist_hotspots, 0.5)

        # Penalty formula: α * FRP_j / d(s0, hj)
        penalties_matrix = np.where(
            mask_within_rmax,
            (alpha * hot_frp[np.newaxis, :]) / clamped_hot_dist,
            0.0,
        )

        # Sum penalties per kelurahan and apply cap (150)
        summed_penalties = np.sum(penalties_matrix, axis=1)
        total_penalties = np.minimum(penalty_cap, summed_penalties)

    # Step 4: Calculate final composite ISPU score
    final_scores = np.round(ispu_idw + total_penalties).astype(int)
    final_scores = np.maximum(0, final_scores)

    # Step 5: Format results
    now = datetime.utcnow()
    results: List[IdwResult] = []

    for i, kel in enumerate(kelurahans):
        score = int(final_scores[i])
        category = classify_ispu_category(score)
        
        results.append(
            IdwResult(
                kelurahan_id=kel.id,
                ispu_score=score,
                kategori=category,
                primary_pollutant="PM2.5",
                hotspot_detected=bool(hotspot_flags[i]),
                hotspot_penalty=round(float(total_penalties[i]), 2),
                calculated_at=now,
            )
        )

    logger.info(
        f"Calculated Hotspot-Adjusted IDW for {len(results)} kelurahans. "
        f"Hotspots impacted {np.sum(hotspot_flags)} areas."
    )
    return results
