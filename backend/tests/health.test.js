const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Health & Root Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET / should return basic API metadata', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'AeroHealth Guard Backend API');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('health', '/api/health');
  });

  test('GET /api/health should return 200 OK and health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('timestamp');
  });

  test('GET /api/unknown-endpoint should return 404 Not Found', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('tidak ditemukan');
  });
});
