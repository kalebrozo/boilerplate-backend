import { Module } from '@nestjs/common';
import { TesteGeralService } from './teste-geral.service';
import { TesteGeralController } from './teste-geral.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [TesteGeralController],
  providers: [TesteGeralService],
  exports: [TesteGeralService],
})
export class TesteGeralModule {}