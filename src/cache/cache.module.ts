import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheService } from './cache.service';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        auth_pass: configService.get('REDIS_PASSWORD'),
        ttl: 600, // 10 minutos por padrão
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisCacheModule {}

// Re-export CacheModule for convenience
export { CacheModule };