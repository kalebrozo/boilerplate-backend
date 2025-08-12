import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import {
  CreateBackupPolicyHandler,
  ReadBackupPolicyHandler,
} from './backup.policies';
import { CaslModule } from '../casl/casl.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CaslModule,
    LoggerModule,
  ],
  controllers: [BackupController],
  providers: [
    BackupService,
    CreateBackupPolicyHandler,
    ReadBackupPolicyHandler,
  ],
  exports: [BackupService],
})
export class BackupModule {}