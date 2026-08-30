const shelterService = require('../services/shelter.service');
const { successResponse } = require('../utils/response.util');

class ShelterController {
  /**
   * Endpoint pencarian Clean Air Shelter terdekat berbasis koordinat GPS
   * GET /api/shelters/nearby?lat=&lng=&limit=&max_distance_km=
   */
  async getNearby(req, res, next) {
    try {
      const { lat, lng, limit, max_distance_km } = req.query;
      const data = await shelterService.getNearbyShelters(lat, lng, limit, max_distance_km);

      return successResponse(
        res,
        200,
        'Daftar fasilitas Clean Air Shelter terdekat berhasil diambil.',
        data
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint daftar shelter di kelurahan tertentu
   * GET /api/shelters/kelurahan/:id
   */
  async getByKelurahan(req, res, next) {
    try {
      const { id } = req.params;
      const data = await shelterService.getSheltersByKelurahan(id);

      return successResponse(
        res,
        200,
        `Daftar shelter untuk ${data.nama_kelurahan} berhasil diambil.`,
        data
      );
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ShelterController();
