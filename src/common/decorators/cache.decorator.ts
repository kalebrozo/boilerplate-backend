import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const CACHE_KEY = 'cache';
export const CACHE_TTL_KEY = 'cacheTtl';
export const CACHE_INVALIDATE_KEY = 'cacheInvalidate';

export interface CacheOptions {
  /** Tempo de vida do cache em segundos (default: 300 = 5 minutos) */
  ttl?: number;
  /** Chave customizada do cache (default: auto-gerada) */
  key?: string;
  /** Incluir tenant na chave do cache (default: true) */
  includeTenant?: boolean;
  /** Incluir usuário na chave do cache (default: false) */
  includeUser?: boolean;
  /** Incluir parâmetros da query na chave (default: true) */
  includeQuery?: boolean;
  /** Incluir parâmetros da rota na chave (default: true) */
  includeParams?: boolean;
  /** Invalidar cache após operações de escrita (default: false) */
  invalidateOnWrite?: boolean;
  /** Padrões de chaves para invalidar */
  invalidatePatterns?: string[];
}

export interface CacheInvalidateOptions {
  /** Padrões de chaves para invalidar */
  patterns?: string[];
  /** Invalidar cache do tenant atual (default: true) */
  tenant?: boolean;
  /** Invalidar cache do usuário atual (default: false) */
  user?: boolean;
  /** Chaves específicas para invalidar */
  keys?: string[];
}

/**
 * Decorator para aplicar cache automático em endpoints
 * @param options Configurações de cache
 */
export function Cache(options: CacheOptions = {}) {
  const defaultOptions: CacheOptions = {
    ttl: 300, // 5 minutos
    includeTenant: true,
    includeUser: false,
    includeQuery: true,
    includeParams: true,
    invalidateOnWrite: false,
    ...options,
  };

  return applyDecorators(
    SetMetadata(CACHE_KEY, defaultOptions),
    SetMetadata(CACHE_TTL_KEY, defaultOptions.ttl),
    ApiResponse({
      status: 200,
      description: 'Response may be cached',
      headers: {
        'Cache-Control': {
          description: 'Cache control header',
          schema: { type: 'string', example: `max-age=${defaultOptions.ttl}` },
        },
        'X-Cache-Status': {
          description: 'Cache hit/miss status',
          schema: { type: 'string', enum: ['HIT', 'MISS'] },
        },
      },
    })
  );
}

/**
 * Decorator para invalidar cache após operações
 * @param options Configurações de invalidação
 */
export function CacheInvalidate(options: CacheInvalidateOptions = {}) {
  const defaultOptions: CacheInvalidateOptions = {
    tenant: true,
    user: false,
    ...options,
  };

  return SetMetadata(CACHE_INVALIDATE_KEY, defaultOptions);
}

/**
 * Cache de curta duração (1 minuto)
 */
export const CacheShort = (options?: Partial<CacheOptions>) => Cache({ ttl: 60, ...options });

/**
 * Cache de média duração (5 minutos)
 */
export const CacheMedium = (options?: Partial<CacheOptions>) => Cache({ ttl: 300, ...options });

/**
 * Cache de longa duração (1 hora)
 */
export const CacheLong = (options?: Partial<CacheOptions>) => Cache({ ttl: 3600, ...options });

/**
 * Cache por usuário (inclui ID do usuário na chave)
 */
export const CachePerUser = (options?: Partial<CacheOptions>) => 
  Cache({ includeUser: true, ttl: 300, ...options });

/**
 * Cache por tenant (padrão, mas explícito)
 */
export const CachePerTenant = (options?: Partial<CacheOptions>) => 
  Cache({ includeTenant: true, ttl: 300, ...options });

/**
 * Cache global (sem tenant ou usuário)
 */
export const CacheGlobal = (options?: Partial<CacheOptions>) => 
  Cache({ includeTenant: false, includeUser: false, ttl: 600, ...options });

/**
 * Invalidar cache do tenant após operação
 */
export const InvalidateTenantCache = (options: CacheInvalidateOptions) =>
  CacheInvalidate({ ...options, tenant: true });

/**
 * Invalidar cache do usuário após operação
 */
export const InvalidateUserCache = (options: CacheInvalidateOptions) =>
  CacheInvalidate({ ...options, user: true });

/**
 * Invalidar cache específico por padrões
 */
export const InvalidateCache = (options: CacheInvalidateOptions) =>
  CacheInvalidate(options);