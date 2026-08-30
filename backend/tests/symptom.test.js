const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Module 5: Citizen Health Sensing Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/symptoms/report (Zero PII)', () => {
    test('should record symptom anonymously and return updated percentage', async () => {
      const res = await request(app)
        .post('/api/symptoms/report')
        .send({ kelurahan_id: 1, symptom: 'sesak' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reported_symptom).toBe('sesak');
      expect(res.body.data.percentages).toHaveProperty('sesak_pct');
      expect(res.body.data).toHaveProperty('community_insight');
    });

    test('should return 400 for invalid symptom type', async () => {
      const res = await request(app)
        .post('/api/symptoms/report')
        .send({ kelurahan_id: 1, symptom: 'demam_tinggi' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent kelurahan ID', async () => {
      const res = await request(app)
        .post('/api/symptoms/report')
        .send({ kelurahan_id: 99999, symptom: 'batuk' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/symptoms/kelurahan/:id', () => {
    test('should return daily symptom stats for a kelurahan', async () => {
      const res = await request(app).get('/api/symptoms/kelurahan/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary.total_laporan).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('percentages');
      expect(res.body.data).toHaveProperty('community_insight');
    });
  });

  describe('GET /api/symptoms/summary', () => {
    test('should return global aggregated symptom stats across all regions', async () => {
      const res = await request(app).get('/api/symptoms/summary');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary.total_laporan).toBeGreaterThan(0);
      expect(res.body.data.summary.total_kelurahan_melapor).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('percentages');
      expect(res.body.data).toHaveProperty('community_insight');
    });
  });
});
