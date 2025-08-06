import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
export declare class TenantPrismaProvider extends PrismaClient {
    private request;
    constructor(request: Request);
    private initializeTenantConnection;
}
