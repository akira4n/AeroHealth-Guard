const hotspotService = require('../services/hotspot.service');
const { successResponse } = require('../utils/response.util');

class HotspotController {
  /**
   * Endpoint daftar titik api aktif untuk marker peta Leaflet
   * GET /api/hotspots/active?min_frp=&confidence=&limit=
   */
  async getActiveHotspots(req, res, next) {
    try {
      const data = await hotspotService.getActiveHotspots(req.query);

      return successResponse(res, 200, 'Daftar titik api aktif berhasil diambil.', data);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint ringkasan statistik dan analisis ancaman karhutla satelit
   * GET /api/hotspots/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await hotspotService.getHotspotStats();

      return successResponse(
        res,
        200,
        'Statistik titik api aktif dan status bahaya karhutla berhasil diambil.',
        stats
      );
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new HotspotController();
