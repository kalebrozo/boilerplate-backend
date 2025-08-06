import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          tenantId: data.tenantId,
          action: data.action,
          subject: data.subject,
          subjectId: data.subjectId || null,
          dataBefore: data.dataBefore ? JSON.stringify(data.dataBefore) : null,
          dataAfter: data.dataAfter ? JSON.stringify(data.dataAfter) : null,
          clientInfo: data.clientInfo ? JSON.stringify(data.clientInfo) : null,
        },
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy, search } = pagination;

    const where = search ? {
      OR: [
        { action: { contains: search, mode: 'insensitive' as const } },
        { subject: { contains: search, mode: 'insensitive' as const } },
        { subjectId: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: skip + take < total,
        hasPrev: skip > 0,
      },
    };
  }
}