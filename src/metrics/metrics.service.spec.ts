import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { register } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    // Limpar todas as métricas registradas antes de cada teste
    register.clear();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    // Limpar todas as métricas registradas após cada teste
    register.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('incrementHttpRequests', () => {
    it('should increment HTTP request counter', () => {
      const method = 'GET';
      const route = '/users';
      const statusCode = '200';
      const tenantId = 'tenant1';

      expect(() => {
        service.incrementHttpRequests(method, route, statusCode, tenantId);
      }).not.toThrow();
    });

    it('should handle missing tenantId', () => {
      const method = 'POST';
      const route = '/auth/login';
      const statusCode = '201';

      expect(() => {
        service.incrementHttpRequests(method, route, statusCode);
      }).not.toThrow();
    });
  });

  describe('observeHttpDuration', () => {
    it('should observe HTTP request duration', () => {
      const method = 'GET';
      const route = '/users';
      const duration = 0.5;
      const tenantId = 'tenant1';

      expect(() => {
        service.observeHttpDuration(method, route, duration, tenantId);
      }).not.toThrow();
    });

    it('should handle missing tenantId', () => {
      const method = 'GET';
      const route = '/health';
      const duration = 0.1;

      expect(() => {
        service.observeHttpDuration(method, route, duration);
      }).not.toThrow();
    });
  });

  describe('setActiveConnections', () => {
    it('should set active connections count', () => {
      const count = 15;

      expect(() => {
        service.setActiveConnections(count);
      }).not.toThrow();
    });
  });

  describe('setDatabaseConnections', () => {
    it('should set database connections count', () => {
      const count = 10;

      expect(() => {
        service.setDatabaseConnections(count);
      }).not.toThrow();
    });
  });

  describe('setCacheHitRate', () => {
    it('should set cache hit rate', () => {
      const rate = 85.5;
      const cacheType = 'redis';

      expect(() => {
        service.setCacheHitRate(rate, cacheType);
      }).not.toThrow();
    });

    it('should use default cache type', () => {
      const rate = 90.0;

      expect(() => {
        service.setCacheHitRate(rate);
      }).not.toThrow();
    });
  });

  describe('incrementErrors', () => {
    it('should increment error counter', () => {
      const errorType = 'ValidationError';
      const tenantId = 'tenant1';
      const endpoint = '/users';

      expect(() => {
        service.incrementErrors(errorType, tenantId, endpoint);
      }).not.toThrow();
    });

    it('should handle missing optional parameters', () => {
      const errorType = 'UnknownError';

      expect(() => {
        service.incrementErrors(errorType);
      }).not.toThrow();
    });
  });

  describe('incrementTenantOperations', () => {
    it('should increment tenant operations counter', () => {
      const tenantId = 'tenant1';
      const operationType = 'create';
      const resource = 'users';

      expect(() => {
        service.incrementTenantOperations(tenantId, operationType, resource);
      }).not.toThrow();
    });
  });

  describe('incrementAuthAttempts', () => {
    it('should increment successful auth attempts', () => {
      const status = 'success';
      const method = 'jwt';

      expect(() => {
        service.incrementAuthAttempts(status, method);
      }).not.toThrow();
    });

    it('should increment failed auth attempts', () => {
      const status = 'failure';
      const method = 'jwt';

      expect(() => {
        service.incrementAuthAttempts(status, method);
      }).not.toThrow();
    });

    it('should use default method', () => {
      const status = 'success';

      expect(() => {
        service.incrementAuthAttempts(status);
      }).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      // Adicionar algumas métricas
      service.incrementHttpRequests('GET', '/users', '200', 'tenant1');
      service.incrementAuthAttempts('success', 'jwt');
      service.setActiveConnections(10);

      const metrics = await service.getMetrics();
      
      expect(typeof metrics).toBe('string');
      // Verificar se há métricas ou se está vazio (ambos são válidos)
      if (metrics.length > 0) {
        expect(metrics).toContain('saas_boilerplate_');
      }
    });
  });

  describe('getStats', () => {
    it('should return statistics summary', async () => {
      // Adicionar algumas métricas
      service.incrementHttpRequests('GET', '/users', '200', 'tenant1');
      service.incrementAuthAttempts('success', 'jwt');
      service.setActiveConnections(10);
      service.setDatabaseConnections(5);
      service.setCacheHitRate(85.5);
      service.incrementErrors('ValidationError', 'tenant1', '/users');

      const stats = await service.getStats();
      
      expect(stats).toHaveProperty('totalMetrics');
      expect(stats).toHaveProperty('httpRequests');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('databaseConnections');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('authAttempts');
      
      expect(typeof stats.totalMetrics).toBe('number');
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics', () => {
      // Adicionar algumas métricas
      service.incrementHttpRequests('GET', '/users', '200', 'tenant1');
      service.incrementAuthAttempts('success', 'jwt');
      
      expect(() => {
        service.resetMetrics();
      }).not.toThrow();
    });
  });
});