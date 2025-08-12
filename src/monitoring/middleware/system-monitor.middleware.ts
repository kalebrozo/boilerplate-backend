import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../../common/logger/logger.service';
import * as os from 'os';
import * as process from 'process';

@Injectable()
export class SystemMonitorMiddleware implements NestMiddleware {
  private lastCpuUsage = process.cpuUsage();
  private lastCheck = Date.now();
  private alertThresholds = {
    memoryUsage: 85, // 85% da memória total
    cpuUsage: 80,    // 80% de uso de CPU
    responseTime: 5000, // 5 segundos
  };

  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Monitorar recursos antes da requisição
    this.checkSystemResources();
    
    // Interceptar o final da resposta
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Verificar se a resposta foi lenta
      if (responseTime > 2000) {
        req['performanceAlert'] = {
          type: 'slow_response',
          responseTime,
          endpoint: `${req.method} ${req.route?.path || req.url}`,
        };
      }
      
      return originalSend.call(this, data);
    };
    
    // Continuar com a requisição
    next();
    
    // Log de alertas após a resposta (se houver)
    res.on('finish', () => {
      if (req['performanceAlert']) {
        this.logger.warn('Performance alert', req['performanceAlert']);
      }
    });
  }

  private checkSystemResources() {
    const now = Date.now();
    
    // Verificar apenas a cada 30 segundos para evitar overhead
    if (now - this.lastCheck < 30000) {
      return;
    }
    
    this.lastCheck = now;
    
    try {
      // Verificar uso de memória
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      if (memoryUsagePercent > this.alertThresholds.memoryUsage) {
        this.logger.warn('High memory usage detected', {
          usagePercent: memoryUsagePercent.toFixed(2),
          used: this.formatBytes(usedMemory),
          total: this.formatBytes(totalMemory),
          threshold: this.alertThresholds.memoryUsage,
        });
      }
      
      // Verificar uso de CPU
      const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
      const cpuPercent = this.calculateCpuPercent(currentCpuUsage, now - this.lastCheck);
      
      if (cpuPercent > this.alertThresholds.cpuUsage) {
        this.logger.warn('High CPU usage detected', {
          usagePercent: cpuPercent.toFixed(2),
          threshold: this.alertThresholds.cpuUsage,
          user: currentCpuUsage.user,
          system: currentCpuUsage.system,
        });
      }
      
      this.lastCpuUsage = process.cpuUsage();
      
      // Verificar uso de heap
      const memoryUsage = process.memoryUsage();
      const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      if (heapUsagePercent > 85) {
        this.logger.warn('High heap usage detected', {
          heapUsagePercent: heapUsagePercent.toFixed(2),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
        });
      }
      
      // Log de métricas periódicas (apenas para debug)
      this.logger.debug('System resources check', {
        memory: {
          usagePercent: memoryUsagePercent.toFixed(2),
          used: this.formatBytes(usedMemory),
          free: this.formatBytes(freeMemory),
        },
        cpu: {
          usagePercent: cpuPercent.toFixed(2),
        },
        heap: {
          usagePercent: heapUsagePercent.toFixed(2),
          used: this.formatBytes(memoryUsage.heapUsed),
        },
      });
      
    } catch (error) {
      this.logger.error('Failed to check system resources', error.message);
    }
  }
  
  private calculateCpuPercent(cpuUsage: NodeJS.CpuUsage, timeDiff: number): number {
    // Converter microssegundos para milissegundos
    const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000;
    
    // Calcular porcentagem baseada no tempo decorrido
    const cpuPercent = (totalCpuTime / timeDiff) * 100;
    
    return Math.min(cpuPercent, 100); // Limitar a 100%
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}