import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MonitoringService } from '../monitoring.service';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();
    const endpoint = `${request.method} ${request.route?.path || request.url}`;

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          this.recordMetrics(request, response, responseTime, false);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.recordMetrics(request, response, responseTime, true);
          
          this.logger.error('Request failed', error.message, {
            endpoint,
            responseTime,
            statusCode: response.statusCode,
          });
        },
      })
    );
  }

  private recordMetrics(request: any, response: any, responseTime: number, isError: boolean) {
    const endpoint = request.route?.path || request.url;
    const method = request.method;
    const statusCode = response.statusCode || (isError ? 500 : 200);
    
    // Registrar métricas em memória
    this.monitoringService.recordRequest(`${method} ${endpoint}`, responseTime, isError);
    
    // Registrar métricas no banco de dados
    this.monitoringService.recordRequestMetrics({
      tenantId: request.user?.tenantId,
      userId: request.user?.id,
      endpoint,
      method,
      statusCode,
      responseTime,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.connection?.remoteAddress,
    }).catch(error => {
      this.logger.error('Failed to record request metrics to database', error.message, {
        endpoint: `${method} ${endpoint}`,
      });
    });
    
    // Log de performance para requisições lentas (> 1000ms)
    if (responseTime > 1000) {
      this.logger.warn('Slow request detected', {
        endpoint: `${method} ${endpoint}`,
        responseTime: responseTime,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        statusCode,
      });
    }
    
    // Log de erro se necessário
    if (isError) {
      this.logger.error('Request error recorded', 'Error details', {
        endpoint: `${method} ${endpoint}`,
        responseTime: responseTime,
        statusCode,
      });
    }
  }
}