const symptomService = require('../services/symptom.service');
const { successResponse } = require('../utils/response.util');

class SymptomController {
  /**
   * Endpoint pelaporan 1-klik keluhan kesehatan warga (Zero PII)
   * POST /api/symptoms/report
   */
  async reportSymptom(req, res, next) {
    try {
      const { kelurahan_id, symptom } = req.body;
      const data = await symptomService.recordSymptomReport(kelurahan_id, symptom);

      return successResponse(
        res,
        201,
        'Terima kasih! Laporan kondisi kesehatan Anda berhasil dicatat secara anonim.',
        data
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint statistik keluhan kesehatan warga di kelurahan tertentu hari ini
   * GET /api/symptoms/kelurahan/:id
   */
  async getByKelurahan(req, res, next) {
    try {
      const { id } = req.params;
      const data = await symptomService.getKelurahanSymptomStats(id);

      return successResponse(
        res,
        200,
        `Statistik keluhan kesehatan warga untuk ${data.nama_kelurahan} berhasil diambil.`,
        data
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint ringkasan distribusi keluhan kesehatan seluruh wilayah hari ini
   * GET /api/symptoms/summary
   */
  async getGlobalSummary(req, res, next) {
    try {
      const data = await symptomService.getGlobalSummary();

      return successResponse(
        res,
        200,
        'Ringkasan distribusi keluhan kesehatan komunitas hari ini berhasil diambil.',
        data
      );
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new SymptomController();
