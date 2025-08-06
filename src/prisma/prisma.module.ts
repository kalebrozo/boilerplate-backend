import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantPrismaProvider } from './tenant-prisma.provider';

@Module({
  providers: [PrismaService, TenantPrismaProvider],
  exports: [PrismaService, TenantPrismaProvider],
})
export class PrismaModule {}