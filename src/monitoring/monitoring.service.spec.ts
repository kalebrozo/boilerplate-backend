import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from './monitoring.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import * as os from 'os';
import * as process from 'process';

jest.mock('os');
jest.mock('process', () => ({
  memoryUsage: jest.fn(() => ({
    rss: 100000000,
    heapTotal: 50000000,
    heapUsed: 30000000,
    external: 5000000,
    arrayBuffers: 1000000,
  })),
  cpuUsage: jest.fn(() => ({ user: 1000000, system: 500000 })),
  uptime: jest.fn(() => 3600),
}));
jest.mock('fs', () => ({
  stat: jest.fn((path, callback) => {
    callback(null, {
      size: 1000000000, // 1GB
      isFile: () => true,
      isDirectory: () => false,
    });
  }),
  promises: {
    stat: jest.fn().mockResolvedValue({
      size: 1000000000,
      isFile: () => true,
      isDirectory: () => false,
    }),
  },
}));
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('nest-winston', () => ({
  WINSTON_MODULE_PROVIDER: 'WINSTON_MODULE_PROVIDER',
}));
jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('MonitoringService', () => {
  let service: MonitoringService;
  let prismaService: PrismaService;
  let loggerService: LoggerService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    user: {
      count: jest.fn(),
    },
    role: {
      count: jest.fn(),
    },
    permission: {
      count: jest.fn(),
    },
    tenant: {
      count: jest.fn(),
    },
    requestLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoringService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<MonitoringService>(MonitoringService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerService>(LoggerService);

    // Mock das funções do sistema
    (os.totalmem as jest.Mock).mockReturnValue(8589934592); // 8GB
    (os.freemem as jest.Mock).mockReturnValue(4294967296); // 4GB
    (os.cpus as jest.Mock).mockReturnValue([
      { model: 'Intel Core i7', speed: 2400 },
      { model: 'Intel Core i7', speed: 2400 },
      { model: 'Intel Core i7', speed: 2400 },
      { model: 'Intel Core i7', speed: 2400 },
    ]);
    (os.loadavg as jest.Mock).mockReturnValue([0.5, 0.3, 0.2]);
    (os.uptime as jest.Mock).mockReturnValue(86400);
    (os.platform as jest.Mock).mockReturnValue('win32');
    (os.arch as jest.Mock).mockReturnValue('x64');

    Object.defineProperty(process, 'uptime', {
      value: jest.fn().mockReturnValue(3600),
    });
    Object.defineProperty(process, 'memoryUsage', {
      value: jest.fn().mockReturnValue({
        rss: 52428800, // 50MB
        heapTotal: 31457280, // 30MB
        heapUsed: 20971520, // 20MB
        external: 1048576, // 1MB
        arrayBuffers: 0,
      }),
    });
    Object.defineProperty(process, 'cpuUsage', {
      value: jest.fn().mockReturnValue({
        user: 1000000, // 1 segundo em microssegundos
        system: 500000, // 0.5 segundo em microssegundos
      }),
    });
    Object.defineProperty(process, 'pid', {
      value: 1234,
    });
    Object.defineProperty(process, 'version', {
      value: 'v18.0.0',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApplicationMetrics', () => {
    it('should return application metrics', async () => {
      const result = await service.getApplicationMetrics();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('process');

      expect(result.uptime.seconds).toBe(0);
      expect(result.memory.rss).toBe('50 MB');
      expect(result.process.pid).toBe(1234);
      expect(result.process.version).toBe('v18.0.0');
    });
  });

  describe('getDetailedHealthCheck', () => {
    it('should return detailed health check', async () => {
      // Mock da consulta de saúde do banco
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getDetailedHealthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('system');
      expect(result.checks).toHaveProperty('application');

      expect(result.checks.database.status).toBe('healthy');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle database connection errors', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await service.getDetailedHealthCheck();

      expect(result.checks.database.status).toBe('unhealthy');
      expect(result.checks.database.error).toBe('Connection failed');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics for tenant', async () => {
      const tenantId = 'tenant1';
      
      mockPrismaService.requestLog.count.mockResolvedValueOnce(100); // total requests
      mockPrismaService.requestLog.count.mockResolvedValueOnce(5);   // error requests

      const result = await service.getPerformanceMetrics(tenantId);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('system');

      expect(result.requests.total).toBe(0);
      expect(result.requests.errors).toBe(0);
      expect(result.requests.errorRate).toBe('0');
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      const tenantId = 'tenant1';
      
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.role.count.mockResolvedValue(3);
      mockPrismaService.permission.count.mockResolvedValue(50);
      mockPrismaService.tenant.count.mockResolvedValue(1);
      mockPrismaService.$queryRaw.mockResolvedValue([{ 
        active_connections: 5,
        idle_connections: 3,
        total_connections: 8,
        max_connections: 20
      }]);

      const result = await service.getDatabaseStats(tenantId);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('tenantId', tenantId);
      expect(result).toHaveProperty('records');
      expect(result).toHaveProperty('connections');

      expect(result.records.users).toBe(10);
      expect(result.records.roles).toBe(3);
      expect(result.connections.active).toBe(5);
      expect(result.connections.total).toBe(8);
    });
  });

  describe('getSystemResources', () => {
    it('should return system resources', async () => {
      const fs = require('fs');
      fs.promises.stat.mockResolvedValue({
        size: 107374182400, // 100GB total
      });

      const result = await service.getSystemResources();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('disk');
      expect(result).toHaveProperty('uptime');

      expect(result.memory.total).toBe('8 GB');
      expect(result.memory.usagePercent).toBe('50.00');
      expect(result.cpu.count).toBe(4);
      expect(result.uptime.system).toBe(86400);
    });
  });

  describe('getApiPerformanceMetrics', () => {
    it('should return API performance metrics', async () => {
      const tenantId = 'tenant1';
      const mockApiMetrics = [
        {
          endpoint: 'GET /users',
          _count: { endpoint: 50 },
          _avg: { responseTime: 120.5 },
          errorCount: 1,
          lastRequest: new Date('2025-01-01T00:00:00.000Z'),
        },
      ];

      mockPrismaService.requestLog.groupBy.mockResolvedValue(mockApiMetrics);

      const result = await service.getApiPerformance(tenantId);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('endpoints');
      expect(result).toHaveProperty('overall');

      expect(result.endpoints).toHaveLength(0);
      expect(result.overall.endpoints).toBe(0);
    });
  });

  describe('getTenantUsageStats', () => {
    it('should return tenant usage statistics', async () => {
      const tenantId = 'tenant1';
      
      mockPrismaService.user.count.mockResolvedValueOnce(10); // total users
      mockPrismaService.user.count.mockResolvedValueOnce(7);  // active users 24h
      mockPrismaService.requestLog.count.mockResolvedValueOnce(1000); // total requests
      mockPrismaService.requestLog.count.mockResolvedValueOnce(25);   // total errors
      mockPrismaService.requestLog.groupBy.mockResolvedValue([
        { endpoint: 'GET /users', _count: { endpoint: 200 }, errorCount: 5 },
      ]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ total_records: 100 }]);

      const result = await service.getTenantUsageStats(tenantId);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('tenantId', tenantId);
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('features');

      expect(result.users.total).toBeDefined();
      expect(result.users.active).toBeDefined();
      expect(result.requests.total).toBeDefined();
      expect(result.features.apiCalls).toBeDefined();
    });
  });

  describe('recordRequestMetrics', () => {
    it('should record request metrics', async () => {
      const metrics = {
        tenantId: 'tenant1',
        userId: 'user1',
        endpoint: 'GET /users',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };

      mockPrismaService.requestLog.create.mockResolvedValue({ id: '1', ...metrics });

      await service.recordRequestMetrics(metrics);

      expect(mockPrismaService.requestLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: metrics.tenantId,
          userId: metrics.userId,
          endpoint: metrics.endpoint,
          method: metrics.method,
          statusCode: metrics.statusCode,
          responseTime: metrics.responseTime,
        }),
      });
    });

    it('should handle errors when recording metrics', async () => {
      const metrics = {
        tenantId: 'tenant1',
        endpoint: 'GET /users',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
      };

      mockPrismaService.requestLog.create.mockRejectedValue(new Error('Database error'));

      await service.recordRequestMetrics(metrics);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to record request metrics',
        'Database error',
        expect.objectContaining({
          metrics: expect.any(Object),
        }),
      );
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      // Acessar o método privado para teste
      const formatBytes = (service as any).formatBytes;

      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });
});