import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly databaseConnections: Gauge<string>;
  private readonly cacheHitRate: Gauge<string>;
  private readonly errorRate: Counter<string>;
  private readonly tenantOperations: Counter<string>;
  private readonly authenticationAttempts: Counter<string>;

  constructor() {
    // Contador de requisições HTTP
    this.httpRequestsTotal = new Counter({
      name: 'saas_boilerplate_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
    });

    // Duração das requisições HTTP
    this.httpRequestDuration = new Histogram({
      name: 'saas_boilerplate_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'tenant_id'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // Conexões ativas
    this.activeConnections = new Gauge({
      name: 'saas_boilerplate_active_connections',
      help: 'Number of active connections',
    });

    // Conexões com banco de dados
    this.databaseConnections = new Gauge({
      name: 'saas_boilerplate_database_connections',
      help: 'Number of active database connections',
    });

    // Taxa de acerto do cache
    this.cacheHitRate = new Gauge({
      name: 'saas_boilerplate_cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type'],
    });

    // Taxa de erro
    this.errorRate = new Counter({
      name: 'saas_boilerplate_errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'tenant_id', 'endpoint'],
    });

    // Operações por tenant
    this.tenantOperations = new Counter({
      name: 'saas_boilerplate_tenant_operations_total',
      help: 'Total number of operations per tenant',
      labelNames: ['tenant_id', 'operation_type', 'resource'],
    });

    // Tentativas de autenticação
    this.authenticationAttempts = new Counter({
      name: 'saas_boilerplate_auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['status', 'method'],
    });

    // Registrar métricas
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.activeConnections);
    register.registerMetric(this.databaseConnections);
    register.registerMetric(this.cacheHitRate);
    register.registerMetric(this.errorRate);
    register.registerMetric(this.tenantOperations);
    register.registerMetric(this.authenticationAttempts);
  }

  // Incrementar contador de requisições HTTP
  incrementHttpRequests(method: string, route: string, statusCode: string, tenantId?: string) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
      tenant_id: tenantId || 'unknown',
    });
  }

  // Observar duração de requisição HTTP
  observeHttpDuration(method: string, route: string, duration: number, tenantId?: string) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
        tenant_id: tenantId || 'unknown',
      },
      duration,
    );
  }

  // Definir número de conexões ativas
  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Definir número de conexões com banco
  setDatabaseConnections(count: number) {
    this.databaseConnections.set(count);
  }

  // Definir taxa de acerto do cache
  setCacheHitRate(rate: number, cacheType: string = 'redis') {
    this.cacheHitRate.set({ cache_type: cacheType }, rate);
  }

  // Incrementar contador de erros
  incrementErrors(errorType: string, tenantId?: string, endpoint?: string) {
    this.errorRate.inc({
      error_type: errorType,
      tenant_id: tenantId || 'unknown',
      endpoint: endpoint || 'unknown',
    });
  }

  // Incrementar operações por tenant
  incrementTenantOperations(tenantId: string, operationType: string, resource: string) {
    this.tenantOperations.inc({
      tenant_id: tenantId,
      operation_type: operationType,
      resource,
    });
  }

  // Incrementar tentativas de autenticação
  incrementAuthAttempts(status: 'success' | 'failure', method: string = 'jwt') {
    this.authenticationAttempts.inc({
      status,
      method,
    });
  }

  // Obter todas as métricas em formato Prometheus
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Resetar todas as métricas (útil para testes)
  resetMetrics() {
    register.resetMetrics();
  }

  // Obter estatísticas resumidas
  async getStats() {
    const metrics = await register.getMetricsAsJSON();
    
    return {
      totalMetrics: metrics.length,
      httpRequests: this.getMetricValue(metrics, 'saas_boilerplate_http_requests_total'),
      averageResponseTime: this.getMetricValue(metrics, 'saas_boilerplate_http_request_duration_seconds'),
      activeConnections: this.getMetricValue(metrics, 'saas_boilerplate_active_connections'),
      databaseConnections: this.getMetricValue(metrics, 'saas_boilerplate_database_connections'),
      cacheHitRate: this.getMetricValue(metrics, 'saas_boilerplate_cache_hit_rate'),
      totalErrors: this.getMetricValue(metrics, 'saas_boilerplate_errors_total'),
      authAttempts: this.getMetricValue(metrics, 'saas_boilerplate_auth_attempts_total'),
    };
  }

  private getMetricValue(metrics: any[], metricName: string): number {
    const metric = metrics.find(m => m.name === metricName);
    if (!metric || !metric.values || metric.values.length === 0) {
      return 0;
    }
    
    // Para contadores, somar todos os valores
    if (metric.type === 'counter') {
      return metric.values.reduce((sum: number, value: any) => sum + (value.value || 0), 0);
    }
    
    // Para gauges, pegar o último valor
    if (metric.type === 'gauge') {
      return metric.values[metric.values.length - 1]?.value || 0;
    }
    
    // Para histogramas, pegar a contagem total
    if (metric.type === 'histogram') {
      const countValue = metric.values.find((v: any) => v.metricName?.endsWith('_count'));
      return countValue?.value || 0;
    }
    
    return 0;
  }
}