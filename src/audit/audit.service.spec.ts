import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

const mockPrismaService = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log successfully', async () => {
      const auditData = {
        action: 'CREATE',
        subject: 'User',
        subjectId: 'user-123',
        userId: 'admin-123',
        tenantId: 'tenant-123',
        oldData: null,
        newData: { name: 'John Doe', email: 'john@example.com' },
        timestamp: new Date(),
      };

      const expectedLog = {
        id: 'audit-123',
        ...auditData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.auditLog.create.mockResolvedValue(expectedLog);

      await service.log(auditData);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      };

      const auditLogs = [
        {
          id: 'audit-1',
          action: 'CREATE',
          subject: 'User',
          subjectId: 'user-123',
          userId: 'admin-123',
          oldData: null,
          newData: { name: 'John Doe' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'audit-2',
          action: 'UPDATE',
          subject: 'User',
          subjectId: 'user-124',
          userId: 'admin-123',
          oldData: { name: 'Jane Smith' },
          newData: { name: 'Jane Doe' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(auditLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(auditLogs);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter audit logs by search term', async () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        search: 'CREATE',
      };

      const auditLogs = [
        {
          id: 'audit-1',
          action: 'CREATE',
          subject: 'User',
          subjectId: 'user-123',
          userId: 'admin-123',
          oldData: null,
          newData: { name: 'John Doe' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(auditLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(auditLogs);
      expect(result.meta.total).toBe(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { action: { contains: 'CREATE', mode: 'insensitive' } },
            { subject: { contains: 'CREATE', mode: 'insensitive' } },
            { subjectId: { contains: 'CREATE', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          userId: true,
          tenantId: true,
          action: true,
          subject: true,
          subjectId: true,
          dataBefore: true,
          dataAfter: true,
          clientInfo: true,
          createdAt: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});