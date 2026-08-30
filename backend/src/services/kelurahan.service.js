const kelurahanRepository = require('../repositories/kelurahan.repository');

class KelurahanService {
  /**
   * Mendeteksi kelurahan berdasarkan koordinat GPS
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Object>}
   */
  async locateByCoordinates(lat, lng) {
    const kelurahan = await kelurahanRepository.findByCoordinates(lat, lng);

    if (!kelurahan) {
      return {
        is_within_coverage: false,
        message:
          'Lokasi koordinat Anda berada di luar cakupan wilayah pilot AeroHealth Guard (Sumatera Selatan). Silakan gunakan navigasi pemilihan wilayah manual.',
        coordinates: { lat, lng }
      };
    }

    return {
      is_within_coverage: true,
      kelurahan
    };
  }

  /**
   * Mengambil data hierarki wilayah untuk cascading dropdown
   * @param {string} [kota]
   * @param {string} [kecamatan]
   * @returns {Promise<Object>}
   */
  async getHierarchy(kota, kecamatan) {
    // Level 1: Daftar Kabupaten / Kota
    if (!kota) {
      const cities = await kelurahanRepository.getCities();
      return {
        level: 'kota',
        total: cities.length,
        items: cities
      };
    }

    // Level 2: Daftar Kecamatan di Kota yang dipilih
    if (kota && !kecamatan) {
      const districts = await kelurahanRepository.getDistrictsByCity(kota);
      return {
        level: 'kecamatan',
        kota,
        total: districts.length,
        items: districts
      };
    }

    // Level 3: Daftar Kelurahan di Kecamatan yang dipilih
    const kelurahans = await kelurahanRepository.getKelurahansByDistrict(kota, kecamatan);
    return {
      level: 'kelurahan',
      kota,
      kecamatan,
      total: kelurahans.length,
      items: kelurahans
    };
  }

  /**
   * Mengambil detail kelurahan berdasarkan ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getKelurahanById(id) {
    const kelurahan = await kelurahanRepository.findById(id);

    if (!kelurahan) {
      const error = new Error(`Kelurahan dengan ID ${id} tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    return kelurahan;
  }
}

module.exports = new KelurahanService();
