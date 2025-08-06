"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const audit_service_1 = require("./audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mockPrismaService = {
    auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    },
};
describe('AuditService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_service_1.AuditService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(audit_service_1.AuditService);
        prisma = module.get(prisma_service_1.PrismaService);
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
            const pagination = {
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
            const pagination = {
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
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });
    });
});
//# sourceMappingURL=audit.service.spec.js.map