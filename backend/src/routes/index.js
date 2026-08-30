const express = require('express');
const healthRoutes = require('./health.routes');
const kelurahanRoutes = require('./kelurahan.routes');
const ispuRoutes = require('./ispu.routes');
const hotspotRoutes = require('./hotspot.routes');
const shelterRoutes = require('./shelter.routes');
const symptomRoutes = require('./symptom.routes');

const router = express.Router();

// Mount all feature routes
router.use('/health', healthRoutes);
router.use('/kelurahan', kelurahanRoutes);
router.use('/ispu', ispuRoutes);
router.use('/hotspots', hotspotRoutes);
router.use('/shelters', shelterRoutes);
router.use('/symptoms', symptomRoutes);

module.exports = router;
