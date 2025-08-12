import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaHealthIndicator: PrismaHealthIndicator;
  let memoryHealthIndicator: MemoryHealthIndicator;
  let diskHealthIndicator: DiskHealthIndicator;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockPrismaHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  const mockDiskHealthIndicator = {
    checkStorage: jest.fn(),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealthIndicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    diskHealthIndicator = module.get<DiskHealthIndicator>(DiskHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should perform general health check', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.check();

      expect(result).toEqual(expectedResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ]);
    });
  });

  describe('checkDatabase', () => {
    it('should perform database health check', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.checkDatabase();

      expect(result).toEqual(expectedResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });
  });

  describe('checkMemory', () => {
    it('should perform memory health check', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.checkMemory();

      expect(result).toEqual(expectedResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
    });
  });

  describe('checkDisk', () => {
    it('should perform disk health check', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          storage: { status: 'up' },
        },
        error: {},
        details: {
          storage: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.checkDisk();

      expect(result).toEqual(expectedResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });
  });

  describe('liveness', () => {
    it('should return liveness status', () => {
      const result = controller.liveness();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('readiness', () => {
    it('should perform readiness check', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.readiness();

      expect(result).toEqual(expectedResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });
  });
});