const express = require('express');
const ispuController = require('../controllers/ispu.controller');
const validate = require('../middlewares/validate.middleware');
const {
  kelurahanIdParamSchema,
  historyParamSchema,
  historyQuerySchema
} = require('../validations/ispu.validation');

const router = express.Router();

// GET /api/ispu/map (GeoJSON FeatureCollection untuk peta Leaflet)
router.get('/map', (req, res, next) => ispuController.getMapData(req, res, next));

// GET /api/ispu/kelurahan/:id (Detail skor ISPU & narasi AI mitigasi)
router.get('/kelurahan/:id', validate({ params: kelurahanIdParamSchema }), (req, res, next) =>
  ispuController.getKelurahanIspu(req, res, next)
);

// GET /api/ispu/history/:kelurahan_id?limit=24 (Riwayat tren ISPU)
router.get(
  '/history/:kelurahan_id',
  validate({ params: historyParamSchema, query: historyQuerySchema }),
  (req, res, next) => ispuController.getHistory(req, res, next)
);

module.exports = router;
