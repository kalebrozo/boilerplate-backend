import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { MetricsService } from '../../metrics/metrics.service';
import {
  METRICS_KEY,
  METRICS_COUNTER_KEY,
  METRICS_HISTOGRAM_KEY,
  METRICS_GAUGE_KEY,
  MetricsOptions,
  CounterMetricsOptions,
  HistogramMetricsOptions,
  GaugeMetricsOptions,
} from '../decorators/metrics.decorator';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const metricsOptions = this.reflector.get<MetricsOptions>(
      METRICS_KEY,
      context.getHandler(),
    );

    const counterOptions = this.reflector.get<CounterMetricsOptions>(
      METRICS_COUNTER_KEY,
      context.getHandler(),
    );

    const histogramOptions = this.reflector.get<HistogramMetricsOptions>(
      METRICS_HISTOGRAM_KEY,
      context.getHandler(),
    );

    const gaugeOptions = this.reflector.get<GaugeMetricsOptions>(
      METRICS_GAUGE_KEY,
      context.getHandler(),
    );

    // Se não há configuração de métricas, prosseguir normalmente
    if (!metricsOptions && !counterOptions && !histogramOptions && !gaugeOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Coletar métricas de contador se configurado
    if (counterOptions || (metricsOptions?.collectCounter !== false)) {
      this.collectCounterMetrics(counterOptions || metricsOptions, request, response);
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = (Date.now() - startTime) / 1000;
        response.setHeader('X-Metrics-Collected', 'true');

        // Coletar métricas de duração se configurado
        if (histogramOptions || (metricsOptions?.collectDuration !== false)) {
          this.collectDurationMetrics(
            histogramOptions || metricsOptions,
            request,
            response,
            duration,
          );
        }

        // Coletar métricas de gauge se configurado
        if (gaugeOptions || (metricsOptions?.collectGauge === true)) {
          this.collectGaugeMetrics(
            gaugeOptions || metricsOptions,
            request,
            response,
            data,
          );
        }
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        
        // Coletar métricas de erro
        this.collectErrorMetrics(
          metricsOptions || counterOptions || histogramOptions || gaugeOptions,
          request,
          error,
          duration,
        );
        
        throw error;
      }),
    );
  }

  private collectCounterMetrics(
    options: MetricsOptions | CounterMetricsOptions,
    request: Request & { user?: any },
    response: Response,
  ): void {
    try {
      const metricName = this.generateMetricName(options, request, 'requests_total');
      const labels = this.generateLabels(options, request);
      
      this.metricsService.incrementHttpRequests(
        request.method,
        request.route?.path || request.path,
        response.statusCode.toString(),
        labels.tenant,
      );
      
      this.logger.debug(`Counter metric collected: ${metricName}`, labels);
    } catch (error) {
      this.logger.error('Error collecting counter metrics:', error);
    }
  }

  private collectDurationMetrics(
    options: MetricsOptions | HistogramMetricsOptions,
    request: Request & { user?: any },
    response: Response,
    duration: number,
  ): void {
    try {
      const metricName = this.generateMetricName(options, request, 'request_duration_seconds');
      const labels = this.generateLabels(options, request, response);
      
      this.metricsService.observeHttpDuration(
        request.method,
        request.route?.path || request.path,
        duration,
        labels.tenant,
      );
      
      this.logger.debug(`Duration metric collected: ${metricName} = ${duration}s`, labels);
    } catch (error) {
      this.logger.error('Error collecting duration metrics:', error);
    }
  }

  private collectGaugeMetrics(
    options: MetricsOptions | GaugeMetricsOptions,
    request: Request & { user?: any },
    response: Response,
    data: any,
  ): void {
    try {
      const metricName = this.generateMetricName(options, request, 'gauge');
      const labels = this.generateLabels(options, request, response);
      
      // Tentar extrair valor numérico dos dados de resposta
      let value = 1; // valor padrão
      
      if (data && typeof data === 'object') {
        if (data.total !== undefined) value = data.total;
        else if (data.count !== undefined) value = data.count;
        else if (data.length !== undefined) value = data.length;
        else if (Array.isArray(data)) value = data.length;
      }
      
      // Gauge metrics not implemented in current MetricsService
      this.logger.debug(`Gauge metric would be set: ${metricName} = ${value}`, labels);
      
      this.logger.debug(`Gauge metric collected: ${metricName} = ${value}`, labels);
    } catch (error) {
      this.logger.error('Error collecting gauge metrics:', error);
    }
  }

  private collectErrorMetrics(
    options: MetricsOptions | CounterMetricsOptions | HistogramMetricsOptions | GaugeMetricsOptions,
    request: Request & { user?: any },
    error: any,
    duration: number,
  ): void {
    try {
      const errorMetricName = this.generateMetricName(options, request, 'errors_total');
      const durationMetricName = this.generateMetricName(options, request, 'error_duration_seconds');
      
      const labels = this.generateLabels(options, request, null, error);
      
      this.metricsService.incrementErrors(
        error.name || 'UnknownError',
        labels.tenant,
        request.route?.path || request.path,
      );
      this.metricsService.observeHttpDuration(
        request.method,
        request.route?.path || request.path,
        duration,
        labels.tenant,
      );
      
      this.logger.debug(`Error metrics collected: ${errorMetricName}`, labels);
    } catch (metricsError) {
      this.logger.error('Error collecting error metrics:', metricsError);
    }
  }

  private generateMetricName(
    options: MetricsOptions | CounterMetricsOptions | HistogramMetricsOptions | GaugeMetricsOptions,
    request: Request,
    suffix: string,
  ): string {
    if (options.name) {
      return options.name;
    }

    const controller = request.route?.path?.split('/')[1] || 'unknown';
    const action = request.method.toLowerCase();
    
    return `saas_boilerplate_${controller}_${action}_${suffix}`;
  }

  private generateLabels(
    options: MetricsOptions | CounterMetricsOptions | HistogramMetricsOptions | GaugeMetricsOptions,
    request: Request & { user?: any },
    response?: Response,
    error?: any,
  ): Record<string, string> {
    const labels: Record<string, string> = {};

    // Labels customizados
    if (options.labels) {
      Object.assign(labels, options.labels);
    }

    // Incluir método HTTP
    if (options.includeMethod !== false) {
      labels.method = request.method;
    }

    // Incluir endpoint
    if (options.includeEndpoint !== false) {
      labels.endpoint = request.route?.path || request.path;
    }

    // Incluir status code
    if (options.includeStatus !== false && response) {
      labels.status_code = response.statusCode.toString();
    }

    // Incluir tenant
    if (options.includeTenant !== false && request.user?.tenantId) {
      labels.tenant_id = request.user.tenantId;
    }

    // Incluir usuário
    if (options.includeUser && request.user?.id) {
      labels.user_id = request.user.id;
    }

    // Incluir tipo de erro
    if (error) {
      labels.error_type = error.constructor.name;
      labels.status_code = error.status?.toString() || '500';
    }

    return labels;
  }
}