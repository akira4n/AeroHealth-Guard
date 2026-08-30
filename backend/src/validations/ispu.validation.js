const { z } = require('zod');

/**
 * Validasi parameter ID kelurahan untuk query ISPU
 * GET /api/ispu/kelurahan/:id
 */
const kelurahanIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: 'Parameter ID kelurahan wajib diisi.',
      invalid_type_error: 'Parameter ID kelurahan harus berupa angka integer.'
    })
    .int('ID kelurahan harus berupa bilangan bulat.')
    .positive('ID kelurahan harus bernilai positif.')
});

/**
 * Validasi parameter query untuk riwayat tren ISPU
 * GET /api/ispu/history/:kelurahan_id?limit=24
 */
const historyParamSchema = z.object({
  kelurahan_id: z.coerce
    .number({
      required_error: 'Parameter kelurahan_id wajib diisi.',
      invalid_type_error: 'Parameter kelurahan_id harus berupa angka integer.'
    })
    .int('kelurahan_id harus berupa bilangan bulat.')
    .positive('kelurahan_id harus bernilai positif.')
});

const historyQuerySchema = z.object({
  limit: z.coerce
    .number({
      invalid_type_error: 'Limit harus berupa angka.'
    })
    .int('Limit harus berupa bilangan bulat.')
    .min(1, 'Limit minimal adalah 1.')
    .max(100, 'Limit maksimal adalah 100.')
    .default(24)
});

module.exports = {
  kelurahanIdParamSchema,
  historyParamSchema,
  historyQuerySchema
};
