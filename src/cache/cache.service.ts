import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Buscar dados do cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const data = await this.cacheManager.get<T>(key);
      if (data) {
        this.logger.debug(`Cache HIT para chave: ${key}`);
      } else {
        this.logger.debug(`Cache MISS para chave: ${key}`);
      }
      return data;
    } catch (error) {
      this.logger.error(`Erro ao buscar cache para chave ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Armazenar dados no cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET para chave: ${key}`);
    } catch (error) {
      this.logger.error(`Erro ao definir cache para chave ${key}:`, error);
    }
  }

  /**
   * Remover uma chave específica do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL para chave: ${key}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar cache para chave ${key}:`, error);
    }
  }

  /**
   * Limpar todo o cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache completamente limpo');
    } catch (error) {
      this.logger.error('Erro ao limpar cache:', error);
    }
  }

  /**
   * Invalidar cache por padrão (usando wildcards)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Para Redis, precisamos usar o store diretamente para buscar chaves por padrão
      const store = this.cacheManager.store as any;
      if (store && store.getClient) {
        const client = store.getClient();
        const keys = await client.keys(pattern);
        if (keys && keys.length > 0) {
          await Promise.all(keys.map((key: string) => this.del(key)));
          this.logger.debug(`Cache invalidado para padrão: ${pattern}, ${keys.length} chaves removidas`);
        }
      } else {
        // Fallback: tentar deletar a chave diretamente se não conseguir listar
        this.logger.warn(`Não foi possível listar chaves para padrão: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache por padrão ${pattern}:`, error);
    }
  }

  /**
   * Invalidar cache relacionado a um tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    await this.invalidatePattern(`*:tenant:${tenantId}:*`);
  }

  /**
   * Invalidar cache relacionado a um usuário
   */
  async invalidateUser(userId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.invalidatePattern(`*:tenant:${tenantId}:user:${userId}:*`);
    } else {
      await this.invalidatePattern(`*:user:${userId}:*`);
    }
  }

  /**
   * Invalidar cache relacionado a uma entidade específica
   */
  async invalidateEntity(entityName: string, entityId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.invalidatePattern(`*:tenant:${tenantId}:${entityName}:${entityId}:*`);
      await this.invalidatePattern(`*:tenant:${tenantId}:${entityName}:list:*`);
    } else {
      await this.invalidatePattern(`*:${entityName}:${entityId}:*`);
      await this.invalidatePattern(`*:${entityName}:list:*`);
    }
  }

  /**
   * Gerar chave de cache padronizada
   */
  generateKey(parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }

  /**
   * Gerar chave para listagem com paginação
   */
  generateListKey(entityName: string, tenantId: string, page: number = 1, limit: number = 10, filters?: any): string {
    const filterHash = filters ? JSON.stringify(filters) : 'no-filters';
    return this.generateKey(['list', 'tenant', tenantId, entityName, `page-${page}`, `limit-${limit}`, filterHash]);
  }

  /**
   * Gerar chave para entidade específica
   */
  generateEntityKey(entityName: string, entityId: string, tenantId?: string): string {
    if (tenantId) {
      return this.generateKey(['entity', 'tenant', tenantId, entityName, entityId]);
    }
    return this.generateKey(['entity', entityName, entityId]);
  }

  /**
   * Gerar chave para dados de usuário
   */
  generateUserKey(userId: string, dataType: string, tenantId?: string): string {
    if (tenantId) {
      return this.generateKey(['user', 'tenant', tenantId, 'user', userId, dataType]);
    }
    return this.generateKey(['user', userId, dataType]);
  }
}