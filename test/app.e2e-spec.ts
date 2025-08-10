import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { testPrisma, cleanupTestData } from './test-setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('Auth Module', () => {
    it('/auth/login (POST) should return 401 without credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(401);
    });

    it('/auth/login (POST) should return 200 and token with valid credentials', async () => {
      // Criar tenant
      const tenant = await testPrisma.tenant.create({
        data: { name: 'Test Tenant', schema: 'test_schema' },
      });

      // Criar role admin
      const adminRole = await testPrisma.role.create({
        data: {
          name: 'admin',
        },
      });

      // Criar usuário admin via API de registro para garantir senha hasheada
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          name: 'Admin User',
          roleId: adminRole.id,
        });

      expect(registerResponse.status).toBe(201);

      // Autenticar usuário
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');
    });
  });
});