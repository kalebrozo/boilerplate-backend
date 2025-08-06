import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TenantsController (e2e)', () => {
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

    // Criar tenant e role
    const tenant = await prisma.tenant.create({
      data: { name: 'Admin Tenant', schema: 'admin_schema' },
    });

    const role = await prisma.role.create({
        data: { 
          name: `Admin-${Date.now()}`
        },
      });

    // Registrar usuário admin usando o serviço de auth
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        roleId: role.id,
      });

    authToken = registerResponse.body.accessToken;
  });

  describe('POST /tenants', () => {
    it('should create a new tenant', async () => {
      const createTenantDto = {
        name: 'New Tenant',
        schema: 'new_schema',
      };

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTenantDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createTenantDto.name);
      expect(response.body.schema).toBe(createTenantDto.schema);
    });

    it('should not create tenant with duplicate schema', async () => {
      const createTenantDto = {
        name: 'New Tenant',
        schema: 'duplicate_schema',
      };

      // Primeira criação
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTenantDto)
        .expect(201);

      // Segunda tentativa
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTenantDto)
        .expect(409);
    });
  });

  describe('GET /tenants', () => {
    beforeEach(async () => {
      // Criar múltiplos tenants
      for (let i = 1; i <= 5; i++) {
        await prisma.tenant.create({
          data: {
            name: `Tenant ${i}`,
            schema: `schema_${i}`,
          },
        });
      }
    });

    it('should return all tenants with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.totalPages).toBe(2);
    });

    it('should filter tenants by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Tenant 1' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Tenant 1');
    });
  });

  describe('GET /tenants/:id', () => {
    let tenant: any;

    beforeEach(async () => {
      tenant = await prisma.tenant.create({
        data: { name: 'Specific Tenant', schema: 'specific_schema' },
      });
    });

    it('should return tenant by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenant.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(tenant.id);
      expect(response.body.name).toBe('Specific Tenant');
    });

    it('should return 404 for non-existent tenant', async () => {
      await request(app.getHttpServer())
        .get('/tenants/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /tenants/:id', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenant = await prisma.tenant.create({
        data: { name: 'Original Tenant', schema: 'original_schema' },
      });
      tenantId = tenant.id;
    });

    it('should update tenant', async () => {
      const updateDto = {
        name: 'Updated Tenant',
      };

      const response = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });
  });

  describe('DELETE /tenants/:id', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenant = await prisma.tenant.create({
        data: { name: 'Tenant to Delete', schema: 'delete_schema' },
      });
      tenantId = tenant.id;
    });

    it('should delete tenant', async () => {
      await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se foi deletado
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});