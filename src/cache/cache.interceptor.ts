import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';
import { LoggerService } from '../common/logger/logger.service';

// Decorator para marcar métodos que devem usar cache
export const UseCache = (ttl?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('use-cache', { ttl }, descriptor.value);
  };
};

// Decorator para marcar métodos que devem invalidar cache
export const InvalidateCache = (patterns: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('invalidate-cache', { patterns }, descriptor.value);
  };
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Verificar se deve usar cache (apenas para métodos GET)
    const cacheMetadata = this.reflector.get('use-cache', handler);
    const shouldUseCache = cacheMetadata && request.method === 'GET';

    // Verificar se deve invalidar cache
    const invalidateMetadata = this.reflector.get('invalidate-cache', handler);
    const shouldInvalidateCache = invalidateMetadata && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

    if (shouldUseCache) {
      return this.handleCacheRead(request, next, cacheMetadata, className, methodName);
    }

    if (shouldInvalidateCache) {
      return this.handleCacheInvalidation(request, next, invalidateMetadata, className, methodName);
    }

    return next.handle();
  }

  private async handleCacheRead(
    request: any,
    next: CallHandler,
    cacheMetadata: any,
    className: string,
    methodName: string,
  ): Promise<Observable<any>> {
    const cacheKey = this.generateCacheKey(request, className, methodName);
    
    try {
      // Tentar buscar do cache
      const cachedData = await this.cacheService.get(cacheKey);
      
      if (cachedData !== undefined) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return of(cachedData);
      }

      // Se não encontrou no cache, executar o método e armazenar o resultado
      this.logger.debug(`Cache MISS: ${cacheKey}`);
      return next.handle().pipe(
        tap(async (data) => {
          if (data !== undefined && data !== null) {
            await this.cacheService.set(cacheKey, data, cacheMetadata.ttl);
            this.logger.debug(`Cache SET: ${cacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Erro no cache para ${cacheKey}:`, error);
      return next.handle();
    }
  }

  private async handleCacheInvalidation(
    request: any,
    next: CallHandler,
    invalidateMetadata: any,
    className: string,
    methodName: string,
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      tap(async (data) => {
        try {
          // Invalidar cache após operação bem-sucedida
          for (const pattern of invalidateMetadata.patterns) {
            const resolvedPattern = this.resolvePattern(pattern, request, data);
            await this.cacheService.invalidatePattern(resolvedPattern);
            this.logger.debug(`Cache invalidado: ${resolvedPattern}`);
          }
        } catch (error) {
          this.logger.error(`Erro ao invalidar cache em ${className}.${methodName}:`, error);
        }
      }),
    );
  }

  private generateCacheKey(request: any, className: string, methodName: string): string {
    const tenantId = request.user?.tenantId || 'no-tenant';
    const userId = request.user?.id || 'no-user';
    const url = request.url;
    const query = JSON.stringify(request.query || {});
    const params = JSON.stringify(request.params || {});
    
    return this.cacheService.generateKey([
      'api',
      'tenant',
      tenantId,
      'user',
      userId,
      className.toLowerCase(),
      methodName.toLowerCase(),
      url,
      query,
      params,
    ]);
  }

  private resolvePattern(pattern: string, request: any, responseData?: any): string {
    let resolvedPattern = pattern;
    
    // Substituir placeholders
    resolvedPattern = resolvedPattern.replace('{tenantId}', request.user?.tenantId || '*');
    resolvedPattern = resolvedPattern.replace('{userId}', request.user?.id || '*');
    
    // Substituir parâmetros da URL
    if (request.params) {
      Object.keys(request.params).forEach(key => {
        resolvedPattern = resolvedPattern.replace(`{${key}}`, request.params[key]);
      });
    }
    
    // Substituir dados da resposta
    if (responseData && responseData.id) {
      resolvedPattern = resolvedPattern.replace('{id}', responseData.id);
    }
    
    return resolvedPattern;
  }
}