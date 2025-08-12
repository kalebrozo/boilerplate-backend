import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';

describe('MonitoringController', () => {
  let controller: MonitoringController;
  let service: MonitoringService;

  const mockMonitoringService = {
    getApplicationMetrics: jest.fn(),
    getDetailedHealthCheck: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    getDatabaseStats: jest.fn(),
    getSystemResources: jest.fn(),
    getApiPerformance: jest.fn(),
    getTenantUsageStats: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user1',
      tenantId: 'tenant1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        {
          provide: MonitoringService,
          useValue: mockMonitoringService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MonitoringController>(MonitoringController);
    service = module.get<MonitoringService>(MonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return application metrics', async () => {
      const expectedMetrics = {
        timestamp: '2025-01-01T00:00:00.000Z',
        uptime: { milliseconds: 1000, seconds: 1, minutes: 0, hours: 0 },
        memory: { rss: '50 MB', heapTotal: '30 MB', heapUsed: '20 MB' },
        cpu: { user: 1000, system: 500 },
        process: { pid: 1234, version: 'v18.0.0', platform: 'linux', arch: 'x64' },
      };

      mockMonitoringService.getApplicationMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics();
      expect(result).toEqual(expectedMetrics);
      expect(mockMonitoringService.getApplicationMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health check', async () => {
      const expectedHealth = {
        status: 'healthy',
        timestamp: '2025-01-01T00:00:00.000Z',
        checks: {
          database: { status: 'healthy', responseTime: '5ms' },
          system: { memory: { usagePercent: '60' }, disk: { usagePercent: '45' } },
          application: { uptime: { seconds: 100 } },
        },
      };

      mockMonitoringService.getDetailedHealthCheck.mockResolvedValue(expectedHealth);

      const result = await controller.getDetailedHealth();
      expect(result).toEqual(expectedHealth);
      expect(mockMonitoringService.getDetailedHealthCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics for tenant', async () => {
      const expectedMetrics = {
        timestamp: '2025-01-01T00:00:00.000Z',
        tenantId: 'tenant1',
        requests: { total: 100, errors: 5, errorRate: '5.00' },
        database: { averageResponseTime: 10 },
        system: { memory: { heapUsed: 1000000 }, cpu: { user: 1000 } },
      };

      mockMonitoringService.getPerformanceMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getPerformanceMetrics(mockRequest);
      expect(result).toEqual(expectedMetrics);
      expect(mockMonitoringService.getPerformanceMetrics).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics for tenant', async () => {
      const expectedStats = {
        timestamp: '2025-01-01T00:00:00.000Z',
        tenantId: 'tenant1',
        records: { users: 10, roles: 3, permissions: 50, tenants: 1 },
        connections: { active: 5, idle: 3, total: 8, maxConnections: 20 },
      };

      mockMonitoringService.getDatabaseStats.mockResolvedValue(expectedStats);

      const result = await controller.getDatabaseStats(mockRequest);
      expect(result).toEqual(expectedStats);
      expect(mockMonitoringService.getDatabaseStats).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('getSystemResources', () => {
    it('should return system resources', async () => {
      const expectedResources = {
        timestamp: '2025-01-01T00:00:00.000Z',
        memory: { total: '8 GB', used: '4 GB', free: '4 GB', usagePercent: '50.00' },
        cpu: { count: 4, model: 'Intel Core i7', speed: 2400, loadAverage: { '1min': '0.5' } },
        disk: { path: 'C:\\', total: '100GB', used: '60GB', free: '40GB', usagePercent: '60' },
        uptime: { system: 86400, process: 3600 },
      };

      mockMonitoringService.getSystemResources.mockResolvedValue(expectedResources);

      const result = await controller.getSystemResources();
      expect(result).toEqual(expectedResources);
      expect(mockMonitoringService.getSystemResources).toHaveBeenCalledTimes(1);
    });
  });

  describe('getApiPerformance', () => {
    it('should return API performance metrics for tenant', async () => {
      const expectedMetrics = {
        timestamp: '2025-01-01T00:00:00.000Z',
        tenantId: 'tenant1',
        endpoints: [
          {
            endpoint: 'GET /users',
            totalRequests: 50,
            averageResponseTime: '120.50',
            errorRate: '2.00',
            lastRequest: new Date('2025-01-01T00:00:00.000Z'),
          },
        ],
        summary: {
          totalEndpoints: 1,
          totalRequests: 50,
          averageResponseTime: '120.50',
          overallErrorRate: '2.00',
        },
      };

      mockMonitoringService.getApiPerformance.mockResolvedValue(expectedMetrics);

      const result = await controller.getApiPerformance(mockRequest);
      expect(result).toEqual(expectedMetrics);
      expect(mockMonitoringService.getApiPerformance).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('getTenantUsage', () => {
    it('should return tenant usage statistics', async () => {
      const expectedUsage = {
        timestamp: '2025-01-01T00:00:00.000Z',
        tenantId: 'tenant1',
        userActivity: {
          totalUsers: 10,
          activeUsers24h: 7,
          activityRate: '70.00',
        },
        apiUsage: {
          totalRequests: 1000,
          totalErrors: 25,
          uniqueEndpoints: 15,
          mostUsedEndpoints: [
            { endpoint: 'GET /users', requests: 200, errors: 5 },
          ],
        },
        storage: {
          totalRecords: 100,
          estimatedSize: '50KB',
          lastUpdated: '2025-01-01T00:00:00.000Z',
        },
      };

      mockMonitoringService.getTenantUsageStats.mockResolvedValue(expectedUsage);

      const result = await controller.getTenantUsage(mockRequest);
      expect(result).toEqual(expectedUsage);
      expect(mockMonitoringService.getTenantUsageStats).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable');
      mockMonitoringService.getApplicationMetrics.mockRejectedValue(error);

      await expect(controller.getMetrics()).rejects.toThrow('Service unavailable');
    });
  });
});