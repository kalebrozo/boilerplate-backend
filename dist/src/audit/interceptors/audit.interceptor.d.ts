import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditInterceptor implements NestInterceptor {
    private reflector;
    private auditService;
    private prisma;
    constructor(reflector: Reflector, auditService: AuditService, prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private getModelBySubject;
}
