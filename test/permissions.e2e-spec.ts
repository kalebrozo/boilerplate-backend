import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('PermissionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
      const { tenant, adminRole } = await setupFreshDatabase();

      // Registrar usuário admin usando o serviço de auth
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `admin-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Admin User',
          roleId: adminRole.id,
        });

    if (registerResponse.status !== 201) {
      console.log('Register failed:', registerResponse.status, registerResponse.body);
      throw new Error(`Registration failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.body)}`);
    }

    authToken = registerResponse.body.accessToken;
      expect(authToken).toBeDefined();
  });

  describe('POST /permissions', () => {
    it('should create a new permission', async () => {
      const createPermissionDto = {
        action: 'create',
        subject: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPermissionDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.action).toBe(createPermissionDto.action);
    });

    it('should not create permission with duplicate action/subject', async () => {
      const createPermissionDto = {
        action: 'create',
        subject: 'User',
      };

      // Primeira criação
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPermissionDto)
        .expect(201);

      // Segunda tentativa
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPermissionDto)
        .expect(409);
    });
  });

  describe('GET /permissions', () => {
    beforeEach(async () => {
      // Criar múltiplas permissões
      const permissions = [
        { action: 'create', subject: `User-${Date.now()}` },
        { action: 'read', subject: `User-${Date.now()}` },
        { action: 'update', subject: `User-${Date.now()}` },
        { action: 'delete', subject: `User-${Date.now()}` },
        { action: 'manage', subject: `Role-${Date.now()}` },
      ];

      for (const perm of permissions) {
        await testPrisma.permission.create({ 
          data: {
            action: perm.action,
            subject: perm.subject
          }
        });
      }
    });

    it('should return all permissions with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should filter permissions by search term', async () => {
      const response = await request(app.getHttpServer())
          .get('/permissions')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ search: 'User' })
          .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every(p => p.subject.toLowerCase().includes('user'))).toBe(true);
    });
  });

  describe('GET /permissions/:id', () => {
    let permissionId: string;

    beforeEach(async () => {
      const permission = await testPrisma.permission.create({
        data: {
          action: 'specific',
          subject: `Permission-${Date.now()}`,
        },
      });
      permissionId = permission.id;
    });

    it('should return permission by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(permissionId);
      expect(response.body.action).toBe('specific');
    });

    it('should return 404 for non-existent permission', async () => {
      await request(app.getHttpServer())
        .get('/permissions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /permissions/:id', () => {
    let permissionId: string;

    beforeEach(async () => {
      const permission = await testPrisma.permission.create({
        data: {
          action: 'read',
          subject: `User-${Date.now()}`,
  
        },
      });
      permissionId = permission.id;
    });

    it('should update permission', async () => {
      const updateDto = {
        action: 'write',
      };

      const response = await request(app.getHttpServer())
        .patch(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.action).toBe('write');
    });
  });

  describe('DELETE /permissions/:id', () => {
    let permissionId: string;

    beforeEach(async () => {
      const permission = await prisma.permission.create({
        data: {
          action: 'delete',
          subject: `Test-${Date.now()}`,
        },
      });
      permissionId = permission.id;
    });

    it('should delete permission', async () => {
      await request(app.getHttpServer())
        .delete(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se foi deletado
      await request(app.getHttpServer())
        .get(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not delete permission assigned to roles', async () => {
      // Criar role com essa permission
      const role = await prisma.role.create({
        data: {
          name: `Role-with-permission-${Date.now()}`,
          permissions: {
            connect: { id: permissionId },
          },
        },
      });

      await request(app.getHttpServer())
        .delete(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });
  });
});