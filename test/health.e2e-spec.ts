import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await setupFreshDatabase();
  });

  describe('/health (GET)', () => {
    it('should return general health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      
      // Verificar se as verificações principais estão presentes
      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details).toHaveProperty('memory_heap');
      expect(response.body.details).toHaveProperty('memory_rss');
      expect(response.body.details).toHaveProperty('storage');
    });
  });

  describe('/health/database (GET)', () => {
    it('should return database health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details.database).toHaveProperty('status');
    });
  });

  describe('/health/memory (GET)', () => {
    it('should return memory health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/memory')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('memory_heap');
      expect(response.body.details).toHaveProperty('memory_rss');
    });
  });

  describe('/health/disk (GET)', () => {
    it('should return disk health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/disk')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('storage');
    });
  });

  describe('/health/liveness (GET)', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/liveness')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('/health/readiness (GET)', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/readiness')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details.database).toHaveProperty('status');
    });
  });

  describe('Health Check Integration', () => {
    it('should have consistent database status across endpoints', async () => {
      const [generalResponse, databaseResponse, readinessResponse] = await Promise.all([
        request(app.getHttpServer()).get('/health'),
        request(app.getHttpServer()).get('/health/database'),
        request(app.getHttpServer()).get('/health/readiness'),
      ]);

      expect(generalResponse.status).toBe(200);
      expect(databaseResponse.status).toBe(200);
      expect(readinessResponse.status).toBe(200);

      // Verificar se o status do banco é consistente
      const generalDbStatus = generalResponse.body.details.database.status;
      const databaseDbStatus = databaseResponse.body.details.database.status;
      const readinessDbStatus = readinessResponse.body.details.database.status;

      expect(generalDbStatus).toBe(databaseDbStatus);
      expect(databaseDbStatus).toBe(readinessDbStatus);
    });

    it('should return proper status codes for all endpoints', async () => {
      const endpoints = [
        '/health',
        '/health/database',
        '/health/memory',
        '/health/disk',
        '/health/liveness',
        '/health/readiness',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer()).get(endpoint);
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      }
    });
  });
});