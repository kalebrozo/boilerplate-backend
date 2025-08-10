import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('TesteGeralController (e2e)', () => {
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
    if (app) {
      await app.close();
    }
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
      });

    authToken = registerResponse.body.accessToken;
  });

  it('should be defined', async () => {
    expect(app).toBeDefined();
  });

  it('GET /teste-geral', async () => {
    const response = await request(app.getHttpServer())
      .get('/teste-geral')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /teste-geral', async () => {
    const createDto = {
      nome: 'Teste E2E',
      valorDecimal: 99.99,
      valorInteiro: 42,
      valorFloat: 3.14,
      status: 'ATIVO',
      categoria: 'TECNOLOGIA',
    };

    const response = await request(app.getHttpServer())
      .post('/teste-geral')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.nome).toBe(createDto.nome);
  });
});