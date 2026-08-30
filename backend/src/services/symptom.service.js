const symptomRepository = require('../repositories/symptom.repository');
const kelurahanRepository = require('../repositories/kelurahan.repository');

/**
 * Menghitung persentase distribusi gejala (1 angka di belakang koma)
 * @param {number} batuk
 * @param {number} mata
 * @param {number} sesak
 * @param {number} normal
 * @param {number} total
 * @returns {{ batuk_pct: number, mata_perih_pct: number, sesak_pct: number, normal_pct: number }}
 */
const calculatePercentages = (batuk, mata, sesak, normal, total) => {
  if (!total || total === 0) {
    return {
      batuk_pct: 0,
      mata_perih_pct: 0,
      sesak_pct: 0,
      normal_pct: 0
    };
  }
  return {
    batuk_pct: parseFloat(((batuk / total) * 100).toFixed(1)),
    mata_perih_pct: parseFloat(((mata / total) * 100).toFixed(1)),
    sesak_pct: parseFloat(((sesak / total) * 100).toFixed(1)),
    normal_pct: parseFloat(((normal / total) * 100).toFixed(1))
  };
};

/**
 * Menghasilkan narasi wawasan komunitas berdasarkan gejala dominan
 * @param {{ batuk_pct: number, mata_perih_pct: number, sesak_pct: number, normal_pct: number }} percentages
 * @param {number} totalLaporan
 * @param {string} [kelurahanNama]
 * @returns {{ dominant_symptom: string, community_insight: string }}
 */
const generateCommunityInsight = (percentages, totalLaporan, kelurahanNama = 'kelurahan ini') => {
  if (!totalLaporan || totalLaporan === 0) {
    return {
      dominant_symptom: 'none',
      community_insight: `Belum ada laporan keluhan kesehatan dari warga di ${kelurahanNama} hari ini.`
    };
  }

  const items = [
    { key: 'mata_perih', label: 'mata perih', pct: percentages.mata_perih_pct },
    { key: 'batuk', label: 'batuk-batuk', pct: percentages.batuk_pct },
    { key: 'sesak', label: 'sesak napas', pct: percentages.sesak_pct },
    { key: 'normal', label: 'kondisi normal / udara bersih', pct: percentages.normal_pct }
  ];

  items.sort((a, b) => b.pct - a.pct);
  const dominant = items[0];

  let insight;
  if (dominant.key === 'normal' && dominant.pct >= 50) {
    insight = `Mayoritas warga (${dominant.pct}%) di ${kelurahanNama} melaporkan bernapas normal dan tidak merasakan gangguan udara hari ini.`;
  } else if (dominant.key === 'mata_perih') {
    insight = `${dominant.pct}% warga di ${kelurahanNama} mengeluhkan mata perih hari ini akibat paparan partikulat asap.`;
  } else if (dominant.key === 'batuk') {
    insight = `${dominant.pct}% warga di ${kelurahanNama} melaporkan gejala batuk-batuk hari ini.`;
  } else if (dominant.key === 'sesak') {
    insight = `PERINGATAN KESEHATAN: ${dominant.pct}% warga di ${kelurahanNama} mengeluhkan sesak napas hari ini. Disarankan segera menuju shelter udara bersih terdekat jika membutuhkan.`;
  } else {
    insight = `${dominant.pct}% warga di ${kelurahanNama} mengeluhkan ${dominant.label} hari ini.`;
  }

  return {
    dominant_symptom: dominant.key,
    community_insight: insight
  };
};

class SymptomService {
  /**
   * Merekam laporan gejala 1-klik warga secara anonim (Zero PII)
   * @param {number} kelurahanId
   * @param {string} symptom
   * @returns {Promise<Object>}
   */
  async recordSymptomReport(kelurahanId, symptom) {
    // Validasi kelurahan
    const kelurahan = await kelurahanRepository.findById(kelurahanId);
    if (!kelurahan) {
      const error = new Error(`Kelurahan dengan ID ${kelurahanId} tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    // Atomic SQL UPSERT
    const updated = await symptomRepository.upsertDailyReport(kelurahanId, symptom);

    const percentages = calculatePercentages(
      updated.count_batuk,
      updated.count_mata_perih,
      updated.count_sesak,
      updated.count_normal,
      updated.total_laporan
    );

    const insight = generateCommunityInsight(
      percentages,
      updated.total_laporan,
      kelurahan.nama_kelurahan
    );

    return {
      kelurahan_id: kelurahan.id,
      nama_kelurahan: kelurahan.nama_kelurahan,
      reported_symptom: symptom,
      date: updated.tanggal,
      summary: {
        total_laporan: updated.total_laporan,
        count_batuk: updated.count_batuk,
        count_mata_perih: updated.count_mata_perih,
        count_sesak: updated.count_sesak,
        count_normal: updated.count_normal
      },
      percentages,
      ...insight
    };
  }

  /**
   * Mengambil data agregasi gejala kelurahan hari ini
   * @param {number} kelurahanId
   * @returns {Promise<Object>}
   */
  async getKelurahanSymptomStats(kelurahanId) {
    const kelurahan = await kelurahanRepository.findById(kelurahanId);
    if (!kelurahan) {
      const error = new Error(`Kelurahan dengan ID ${kelurahanId} tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    const report = await symptomRepository.findTodayByKelurahanId(kelurahanId);

    const counts = report || {
      count_batuk: 0,
      count_mata_perih: 0,
      count_sesak: 0,
      count_normal: 0,
      total_laporan: 0
    };

    const percentages = calculatePercentages(
      counts.count_batuk,
      counts.count_mata_perih,
      counts.count_sesak,
      counts.count_normal,
      counts.total_laporan
    );

    const insight = generateCommunityInsight(
      percentages,
      counts.total_laporan,
      kelurahan.nama_kelurahan
    );

    return {
      kelurahan_id: kelurahan.id,
      nama_kelurahan: kelurahan.nama_kelurahan,
      nama_kecamatan: kelurahan.nama_kecamatan,
      kabupaten_kota: kelurahan.kabupaten_kota,
      date: report ? report.tanggal : new Date().toISOString().split('T')[0],
      summary: {
        total_laporan: counts.total_laporan,
        count_batuk: counts.count_batuk,
        count_mata_perih: counts.count_mata_perih,
        count_sesak: counts.count_sesak,
        count_normal: counts.count_normal
      },
      percentages,
      ...insight
    };
  }

  /**
   * Mengambil agregasi distribusi gejala tingkat wilayah / kota hari ini
   * @returns {Promise<Object>}
   */
  async getGlobalSummary() {
    const stats = await symptomRepository.getGlobalDailySummary();

    const percentages = calculatePercentages(
      stats.total_batuk,
      stats.total_mata_perih,
      stats.total_sesak,
      stats.total_normal,
      stats.total_laporan
    );

    const insight = generateCommunityInsight(percentages, stats.total_laporan, 'seluruh wilayah');

    return {
      date: new Date().toISOString().split('T')[0],
      summary: stats,
      percentages,
      ...insight
    };
  }
}

module.exports = new SymptomService();
