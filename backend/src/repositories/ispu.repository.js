const prisma = require('../config/database');

class IspuRepository {
  /**
   * Mengambil log ISPU dan AI Advisory terbaru untuk kelurahan tertentu
   * @param {number} kelurahanId
   * @returns {Promise<Object|null>}
   */
  async findLatestByKelurahanId(kelurahanId) {
    const parsedId = parseInt(kelurahanId, 10);

    const result = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.kelurahan_id,
        k.nama_kelurahan,
        k.nama_kecamatan,
        k.kabupaten_kota,
        k.provinsi,
        l.ispu_score,
        l.kategori,
        l.primary_pollutant,
        l.advisory_text,
        l.hotspot_detected,
        l.calculated_at,
        ST_AsGeoJSON(k.geom)::json AS geometry,
        ST_AsGeoJSON(ST_Centroid(k.geom))::json AS centroid
      FROM log_ispu_kelurahan l
      JOIN kelurahan k ON k.id = l.kelurahan_id
      WHERE l.kelurahan_id = ${parsedId}
      ORDER BY l.calculated_at DESC
      LIMIT 1;
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Mengambil data seluruh kelurahan beserta skor ISPU terbaru untuk Leaflet Heatmap
   * @returns {Promise<Array<Object>>}
   */
  async findAllLatestForMap() {
    const result = await prisma.$queryRaw`
      SELECT 
        k.id AS kelurahan_id,
        k.kode_kemendagri,
        k.nama_kelurahan,
        k.nama_kecamatan,
        k.kabupaten_kota,
        k.provinsi,
        ST_AsGeoJSON(k.geom)::json AS geometry,
        ST_AsGeoJSON(ST_Centroid(k.geom))::json AS centroid,
        l.ispu_score,
        l.kategori,
        l.primary_pollutant,
        l.hotspot_detected,
        l.calculated_at
      FROM kelurahan k
      LEFT JOIN LATERAL (
        SELECT ispu_score, kategori, primary_pollutant, hotspot_detected, calculated_at
        FROM log_ispu_kelurahan
        WHERE kelurahan_id = k.id
        ORDER BY calculated_at DESC
        LIMIT 1
      ) l ON true
      ORDER BY k.id ASC;
    `;

    return result;
  }

  /**
   * Mengambil riwayat log ISPU kelurahan untuk visualisasi tren
   * @param {number} kelurahanId
   * @param {number} limit
   * @returns {Promise<Array<Object>>}
   */
  async findHistoryByKelurahanId(kelurahanId, limit = 24) {
    const parsedId = parseInt(kelurahanId, 10);
    const parsedLimit = parseInt(limit, 10);

    const result = await prisma.$queryRaw`
      SELECT 
        id,
        kelurahan_id,
        ispu_score,
        kategori,
        primary_pollutant,
        hotspot_detected,
        calculated_at
      FROM log_ispu_kelurahan
      WHERE kelurahan_id = ${parsedId}
      ORDER BY calculated_at DESC
      LIMIT ${parsedLimit};
    `;

    return result;
  }
}

module.exports = new IspuRepository();
