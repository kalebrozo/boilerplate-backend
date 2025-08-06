import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDITABLE_KEY } from '../decorators/auditable.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const auditableMetadata = this.reflector.get(
      AUDITABLE_KEY,
      context.getHandler(),
    );

    if (!auditableMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];
    const { action, subject } = auditableMetadata;

    let dataBefore = null;
    let subjectId = null;

    // Capturar estado anterior para UPDATE e DELETE
    if (['UPDATE', 'DELETE'].includes(action) && request.params.id) {
      subjectId = request.params.id;
      
      try {
        // Determinar o modelo baseado no subject
        const model = this.getModelBySubject(subject);
        if (model) {
          const entity = await (model as any).findUnique({
            where: { id: subjectId },
          });
          dataBefore = entity;
        }
      } catch (error) {
        console.error('Error fetching dataBefore:', error);
      }
    }

    return next.handle().pipe(
      tap(async (dataAfter) => {
        // Para CREATE, o ID vem da resposta
        if (action === 'CREATE' && dataAfter?.id) {
          subjectId = dataAfter.id;
        }

        // Capturar informações do cliente
        const clientInfo = {
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        };

        // Registrar auditoria de forma assíncrona
        await this.auditService.log({
          userId: user?.id || 'system',
          tenantId: tenantId || 'public',
          action,
          subject,
          subjectId,
          dataBefore,
          dataAfter,
          clientInfo,
        });
      }),
    );
  }

  private getModelBySubject(subject: string) {
    switch (subject.toLowerCase()) {
      case 'user':
        return this.prisma.user;
      case 'role':
        return this.prisma.role;
      case 'tenant':
        return this.prisma.tenant;
      default:
        return null;
    }
  }
}