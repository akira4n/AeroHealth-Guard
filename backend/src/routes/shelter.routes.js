const express = require('express');
const shelterController = require('../controllers/shelter.controller');
const validate = require('../middlewares/validate.middleware');
const {
  nearbyQuerySchema,
  kelurahanShelterParamSchema
} = require('../validations/shelter.validation');

const router = express.Router();

// GET /api/shelters/nearby?lat=&lng=&limit=&max_distance_km=
router.get('/nearby', validate({ query: nearbyQuerySchema }), (req, res, next) =>
  shelterController.getNearby(req, res, next)
);

// GET /api/shelters/kelurahan/:id
router.get('/kelurahan/:id', validate({ params: kelurahanShelterParamSchema }), (req, res, next) =>
  shelterController.getByKelurahan(req, res, next)
);

module.exports = router;
