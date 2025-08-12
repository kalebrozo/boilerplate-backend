import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';
import { Request } from 'express';
import { CacheService } from '../../cache/cache.service';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // Se não há configuração de rate limit, prosseguir normalmente
    if (!rateLimitOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const response = context.switchToHttp().getResponse();

    // Gerar chave para o rate limit
    const key = this.generateRateLimitKey(rateLimitOptions, request);
    
    // Verificar e atualizar rate limit
    const rateLimitInfo = await this.checkRateLimit(key, rateLimitOptions);
    
    // Adicionar headers de rate limit
    this.addRateLimitHeaders(response, rateLimitOptions, rateLimitInfo);
    
    // Se excedeu o limite, lançar exceção
    if (rateLimitInfo.count > rateLimitOptions.limit) {
      this.logger.warn(`Rate limit exceeded for key: ${key}`, {
        limit: rateLimitOptions.limit,
        current: rateLimitInfo.count,
        resetTime: new Date(rateLimitInfo.resetTime),
      });
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: rateLimitOptions.message || 'Too many requests',
          error: 'Too Many Requests',
          retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.logger.debug(`Rate limit check passed for key: ${key}`, {
      limit: rateLimitOptions.limit,
      current: rateLimitInfo.count,
      remaining: rateLimitOptions.limit - rateLimitInfo.count,
    });

    return next.handle();
  }

  private generateRateLimitKey(
    options: RateLimitOptions,
    request: Request & { user?: any },
  ): string {
    const parts: string[] = ['rate_limit'];

    // Adicionar prefixo customizado
    // Key prefix could be added here if needed

    // Adicionar endpoint
    const endpoint = request.route?.path || request.path;
    parts.push(endpoint.replace(/[^a-zA-Z0-9]/g, '_'));

    // Adicionar método HTTP
    parts.push(request.method.toLowerCase());

    // Default to IP-based rate limiting
    const clientIp = this.getClientIp(request);
    parts.push(clientIp);
    
    // Add user-based limiting if user is authenticated
    if (request.user?.id) {
      parts.push(`user:${request.user.id}`);
    }
    
    // Add tenant-based limiting if tenant is available
    if (request.user?.tenantId) {
      parts.push(`tenant:${request.user.tenantId}`);
    }

    return parts.join(':');
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

  private async checkRateLimit(
    key: string,
    options: RateLimitOptions,
  ): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - (options.ttl * 1000);
    
    try {
      // Tentar obter informações existentes do cache
      const existing = await this.cacheService.get<RateLimitInfo>(key);
      
      if (existing && existing.resetTime > now) {
        // Janela ainda válida, incrementar contador
        const updated: RateLimitInfo = {
          count: existing.count + 1,
          resetTime: existing.resetTime,
        };
        
        await this.cacheService.set(
          key,
          updated,
          Math.ceil((updated.resetTime - now) / 1000),
        );
        
        return updated;
      } else {
        // Nova janela ou janela expirada
        const newInfo: RateLimitInfo = {
          count: 1,
          resetTime: now + (options.ttl * 1000),
        };
        
        await this.cacheService.set(key, newInfo, options.ttl);
        
        return newInfo;
      }
    } catch (error) {
      this.logger.error(`Error checking rate limit for key ${key}:`, error);
      
      // Em caso de erro, permitir a requisição mas logar o problema
      return {
        count: 1,
        resetTime: now + (options.ttl * 1000),
      };
    }
  }

  private addRateLimitHeaders(
    response: any,
    options: RateLimitOptions,
    rateLimitInfo: RateLimitInfo,
  ): void {
    const remaining = Math.max(0, options.limit - rateLimitInfo.count);
    const resetTime = Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000);

    response.setHeader('X-RateLimit-Limit', options.limit.toString());
    response.setHeader('X-RateLimit-Remaining', remaining.toString());
    response.setHeader('X-RateLimit-Reset', resetTime.toString());
    response.setHeader('X-RateLimit-Reset-Time', new Date(rateLimitInfo.resetTime).toISOString());
    
    if (rateLimitInfo.count > options.limit) {
      response.setHeader('Retry-After', resetTime.toString());
    }
  }
}