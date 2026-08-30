const prisma = require('../config/database');

class SymptomRepository {
  /**
   * Melakukan atomic UPSERT pelaporan gejala warga untuk tanggal hari ini
   * @param {number} kelurahanId
   * @param {string} symptom - 'batuk' | 'mata_perih' | 'sesak' | 'normal'
   * @returns {Promise<Object>}
   */
  async upsertDailyReport(kelurahanId, symptom) {
    const parsedId = parseInt(kelurahanId, 10);

    const result = await prisma.$queryRaw`
      INSERT INTO kelurahan_symptom_summary (
        kelurahan_id,
        tanggal,
        count_batuk,
        count_mata_perih,
        count_sesak,
        count_normal,
        total_laporan
      )
      VALUES (
        ${parsedId},
        CURRENT_DATE,
        CASE WHEN ${symptom} = 'batuk' THEN 1 ELSE 0 END,
        CASE WHEN ${symptom} = 'mata_perih' THEN 1 ELSE 0 END,
        CASE WHEN ${symptom} = 'sesak' THEN 1 ELSE 0 END,
        CASE WHEN ${symptom} = 'normal' THEN 1 ELSE 0 END,
        1
      )
      ON CONFLICT (kelurahan_id, tanggal)
      DO UPDATE SET
        count_batuk = kelurahan_symptom_summary.count_batuk + (CASE WHEN ${symptom} = 'batuk' THEN 1 ELSE 0 END),
        count_mata_perih = kelurahan_symptom_summary.count_mata_perih + (CASE WHEN ${symptom} = 'mata_perih' THEN 1 ELSE 0 END),
        count_sesak = kelurahan_symptom_summary.count_sesak + (CASE WHEN ${symptom} = 'sesak' THEN 1 ELSE 0 END),
        count_normal = kelurahan_symptom_summary.count_normal + (CASE WHEN ${symptom} = 'normal' THEN 1 ELSE 0 END),
        total_laporan = kelurahan_symptom_summary.total_laporan + 1
      RETURNING 
        id,
        kelurahan_id,
        tanggal,
        count_batuk,
        count_mata_perih,
        count_sesak,
        count_normal,
        total_laporan;
    `;

    return result[0];
  }

  /**
   * Mengambil agregasi gejala warga untuk kelurahan tertentu pada hari ini
   * @param {number} kelurahanId
   * @returns {Promise<Object|null>}
   */
  async findTodayByKelurahanId(kelurahanId) {
    const parsedId = parseInt(kelurahanId, 10);

    const result = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.kelurahan_id,
        k.nama_kelurahan,
        k.nama_kecamatan,
        k.kabupaten_kota,
        s.tanggal,
        s.count_batuk,
        s.count_mata_perih,
        s.count_sesak,
        s.count_normal,
        s.total_laporan
      FROM kelurahan_symptom_summary s
      JOIN kelurahan k ON k.id = s.kelurahan_id
      WHERE s.kelurahan_id = ${parsedId} AND s.tanggal = CURRENT_DATE
      LIMIT 1;
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Mengambil ringkasan agregasi seluruh keluhan warga hari ini di tingkat kota/wilayah
   * @returns {Promise<Object>}
   */
  async getGlobalDailySummary() {
    const result = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(count_batuk), 0)::int AS total_batuk,
        COALESCE(SUM(count_mata_perih), 0)::int AS total_mata_perih,
        COALESCE(SUM(count_sesak), 0)::int AS total_sesak,
        COALESCE(SUM(count_normal), 0)::int AS total_normal,
        COALESCE(SUM(total_laporan), 0)::int AS total_laporan,
        COUNT(DISTINCT kelurahan_id)::int AS total_kelurahan_melapor
      FROM kelurahan_symptom_summary
      WHERE tanggal = CURRENT_DATE;
    `;

    return (
      result[0] || {
        total_batuk: 0,
        total_mata_perih: 0,
        total_sesak: 0,
        total_normal: 0,
        total_laporan: 0,
        total_kelurahan_melapor: 0
      }
    );
  }
}

module.exports = new SymptomRepository();
