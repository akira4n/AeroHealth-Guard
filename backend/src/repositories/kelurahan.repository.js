const prisma = require('../config/database');

class KelurahanRepository {
  /**
   * Mencari wilayah kelurahan berdasarkan koordinat GPS (lat, lng) menggunakan PostGIS ST_Contains
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Object|null>}
   */
  async findByCoordinates(lat, lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    const result = await prisma.$queryRaw`
      SELECT 
        id, 
        kode_kemendagri, 
        nama_kelurahan, 
        nama_kecamatan, 
        kabupaten_kota, 
        provinsi,
        ST_AsGeoJSON(geom)::json AS geometry,
        ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
      FROM kelurahan
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${parsedLng}::float8, ${parsedLat}::float8), 4326))
      LIMIT 1;
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Mengambil detail kelurahan beserta poligon GeoJSON berdasarkan ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const parsedId = parseInt(id, 10);

    const result = await prisma.$queryRaw`
      SELECT 
        id, 
        kode_kemendagri, 
        nama_kelurahan, 
        nama_kecamatan, 
        kabupaten_kota, 
        provinsi,
        ST_AsGeoJSON(geom)::json AS geometry,
        ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
      FROM kelurahan
      WHERE id = ${parsedId}
      LIMIT 1;
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Mengambil daftar unik kabupaten/kota
   * @returns {Promise<Array<string>>}
   */
  async getCities() {
    const result = await prisma.$queryRaw`
      SELECT DISTINCT kabupaten_kota 
      FROM kelurahan 
      ORDER BY kabupaten_kota ASC;
    `;
    return result.map((row) => row.kabupaten_kota);
  }

  /**
   * Mengambil daftar unik kecamatan di dalam suatu kota/kabupaten
   * @param {string} kota
   * @returns {Promise<Array<string>>}
   */
  async getDistrictsByCity(kota) {
    const result = await prisma.$queryRaw`
      SELECT DISTINCT nama_kecamatan 
      FROM kelurahan 
      WHERE kabupaten_kota = ${kota}
      ORDER BY nama_kecamatan ASC;
    `;
    return result.map((row) => row.nama_kecamatan);
  }

  /**
   * Mengambil daftar kelurahan di dalam suatu kecamatan dan kota/kabupaten
   * @param {string} kota
   * @param {string} kecamatan
   * @returns {Promise<Array<Object>>}
   */
  async getKelurahansByDistrict(kota, kecamatan) {
    const result = await prisma.$queryRaw`
      SELECT 
        id, 
        kode_kemendagri, 
        nama_kelurahan, 
        nama_kecamatan, 
        kabupaten_kota
      FROM kelurahan 
      WHERE kabupaten_kota = ${kota} AND nama_kecamatan = ${kecamatan}
      ORDER BY nama_kelurahan ASC;
    `;
    return result;
  }
}

module.exports = new KelurahanRepository();
