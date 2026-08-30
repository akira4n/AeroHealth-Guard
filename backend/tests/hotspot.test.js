const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Module 3: Active Hotspots Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/hotspots/active', () => {
    test('should return list of active hotspots for Leaflet markers', async () => {
      const res = await request(app).get('/api/hotspots/active');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.hotspots)).toBe(true);

      const hs = res.body.data.hotspots[0];
      expect(hs).toHaveProperty('latitude');
      expect(hs).toHaveProperty('longitude');
      expect(hs).toHaveProperty('frp');
      expect(hs).toHaveProperty('intensity_category');
      expect(hs).toHaveProperty('confidence');
      expect(hs.coordinates).toHaveLength(2);
    });

    test('should filter by min_frp correctly', async () => {
      const res = await request(app).get('/api/hotspots/active?min_frp=100');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.hotspots.every((h) => h.frp >= 100)).toBe(true);
    });

    test('should filter by confidence level', async () => {
      const res = await request(app).get('/api/hotspots/active?confidence=nominal');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.hotspots.every((h) => h.confidence === 'nominal')).toBe(true);
    });

    test('should return 400 for negative min_frp', async () => {
      const res = await request(app).get('/api/hotspots/active?min_frp=-5');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/hotspots/stats', () => {
    test('should return aggregated karhutla statistics and threat assessment', async () => {
      const res = await request(app).get('/api/hotspots/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('total_active_hotspots');
      expect(res.body.data.summary).toHaveProperty('max_frp_mw');
      expect(res.body.data).toHaveProperty('threat_assessment');
      expect(res.body.data.threat_assessment).toHaveProperty('level');
      expect(res.body.data.threat_assessment).toHaveProperty('description');
    });
  });
});
