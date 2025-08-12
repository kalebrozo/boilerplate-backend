import { Injectable } from '@nestjs/common';

export interface MigrationGuide {
  steps: string[];
  estimatedTime: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface ApiVersionInfo {
  version: string;
  status: 'active' | 'deprecated' | 'experimental';
  releaseDate: string;
  deprecatedSince?: string;
  endOfLifeDate?: string;
  features: string[];
  breakingChanges?: string[];
  migrationGuide?: MigrationGuide;
}

@Injectable()
export class VersionService {
  private readonly versions: Map<string, ApiVersionInfo> = new Map();

  constructor() {
    this.initializeVersions();
  }

  private initializeVersions() {
    // Versão 1.0 - Versão inicial
    this.versions.set('1', {
      version: '1.0',
      status: 'active',
      releaseDate: '2024-01-01',
      features: [
        'Autenticação JWT',
        'Autorização CASL',
        'CRUD básico de usuários',
        'Sistema multi-tenant',
        'Auditoria básica',
      ],
    });

    // Versão 3.0 - Versão experimental
    this.versions.set('3', {
      version: '3.0',
      status: 'experimental',
      releaseDate: '2024-03-01',
      features: [
        'Todas as funcionalidades da v2',
        'Integração com IA',
        'Analytics em tempo real',
        'Notificações push',
        'API GraphQL',
      ],
      breakingChanges: [
        'Nova estrutura de dados para analytics',
        'Mudanças na autenticação para suporte a GraphQL',
      ],
    });

    // Versão 2.0 - Versão melhorada
    this.versions.set('2', {
      version: '2.0',
      status: 'active',
      releaseDate: '2024-02-01',
      features: [
        'Todas as funcionalidades da v1',
        'Metadados expandidos nas respostas',
        'Auditoria detalhada',
        'Operações em lote',
        'Perfil do usuário atual',
        'Estatísticas avançadas',
        'Histórico de mudanças',
      ],
      breakingChanges: [
        'Formato de resposta alterado para incluir metadados',
        'Novos campos obrigatórios em algumas operações',
      ],
      migrationGuide: {
        steps: [
          'Update your API calls to use new endpoints',
          'Handle new response format with metadata',
          'Update error handling for new error codes'
        ],
        estimatedTime: '2-4 hours',
        complexity: 'medium'
      },
    });
  }

  /**
   * Obter informações sobre uma versão específica
   */
  getVersionInfo(version: string): ApiVersionInfo | undefined {
    return this.versions.get(version);
  }

  /**
   * Obter todas as versões disponíveis
   */
  getAllVersions(): ApiVersionInfo[] {
    return Array.from(this.versions.values());
  }

  /**
   * Obter versões ativas
   */
  getActiveVersions(): ApiVersionInfo[] {
    return this.getAllVersions().filter(v => v.status === 'active');
  }

  /**
   * Obter versões depreciadas
   */
  getDeprecatedVersions(): ApiVersionInfo[] {
    return this.getAllVersions().filter(v => v.status === 'deprecated');
  }

  /**
   * Obter versões experimentais
   */
  getExperimentalVersions(): ApiVersionInfo[] {
    return this.getAllVersions().filter(v => v.status === 'experimental');
  }

  /**
   * Verificar se uma versão é suportada
   */
  isVersionSupported(version: string): boolean {
    return this.versions.has(version);
  }

  /**
   * Verificar se uma versão está depreciada
   */
  isVersionDeprecated(version: string): boolean {
    const versionInfo = this.getVersionInfo(version);
    return versionInfo?.status === 'deprecated';
  }

  /**
   * Verificar se uma versão é experimental
   */
  isVersionExperimental(version: string): boolean {
    const versionInfo = this.getVersionInfo(version);
    return versionInfo?.status === 'experimental';
  }

  /**
   * Obter a versão mais recente
   */
  getLatestVersion(): ApiVersionInfo | undefined {
    const activeVersions = this.getActiveVersions();
    return activeVersions.sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    )[0];
  }

  /**
   * Obter versão padrão
   */
  getDefaultVersion(): string {
    return '1';
  }

  /**
   * Adicionar uma nova versão (para uso futuro)
   */
  addVersion(info: ApiVersionInfo): void {
    this.versions.set(info.version, info);
  }

  /**
   * Marcar uma versão como depreciada
   */
  deprecateVersion(version: string, deprecatedSince: string, endOfLifeDate?: string): boolean {
    const versionInfo = this.versions.get(version);
    if (!versionInfo) {
      return false;
    }

    versionInfo.status = 'deprecated';
    versionInfo.deprecatedSince = deprecatedSince;
    if (endOfLifeDate) {
      versionInfo.endOfLifeDate = endOfLifeDate;
    }

    this.versions.set(version, versionInfo);
    return true;
  }

  /**
   * Obter estatísticas das versões
   */
  getVersionStats() {
    const allVersions = this.getAllVersions();
    return {
      total: allVersions.length,
      active: allVersions.filter(v => v.status === 'active').length,
      deprecated: allVersions.filter(v => v.status === 'deprecated').length,
      experimental: allVersions.filter(v => v.status === 'experimental').length,
      latest: this.getLatestVersion()?.version,
      default: this.getDefaultVersion(),
    };
  }
}