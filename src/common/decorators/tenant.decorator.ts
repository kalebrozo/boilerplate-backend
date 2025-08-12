import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiSecurity, ApiResponse } from '@nestjs/swagger';

export const TENANT_KEY = 'tenant';
export const TENANT_ISOLATION_KEY = 'tenantIsolation';
export const TENANT_VALIDATION_KEY = 'tenantValidation';

export interface TenantOptions {
  /** Aplicar isolamento automático de tenant (default: true) */
  isolation?: boolean;
  /** Validar se o tenant existe (default: true) */
  validate?: boolean;
  /** Permitir acesso cross-tenant para super admins (default: false) */
  allowCrossTenant?: boolean;
  /** Campo do modelo que contém o tenantId (default: 'tenantId') */
  tenantField?: string;
  /** Aplicar filtro automático nas queries (default: true) */
  autoFilter?: boolean;
  /** Logs de acesso por tenant (default: true) */
  logAccess?: boolean;
  /** Métricas por tenant (default: true) */
  collectMetrics?: boolean;
}

export interface TenantIsolationOptions {
  /** Nível de isolamento */
  level: 'strict' | 'moderate' | 'flexible';
  /** Permitir bypass para roles específicos */
  bypassRoles?: string[];
  /** Campos adicionais para verificação */
  additionalFields?: string[];
}

export interface TenantValidationOptions {
  /** Validar existência do tenant */
  checkExists?: boolean;
  /** Validar se tenant está ativo */
  checkActive?: boolean;
  /** Validar permissões do usuário no tenant */
  checkPermissions?: boolean;
  /** Cache da validação em segundos */
  cacheValidation?: number;
}

/**
 * Decorator para aplicar isolamento automático de tenant
 * @param options Configurações de tenant
 */
export function Tenant(options: TenantOptions = {}) {
  const defaultOptions: TenantOptions = {
    isolation: true,
    validate: true,
    allowCrossTenant: false,
    tenantField: 'tenantId',
    autoFilter: true,
    logAccess: true,
    collectMetrics: true,
    ...options,
  };

  return applyDecorators(
    SetMetadata(TENANT_KEY, defaultOptions),
    ApiSecurity('bearer'),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Tenant access denied',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Access denied for tenant' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Tenant not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Tenant not found' },
          error: { type: 'string', example: 'Not Found' },
        },
      },
    })
  );
}

/**
 * Decorator para isolamento rigoroso de tenant
 * @param options Configurações de isolamento
 */
export function TenantIsolation(options: TenantIsolationOptions) {
  return applyDecorators(
    SetMetadata(TENANT_ISOLATION_KEY, options),
    Tenant({ isolation: true, allowCrossTenant: false })
  );
}

/**
 * Decorator para validação de tenant
 * @param options Configurações de validação
 */
export function TenantValidation(options: TenantValidationOptions = {}) {
  const defaultOptions: TenantValidationOptions = {
    checkExists: true,
    checkActive: true,
    checkPermissions: true,
    cacheValidation: 300, // 5 minutos
    ...options,
  };

  return applyDecorators(
    SetMetadata(TENANT_VALIDATION_KEY, defaultOptions),
    Tenant({ validate: true })
  );
}

/**
 * Isolamento rigoroso - sem cross-tenant
 */
export const TenantStrict = (options?: Partial<TenantIsolationOptions>) => 
  TenantIsolation({ level: 'strict', ...options });

/**
 * Isolamento moderado - permite alguns casos especiais
 */
export const TenantModerate = (options?: Partial<TenantIsolationOptions>) => 
  TenantIsolation({ level: 'moderate', bypassRoles: ['super_admin'], ...options });

/**
 * Isolamento flexível - para casos específicos
 */
export const TenantFlexible = (options?: Partial<TenantIsolationOptions>) => 
  TenantIsolation({ level: 'flexible', bypassRoles: ['super_admin', 'system_admin'], ...options });

/**
 * Tenant com validação completa
 */
export const TenantValidated = (options?: Partial<TenantValidationOptions>) => 
  TenantValidation({ checkExists: true, checkActive: true, checkPermissions: true, ...options });

/**
 * Tenant com validação básica
 */
export const TenantBasic = (options?: Partial<TenantValidationOptions>) => 
  TenantValidation({ checkExists: true, checkActive: false, checkPermissions: false, ...options });

/**
 * Tenant sem isolamento (para endpoints globais)
 */
export const TenantGlobal = (options?: Partial<TenantOptions>) => 
  Tenant({ isolation: false, validate: false, autoFilter: false, ...options });

/**
 * Tenant com métricas detalhadas
 */
export const TenantWithMetrics = (options?: Partial<TenantOptions>) => 
  Tenant({ collectMetrics: true, logAccess: true, ...options });

/**
 * Tenant silencioso (sem logs nem métricas)
 */
export const TenantSilent = (options?: Partial<TenantOptions>) => 
  Tenant({ logAccess: false, collectMetrics: false, ...options });

/**
 * Tenant para super admins (permite cross-tenant)
 */
export const TenantSuperAdmin = (options?: Partial<TenantOptions>) => 
  Tenant({ allowCrossTenant: true, isolation: false, ...options });

/**
 * Tenant para operações de sistema
 */
export const TenantSystem = (options?: Partial<TenantOptions>) => 
  Tenant({ 
    allowCrossTenant: true, 
    isolation: false, 
    validate: false,
    autoFilter: false,
    ...options
  });