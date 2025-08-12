import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
// ApiTooManyRequests not available in current Swagger version

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  /** Número máximo de requisições */
  limit: number;
  /** Janela de tempo em segundos */
  ttl: number;
  /** Aplicar rate limit por usuário (default: false) */
  perUser?: boolean;
  /** Aplicar rate limit por tenant (default: false) */
  perTenant?: boolean;
  /** Mensagem customizada de erro */
  message?: string;
}

export const RateLimit = (limit: number, ttl?: number, options?: Partial<RateLimitOptions>) => {
  const finalOptions: RateLimitOptions = {
    limit,
    ttl: ttl || 60,
    ...options,
  };
  return SetMetadata(RATE_LIMIT_KEY, finalOptions);
};

/**
 * Decorators pré-definidos para diferentes níveis de rate limiting
 */
export const RateLimitLow = () => RateLimit(10, 60);
export const RateLimitMedium = () => RateLimit(50, 60);
export const RateLimitHigh = () => RateLimit(100, 60);

/**
 * Rate limiting por usuário
 */
export const RateLimitPerUser = (limit: number = 100, ttl: number = 60) =>
  RateLimit(limit, ttl, {});

/**
 * Rate limiting por tenant
 */
export const RateLimitPerTenant = (limit: number = 1000, ttl: number = 60) =>
  RateLimit(limit, ttl, {});