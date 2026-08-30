const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Module 1: Kelurahan & Geolocation Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/kelurahan/locate', () => {
    test('should identify Kelurahan 16 Ilir from Palembang GPS coordinates', async () => {
      const res = await request(app).get('/api/kelurahan/locate?lat=-2.990&lng=104.760');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_within_coverage).toBe(true);
      expect(res.body.data.kelurahan.nama_kelurahan).toBe('Kelurahan 16 Ilir');
      expect(res.body.data.kelurahan.kabupaten_kota).toBe('Kota Palembang');
      expect(res.body.data.kelurahan.geometry).toHaveProperty('type', 'Polygon');
      expect(res.body.data.kelurahan.centroid).toHaveProperty('type', 'Point');
    });

    test('should identify Kelurahan 26 Ilir from Bukit Kecil GPS coordinates', async () => {
      const res = await request(app).get('/api/kelurahan/locate?lat=-2.992&lng=104.750');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.is_within_coverage).toBe(true);
      expect(res.body.data.kelurahan.nama_kelurahan).toBe('Kelurahan 26 Ilir');
    });

    test('should return is_within_coverage=false for coordinates outside pilot area', async () => {
      const res = await request(app).get('/api/kelurahan/locate?lat=-6.200&lng=106.816');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_within_coverage).toBe(false);
      expect(res.body.data.message).toContain('di luar cakupan');
    });

    test('should return 400 Bad Request when coordinates are invalid or missing', async () => {
      const res = await request(app).get('/api/kelurahan/locate?lat=invalid&lng=abc');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/kelurahan/list (Cascading Dropdown)', () => {
    test('should return list of cities when no params provided', async () => {
      const res = await request(app).get('/api/kelurahan/list');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.level).toBe('kota');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items).toContain('Kota Palembang');
      expect(res.body.data.items).toContain('Kabupaten Ogan Ilir');
    });

    test('should return list of districts when kota is provided', async () => {
      const res = await request(app).get('/api/kelurahan/list?kota=Kota%20Palembang');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.level).toBe('kecamatan');
      expect(res.body.data.items).toContain('Ilir Timur I');
      expect(res.body.data.items).toContain('Bukit Kecil');
    });

    test('should return list of kelurahans when kota & kecamatan are provided', async () => {
      const res = await request(app).get(
        '/api/kelurahan/list?kota=Kota%20Palembang&kecamatan=Ilir%20Timur%20I'
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.data.level).toBe('kelurahan');
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0].nama_kelurahan).toBe('Kelurahan 16 Ilir');
    });
  });

  describe('GET /api/kelurahan/:id', () => {
    test('should return kelurahan details with GeoJSON by ID', async () => {
      const res = await request(app).get('/api/kelurahan/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('nama_kelurahan', 'Kelurahan 16 Ilir');
      expect(res.body.data.geometry).toHaveProperty('type', 'Polygon');
    });

    test('should return 404 for non-existent kelurahan ID', async () => {
      const res = await request(app).get('/api/kelurahan/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should return 400 for non-numeric ID param', async () => {
      const res = await request(app).get('/api/kelurahan/abc');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
