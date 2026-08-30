const { z } = require('zod');

/**
 * Validasi parameter query untuk daftar titik api aktif
 * GET /api/hotspots/active?min_frp=&confidence=&limit=
 */
const activeHotspotsQuerySchema = z.object({
  min_frp: z.coerce
    .number({
      invalid_type_error: 'Parameter min_frp harus berupa angka.'
    })
    .min(0, 'min_frp tidak boleh bernilai negatif.')
    .optional(),
  confidence: z
    .enum(['all', 'nominal', 'high'], {
      errorMap: () => ({
        message: "Nilai confidence harus salah satu dari: 'all', 'nominal', 'high'."
      })
    })
    .optional()
    .default('all'),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limit harus berupa angka integer.'
    })
    .int('Limit harus berupa bilangan bulat.')
    .min(1, 'Limit minimal adalah 1.')
    .max(500, 'Limit maksimal adalah 500.')
    .default(100)
});

module.exports = {
  activeHotspotsQuerySchema
};
