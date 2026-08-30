const { z } = require('zod');

/**
 * Validasi parameter query untuk deteksi kelurahan via koordinat GPS
 * GET /api/kelurahan/locate?lat=&lng=
 */
const locateQuerySchema = z.object({
  lat: z.coerce
    .number({
      required_error: 'Parameter lat (latitude) wajib diisi.',
      invalid_type_error: 'Parameter lat harus berupa angka.'
    })
    .min(-90, 'Latitude harus berada dalam rentang -90 hingga 90.')
    .max(90, 'Latitude harus berada dalam rentang -90 hingga 90.'),
  lng: z.coerce
    .number({
      required_error: 'Parameter lng (longitude) wajib diisi.',
      invalid_type_error: 'Parameter lng harus berupa angka.'
    })
    .min(-180, 'Longitude harus berada dalam rentang -180 hingga 180.')
    .max(180, 'Longitude harus berada dalam rentang -180 hingga 180.')
});

/**
 * Validasi parameter query untuk cascading dropdown wilayah
 * GET /api/kelurahan/list?kota=&kecamatan=
 */
const listQuerySchema = z.object({
  kota: z.string().trim().optional(),
  kecamatan: z.string().trim().optional()
});

/**
 * Validasi parameter ID kelurahan
 * GET /api/kelurahan/:id
 */
const idParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: 'Parameter ID kelurahan wajib diisi.',
      invalid_type_error: 'Parameter ID kelurahan harus berupa angka integer.'
    })
    .int('ID kelurahan harus berupa bilangan bulat.')
    .positive('ID kelurahan harus bernilai positif.')
});

module.exports = {
  locateQuerySchema,
  listQuerySchema,
  idParamSchema
};
