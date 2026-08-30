const express = require('express');
const kelurahanController = require('../controllers/kelurahan.controller');
const validate = require('../middlewares/validate.middleware');
const {
  locateQuerySchema,
  listQuerySchema,
  idParamSchema
} = require('../validations/kelurahan.validation');

const router = express.Router();

// GET /api/kelurahan/locate?lat=&lng=
router.get('/locate', validate({ query: locateQuerySchema }), (req, res, next) =>
  kelurahanController.locate(req, res, next)
);

// GET /api/kelurahan/list?kota=&kecamatan=
router.get('/list', validate({ query: listQuerySchema }), (req, res, next) =>
  kelurahanController.getList(req, res, next)
);

// GET /api/kelurahan/:id
router.get('/:id', validate({ params: idParamSchema }), (req, res, next) =>
  kelurahanController.getById(req, res, next)
);

module.exports = router;
