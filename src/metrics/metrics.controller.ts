import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { MetricsService } from './metrics.service';
import { Public } from '../auth/decorators/public.decorator';
import { ReadMetricsPolicyHandler } from './metrics.policies';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obter métricas em formato Prometheus' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas em formato Prometheus',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP saas_boilerplate_http_requests_total Total number of HTTP requests\n# TYPE saas_boilerplate_http_requests_total counter\nsaas_boilerplate_http_requests_total{method="GET",route="/users",status_code="200",tenant_id="tenant1"} 42'
        }
      }
    }
  })
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new ReadMetricsPolicyHandler())
  @ApiOperation({ summary: 'Obter estatísticas resumidas das métricas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas resumidas das métricas',
    schema: {
      type: 'object',
      properties: {
        totalMetrics: { type: 'number', example: 8 },
        httpRequests: { type: 'number', example: 1250 },
        averageResponseTime: { type: 'number', example: 0.245 },
        activeConnections: { type: 'number', example: 15 },
        databaseConnections: { type: 'number', example: 10 },
        cacheHitRate: { type: 'number', example: 85.5 },
        totalErrors: { type: 'number', example: 12 },
        authAttempts: { type: 'number', example: 450 }
      }
    }
  })
  async getStats() {
    return this.metricsService.getStats();
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check das métricas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status das métricas',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-12-08T15:30:00.000Z' },
        metricsEnabled: { type: 'boolean', example: true }
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      metricsEnabled: true,
    };
  }
}