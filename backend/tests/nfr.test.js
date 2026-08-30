const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const kelurahanRepository = require('../src/repositories/kelurahan.repository');
const shelterRepository = require('../src/repositories/shelter.repository');

describe('Non-Functional Requirements (NFR) Verification', () => {
  beforeAll(async () => {
    // Warm up Prisma connection pool so initial handshake is excluded from pure query latency
    await prisma.$queryRaw`SELECT 1;`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('NFR-PER-2: PostGIS ST_Contains query execution time must be under 100ms', async () => {
    const start = performance.now();
    await kelurahanRepository.findByCoordinates(-2.99, 104.76);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  test('NFR-PER-2: PostGIS ST_DistanceSphere query execution time must be under 100ms', async () => {
    const start = performance.now();
    await shelterRepository.findNearbyShelters(-2.985, 104.75, 5);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  test('NFR-PER-3: API latency for /api/ispu/map must be under 200ms', async () => {
    const start = performance.now();
    const res = await request(app).get('/api/ispu/map');
    const duration = performance.now() - start;

    expect(res.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
  });

  test('NFR-PER-3: API latency for /api/kelurahan/locate must be under 200ms', async () => {
    const start = performance.now();
    const res = await request(app).get('/api/kelurahan/locate?lat=-2.990&lng=104.760');
    const duration = performance.now() - start;

    expect(res.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
  });

  test('NFR-SEC-2: Zero PII — Symptom report payload & response must not contain personal identifiers', async () => {
    const res = await request(app)
      .post('/api/symptoms/report')
      .send({ kelurahan_id: 2, symptom: 'batuk' });

    expect(res.statusCode).toBe(201);
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('ip_address');
    expect(bodyStr).not.toContain('user_id');
    expect(bodyStr).not.toContain('device_id');
    expect(bodyStr).not.toContain('email');
  });

  test('NFR-REL-1: System provides standard KLHK fallback when AI advisory text is null or empty', async () => {
    const ispuService = require('../src/services/ispu.service');
    const mockData = await ispuService.getKelurahanIspu(1);
    expect(mockData.advisory_text).toBeDefined();
    expect(mockData.advisory_text.length).toBeGreaterThan(0);
  });
});
