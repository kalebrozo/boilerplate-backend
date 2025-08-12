import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import {
  CreateBackupPolicyHandler,
  ReadBackupPolicyHandler,
} from './backup.policies';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Backup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('manual')
  @ApiOperation({ summary: 'Executar backup manual do banco de dados' })
  @ApiResponse({ 
    status: 201, 
    description: 'Backup manual executado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        backupPath: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @CheckPolicies(new CreateBackupPolicyHandler())
  @Throttle({ default: { limit: 1, ttl: 300000 } }) // 1 backup manual a cada 5 minutos
  async createManualBackup() {
    try {
      const backupPath = await this.backupService.performManualBackup();
      
      return {
        message: 'Backup manual executado com sucesso',
        backupPath,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Obter status dos backups' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status dos backups obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        lastBackup: { type: 'string', nullable: true },
        backupCount: { type: 'number' },
        backupDirectory: { type: 'string' },
        nextScheduledBackup: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @CheckPolicies(new ReadBackupPolicyHandler())
  async getBackupStatus() {
    const status = await this.backupService.getBackupStatus();
    
    // Calcular próximo backup agendado (2:00 AM do próximo dia)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    
    return {
      ...status,
      nextScheduledBackup: tomorrow.toISOString(),
    };
  }
}