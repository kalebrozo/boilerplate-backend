import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { MonitoringService } from './monitoring.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  ReadMonitoringPolicyHandler,
  ManageMonitoringPolicyHandler,
} from './monitoring.policies';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Obter métricas de performance da aplicação' })
  @ApiResponse({ status: 200, description: 'Métricas de performance retornadas com sucesso.' })
  @Public()
  async getMetrics() {
    return this.monitoringService.getApplicationMetrics();
  }

  @Get('health-detailed')
  @ApiOperation({ summary: 'Verificação detalhada de saúde do sistema' })
  @ApiResponse({ status: 200, description: 'Status detalhado do sistema.' })
  @Public()
  async getDetailedHealth() {
    return this.monitoringService.getDetailedHealthCheck();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Métricas de performance em tempo real' })
  @ApiResponse({ status: 200, description: 'Métricas de performance retornadas.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new ReadMonitoringPolicyHandler())
  async getPerformanceMetrics(@Request() req) {
    return this.monitoringService.getPerformanceMetrics(req.user.tenantId);
  }

  @Get('database-stats')
  @ApiOperation({ summary: 'Estatísticas do banco de dados' })
  @ApiResponse({ status: 200, description: 'Estatísticas do banco retornadas.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new ReadMonitoringPolicyHandler())
  async getDatabaseStats(@Request() req) {
    return this.monitoringService.getDatabaseStats(req.user.tenantId);
  }

  @Get('system-resources')
  @ApiOperation({ summary: 'Recursos do sistema (CPU, Memória, Disco)' })
  @ApiResponse({ status: 200, description: 'Recursos do sistema retornados.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new ReadMonitoringPolicyHandler())
  async getSystemResources() {
    return this.monitoringService.getSystemResources();
  }

  @Get('api-performance')
  @ApiOperation({ summary: 'Obter métricas de performance de APIs' })
  @ApiResponse({ status: 200, description: 'Métricas de performance das APIs.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new ReadMonitoringPolicyHandler())
  getApiPerformance(@Request() req) {
    return this.monitoringService.getApiPerformance(req.user.tenantId);
  }

  @Get('tenant-usage')
  @ApiOperation({ summary: 'Uso de recursos por tenant' })
  @ApiResponse({ status: 200, description: 'Estatísticas de uso por tenant.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new ReadMonitoringPolicyHandler())
  async getTenantUsage(@Request() req) {
    return this.monitoringService.getTenantUsageStats(req.user.tenantId);
  }
}