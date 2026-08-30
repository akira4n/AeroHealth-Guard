const prisma = require('../config/database');

class HotspotRepository {
  /**
   * Mengambil daftar titik api aktif dari tabel active_hotspots dengan filter opsional
   * @param {{ min_frp?: number, confidence?: string, limit?: number }} filters
   * @returns {Promise<Array<Object>>}
   */
  async findActiveHotspots(filters = {}) {
    const minFrp = filters.min_frp !== undefined ? parseFloat(filters.min_frp) : 0;
    const confidence = filters.confidence || 'all';
    const limit = parseInt(filters.limit || 100, 10);

    let result;

    if (confidence === 'all') {
      result = await prisma.$queryRaw`
        SELECT 
          id,
          latitude,
          longitude,
          frp,
          confidence,
          acquired_at,
          ST_AsGeoJSON(location)::json AS location_geojson
        FROM active_hotspots
        WHERE frp >= ${minFrp}
        ORDER BY frp DESC, acquired_at DESC
        LIMIT ${limit};
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT 
          id,
          latitude,
          longitude,
          frp,
          confidence,
          acquired_at,
          ST_AsGeoJSON(location)::json AS location_geojson
        FROM active_hotspots
        WHERE frp >= ${minFrp} AND confidence = ${confidence}
        ORDER BY frp DESC, acquired_at DESC
        LIMIT ${limit};
      `;
    }

    return result;
  }

  /**
   * Mengambil ringkasan statistik agregasi titik api aktif
   * @returns {Promise<Object>}
   */
  async getHotspotSummaryStats() {
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int AS total_hotspots,
        COALESCE(MAX(frp), 0)::float AS max_frp,
        COALESCE(ROUND(AVG(frp)::numeric, 1), 0)::float AS avg_frp,
        COUNT(*) FILTER (WHERE confidence = 'high')::int AS high_confidence_count,
        COUNT(*) FILTER (WHERE confidence = 'nominal')::int AS nominal_confidence_count,
        COUNT(*) FILTER (WHERE frp > 100)::int AS high_intensity_count,
        MAX(acquired_at) AS last_sync
      FROM active_hotspots;
    `;

    return (
      result[0] || {
        total_hotspots: 0,
        max_frp: 0,
        avg_frp: 0,
        high_confidence_count: 0,
        nominal_confidence_count: 0,
        high_intensity_count: 0,
        last_sync: null
      }
    );
  }
}

module.exports = new HotspotRepository();
