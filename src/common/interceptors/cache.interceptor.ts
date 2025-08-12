import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../cache/cache.service';
import { CACHE_KEY, CACHE_INVALIDATE_KEY, CacheOptions, CacheInvalidateOptions } from '../decorators/cache.decorator';
import { Request, Response } from 'express';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheOptions>(
      CACHE_KEY,
      context.getHandler(),
    );

    const invalidateOptions = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;

    // Se não há configuração de cache, prosseguir normalmente
    if (!cacheOptions && !invalidateOptions) {
      return next.handle();
    }

    // Para operações de escrita, invalidar cache se configurado
    if (invalidateOptions && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await this.handleCacheInvalidation(invalidateOptions, request);
      return next.handle();
    }

    // Para operações de leitura, tentar buscar do cache
    if (cacheOptions && method === 'GET') {
      return this.handleCacheRead(cacheOptions, request, response, next);
    }

    return next.handle();
  }

  private async handleCacheRead(
    options: CacheOptions,
    request: Request & { user?: any },
    response: Response,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.generateCacheKey(options, request);

    try {
      // Tentar buscar do cache
      const cachedData = await this.cacheService.get(cacheKey);
      
      if (cachedData !== undefined) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        response.setHeader('X-Cache-Status', 'HIT');
        response.setHeader('Cache-Control', `max-age=${options.ttl}`);
        return of(cachedData);
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}`);
      response.setHeader('X-Cache-Status', 'MISS');

      // Se não encontrou no cache, executar e armazenar
      return next.handle().pipe(
        tap(async (data) => {
          if (data && response.statusCode >= 200 && response.statusCode < 300) {
            await this.cacheService.set(cacheKey, data, options.ttl);
            this.logger.debug(`Data cached with key: ${cacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${cacheKey}:`, error);
      return next.handle();
    }
  }

  private async handleCacheInvalidation(
    options: CacheInvalidateOptions,
    request: Request & { user?: any },
  ): Promise<void> {
    try {
      // Invalidar por padrões específicos
      if (options.patterns && options.patterns.length > 0) {
        for (const pattern of options.patterns) {
          await this.cacheService.invalidatePattern(pattern);
          this.logger.debug(`Cache invalidated for pattern: ${pattern}`);
        }
      }

      // Invalidar por chaves específicas
      if (options.keys && options.keys.length > 0) {
        for (const key of options.keys) {
          await this.cacheService.del(key);
          this.logger.debug(`Cache invalidated for key: ${key}`);
        }
      }

      // Invalidar cache do tenant
      if (options.tenant && request.user?.tenantId) {
        await this.cacheService.invalidateTenant(request.user.tenantId);
        this.logger.debug(`Cache invalidated for tenant: ${request.user.tenantId}`);
      }

      // Invalidar cache do usuário
      if (options.user && request.user?.id) {
        await this.cacheService.invalidateUser(request.user.id, request.user.tenantId);
        this.logger.debug(`Cache invalidated for user: ${request.user.id}`);
      }
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
    }
  }

  private generateCacheKey(
    options: CacheOptions,
    request: Request & { user?: any },
  ): string {
    if (options.key) {
      return options.key;
    }

    const keyParts: string[] = [];

    // Adicionar endpoint
    if (options.includeTenant !== false) {
      keyParts.push(request.route?.path || request.path);
    }

    // Adicionar método HTTP
    keyParts.push(request.method);

    // Adicionar tenant
    if (options.includeTenant !== false && request.user?.tenantId) {
      keyParts.push(`tenant:${request.user.tenantId}`);
    }

    // Adicionar usuário
    if (options.includeUser && request.user?.id) {
      keyParts.push(`user:${request.user.id}`);
    }

    // Adicionar parâmetros da rota
    if (options.includeParams !== false && request.params) {
      const params = Object.entries(request.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join(',');
      if (params) {
        keyParts.push(`params:${params}`);
      }
    }

    // Adicionar query parameters
    if (options.includeQuery !== false && request.query) {
      const query = Object.entries(request.query)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join(',');
      if (query) {
        keyParts.push(`query:${query}`);
      }
    }

    return this.cacheService.generateKey(keyParts);
  }
}