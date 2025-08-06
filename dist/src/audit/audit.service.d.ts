import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
export interface AuditLogData {
    userId: string;
    tenantId: string;
    action: string;
    subject: string;
    subjectId?: string;
    dataBefore?: any;
    dataAfter?: any;
    clientInfo?: {
        ip: string;
        userAgent: string;
    };
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: AuditLogData): Promise<void>;
    findAll(pagination: PaginationDto): Promise<{
        data: {
            id: string;
            userId: string;
            tenantId: string;
            action: string;
            subject: string;
            subjectId: string;
            dataBefore: import("@prisma/client/runtime/library").JsonValue | null;
            dataAfter: import("@prisma/client/runtime/library").JsonValue | null;
            clientInfo: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
}
