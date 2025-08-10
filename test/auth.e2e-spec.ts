import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('AuthController (e2e)', () => {
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

  let testRole: any;

  beforeEach(async () => {
    const { tenant: freshTenant, adminRole: freshAdminRole } = await setupFreshDatabase();
    testRole = freshAdminRole;
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        roleId: testRole.id,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(registerDto.email);
    });

    it('should not register user with existing email', async () => {
      // Primeiro registro
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        roleId: testRole.id,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Segundo registro com mesmo email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = `test-login-${Date.now()}@example.com`;
    
    beforeEach(async () => {
      // Criar role
      const role = await testPrisma.role.create({
        data: { name: 'User' }
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: 'password123',
          name: 'Test User',
          roleId: role.id,
        });
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: testEmail,
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('email', loginDto.email);
    });

    it('should not login with invalid credentials', async () => {
      const loginDto = {
        email: testEmail,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });
});