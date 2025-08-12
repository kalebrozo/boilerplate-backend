import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from '../metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const method = request.method;
    const route = this.getRoute(context);
    const tenantId = request.user?.tenantId || request.headers['x-tenant-id'];

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000; // em segundos
        const statusCode = response.statusCode.toString();

        // Coletar métricas de requisição
        this.metricsService.incrementHttpRequests(method, route, statusCode, tenantId);
        this.metricsService.observeHttpDuration(method, route, duration, tenantId);

        // Coletar métricas de erro para status codes de erro
        if (response.statusCode >= 400) {
          this.metricsService.incrementErrors(
            `HttpError${response.statusCode}`,
            tenantId,
            route
          );
        }

        // Coletar métricas de operação por tenant
        if (tenantId) {
          const operationType = this.getOperationType(method);
          const resource = this.getResourceFromRoute(route);
          this.metricsService.incrementTenantOperations(tenantId, operationType, resource);
        }
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = error.status?.toString() || '500';

        // Coletar métricas de erro
        this.metricsService.incrementHttpRequests(method, route, statusCode, tenantId);
        this.metricsService.observeHttpDuration(method, route, duration, tenantId);
        this.metricsService.incrementErrors(
          error.name || 'UnknownError',
          tenantId,
          route
        );

        throw error;
      }),
    );
  }

  private getRoute(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Tentar obter a rota do Reflect metadata
    const controllerPath = Reflect.getMetadata('path', controller) || '';
    const handlerPath = Reflect.getMetadata('path', handler) || '';
    
    if (controllerPath && handlerPath) {
      return `/${controllerPath}/${handlerPath}`.replace(/\/+/g, '/');
    }

    // Fallback para URL da requisição
    return request.route?.path || request.url.split('?')[0] || 'unknown';
  }

  private getOperationType(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'read';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'unknown';
    }
  }

  private getResourceFromRoute(route: string): string {
    // Extrair o recurso da rota (ex: /users/123 -> users)
    const segments = route.split('/').filter(segment => segment && !segment.startsWith(':'));
    return segments[0] || 'unknown';
  }
}