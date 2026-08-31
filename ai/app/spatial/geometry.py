import numpy as np

# Earth's mean radius in kilometers (WGS 84 ellipsoid mean radius)
EARTH_RADIUS_KM = 6371.0088


def haversine_distance_matrix(coords_a: np.ndarray, coords_b: np.ndarray) -> np.ndarray:
    """
    Calculate the pairwise great-circle Haversine distance matrix between two sets of coordinates.

    Parameters:
        coords_a: Array of shape (N, 2) containing [latitude, longitude] in decimal degrees.
        coords_b: Array of shape (M, 2) containing [latitude, longitude] in decimal degrees.

    Returns:
        np.ndarray of shape (N, M) containing pairwise distances in kilometers.
    """
    if coords_a.size == 0 or coords_b.size == 0:
        return np.empty((coords_a.shape[0], coords_b.shape[0]), dtype=float)

    # Convert decimal degrees to radians
    lat_a = np.radians(coords_a[:, 0])
    lon_a = np.radians(coords_a[:, 1])
    lat_b = np.radians(coords_b[:, 0])
    lon_b = np.radians(coords_b[:, 1])

    # Differences with broadcasting
    dlat = lat_a[:, np.newaxis] - lat_b[np.newaxis, :]
    dlon = lon_a[:, np.newaxis] - lon_b[np.newaxis, :]

    # Haversine formula
    sin_dlat2 = np.sin(dlat / 2.0) ** 2
    sin_dlon2 = np.sin(dlon / 2.0) ** 2
    cos_lat_a = np.cos(lat_a[:, np.newaxis])
    cos_lat_b = np.cos(lat_b[np.newaxis, :])

    a = sin_dlat2 + cos_lat_a * cos_lat_b * sin_dlon2
    a = np.clip(a, 0.0, 1.0)

    c = 2.0 * np.arcsin(np.sqrt(a))
    return EARTH_RADIUS_KM * c
