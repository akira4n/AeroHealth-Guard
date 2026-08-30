const express = require('express');
const hotspotController = require('../controllers/hotspot.controller');
const validate = require('../middlewares/validate.middleware');
const { activeHotspotsQuerySchema } = require('../validations/hotspot.validation');

const router = express.Router();

// GET /api/hotspots/active?min_frp=&confidence=&limit=
router.get('/active', validate({ query: activeHotspotsQuerySchema }), (req, res, next) =>
  hotspotController.getActiveHotspots(req, res, next)
);

// GET /api/hotspots/stats
router.get('/stats', (req, res, next) => hotspotController.getStats(req, res, next));

module.exports = router;
