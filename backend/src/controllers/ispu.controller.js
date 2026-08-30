const ispuService = require('../services/ispu.service');
const { successResponse } = require('../utils/response.util');

class IspuController {
  /**
   * Endpoint detail skor ISPU dan rekomendasi mitigasi kesehatan kelurahan
   * GET /api/ispu/kelurahan/:id
   */
  async getKelurahanIspu(req, res, next) {
    try {
      const { id } = req.params;
      const data = await ispuService.getKelurahanIspu(id);

      return successResponse(
        res,
        200,
        `Data estimasi ISPU untuk ${data.nama_kelurahan} berhasil diambil.`,
        data
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint GeoJSON FeatureCollection untuk rendering Leaflet Heatmap
   * GET /api/ispu/map
   */
  async getMapData(req, res, next) {
    try {
      const featureCollection = await ispuService.getMapFeatureCollection();

      return successResponse(
        res,
        200,
        'Data spasial peta kualitas udara (ISPU Map) berhasil diambil.',
        featureCollection
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint riwayat skor ISPU untuk tren grafik
   * GET /api/ispu/history/:kelurahan_id?limit=24
   */
  async getHistory(req, res, next) {
    try {
      const { kelurahan_id } = req.params;
      const { limit } = req.query;

      const history = await ispuService.getIspuHistory(kelurahan_id, limit);

      return successResponse(res, 200, 'Riwayat estimasi ISPU berhasil diambil.', {
        kelurahan_id: parseInt(kelurahan_id, 10),
        total: history.length,
        history
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new IspuController();
