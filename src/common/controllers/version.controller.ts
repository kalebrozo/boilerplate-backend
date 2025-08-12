import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { VersionService, ApiVersionInfo, MigrationGuide } from '../services/version.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('API Versioning')
@Controller('api/versions')
@Public()
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as versões da API' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de todas as versões disponíveis',
    schema: {
      type: 'object',
      properties: {
        versions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              status: { type: 'string', enum: ['active', 'deprecated', 'experimental'] },
              releaseDate: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            deprecated: { type: 'number' },
            experimental: { type: 'number' },
            latest: { type: 'string' },
            default: { type: 'string' },
          },
        },
      },
    },
  })
  getAllVersions() {
    return {
      versions: this.versionService.getAllVersions(),
      stats: this.versionService.getVersionStats(),
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar versões ativas da API' })
  @ApiResponse({ status: 200, description: 'Lista de versões ativas' })
  getActiveVersions() {
    return {
      versions: this.versionService.getActiveVersions(),
      count: this.versionService.getActiveVersions().length,
    };
  }

  @Get('deprecated')
  @ApiOperation({ summary: 'Listar versões depreciadas da API' })
  @ApiResponse({ status: 200, description: 'Lista de versões depreciadas' })
  getDeprecatedVersions() {
    return {
      versions: this.versionService.getDeprecatedVersions(),
      count: this.versionService.getDeprecatedVersions().length,
    };
  }

  @Get('experimental')
  @ApiOperation({ summary: 'Listar versões experimentais da API' })
  @ApiResponse({ status: 200, description: 'Lista de versões experimentais' })
  getExperimentalVersions() {
    return {
      versions: this.versionService.getExperimentalVersions(),
      count: this.versionService.getExperimentalVersions().length,
    };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Obter a versão mais recente da API' })
  @ApiResponse({ status: 200, description: 'Versão mais recente' })
  getLatestVersion() {
    const latest = this.versionService.getLatestVersion();
    if (!latest) {
      throw new NotFoundException('No active versions found');
    }
    return latest;
  }

  @Get('default')
  @ApiOperation({ summary: 'Obter a versão padrão da API' })
  @ApiResponse({ status: 200, description: 'Versão padrão' })
  getDefaultVersion() {
    const defaultVersion = this.versionService.getDefaultVersion();
    const versionInfo = this.versionService.getVersionInfo(defaultVersion);
    
    return {
      version: defaultVersion,
      info: versionInfo,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas das versões da API' })
  @ApiResponse({ status: 200, description: 'Estatísticas das versões' })
  getVersionStats() {
    return this.versionService.getVersionStats();
  }

  @Get(':version')
  @ApiOperation({ summary: 'Obter informações de uma versão específica' })
  @ApiParam({ name: 'version', description: 'Número da versão', example: '1' })
  @ApiResponse({ status: 200, description: 'Informações da versão' })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  getVersionInfo(@Param('version') version: string): ApiVersionInfo {
    const versionInfo = this.versionService.getVersionInfo(version);
    if (!versionInfo) {
      throw new NotFoundException(`API version '${version}' not found`);
    }
    return versionInfo;
  }

  @Get(':version/supported')
  @ApiOperation({ summary: 'Verificar se uma versão é suportada' })
  @ApiParam({ name: 'version', description: 'Número da versão', example: '1' })
  @ApiResponse({ status: 200, description: 'Status de suporte da versão' })
  checkVersionSupport(@Param('version') version: string) {
    return {
      version,
      supported: this.versionService.isVersionSupported(version),
      deprecated: this.versionService.isVersionDeprecated(version),
      experimental: this.versionService.isVersionExperimental(version),
    };
  }

  @Get(':version/migration')
  @ApiOperation({ summary: 'Obter guia de migração para uma versão' })
  @ApiParam({ name: 'version', description: 'Número da versão', example: '2' })
  @ApiResponse({ status: 200, description: 'Guia de migração' })
  @ApiResponse({ status: 404, description: 'Versão não encontrada ou sem guia de migração' })
  getMigrationGuide(@Param('version') version: string) {
    const versionInfo = this.versionService.getVersionInfo(version);
    if (!versionInfo) {
      throw new NotFoundException(`API version '${version}' not found`);
    }

    if (!versionInfo.migrationGuide) {
      throw new NotFoundException(`No migration guide available for version '${version}'`);
    }

    return {
      version,
      migrationGuide: versionInfo.migrationGuide,
      breakingChanges: versionInfo.breakingChanges || [],
      features: versionInfo.features,
    };
  }
}