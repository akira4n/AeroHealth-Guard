const shelterRepository = require('../repositories/shelter.repository');
const kelurahanRepository = require('../repositories/kelurahan.repository');

/**
 * Format jarak meter ke string yang mudah dibaca (misal: "458 m" atau "2.1 km")
 * @param {number} distanceMeters
 * @returns {string}
 */
const formatDistance = (distanceMeters = 0) => {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

/**
 * Menghasilkan URL navigasi arah rute Google Maps
 * @param {number} userLat
 * @param {number} userLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {string}
 */
const buildGoogleMapsUrl = (userLat, userLng, destLat, destLng) => {
  return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
};

class ShelterService {
  /**
   * Mengambil daftar shelter terdekat dari koordinat pengguna dengan kalkulasi rute navigasi
   * @param {number} lat
   * @param {number} lng
   * @param {number} [limit=5]
   * @param {number} [maxDistanceKm]
   * @returns {Promise<Object>}
   */
  async getNearbyShelters(lat, lng, limit = 5, maxDistanceKm) {
    const rawShelters = await shelterRepository.findNearbyShelters(lat, lng, limit, maxDistanceKm);

    const shelters = rawShelters.map((item) => {
      const distMeters = item.distance_meters ?? 0;
      const distKm = parseFloat((distMeters / 1000).toFixed(2));

      return {
        id: item.id,
        nama_tempat: item.nama_tempat,
        alamat: item.alamat,
        fasilitas: item.fasilitas,
        kelurahan_id: item.kelurahan_id,
        nama_kelurahan: item.nama_kelurahan,
        nama_kecamatan: item.nama_kecamatan,
        kabupaten_kota: item.kabupaten_kota,
        latitude: item.latitude,
        longitude: item.longitude,
        coordinates: [item.longitude, item.latitude],
        distance_meters: distMeters,
        distance_km: distKm,
        distance_formatted: formatDistance(distMeters),
        google_maps_url: buildGoogleMapsUrl(lat, lng, item.latitude, item.longitude),
        location: item.location_geojson
      };
    });

    return {
      total: shelters.length,
      user_coordinates: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      },
      shelters
    };
  }

  /**
   * Mengambil daftar shelter di dalam kelurahan tertentu
   * @param {number} kelurahanId
   * @returns {Promise<Object>}
   */
  async getSheltersByKelurahan(kelurahanId) {
    const kelurahan = await kelurahanRepository.findById(kelurahanId);
    if (!kelurahan) {
      const error = new Error(`Kelurahan dengan ID ${kelurahanId} tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    const rawShelters = await shelterRepository.findByKelurahanId(kelurahanId);

    const shelters = rawShelters.map((item) => ({
      id: item.id,
      nama_tempat: item.nama_tempat,
      alamat: item.alamat,
      fasilitas: item.fasilitas,
      kelurahan_id: item.kelurahan_id,
      nama_kelurahan: item.nama_kelurahan,
      nama_kecamatan: item.nama_kecamatan,
      kabupaten_kota: item.kabupaten_kota,
      latitude: item.latitude,
      longitude: item.longitude,
      coordinates: [item.longitude, item.latitude],
      location: item.location_geojson
    }));

    return {
      kelurahan_id: parseInt(kelurahanId, 10),
      nama_kelurahan: kelurahan.nama_kelurahan,
      total: shelters.length,
      shelters
    };
  }
}

module.exports = new ShelterService();
