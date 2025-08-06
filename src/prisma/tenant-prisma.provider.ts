import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaProvider extends PrismaClient {
  constructor(@Inject(REQUEST) private request: Request) {
    super();
    this.initializeTenantConnection();
  }

  private async initializeTenantConnection() {
    const tenantId = this.request.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Configurar conexão para o schema específico do tenant
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const tenantDatabaseUrl = `${databaseUrl}?schema=${tenantId}`;
    
    // Criar nova instância do Prisma para o tenant
    const tenantPrisma = new PrismaClient({
      datasources: {
        db: {
          url: tenantDatabaseUrl,
        },
      },
    });

    // Copiar métodos do tenantPrisma para esta instância
    Object.assign(this, tenantPrisma);
  }
}