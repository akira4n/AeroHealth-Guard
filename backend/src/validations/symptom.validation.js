const { z } = require('zod');
const { SYMPTOM_TYPES } = require('../utils/constants');

/**
 * Validasi payload untuk pelaporan gejala kesehatan 1-klik warga
 * POST /api/symptoms/report
 */
const reportSymptomSchema = z.object({
  kelurahan_id: z.coerce
    .number({
      required_error: 'kelurahan_id wajib diisi.',
      invalid_type_error: 'kelurahan_id harus berupa angka integer.'
    })
    .int('kelurahan_id harus berupa bilangan bulat.')
    .positive('kelurahan_id harus bernilai positif.'),
  symptom: z.enum(SYMPTOM_TYPES, {
    errorMap: () => ({
      message: `Pilihan gejala tidak valid. Pilih salah satu dari: ${SYMPTOM_TYPES.join(', ')}.`
    })
  })
});

/**
 * Validasi parameter ID kelurahan untuk query statistik keluhan
 * GET /api/symptoms/kelurahan/:id
 */
const kelurahanSymptomParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: 'Parameter ID kelurahan wajib diisi.',
      invalid_type_error: 'Parameter ID kelurahan harus berupa angka integer.'
    })
    .int('ID kelurahan harus berupa bilangan bulat.')
    .positive('ID kelurahan harus bernilai positif.')
});

module.exports = {
  reportSymptomSchema,
  kelurahanSymptomParamSchema
};
