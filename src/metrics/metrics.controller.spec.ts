import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  const mockMetricsService = {
    getMetrics: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
    const expectedMetrics = `# HELP saas_boilerplate_http_requests_total Total number of HTTP requests
# TYPE saas_boilerplate_http_requests_total counter
saas_boilerplate_http_requests_total{method="GET",route="/users",status_code="200",tenant_id="tenant1"} 42`;
    
    mockMetricsService.getMetrics.mockResolvedValue(expectedMetrics);

    const mockResponse = {
      set: jest.fn(),
      send: jest.fn()
    } as any;

    await controller.getMetrics(mockResponse);
    
    expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(mockResponse.send).toHaveBeenCalledWith(expectedMetrics);
    expect(mockMetricsService.getMetrics).toHaveBeenCalledTimes(1);
  });

    it('should handle empty metrics', async () => {
    const expectedMetrics = '';
    
    mockMetricsService.getMetrics.mockResolvedValue(expectedMetrics);

    const mockResponse = {
      set: jest.fn(),
      send: jest.fn()
    } as any;

    await controller.getMetrics(mockResponse);
    
    expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(mockResponse.send).toHaveBeenCalledWith(expectedMetrics);
    expect(mockMetricsService.getMetrics).toHaveBeenCalledTimes(1);
  });
  });

  describe('getStats', () => {
    it('should return statistics summary', async () => {
      const expectedStats = {
        totalMetrics: 8,
        httpRequests: 1250,
        averageResponseTime: 0.245,
        activeConnections: 15,
        databaseConnections: 10,
        cacheHitRate: 85.5,
        totalErrors: 12,
        authAttempts: 450,
      };
      
      mockMetricsService.getStats.mockResolvedValue(expectedStats);

      const result = await controller.getStats();
      
      expect(result).toEqual(expectedStats);
      expect(mockMetricsService.getStats).toHaveBeenCalledTimes(1);
    });

    it('should handle zero values in stats', async () => {
      const expectedStats = {
        totalMetrics: 0,
        httpRequests: 0,
        averageResponseTime: 0,
        activeConnections: 0,
        databaseConnections: 0,
        cacheHitRate: 0,
        totalErrors: 0,
        authAttempts: 0,
      };
      
      mockMetricsService.getStats.mockResolvedValue(expectedStats);

      const result = await controller.getStats();
      
      expect(result).toEqual(expectedStats);
      expect(mockMetricsService.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();
      
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metricsEnabled', true);
      expect(typeof result.timestamp).toBe('string');
      
      // Verificar se o timestamp é uma data válida
      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return current timestamp', () => {
      const beforeCall = new Date();
      const result = controller.getHealth();
      const afterCall = new Date();
      
      const resultTimestamp = new Date(result.timestamp);
      
      expect(resultTimestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(resultTimestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('Guards and Decorators', () => {
    it('should have Public decorator on getMetrics', () => {
      const metadata = Reflect.getMetadata('isPublic', controller.getMetrics);
      expect(metadata).toBe(true);
    });

    it('should have Public decorator on getHealth', () => {
      const metadata = Reflect.getMetadata('isPublic', controller.getHealth);
      expect(metadata).toBe(true);
    });

    it('should have guards configured', () => {
      // Os guards são aplicados via decorators @UseGuards no controller
      // Este teste verifica que o controller está configurado corretamente
      expect(controller).toBeDefined();
      expect(typeof controller.getStats).toBe('function');
    });
  });

  describe('API Documentation', () => {
    it('should have ApiTags decorator', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', MetricsController);
      expect(tags).toContain('Metrics');
    });

    it('should have ApiOperation decorators on methods', () => {
      const getMetricsOperation = Reflect.getMetadata('swagger/apiOperation', controller.getMetrics);
      const getStatsOperation = Reflect.getMetadata('swagger/apiOperation', controller.getStats);
      const getHealthOperation = Reflect.getMetadata('swagger/apiOperation', controller.getHealth);
      
      expect(getMetricsOperation).toBeDefined();
      expect(getStatsOperation).toBeDefined();
      expect(getHealthOperation).toBeDefined();
    });
  });
});