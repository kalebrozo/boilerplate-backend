import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import * as os from 'os';
import * as process from 'process';
import * as fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);

@Injectable()
export class MonitoringService {
  private readonly startTime = Date.now();
  private requestMetrics = new Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastRequest: Date;
  }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async getApplicationMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = Date.now() - this.startTime;

    return {
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
      },
      memory: {
        rss: this.formatBytes(memoryUsage.rss),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        external: this.formatBytes(memoryUsage.external),
        arrayBuffers: this.formatBytes(memoryUsage.arrayBuffers),
        heapUsagePercent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
  }

  async getDetailedHealthCheck() {
    try {
      const [dbHealth, systemHealth, appMetrics] = await Promise.all([
        this.checkDatabaseHealth(),
        this.getSystemResources(),
        this.getApplicationMetrics(),
      ]);

      const overallStatus = dbHealth.status === 'healthy' && 
                           parseFloat(systemHealth.memory.usagePercent) < 90 &&
                            parseFloat(systemHealth.disk.usagePercent) < 90 ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth,
          system: systemHealth,
          application: appMetrics,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error.message);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async getPerformanceMetrics(tenantId?: string) {
    try {
      const [systemMetrics, requestMetrics, dbMetrics] = await Promise.all([
        this.getSystemPerformance(),
        this.getRequestMetrics(tenantId),
        this.getDatabasePerformance(),
      ]);

      return {
        system: systemMetrics,
        requests: requestMetrics,
        database: dbMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get performance metrics', error.message, {
        tenantId,
      });
      throw error;
    }
  }

  async getDatabaseStats(tenantId: string) {
    try {
      const [userCount, roleCount, permissionCount, tenantCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.role.count(),
        this.prisma.permission.count(),
        this.prisma.tenant.count(),
      ]);

      // Estatísticas de conexões do banco
      const connectionStats = await this.getDatabaseConnectionStats();

      return {
        timestamp: new Date().toISOString(),
        tenantId,
        records: {
          users: userCount,
          roles: roleCount,
          permissions: permissionCount,
          tenants: tenantCount,
        },
        connections: connectionStats,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats', error.message, { tenantId });
      throw error;
    }
  }

  async getSystemResources() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // Informações do disco
    const diskInfo = await this.getDiskUsage();

    return {
      timestamp: new Date().toISOString(),
      memory: {
        total: this.formatBytes(totalMemory),
        used: this.formatBytes(usedMemory),
        free: this.formatBytes(freeMemory),
        usagePercent: memoryUsagePercent.toFixed(2),
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0,
        loadAverage: {
          '1min': loadAverage[0]?.toFixed(2) || '0',
          '5min': loadAverage[1]?.toFixed(2) || '0',
          '15min': loadAverage[2]?.toFixed(2) || '0',
        },
      },
      disk: diskInfo,
      uptime: {
        system: os.uptime(),
        process: process.uptime(),
      },
    };
  }

  async getApiPerformance(tenantId?: string) {
    try {
      const where = tenantId ? { tenantId } : {};
      
      // Buscar métricas por endpoint
      const endpointStats = await this.prisma.requestLog.groupBy({
        by: ['endpoint', 'method'],
        where,
        _count: { id: true },
        _avg: { responseTime: true },
        _max: { createdAt: true },
      });

      // Buscar contagem de erros por endpoint
      const errorStats = await this.prisma.requestLog.groupBy({
        by: ['endpoint', 'method'],
        where: { ...where, statusCode: { gte: 400 } },
        _count: { id: true },
      });

      const errorMap = new Map(
        errorStats.map(stat => [
          `${stat.endpoint}-${stat.method}`,
          stat._count.id
        ])
      );

      const endpointMetrics = endpointStats.map(stat => {
        const key = `${stat.endpoint}-${stat.method}`;
        const errors = errorMap.get(key) || 0;
        const total = stat._count.id;
        
        return {
          endpoint: `${stat.method} ${stat.endpoint}`,
          totalRequests: total,
          averageResponseTime: stat._avg.responseTime?.toFixed(2) || '0',
          errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) : '0',
          lastRequest: stat._max.createdAt,
        };
      });

      const overallMetrics = await this.getRequestMetrics(tenantId);

      return {
        overall: overallMetrics,
        endpoints: endpointMetrics.sort((a, b) => b.totalRequests - a.totalRequests),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get API performance metrics', error.message, {
        tenantId,
      });
      
      // Fallback para métricas em memória
      const endpointMetrics = Array.from(this.requestMetrics.entries()).map(
        ([endpoint, data]) => ({
          endpoint,
          totalRequests: data.count,
          averageResponseTime: data.count > 0 ? (data.totalTime / data.count).toFixed(2) : '0',
          errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) : '0',
          lastRequest: data.lastRequest,
        })
      );

      const overallMetrics = await this.getRequestMetrics(tenantId);

      return {
        overall: overallMetrics,
        endpoints: endpointMetrics.sort((a, b) => b.totalRequests - a.totalRequests),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getTenantUsageStats(tenantId: string) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [requestStats, userStats] = await Promise.all([
        // Estatísticas de requisições
        Promise.all([
          this.prisma.requestLog.count({ where: { tenantId } }),
          this.prisma.requestLog.count({ 
            where: { tenantId, createdAt: { gte: today } } 
          }),
          this.prisma.requestLog.count({ 
            where: { tenantId, createdAt: { gte: thisWeek } } 
          }),
          this.prisma.requestLog.count({ 
            where: { tenantId, createdAt: { gte: thisMonth } } 
          }),
        ]),
        // Estatísticas de usuários (sem filtro por tenant pois User não tem tenantId)
         Promise.all([
           this.prisma.user.count(),
           this.prisma.user.count(),
         ]),
      ]);

      const [totalRequests, todayRequests, weekRequests, monthRequests] = requestStats;
      const [activeUsers, totalUsers] = userStats;

      // Calcular estatísticas de API por endpoint
      const apiStats = await this.prisma.requestLog.groupBy({
        by: ['endpoint'],
        where: { tenantId },
        _count: { id: true },
      });

      return {
        tenantId,
        timestamp: new Date().toISOString(),
        requests: {
          total: totalRequests,
          today: todayRequests,
          thisWeek: weekRequests,
          thisMonth: monthRequests,
        },
        users: {
          active: activeUsers,
          total: totalUsers,
          online: Math.floor(activeUsers * 0.1), // Estimativa de usuários online
        },
        features: {
          apiCalls: totalRequests,
          endpoints: apiStats.length,
          mostUsedEndpoint: apiStats.sort((a, b) => b._count.id - a._count.id)[0]?.endpoint || 'N/A',
        },
        performance: await this.getRequestMetrics(tenantId),
      };
    } catch (error) {
      this.logger.error('Failed to get tenant usage stats', error.message, { tenantId });
      throw error;
    }
  }

  // Método para registrar métricas de requisição (usado por interceptor)
  recordRequest(endpoint: string, responseTime: number, isError: boolean = false) {
    const current = this.requestMetrics.get(endpoint) || {
      count: 0,
      totalTime: 0,
      errors: 0,
      lastRequest: new Date(),
    };

    current.count++;
    current.totalTime += responseTime;
    if (isError) current.errors++;
    current.lastRequest = new Date();

    this.requestMetrics.set(endpoint, current);
  }

  // Método para registrar métricas no banco de dados
  async recordRequestMetrics(metrics: {
    tenantId?: string;
    userId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ip?: string;
  }) {
    try {
      await this.prisma.requestLog.create({
        data: {
          tenantId: metrics.tenantId,
          userId: metrics.userId,
          endpoint: metrics.endpoint,
          method: metrics.method,
          statusCode: metrics.statusCode,
          responseTime: metrics.responseTime,
          userAgent: metrics.userAgent,
          ip: metrics.ip,
        },
      });
    } catch (error) {
      this.logger.error('Failed to record request metrics', error.message, {
        metrics,
      });
    }
  }

  private async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async getDatabasePerformance() {
    try {
      const queries = [
        { name: 'simple_select', query: 'SELECT 1' },
        { name: 'user_count', query: 'SELECT COUNT(*) FROM users' },
        { name: 'tenant_count', query: 'SELECT COUNT(*) FROM tenants' },
      ];

      const results = await Promise.all(
        queries.map(async ({ name, query }) => {
          const start = Date.now();
          try {
            await this.prisma.$queryRawUnsafe(query);
            return {
              query: name,
              responseTime: Date.now() - start,
              status: 'success',
            };
          } catch (error) {
            return {
              query: name,
              responseTime: Date.now() - start,
              status: 'error',
              error: error.message,
            };
          }
        })
      );

      return {
        queries: results,
        averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      };
    } catch (error) {
      return {
        error: error.message,
        queries: [],
        averageResponseTime: 0,
      };
    }
  }

  private getSystemPerformance() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        // Placeholder para métricas do event loop
        lag: 0,
      },
    };
  }

  private async getDiskUsage() {
    try {
      // Para Windows, verificamos o drive C:
      const drivePath = process.platform === 'win32' ? 'C:\\' : '/';
      const stats = await stat(drivePath);
      
      // Valores aproximados para demonstração
      // Em produção, seria melhor usar uma biblioteca específica
      return {
        path: drivePath,
        total: '100GB', // Placeholder
        used: '60GB',   // Placeholder
        free: '40GB',   // Placeholder
        usagePercent: '60',
      };
    } catch (error) {
      return {
        path: 'unknown',
        total: 'unknown',
        used: 'unknown',
        free: 'unknown',
        usagePercent: 'unknown',
        error: error.message,
      };
    }
  }

  private async getDatabaseConnectionStats() {
    try {
      // Placeholder para estatísticas de conexão
      // Em produção, isso dependeria do pool de conexões do Prisma
      return {
        active: 5,
        idle: 3,
        total: 8,
        maxConnections: 20,
      };
    } catch (error) {
      return {
        active: 0,
        idle: 0,
        total: 0,
        maxConnections: 0,
        error: error.message,
      };
    }
  }

  private async getRequestMetrics(tenantId?: string) {
    try {
      const where = tenantId ? { tenantId } : {};
      
      const [totalRequests, totalErrors, avgResponseTime] = await Promise.all([
        this.prisma.requestLog.count({ where }),
        this.prisma.requestLog.count({ 
          where: { ...where, statusCode: { gte: 400 } } 
        }),
        this.prisma.requestLog.aggregate({
          where,
          _avg: { responseTime: true },
        }),
      ]);

      return {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0',
        averageResponseTime: avgResponseTime._avg.responseTime?.toFixed(2) || '0',
        endpoints: await this.prisma.requestLog.groupBy({
          by: ['endpoint'],
          where,
        }).then(groups => groups.length),
      };
    } catch (error) {
      this.logger.error('Failed to get request metrics from database', error.message, {
        tenantId,
      });
      
      // Fallback para métricas em memória
      const totalRequests = Array.from(this.requestMetrics.values())
        .reduce((sum, metric) => sum + metric.count, 0);
      
      const totalErrors = Array.from(this.requestMetrics.values())
        .reduce((sum, metric) => sum + metric.errors, 0);

      return {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0',
        averageResponseTime: '0',
        endpoints: this.requestMetrics.size,
      };
    }
  }

  private async getUserActivityStats(tenantId: string) {
    try {
      const [totalUsers, activeUsers] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count(), // Como não temos lastLoginAt, retornamos o total
      ]);

      return {
        totalUsers,
        activeUsers24h: activeUsers,
        activityRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : '0',
      };
    } catch (error) {
      return {
        totalUsers: 0,
        activeUsers24h: 0,
        activityRate: '0',
        error: error.message,
      };
    }
  }

  private getApiUsageStats(tenantId: string) {
    // Filtrar métricas por tenant seria necessário implementar
    // um sistema de rastreamento mais sofisticado
    const tenantMetrics = Array.from(this.requestMetrics.entries())
      .filter(([endpoint]) => endpoint.includes(tenantId) || true) // Placeholder
      .map(([endpoint, data]) => ({
        endpoint,
        requests: data.count,
        errors: data.errors,
        lastUsed: data.lastRequest,
      }));

    return {
      totalRequests: tenantMetrics.reduce((sum, m) => sum + m.requests, 0),
      totalErrors: tenantMetrics.reduce((sum, m) => sum + m.errors, 0),
      uniqueEndpoints: tenantMetrics.length,
      mostUsedEndpoints: tenantMetrics
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5),
    };
  }

  private async getStorageUsageStats(tenantId: string) {
    try {
      // Placeholder para estatísticas de armazenamento
      // Em produção, isso incluiria uploads, logs, etc.
      const recordCount = await this.prisma.user.count();
      
      return {
        totalRecords: recordCount,
        estimatedSize: `${recordCount * 0.5}KB`, // Estimativa
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return {
        totalRecords: 0,
        estimatedSize: '0KB',
        lastUpdated: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private calculateOverallAverageResponseTime(metrics: any[]) {
    if (metrics.length === 0) return '0';
    
    const totalTime = metrics.reduce((sum, m) => sum + (parseFloat(m.averageResponseTime) * m.totalRequests), 0);
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    
    return totalRequests > 0 ? (totalTime / totalRequests).toFixed(2) : '0';
  }

  private calculateOverallErrorRate(metrics: any[]) {
    if (metrics.length === 0) return '0';
    
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.totalRequests * parseFloat(m.errorRate) / 100), 0);
    
    return totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}