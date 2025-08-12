import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';

describe('BackupService', () => {
  let service: BackupService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
        BACKUP_DIRECTORY: '/test/backups',
        BACKUP_RETENTION_DAYS: '7',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have configService injected', () => {
    expect(configService).toBeDefined();
  });

  describe('performManualBackup', () => {
    it('should be defined', () => {
      expect(service.performManualBackup).toBeDefined();
    });
  });

  describe('getBackupStatus', () => {
    it('should be defined', () => {
      expect(service.getBackupStatus).toBeDefined();
    });
  });

  describe('performDailyBackup', () => {
    it('should be defined', () => {
      expect(service.performDailyBackup).toBeDefined();
    });
  });
});