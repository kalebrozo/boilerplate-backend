import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}