const { z } = require('zod');

/**
 * Validasi parameter query untuk pencarian shelter terdekat
 * GET /api/shelters/nearby?lat=&lng=&limit=&max_distance_km=
 */
const nearbyQuerySchema = z.object({
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
    .max(180, 'Longitude harus berada dalam rentang -180 hingga 180.'),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limit harus berupa angka integer.'
    })
    .int('Limit harus berupa bilangan bulat.')
    .min(1, 'Limit minimal adalah 1.')
    .max(20, 'Limit maksimal adalah 20.')
    .default(5),
  max_distance_km: z.coerce
    .number({
      invalid_type_error: 'max_distance_km harus berupa angka.'
    })
    .positive('max_distance_km harus bernilai positif.')
    .optional()
});

/**
 * Validasi parameter ID kelurahan untuk daftar shelter
 * GET /api/shelters/kelurahan/:id
 */
const kelurahanShelterParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: 'Parameter ID kelurahan wajib diisi.',
      invalid_type_error: 'Parameter ID kelurahan harus berupa angka integer.'
    })
    .int('ID kelurahan harus berupa bilangan bulat.')
    .positive('ID kelurahan harus bernilai positif.')
});

module.exports = {
  nearbyQuerySchema,
  kelurahanShelterParamSchema
};
