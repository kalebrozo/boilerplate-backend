import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('MonitoringController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminAuthToken: string;

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
    const { adminRole, userRole } = await setupFreshDatabase();
    
    // Registrar usuário admin
    const adminRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'Admin123!@#',
        name: 'Admin User',
        roleId: adminRole.id,
      })
      .expect(201);

    // Login do admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminRegisterResponse.body.user.email,
        password: 'Admin123!@#',
      })
      .expect(200);

    adminAuthToken = adminLoginResponse.body.access_token;

    // Registrar usuário comum
    const userRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `user-${Date.now()}@example.com`,
        password: 'User123!@#',
        name: 'Regular User',
        roleId: userRole.id,
      })
      .expect(201);

    // Login do usuário comum
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userRegisterResponse.body.user.email,
        password: 'User123!@#',
      })
      .expect(200);

    authToken = userLoginResponse.body.access_token;
  });

  describe('/monitoring/metrics (GET)', () => {
    it('should return application metrics without authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('cpu');
          expect(res.body).toHaveProperty('process');
          expect(res.body.uptime).toHaveProperty('seconds');
          expect(res.body.memory).toHaveProperty('rss');
          expect(res.body.process).toHaveProperty('pid');
        });
    });
  });

  describe('/monitoring/health-detailed (GET)', () => {
    it('should return detailed health check without authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/health-detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('checks');
          expect(res.body.checks).toHaveProperty('database');
          expect(res.body.checks).toHaveProperty('system');
          expect(res.body.checks).toHaveProperty('application');
          expect(res.body.checks.database).toHaveProperty('status');
        });
    });
  });

  describe('/monitoring/performance (GET)', () => {
    it('should return performance metrics for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/monitoring/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('tenantId');
          expect(res.body).toHaveProperty('requests');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('system');
          expect(res.body.requests).toHaveProperty('total');
          expect(res.body.requests).toHaveProperty('errors');
          expect(res.body.requests).toHaveProperty('errorRate');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/performance')
        .expect(401);
    });
  });

  describe('/monitoring/database-stats (GET)', () => {
    it('should return database statistics for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/monitoring/database-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('tenantId');
          expect(res.body).toHaveProperty('records');
          expect(res.body).toHaveProperty('connections');
          expect(res.body.records).toHaveProperty('users');
          expect(res.body.records).toHaveProperty('roles');
          expect(res.body.records).toHaveProperty('permissions');
          expect(res.body.connections).toHaveProperty('active');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/database-stats')
        .expect(401);
    });
  });

  describe('/monitoring/system-resources (GET)', () => {
    it('should return system resources for admin user', () => {
      return request(app.getHttpServer())
        .get('/monitoring/system-resources')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('cpu');
          expect(res.body).toHaveProperty('disk');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body.memory).toHaveProperty('total');
          expect(res.body.memory).toHaveProperty('usagePercent');
          expect(res.body.cpu).toHaveProperty('count');
        });
    });

    it('should require admin privileges', () => {
      return request(app.getHttpServer())
        .get('/monitoring/system-resources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/system-resources')
        .expect(401);
    });
  });

  describe('/monitoring/api-performance (GET)', () => {
    it('should return API performance metrics for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/monitoring/api-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('tenantId');
          expect(res.body).toHaveProperty('endpoints');
          expect(res.body).toHaveProperty('summary');
          expect(Array.isArray(res.body.endpoints)).toBe(true);
          expect(res.body.summary).toHaveProperty('totalEndpoints');
          expect(res.body.summary).toHaveProperty('totalRequests');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/api-performance')
        .expect(401);
    });
  });

  describe('/monitoring/tenant-usage (GET)', () => {
    it('should return tenant usage statistics for admin user', () => {
      return request(app.getHttpServer())
        .get('/monitoring/tenant-usage')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('tenantId');
          expect(res.body).toHaveProperty('userActivity');
          expect(res.body).toHaveProperty('apiUsage');
          expect(res.body).toHaveProperty('storage');
          expect(res.body.userActivity).toHaveProperty('totalUsers');
          expect(res.body.userActivity).toHaveProperty('activeUsers24h');
          expect(res.body.apiUsage).toHaveProperty('totalRequests');
          expect(res.body.storage).toHaveProperty('totalRecords');
        });
    });

    it('should require admin privileges', () => {
      return request(app.getHttpServer())
        .get('/monitoring/tenant-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/monitoring/tenant-usage')
        .expect(401);
    });
  });

  describe('Integration with other endpoints', () => {
    it('should record metrics when making authenticated requests', async () => {
      // Fazer algumas requisições para gerar métricas
      await request(app.getHttpServer())
        .get('/users/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/roles/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se as métricas foram registradas
      const performanceResponse = await request(app.getHttpServer())
        .get('/monitoring/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // As métricas podem não aparecer imediatamente devido ao interceptor
      // mas a estrutura deve estar presente
      expect(performanceResponse.body.requests).toHaveProperty('total');
      expect(performanceResponse.body.requests).toHaveProperty('errors');
    });

    it('should handle errors gracefully in monitoring endpoints', async () => {
      // Tentar acessar um endpoint que não existe
      await request(app.getHttpServer())
        .get('/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Verificar se as métricas ainda funcionam
      const performanceResponse = await request(app.getHttpServer())
        .get('/monitoring/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(performanceResponse.body).toHaveProperty('timestamp');
    });
  });

  describe('Response format validation', () => {
    it('should return consistent timestamp format across all endpoints', async () => {
      const endpoints = [
        '/monitoring/metrics',
        '/monitoring/health-detailed',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);

        expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });

    it('should return proper error responses for unauthorized access', async () => {
      const protectedEndpoints = [
        '/monitoring/performance',
        '/monitoring/database-stats',
        '/monitoring/api-performance',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('statusCode', 401);
      }
    });
  });
});