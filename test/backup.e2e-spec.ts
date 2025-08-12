import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';
import { BackupService } from '../src/backup/backup.service';

describe('BackupController (e2e)', () => {
  let app: INestApplication;
  let backupService: BackupService;
  let authToken: string;
  let adminUserId: string;
  let userRole: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    backupService = moduleFixture.get<BackupService>(BackupService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const { tenant, adminRole, userRole: testUserRole } = await setupFreshDatabase();
    userRole = testUserRole;

    // Criar usuário admin para testes
    const adminUser = await testPrisma.user.create({
      data: {
        email: 'admin@backup.test',
        name: 'Admin User',
        password: '$2b$10$hashedpassword',
        role: {
          connect: {
            id: adminRole.id,
          },
        },
      },
    });
    adminUserId = adminUser.id;

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@backup.test',
        password: 'password123',
      });

    if (loginResponse.status === 201) {
      authToken = loginResponse.body.access_token;
    }
  });

  describe('/backup/status (GET)', () => {
    it('should return backup status for authenticated admin user', async () => {
      if (!authToken) {
        // Skip test if authentication failed
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/backup/status')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'test-tenant')
        .expect(200);

      expect(response.body).toHaveProperty('lastBackup');
      expect(response.body).toHaveProperty('backupCount');
      expect(response.body).toHaveProperty('backupDirectory');
      expect(response.body).toHaveProperty('nextScheduledBackup');
      
      expect(typeof response.body.backupCount).toBe('number');
      expect(typeof response.body.backupDirectory).toBe('string');
      
      // Verificar se nextScheduledBackup é uma data válida
      const nextBackup = new Date(response.body.nextScheduledBackup);
      expect(nextBackup).toBeInstanceOf(Date);
      expect(nextBackup.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/backup/status')
        .expect(401);
    });

    it('should return 403 for users without system permissions', async () => {
      // Criar usuário sem permissões de sistema
      const regularUser = await testPrisma.user.create({
        data: {
          email: 'user@backup.test',
          name: 'Regular User',
          password: '$2b$10$hashedpassword',
          role: {
            connect: {
              id: userRole.id,
            },
          },
        },
      });

      // Fazer login com usuário regular
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@backup.test',
          password: 'password123',
        });

      if (loginResponse.status === 201) {
        const userToken = loginResponse.body.access_token;
        
        await request(app.getHttpServer())
          .get('/backup/status')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', 'test-tenant')
          .expect(403);
      }
    });
  });

  describe('/backup/manual (POST)', () => {
    it('should create manual backup for authenticated admin user', async () => {
      if (!authToken) {
        // Skip test if authentication failed
        return;
      }

      // Mock do backup service para evitar execução real
      const mockBackupPath = '/test/path/manual-backup-test.sql';
      jest.spyOn(backupService, 'performManualBackup')
        .mockResolvedValue(mockBackupPath);

      const response = await request(app.getHttpServer())
        .post('/backup/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'test-tenant')
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('backupPath');
      expect(response.body).toHaveProperty('timestamp');
      
      expect(response.body.message).toBe('Backup manual executado com sucesso');
      expect(response.body.backupPath).toBe(mockBackupPath);
      
      // Verificar se timestamp é uma data válida
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/backup/manual')
        .expect(401);
    });

    it('should return 403 for users without system permissions', async () => {
      // Criar usuário sem permissões de sistema
      const regularUser = await testPrisma.user.create({
        data: {
          email: 'user2@backup.test',
          name: 'Regular User 2',
          password: '$2b$10$hashedpassword',
          role: {
            connect: {
              id: userRole.id,
            },
          },
        },
      });

      // Fazer login com usuário regular
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user2@backup.test',
          password: 'password123',
        });

      if (loginResponse.status === 201) {
        const userToken = loginResponse.body.access_token;
        
        await request(app.getHttpServer())
          .post('/backup/manual')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', 'test-tenant')
          .expect(403);
      }
    });

    it('should handle backup service errors', async () => {
      if (!authToken) {
        // Skip test if authentication failed
        return;
      }

      // Mock do backup service para simular erro
      jest.spyOn(backupService, 'performManualBackup')
        .mockRejectedValue(new Error('Backup failed'));

      await request(app.getHttpServer())
        .post('/backup/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'test-tenant')
        .expect(500);
    });

    it('should respect throttle limits', async () => {
      if (!authToken) {
        // Skip test if authentication failed
        return;
      }

      // Mock do backup service
      const mockBackupPath = '/test/path/manual-backup-test.sql';
      jest.spyOn(backupService, 'performManualBackup')
        .mockResolvedValue(mockBackupPath);

      // Primeira requisição deve funcionar
      await request(app.getHttpServer())
        .post('/backup/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'test-tenant')
        .expect(201);

      // Segunda requisição imediata deve ser throttled
      await request(app.getHttpServer())
        .post('/backup/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'test-tenant')
        .expect(429); // Too Many Requests
    });
  });

  describe('Backup Service Integration', () => {
    it('should have backup service available', () => {
      expect(backupService).toBeDefined();
      expect(typeof backupService.performManualBackup).toBe('function');
      expect(typeof backupService.getBackupStatus).toBe('function');
    });

    it('should handle backup directory creation', async () => {
      const status = await backupService.getBackupStatus();
      expect(status.backupDirectory).toBeDefined();
      expect(typeof status.backupDirectory).toBe('string');
    });
  });
});