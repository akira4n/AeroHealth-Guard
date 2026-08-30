const express = require('express');
const symptomController = require('../controllers/symptom.controller');
const validate = require('../middlewares/validate.middleware');
const {
  reportSymptomSchema,
  kelurahanSymptomParamSchema
} = require('../validations/symptom.validation');

const router = express.Router();

// POST /api/symptoms/report (Pelaporan 1-klik warga, Zero PII)
router.post('/report', validate({ body: reportSymptomSchema }), (req, res, next) =>
  symptomController.reportSymptom(req, res, next)
);

// GET /api/symptoms/summary (Distribusi global seluruh kelurahan hari ini)
router.get('/summary', (req, res, next) => symptomController.getGlobalSummary(req, res, next));

// GET /api/symptoms/kelurahan/:id (Statistik keluhan per kelurahan hari ini)
router.get('/kelurahan/:id', validate({ params: kelurahanSymptomParamSchema }), (req, res, next) =>
  symptomController.getByKelurahan(req, res, next)
);

module.exports = router;
