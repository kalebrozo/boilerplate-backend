import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private configService: ConfigService) {
    // Criar diretório de backup se não existir
    this.backupDir = join(process.cwd(), 'backups');
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Diretório de backup criado: ${this.backupDir}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async performDailyBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup-${timestamp}.sql`;
      const backupPath = join(this.backupDir, backupFile);
      
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      this.logger.log(`Iniciando backup diário: ${backupFile}`);
      
      // Executar pg_dump para criar backup
      const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
      await execAsync(command);
      
      this.logger.log(`Backup criado com sucesso: ${backupFile}`);
      
      // Limpar backups antigos (manter apenas os últimos 7 dias)
      await this.cleanOldBackups();
      
    } catch (error) {
      this.logger.error('Erro ao criar backup:', error.message);
      throw error;
    }
  }

  async performManualBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `manual-backup-${timestamp}.sql`;
      const backupPath = join(this.backupDir, backupFile);
      
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      this.logger.log(`Iniciando backup manual: ${backupFile}`);
      
      // Executar pg_dump para criar backup
      const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
      await execAsync(command);
      
      this.logger.log(`Backup manual criado com sucesso: ${backupFile}`);
      
      return backupPath;
      
    } catch (error) {
      this.logger.error('Erro ao criar backup manual:', error.message);
      throw error;
    }
  }

  private async cleanOldBackups() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Comando para remover arquivos de backup mais antigos que 7 dias
      const command = process.platform === 'win32' 
        ? `forfiles /p "${this.backupDir}" /s /m *.sql /d -7 /c "cmd /c del @path"` 
        : `find "${this.backupDir}" -name "*.sql" -type f -mtime +7 -delete`;
      
      await execAsync(command);
      this.logger.log('Limpeza de backups antigos concluída');
      
    } catch (error) {
      // Não falhar se a limpeza der erro, apenas logar
      this.logger.warn('Aviso na limpeza de backups antigos:', error.message);
    }
  }

  async getBackupStatus(): Promise<{
    lastBackup: string | null;
    backupCount: number;
    backupDirectory: string;
  }> {
    try {
      const { stdout } = await execAsync(
        process.platform === 'win32'
          ? `dir "${this.backupDir}\*.sql" /b /o-d`
          : `ls -t "${this.backupDir}"/*.sql 2>/dev/null || echo ""`
      );
      
      const files = stdout.trim().split('\n').filter(f => f.length > 0);
      
      return {
        lastBackup: files.length > 0 ? files[0] : null,
        backupCount: files.length,
        backupDirectory: this.backupDir,
      };
    } catch (error) {
      this.logger.error('Erro ao obter status dos backups:', error.message);
      return {
        lastBackup: null,
        backupCount: 0,
        backupDirectory: this.backupDir,
      };
    }
  }
}