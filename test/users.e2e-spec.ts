import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('UsersController (e2e)', () => {
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
    const { tenant: freshTenant, adminRole: freshAdminRole } = await setupFreshDatabase();

    // Registrar usuário admin usando o serviço de auth
    const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `admin-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Admin User',
          roleId: freshAdminRole.id,
        });

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.accessToken;
      expect(authToken).toBeDefined();
  });

  describe('POST /users', () => {
    let testRoleId: string;

    beforeEach(async () => {
      const tenant = await testPrisma.tenant.create({
        data: { name: 'Test Tenant', schema: 'test_schema' },
      });
      const role = await testPrisma.role.create({
        data: { name: `Test-User-${Date.now()}` },
      });
      testRoleId = role.id;
    });

    it('should create a new user', async () => {
      const createUserDto = {
        email: `new-${Date.now()}@example.com`,
        password: 'password123',
        name: 'New User',
        roleId: testRoleId,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createUserDto.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not create user with duplicate email', async () => {
      const createUserDto = {
        email: `duplicate-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Duplicate User',
        roleId: testRoleId,
      };

      // Primeira criação
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createUserDto)
        .expect(201);

      // Segunda tentativa
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createUserDto)
        .expect(409);
    });
  });

  describe('GET /users', () => {
    let testRoleId: string;

    beforeEach(async () => {
      const role = await testPrisma.role.create({
        data: { name: `Test-User-${Date.now()}` },
      });
      testRoleId = role.id;

      // Criar múltiplos usuários
      for (let i = 1; i <= 5; i++) {
        await testPrisma.user.create({
          data: {
            email: `user${i}-${Date.now()}@example.com`,
            name: `User ${i}`,
            password: 'hashedpassword',
            roleId: testRoleId,
          },
        });
      }
    });

    it('should return all users with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should filter users by search term', async () => {
      // Criar um usuário específico para o teste
      await testPrisma.user.create({
        data: {
          email: `search-${Date.now()}@example.com`,
          name: 'User Search',
          password: 'hashedpassword',
          roleId: testRoleId,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'User Search' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('User Search');
    });
  });

  describe('GET /users/:id', () => {
    let userId: string;
    let testRoleId: string;

    beforeEach(async () => {
      const role = await testPrisma.role.create({
        data: { name: `Test-User-${Date.now()}` },
      });
      testRoleId = role.id;

      const user = await testPrisma.user.create({
        data: {
          email: `specific-${Date.now()}@example.com`,
          name: 'Specific User',
          password: 'hashedpassword',
          roleId: testRoleId,
        },
      });
      userId = user.id;
    });

    it('should return user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toContain('specific-');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /users/:id', () => {
    let userId: string;
    let testRoleId: string;

    beforeEach(async () => {
      const role = await testPrisma.role.create({
        data: { name: `Test-User-${Date.now()}` },
      });
      testRoleId = role.id;

      const user = await testPrisma.user.create({
        data: {
          email: `update-${Date.now()}@example.com`,
          name: 'Original User',
          password: 'hashedpassword',
          roleId: testRoleId,
        },
      });
      userId = user.id;
    });

    it('should update user', async () => {
      const updateDto = {
        name: 'Updated User',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });
  });

  describe('DELETE /users/:id', () => {
    let userId: string;
    let testRoleId: string;

    beforeEach(async () => {
      const role = await testPrisma.role.create({
        data: { name: `Test-User-${Date.now()}` },
      });
      testRoleId = role.id;

      const user = await testPrisma.user.create({
        data: {
          email: `delete-${Date.now()}@example.com`,
          name: 'User to Delete',
          password: 'hashedpassword',
          roleId: testRoleId,
        },
      });
      userId = user.id;
    });

    it('should delete user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se foi deletado
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});