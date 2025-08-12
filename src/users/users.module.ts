import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersV1Controller } from './v1/users-v1.controller';
import { UsersV2Controller } from './v2/users-v2.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RedisCacheModule } from '../cache/cache.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, AuditModule, RedisCacheModule, CaslModule],
  controllers: [UsersController, UsersV1Controller, UsersV2Controller],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}