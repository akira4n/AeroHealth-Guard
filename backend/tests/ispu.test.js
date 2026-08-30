const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Module 2: ISPU & Spatial Heatmap Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/ispu/map', () => {
    test('should return GeoJSON FeatureCollection with styled properties for Leaflet', async () => {
      const res = await request(app).get('/api/ispu/map');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.data.features)).toBe(true);
      expect(res.body.data.features.length).toBeGreaterThan(0);

      const feature = res.body.data.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.properties).toHaveProperty('kelurahan_id');
      expect(feature.properties).toHaveProperty('ispu_score');
      expect(feature.properties).toHaveProperty('kategori');
      expect(feature.properties).toHaveProperty('color');
      expect(feature.properties.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(feature.geometry).toHaveProperty('type', 'Polygon');
    });
  });

  describe('GET /api/ispu/kelurahan/:id', () => {
    test('should return latest ISPU and AI Advisory for Kelurahan 16 Ilir', async () => {
      const res = await request(app).get('/api/ispu/kelurahan/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.kelurahan_id).toBe(1);
      expect(res.body.data.nama_kelurahan).toBe('Kelurahan 16 Ilir');
      expect(res.body.data.ispu_score).toBe(168);
      expect(res.body.data.kategori).toBe('Tidak Sehat');
      expect(res.body.data.color).toBe('#FF0000');
      expect(res.body.data.hotspot_detected).toBe(true);
      expect(typeof res.body.data.advisory_text).toBe('string');
      expect(res.body.data.advisory_text.length).toBeGreaterThan(10);
    });

    test('should return Sangat Tidak Sehat status with purple color for Indralaya', async () => {
      const res = await request(app).get('/api/ispu/kelurahan/7');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.ispu_score).toBe(228);
      expect(res.body.data.kategori).toBe('Sangat Tidak Sehat');
      expect(res.body.data.color).toBe('#8F3F97');
    });

    test('should return 404 for non-existent kelurahan ID', async () => {
      const res = await request(app).get('/api/ispu/kelurahan/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/ispu/history/:kelurahan_id', () => {
    test('should return historical readings array', async () => {
      const res = await request(app).get('/api/ispu/history/1?limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.kelurahan_id).toBe(1);
      expect(Array.isArray(res.body.data.history)).toBe(true);
      expect(res.body.data.history[0]).toHaveProperty('ispu_score');
      expect(res.body.data.history[0]).toHaveProperty('color');
    });
  });
});
