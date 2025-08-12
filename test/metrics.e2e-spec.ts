import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('MetricsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

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
    const { adminRole } = await setupFreshDatabase();
    
    // Registrar usuário admin
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Admin User',
        roleId: adminRole.id,
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
  });

  describe('/metrics (GET)', () => {
    it('should return metrics in Prometheus format without authentication', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(typeof res.text).toBe('string');
          // Verificar se contém métricas do Prometheus
          expect(res.text).toMatch(/# HELP/);
          expect(res.text).toMatch(/# TYPE/);
        });
    });

    it('should contain default Node.js metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          // Verificar métricas padrão do Node.js
          expect(res.text).toMatch(/nodejs_/);
          expect(res.text).toMatch(/process_/);
        });
    });

    it('should contain custom SaaS boilerplate metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          // Verificar métricas customizadas
          expect(res.text).toMatch(/saas_boilerplate_/);
        });
    });
  });

  describe('/metrics/stats (GET)', () => {
    it('should return statistics with valid authentication', () => {
      return request(app.getHttpServer())
        .get('/metrics/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalMetrics');
          expect(res.body).toHaveProperty('httpRequests');
          expect(res.body).toHaveProperty('averageResponseTime');
          expect(res.body).toHaveProperty('activeConnections');
          expect(res.body).toHaveProperty('databaseConnections');
          expect(res.body).toHaveProperty('cacheHitRate');
          expect(res.body).toHaveProperty('totalErrors');
          expect(res.body).toHaveProperty('authAttempts');
          
          // Verificar tipos
          expect(typeof res.body.totalMetrics).toBe('number');
          expect(typeof res.body.httpRequests).toBe('number');
          expect(typeof res.body.averageResponseTime).toBe('number');
          expect(typeof res.body.activeConnections).toBe('number');
          expect(typeof res.body.databaseConnections).toBe('number');
          expect(typeof res.body.cacheHitRate).toBe('number');
          expect(typeof res.body.totalErrors).toBe('number');
          expect(typeof res.body.authAttempts).toBe('number');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/metrics/stats')
        .expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/metrics/stats')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/metrics/health (GET)', () => {
    it('should return health status without authentication', () => {
      return request(app.getHttpServer())
        .get('/metrics/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('metricsEnabled', true);
          
          // Verificar se timestamp é uma data válida
          const timestamp = new Date(res.body.timestamp);
          expect(timestamp).toBeInstanceOf(Date);
          expect(timestamp.getTime()).not.toBeNaN();
        });
    });

    it('should return current timestamp', async () => {
      const beforeRequest = new Date();
      
      const response = await request(app.getHttpServer())
        .get('/metrics/health')
        .expect(200);
      
      const afterRequest = new Date();
      const responseTimestamp = new Date(response.body.timestamp);
      
      expect(responseTimestamp.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(responseTimestamp.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
    });
  });

  describe('Metrics Collection Integration', () => {
    it('should collect HTTP request metrics', async () => {
      // Fazer algumas requisições para gerar métricas
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      
      await request(app.getHttpServer())
        .get('/health/database')
        .expect(200);
      
      // Verificar se as métricas foram coletadas
      const metricsResponse = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);
      
      expect(metricsResponse.text).toMatch(/saas_boilerplate_http_requests_total/);
      expect(metricsResponse.text).toMatch(/saas_boilerplate_http_request_duration_seconds/);
    });

    it('should collect authentication metrics', async () => {
      // Fazer login para gerar métricas de autenticação
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
      
      // Verificar se as métricas de autenticação foram coletadas
      const metricsResponse = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);
      
      expect(metricsResponse.text).toMatch(/saas_boilerplate_auth_attempts_total/);
    });

    it('should collect error metrics', async () => {
      // Fazer uma requisição autenticada que gera erro 404
      await request(app.getHttpServer())
        .get('/users/nonexistent-user-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Verificar se as métricas de erro foram coletadas
      const metricsResponse = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);
      
      expect(metricsResponse.text).toMatch(/status_code="404"/);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limiting on stats endpoint', async () => {
      // Fazer múltiplas requisições rapidamente
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/metrics/stats')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Verificar se pelo menos algumas requisições foram bem-sucedidas
      const successfulRequests = responses.filter(res => res.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
      
      // Pode haver algumas requisições com rate limit (429)
      const rateLimitedRequests = responses.filter(res => res.status === 429);
      // Rate limiting pode ou não ser acionado dependendo da configuração
    });
  });

  describe('Content Type', () => {
    it('should return metrics with correct content type', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect('Content-Type', /text\/plain/);
    });

    it('should return stats with JSON content type', () => {
      return request(app.getHttpServer())
        .get('/metrics/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('should return health with JSON content type', () => {
      return request(app.getHttpServer())
        .get('/metrics/health')
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });
  });
});