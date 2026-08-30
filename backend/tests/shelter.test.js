const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Module 4: Clean Air Shelter Locator Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/shelters/nearby', () => {
    test('should return nearby shelters ordered by PostGIS spherical distance', async () => {
      const res = await request(app).get('/api/shelters/nearby?lat=-2.985&lng=104.750&limit=3');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shelters.length).toBe(3);

      const first = res.body.data.shelters[0];
      const second = res.body.data.shelters[1];
      expect(first.distance_meters).toBeLessThan(second.distance_meters);
      expect(first.nama_tempat).toContain('Palembang Icon');
      expect(first.distance_formatted).toBe('458 m');
      expect(first.google_maps_url).toContain('https://www.google.com/maps/dir/');
    });

    test('should filter by max_distance_km radius', async () => {
      const res = await request(app).get(
        '/api/shelters/nearby?lat=-2.985&lng=104.750&max_distance_km=1'
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.data.shelters.length).toBe(1);
      expect(res.body.data.shelters[0].distance_km).toBeLessThanOrEqual(1.0);
    });

    test('should return 400 when lat/lng are missing', async () => {
      const res = await request(app).get('/api/shelters/nearby');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/shelters/kelurahan/:id', () => {
    test('should return shelters located in Demang Lebar Daun (ID 3)', async () => {
      const res = await request(app).get('/api/shelters/kelurahan/3');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.kelurahan_id).toBe(3);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.shelters.some((s) => s.nama_tempat.includes('RSUP'))).toBe(true);
    });

    test('should return 404 for non-existent kelurahan ID', async () => {
      const res = await request(app).get('/api/shelters/kelurahan/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
