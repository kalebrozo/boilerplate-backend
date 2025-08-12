import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { CaslModule } from '../casl/casl.module';
import { ReadMetricsPolicyHandler } from './metrics.policies';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/prometheus',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'saas_boilerplate_',
        },
      },
    }),
    CaslModule,
  ],
  controllers: [MetricsController],
  providers: [MetricsService, ReadMetricsPolicyHandler],
  exports: [MetricsService],
})
export class MetricsModule {}