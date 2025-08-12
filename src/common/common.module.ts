import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { RedisCacheModule } from '../cache/cache.module';
import { MetricsModule } from '../metrics/metrics.module';

@Global()
@Module({
  imports: [
    RedisCacheModule,
    MetricsModule,
  ],
  providers: [
    // Interceptors como providers individuais
    CacheInterceptor,
    MetricsInterceptor,
    RateLimitInterceptor,
    TenantInterceptor,
    // Interceptors globais (aplicados automaticamente quando decorators são usados)
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [
    CacheInterceptor,
    MetricsInterceptor,
    RateLimitInterceptor,
    TenantInterceptor,
  ],
})
export class CommonModule {}