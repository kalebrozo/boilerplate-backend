import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const METRICS_KEY = 'metrics';
export const METRICS_COUNTER_KEY = 'metricsCounter';
export const METRICS_HISTOGRAM_KEY = 'metricsHistogram';
export const METRICS_GAUGE_KEY = 'metricsGauge';

export interface MetricsOptions {
  /** Nome da métrica (default: auto-gerado) */
  name?: string;
  /** Descrição da métrica */
  description?: string;
  /** Labels adicionais para a métrica */
  labels?: Record<string, string>;
  /** Incluir tenant como label (default: true) */
  includeTenant?: boolean;
  /** Incluir usuário como label (default: false) */
  includeUser?: boolean;
  /** Incluir método HTTP como label (default: true) */
  includeMethod?: boolean;
  /** Incluir status code como label (default: true) */
  includeStatus?: boolean;
  /** Incluir endpoint como label (default: true) */
  includeEndpoint?: boolean;
  /** Coletar tempo de resposta (default: true) */
  collectDuration?: boolean;
  /** Coletar contador de requisições (default: true) */
  collectCounter?: boolean;
  /** Coletar gauge personalizado */
  collectGauge?: boolean;
}

export interface CounterMetricsOptions extends Omit<MetricsOptions, 'collectDuration' | 'collectGauge'> {
  /** Incremento do contador (default: 1) */
  increment?: number;
}

export interface HistogramMetricsOptions extends Omit<MetricsOptions, 'collectCounter' | 'collectGauge'> {
  /** Buckets para o histograma */
  buckets?: number[];
}

export interface GaugeMetricsOptions extends Omit<MetricsOptions, 'collectCounter' | 'collectDuration'> {
  /** Valor inicial do gauge */
  initialValue?: number;
}

/**
 * Decorator para coleta automática de métricas
 * @param nameOrOptions Nome da métrica ou configurações completas
 * @param options Configurações adicionais (quando primeiro parâmetro é string)
 */
export function Metrics(nameOrOptions?: string | MetricsOptions, options?: Partial<MetricsOptions>) {
  let finalOptions: MetricsOptions;
  
  if (typeof nameOrOptions === 'string') {
    finalOptions = {
      name: nameOrOptions,
      includeTenant: true,
      includeUser: false,
      includeMethod: true,
      includeStatus: true,
      includeEndpoint: true,
      collectDuration: true,
      collectCounter: true,
      collectGauge: false,
      ...options,
    };
  } else {
    finalOptions = {
      includeTenant: true,
      includeUser: false,
      includeMethod: true,
      includeStatus: true,
      includeEndpoint: true,
      collectDuration: true,
      collectCounter: true,
      collectGauge: false,
      ...nameOrOptions,
    };
  }

  return applyDecorators(
    SetMetadata(METRICS_KEY, finalOptions),
    ApiResponse({
      status: 200,
      description: 'Endpoint with automatic metrics collection',
      headers: {
        'X-Metrics-Collected': {
          description: 'Indicates metrics were collected for this request',
          schema: { type: 'string', example: 'true' },
        },
      },
    })
  );
}

/**
 * Decorator para métricas de contador
 * @param options Configurações do contador
 */
export function MetricsCounter(options: CounterMetricsOptions = {}) {
  const counterOptions: MetricsOptions = {
    ...options,
    collectCounter: true,
    collectDuration: false,
    collectGauge: false,
  };

  return applyDecorators(
    SetMetadata(METRICS_COUNTER_KEY, options),
    Metrics(counterOptions)
  );
}

/**
 * Decorator para métricas de histograma (tempo de resposta)
 * @param options Configurações do histograma
 */
export function MetricsHistogram(options: HistogramMetricsOptions = {}) {
  const histogramOptions: MetricsOptions = {
    ...options,
    collectCounter: false,
    collectDuration: true,
    collectGauge: false,
  };

  return applyDecorators(
    SetMetadata(METRICS_HISTOGRAM_KEY, options),
    Metrics(histogramOptions)
  );
}

/**
 * Decorator para métricas de gauge
 * @param options Configurações do gauge
 */
export function MetricsGauge(options: GaugeMetricsOptions = {}) {
  const gaugeOptions: MetricsOptions = {
    ...options,
    collectCounter: false,
    collectDuration: false,
    collectGauge: true,
  };

  return applyDecorators(
    SetMetadata(METRICS_GAUGE_KEY, options),
    Metrics(gaugeOptions)
  );
}

/**
 * Métricas básicas (contador + duração)
 */
export const MetricsBasic = (name?: string, options?: Partial<MetricsOptions>) => 
  Metrics({ name, collectCounter: true, collectDuration: true, ...options });

/**
 * Métricas detalhadas (inclui usuário)
 */
export const MetricsDetailed = (name?: string, options?: Partial<MetricsOptions>) => 
  Metrics({ name, includeUser: true, ...options });

/**
 * Métricas de performance (foco em duração)
 */
export const MetricsPerformance = (name?: string, options?: Partial<HistogramMetricsOptions>) => 
  MetricsHistogram({ name, buckets: [0.1, 0.5, 1, 2, 5, 10], ...options });

/**
 * Métricas de uso (foco em contadores)
 */
export const MetricsUsage = (name?: string, options?: Partial<CounterMetricsOptions>) => 
  MetricsCounter({ name, ...options });

/**
 * Métricas por tenant
 */
export const MetricsPerTenant = (name?: string, options?: Partial<MetricsOptions>) => 
  Metrics({ name, includeTenant: true, includeUser: false, ...options });

/**
 * Métricas por usuário
 */
export const MetricsPerUser = (name?: string, options?: Partial<MetricsOptions>) => 
  Metrics({ name, includeTenant: true, includeUser: true, ...options });

/**
 * Métricas globais (sem tenant/usuário)
 */
export const MetricsGlobal = (name?: string, options?: Partial<MetricsOptions>) => 
  Metrics({ name, includeTenant: false, includeUser: false, ...options });