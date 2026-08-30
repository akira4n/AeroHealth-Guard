const ispuRepository = require('../repositories/ispu.repository');
const kelurahanRepository = require('../repositories/kelurahan.repository');
const { KLHK_FALLBACK_ADVISORY } = require('../utils/constants');

/**
 * Menentukan kode warna hex resmi KLHK berdasarkan kategori atau skor ISPU
 * @param {string} [kategori]
 * @param {number} [score]
 * @returns {string}
 */
const getIspuColor = (kategori, score = 0) => {
  if (kategori) {
    const norm = kategori.toLowerCase().trim();
    if (norm === 'baik') return '#00E400';
    if (norm === 'sedang') return '#FFFF00';
    if (norm === 'tidak sehat') return '#FF0000';
    if (norm === 'sangat tidak sehat') return '#8F3F97';
    if (norm === 'berbahaya') return '#7E0023';
  }

  if (score <= 50) return '#00E400';
  if (score <= 100) return '#FFFF00';
  if (score <= 200) return '#FF0000';
  if (score <= 300) return '#8F3F97';
  return '#7E0023';
};

class IspuService {
  /**
   * Mengambil data skor ISPU dan rekomendasi mitigasi AI terkini untuk suatu kelurahan
   * @param {number} kelurahanId
   * @returns {Promise<Object>}
   */
  async getKelurahanIspu(kelurahanId) {
    const ispuLog = await ispuRepository.findLatestByKelurahanId(kelurahanId);

    if (!ispuLog) {
      // Periksa apakah kelurahannya memang ada di database
      const kelurahan = await kelurahanRepository.findById(kelurahanId);
      if (!kelurahan) {
        const error = new Error(`Kelurahan dengan ID ${kelurahanId} tidak ditemukan.`);
        error.statusCode = 404;
        throw error;
      }

      // Jika ada kelurahan tetapi belum memiliki log ISPU
      return {
        kelurahan_id: kelurahan.id,
        nama_kelurahan: kelurahan.nama_kelurahan,
        nama_kecamatan: kelurahan.nama_kecamatan,
        kabupaten_kota: kelurahan.kabupaten_kota,
        provinsi: kelurahan.provinsi,
        ispu_score: 0,
        kategori: 'Baik',
        color: '#00E400',
        primary_pollutant: 'PM2.5',
        hotspot_detected: false,
        advisory_text: KLHK_FALLBACK_ADVISORY['Baik'],
        is_ai_generated: false,
        calculated_at: null,
        geometry: kelurahan.geometry,
        centroid: kelurahan.centroid
      };
    }

    // Resolusi narasi rekomendasi AI dengan mekanisme fallback KLHK (NFR-REL-1)
    let advisoryText = ispuLog.advisory_text;
    let isAiGenerated = true;

    if (!advisoryText || advisoryText.trim().length === 0) {
      advisoryText = KLHK_FALLBACK_ADVISORY[ispuLog.kategori] || KLHK_FALLBACK_ADVISORY['Baik'];
      isAiGenerated = false;
    }

    return {
      id: ispuLog.id,
      kelurahan_id: ispuLog.kelurahan_id,
      nama_kelurahan: ispuLog.nama_kelurahan,
      nama_kecamatan: ispuLog.nama_kecamatan,
      kabupaten_kota: ispuLog.kabupaten_kota,
      provinsi: ispuLog.provinsi,
      ispu_score: ispuLog.ispu_score,
      kategori: ispuLog.kategori,
      color: getIspuColor(ispuLog.kategori, ispuLog.ispu_score),
      primary_pollutant: ispuLog.primary_pollutant || 'PM2.5',
      hotspot_detected: Boolean(ispuLog.hotspot_detected),
      advisory_text: advisoryText,
      is_ai_generated: isAiGenerated,
      calculated_at: ispuLog.calculated_at,
      geometry: ispuLog.geometry,
      centroid: ispuLog.centroid
    };
  }

  /**
   * Mengambil data poligon seluruh kelurahan dalam format GeoJSON FeatureCollection untuk Leaflet Heatmap
   * @returns {Promise<Object>}
   */
  async getMapFeatureCollection() {
    const rows = await ispuRepository.findAllLatestForMap();

    const features = rows.map((row) => {
      const score = row.ispu_score ?? 0;
      const kategori = row.kategori ?? 'Baik';
      const color = getIspuColor(kategori, score);

      return {
        type: 'Feature',
        id: row.kelurahan_id,
        properties: {
          kelurahan_id: row.kelurahan_id,
          kode_kemendagri: row.kode_kemendagri,
          nama_kelurahan: row.nama_kelurahan,
          nama_kecamatan: row.nama_kecamatan,
          kabupaten_kota: row.kabupaten_kota,
          provinsi: row.provinsi,
          ispu_score: score,
          kategori,
          color,
          primary_pollutant: row.primary_pollutant || 'PM2.5',
          hotspot_detected: Boolean(row.hotspot_detected),
          calculated_at: row.calculated_at,
          centroid: row.centroid
        },
        geometry: row.geometry
      };
    });

    return {
      type: 'FeatureCollection',
      total_features: features.length,
      features
    };
  }

  /**
   * Mengambil riwayat log ISPU untuk tren grafik
   * @param {number} kelurahanId
   * @param {number} [limit=24]
   * @returns {Promise<Array<Object>>}
   */
  async getIspuHistory(kelurahanId, limit = 24) {
    // Validasi keberadaan kelurahan
    const kelurahan = await kelurahanRepository.findById(kelurahanId);
    if (!kelurahan) {
      const error = new Error(`Kelurahan dengan ID ${kelurahanId} tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    const history = await ispuRepository.findHistoryByKelurahanId(kelurahanId, limit);

    return history.map((item) => ({
      ...item,
      color: getIspuColor(item.kategori, item.ispu_score)
    }));
  }
}

module.exports = new IspuService();
