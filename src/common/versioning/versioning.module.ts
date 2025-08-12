import { Module } from '@nestjs/common';
import { VersionService } from '../services/version.service';
import { VersionController } from '../controllers/version.controller';
import { VersionInterceptor } from '../interceptors/version.interceptor';
import { VersionMiddleware } from '../middleware/version.middleware';
import { VersionGuard } from '../guards/version.guard';

@Module({
  controllers: [VersionController],
  providers: [
    VersionService,
    VersionInterceptor,
    VersionMiddleware,
    VersionGuard,
  ],
  exports: [
    VersionService,
    VersionInterceptor,
    VersionMiddleware,
    VersionGuard,
  ],
})
export class VersioningModule {}