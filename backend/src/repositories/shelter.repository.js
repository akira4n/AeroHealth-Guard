const prisma = require('../config/database');

class ShelterRepository {
  /**
   * Mencari shelter terdekat dari koordinat pengguna menggunakan PostGIS ST_DistanceSphere
   * @param {number} lat
   * @param {number} lng
   * @param {number} [limit=5]
   * @param {number} [maxDistanceKm]
   * @returns {Promise<Array<Object>>}
   */
  async findNearbyShelters(lat, lng, limit = 5, maxDistanceKm) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedLimit = parseInt(limit, 10);

    let result;

    if (maxDistanceKm) {
      const maxDistanceMeters = parseFloat(maxDistanceKm) * 1000;
      result = await prisma.$queryRaw`
        SELECT 
          s.id,
          s.kelurahan_id,
          k.nama_kelurahan,
          k.nama_kecamatan,
          k.kabupaten_kota,
          s.nama_tempat,
          s.alamat,
          s.fasilitas,
          ST_Y(s.location)::float AS latitude,
          ST_X(s.location)::float AS longitude,
          ST_AsGeoJSON(s.location)::json AS location_geojson,
          ROUND(ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint(${parsedLng}::float8, ${parsedLat}::float8), 4326))::numeric, 1)::float AS distance_meters
        FROM clean_shelters s
        LEFT JOIN kelurahan k ON k.id = s.kelurahan_id
        WHERE ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint(${parsedLng}::float8, ${parsedLat}::float8), 4326)) <= ${maxDistanceMeters}
        ORDER BY distance_meters ASC
        LIMIT ${parsedLimit};
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT 
          s.id,
          s.kelurahan_id,
          k.nama_kelurahan,
          k.nama_kecamatan,
          k.kabupaten_kota,
          s.nama_tempat,
          s.alamat,
          s.fasilitas,
          ST_Y(s.location)::float AS latitude,
          ST_X(s.location)::float AS longitude,
          ST_AsGeoJSON(s.location)::json AS location_geojson,
          ROUND(ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint(${parsedLng}::float8, ${parsedLat}::float8), 4326))::numeric, 1)::float AS distance_meters
        FROM clean_shelters s
        LEFT JOIN kelurahan k ON k.id = s.kelurahan_id
        ORDER BY distance_meters ASC
        LIMIT ${parsedLimit};
      `;
    }

    return result;
  }

  /**
   * Mengambil daftar shelter di dalam kelurahan tertentu
   * @param {number} kelurahanId
   * @returns {Promise<Array<Object>>}
   */
  async findByKelurahanId(kelurahanId) {
    const parsedId = parseInt(kelurahanId, 10);

    const result = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.kelurahan_id,
        k.nama_kelurahan,
        k.nama_kecamatan,
        k.kabupaten_kota,
        s.nama_tempat,
        s.alamat,
        s.fasilitas,
        ST_Y(s.location)::float AS latitude,
        ST_X(s.location)::float AS longitude,
        ST_AsGeoJSON(s.location)::json AS location_geojson
      FROM clean_shelters s
      JOIN kelurahan k ON k.id = s.kelurahan_id
      WHERE s.kelurahan_id = ${parsedId}
      ORDER BY s.nama_tempat ASC;
    `;

    return result;
  }
}

module.exports = new ShelterRepository();
