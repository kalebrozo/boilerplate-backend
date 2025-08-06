import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RolesController (e2e)', () => {
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
    // Limpar banco de dados
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.tenant.deleteMany();

    // Criar role admin
    const adminRole = await prisma.role.create({
      data: { name: `Admin-${Date.now()}` },
    });

    // Registrar usuário admin usando o serviço de auth
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        roleId: adminRole.id,
      });

    authToken = registerResponse.body.accessToken;
    expect(authToken).toBeDefined();
  });

  describe('POST /roles', () => {
    it('should create a new role', async () => {
      const createRoleDto = {
        name: `Manager-${Date.now()}`,
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRoleDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createRoleDto.name);
    });

    it('should not create role with duplicate name', async () => {
      const createRoleDto = {
        name: `Unique-Role-${Date.now()}`,
      };

      // Primeira criação
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRoleDto)
        .expect(201);

      // Segunda tentativa
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRoleDto)
        .expect(409);
    });
  });

  describe('GET /roles', () => {
    beforeEach(async () => {
      // Criar múltiplas roles
      for (let i = 1; i <= 5; i++) {
        await prisma.role.create({
          data: {
            name: `Role-${i}-${Date.now()}`,
          },
        });
      }
    });

    it('should return all roles with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.totalPages).toBeGreaterThan(0);
    });

    it('should filter roles by search term', async () => {
      // Criar uma role específica para o teste
      await prisma.role.create({
        data: {
          name: `Role-Search-${Date.now()}`,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Role-Search' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Role-Search');
    });
  });

  describe('GET /roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await prisma.role.create({
        data: {
          name: `Specific-Role-${Date.now()}`,
        },
      });
      roleId = role.id;
    });

    it('should return role by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(roleId);
      expect(response.body.name).toContain('Specific-Role');
    });

    it('should return 404 for non-existent role', async () => {
      await request(app.getHttpServer())
        .get('/roles/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await prisma.role.create({
        data: {
          name: `Patch-Role-${Date.now()}`,
        },
      });
      roleId = role.id;
    });

    it('should update role', async () => {
      const updateDto = {
        name: 'Updated Role',

      };

      const response = await request(app.getHttpServer())
        .patch(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);

    });
  });

  describe('DELETE /roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await prisma.role.create({
        data: {
          name: `Delete-Role-${Date.now()}`,
        },
      });
      roleId = role.id;
    });

    it('should delete role', async () => {
      await request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se foi deletado
      await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not delete role with users', async () => {
      // Criar usuário com essa role
      await prisma.user.create({
        data: {
          email: 'user@example.com',
          name: 'User',
          password: 'hashedpassword',
          roleId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /roles/:id/permissions', () => {
    it('should assign permissions to role', async () => {
      const permission = await prisma.permission.create({
        data: {
          action: 'create',
          subject: 'User',
        },
      });

      const role = await prisma.role.create({
          data: {
            name: `Permission-Role-${Date.now()}`,
          },
        });

      const response = await request(app.getHttpServer())
        .post(`/roles/${role.id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissionIds: [permission.id] })
        .expect(201);

      expect(response.body.permissions).toHaveLength(1);
      expect(response.body.permissions[0].id).toBe(permission.id);
    });
  });
});