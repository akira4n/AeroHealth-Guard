const kelurahanService = require('../services/kelurahan.service');
const { successResponse } = require('../utils/response.util');

class KelurahanController {
  /**
   * Endpoint deteksi lokasi wilayah berdasarkan koordinat GPS
   * GET /api/kelurahan/locate?lat=&lng=
   */
  async locate(req, res, next) {
    try {
      const { lat, lng } = req.query;
      const result = await kelurahanService.locateByCoordinates(lat, lng);

      const message = result.is_within_coverage
        ? 'Wilayah kelurahan berhasil dideteksi.'
        : result.message;

      return successResponse(res, 200, message, result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint daftar wilayah bertingkat (cascading dropdown: kota -> kecamatan -> kelurahan)
   * GET /api/kelurahan/list?kota=&kecamatan=
   */
  async getList(req, res, next) {
    try {
      const { kota, kecamatan } = req.query;
      const result = await kelurahanService.getHierarchy(kota, kecamatan);

      return successResponse(res, 200, 'Daftar wilayah berhasil diambil.', result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint detail kelurahan dan batas poligon GeoJSON berdasarkan ID
   * GET /api/kelurahan/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const kelurahan = await kelurahanService.getKelurahanById(id);

      return successResponse(res, 200, 'Detail kelurahan berhasil diambil.', kelurahan);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new KelurahanController();
