import { Module } from '@nestjs/common';
import { ExportService } from '../common/services/export.service';
import { ExportController } from '../common/controllers/export.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}