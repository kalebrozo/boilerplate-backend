import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import {
  TENANT_KEY,
  TenantOptions,
} from '../decorators/tenant.decorator';
import { Request } from 'express';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly metricsService: MetricsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const tenantOptions = this.reflector.get<TenantOptions>(
      TENANT_KEY,
      context.getHandler(),
    );

    // Se não há configuração de tenant, prosseguir normalmente
    if (!tenantOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    
    // Validar tenant se necessário
    if (tenantOptions.validate !== false) {
      this.validateTenant(request, tenantOptions);
    }

    // Verificar isolamento se necessário
    if (tenantOptions.isolation !== false) {
      this.checkTenantIsolation(request, tenantOptions);
    }

    // Adicionar filtro automático se configurado
    if (tenantOptions.autoFilter) {
      this.addTenantFilter(request, tenantOptions);
    }

    return next.handle().pipe(
      tap((data) => {
        // Coletar métricas se configurado
        if (tenantOptions.collectMetrics) {
          this.collectTenantMetrics(request, tenantOptions, data);
        }

        // Log de acesso se configurado
        if (tenantOptions.logAccess) {
          this.logTenantAccess(request, tenantOptions);
        }
      }),
    );
  }

  private validateTenant(
    request: Request & { user?: any },
    options: TenantOptions,
  ): void {
    const tenantId = this.extractTenantId(request, options);
    
    if (!tenantId) {
      this.logger.warn('Tenant ID not found in request', {
        path: request.path,
        method: request.method,
        userId: request.user?.id,
      });
      
      throw new BadRequestException('Tenant ID is required');
    }

    // Tenant ID validation could be added here if needed

    this.logger.debug('Tenant validation passed', {
      tenantId,
      userId: request.user?.id,
      path: request.path,
    });
  }

  private checkTenantIsolation(
    request: Request & { user?: any },
    options: TenantOptions,
  ): void {
    const userTenantId = request.user?.tenantId;
    const requestTenantId = this.extractTenantId(request, options);
    
    // Se não há usuário autenticado, pular verificação
    if (!request.user || !userTenantId) {
      return;
    }

    // Verificar se o usuário está tentando acessar dados de outro tenant
    if (requestTenantId && requestTenantId !== userTenantId) {
      // Verificar se acesso cross-tenant é permitido
      if (!options.allowCrossTenant) {
        this.logger.warn('Cross-tenant access denied', {
          userTenantId,
          requestTenantId,
          userId: request.user.id,
          path: request.path,
          method: request.method,
        });
        
        throw new ForbiddenException('Access to other tenant data is not allowed');
      } else {
        this.logger.log('Cross-tenant access allowed', {
          userTenantId,
          requestTenantId,
          userId: request.user.id,
          path: request.path,
        });
      }
    }

    this.logger.debug('Tenant isolation check passed', {
      userTenantId,
      requestTenantId,
      userId: request.user?.id,
    });
  }

  private addTenantFilter(
    request: Request & { user?: any },
    options: TenantOptions,
  ): void {
    const tenantId = this.extractTenantId(request, options);
    
    if (tenantId) {
      // Adicionar filtro de tenant aos parâmetros da query
      if (!request.query) {
        request.query = {};
      }
      
      const tenantField = options.tenantField || 'tenantId';
      (request.query as any)[tenantField] = tenantId;
      
      // Adicionar também aos parâmetros do body se for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
        if (typeof request.body === 'object') {
          request.body[tenantField] = tenantId;
        }
      }
      
      this.logger.debug('Tenant filter added', {
        tenantId,
        tenantField,
        method: request.method,
        path: request.path,
      });
    }
  }

  private extractTenantId(
    request: Request & { user?: any },
    options: TenantOptions,
  ): string | null {
    const tenantField = options.tenantField || 'tenantId';
    
    // Prioridade: params > query > body > user > headers
    return (
      request.params?.[tenantField] ||
      request.query?.[tenantField] ||
      request.body?.[tenantField] ||
      request.user?.tenantId ||
      request.headers['x-tenant-id'] ||
      null
    ) as string | null;
  }

  private collectTenantMetrics(
    request: Request & { user?: any },
    options: TenantOptions,
    data: any,
  ): void {
    try {
      const tenantId = this.extractTenantId(request, options);
      
      if (tenantId) {
        const labels = {
          tenant_id: tenantId,
          method: request.method,
          endpoint: request.route?.path || request.path,
          user_id: request.user?.id || 'anonymous',
        };
        
        // Incrementar contador de requisições por tenant
        this.metricsService.incrementTenantOperations(
          tenantId,
          'request',
          request.route?.path || request.path,
        );
        
        // Se há dados de resposta, coletar métricas de volume
        if (data && typeof data === 'object') {
          let count = 0;
          
          if (Array.isArray(data)) {
            count = data.length;
          } else if (data.items && Array.isArray(data.items)) {
            count = data.items.length;
          } else if (data.total !== undefined) {
            count = data.total;
          } else {
            count = 1;
          }
          
          this.metricsService.observeHttpDuration(
            request.method,
            request.route?.path || request.path,
            count / 1000, // Convert to seconds for duration metric
            tenantId,
          );
        }
        
        this.logger.debug('Tenant metrics collected', {
          tenantId,
          endpoint: labels.endpoint,
          method: labels.method,
        });
      }
    } catch (error) {
      this.logger.error('Error collecting tenant metrics:', error);
    }
  }

  private logTenantAccess(
    request: Request & { user?: any },
    options: TenantOptions,
  ): void {
    const tenantId = this.extractTenantId(request, options);
    
    this.logger.log('Tenant access', {
      tenantId,
      userId: request.user?.id,
      method: request.method,
      path: request.path,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      timestamp: new Date().toISOString(),
    });
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }
}