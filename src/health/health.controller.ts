import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
    private diskHealth: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificação geral de saúde da aplicação' })
  @ApiResponse({ status: 200, description: 'Status de saúde da aplicação' })
  @HealthCheck()
  check() {
    return this.health.check([
      // Verificação do banco de dados
      () => this.prismaHealth.pingCheck('database', this.prisma),
      
      // Verificação de memória (heap não deve exceder 1GB)
      () => this.memoryHealth.checkHeap('memory_heap', 1024 * 1024 * 1024),
      
      // Verificação de memória RSS (não deve exceder 1GB)
      () => this.memoryHealth.checkRSS('memory_rss', 1024 * 1024 * 1024),
      
      // Verificação de espaço em disco (deve ter pelo menos 250MB livres)
      () => this.diskHealth.checkStorage('storage', {
        path: 'C:\\',
        thresholdPercent: 0.9, // 90% de uso máximo
      }),
    ]);
  }

  @Get('database')
  @ApiOperation({ summary: 'Verificação específica do banco de dados' })
  @ApiResponse({ status: 200, description: 'Status do banco de dados' })
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  @Get('memory')
  @ApiOperation({ summary: 'Verificação específica de memória' })
  @ApiResponse({ status: 200, description: 'Status da memória' })
  @HealthCheck()
  checkMemory() {
    return this.health.check([
      () => this.memoryHealth.checkHeap('memory_heap', 1024 * 1024 * 1024),
      () => this.memoryHealth.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }

  @Get('disk')
  @ApiOperation({ summary: 'Verificação específica de armazenamento' })
  @ApiResponse({ status: 200, description: 'Status do armazenamento' })
  @HealthCheck()
  checkDisk() {
    return this.health.check([
      () => this.diskHealth.checkStorage('storage', {
        path: 'C:\\',
        thresholdPercent: 0.9,
      }),
    ]);
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Verificação de liveness (aplicação está viva)' })
  @ApiResponse({ status: 200, description: 'Aplicação está funcionando' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Verificação de readiness (aplicação está pronta)' })
  @ApiResponse({ status: 200, description: 'Aplicação está pronta para receber tráfego' })
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}