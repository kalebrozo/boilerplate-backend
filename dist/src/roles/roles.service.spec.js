"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const roles_service_1 = require("./roles.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mockPrismaService = {
    role: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};
describe('RolesService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                roles_service_1.RolesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(roles_service_1.RolesService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a role successfully', async () => {
            const createRoleDto = {
                name: 'Admin',
            };
            const expectedRole = {
                id: 'role-123',
                ...createRoleDto,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.role.create.mockResolvedValue(expectedRole);
            const result = await service.create(createRoleDto);
            expect(result).toEqual(expectedRole);
            expect(prisma.role.create).toHaveBeenCalledWith({
                data: {
                    name: createRoleDto.name,
                    permissions: undefined,
                },
                include: { permissions: true },
            });
        });
    });
    describe('findAll', () => {
        it('should return paginated roles', async () => {
            const pagination = {
                page: 1,
                limit: 10,
                skip: 0,
                take: 10,
                orderBy: { name: 'asc' },
            };
            const roles = [
                {
                    id: 'role-1',
                    name: 'Admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'role-2',
                    name: 'User',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockPrismaService.role.findMany.mockResolvedValue(roles);
            mockPrismaService.role.count.mockResolvedValue(2);
            const result = await service.findAll(pagination);
            expect(result.data).toEqual(roles);
            expect(result.meta.total).toBe(2);
            expect(result.meta.page).toBe(1);
            expect(result.meta.limit).toBe(10);
        });
        it('should filter roles by search term', async () => {
            const pagination = {
                page: 1,
                limit: 10,
                skip: 0,
                take: 10,
                orderBy: { name: 'asc' },
                search: 'admin',
            };
            const roles = [
                {
                    id: 'role-1',
                    name: 'Admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockPrismaService.role.findMany.mockResolvedValue(roles);
            mockPrismaService.role.count.mockResolvedValue(1);
            const result = await service.findAll(pagination);
            expect(result.data).toEqual(roles);
            expect(result.meta.total).toBe(1);
            expect(prisma.role.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'admin', mode: 'insensitive' } },
                        { description: { contains: 'admin', mode: 'insensitive' } },
                    ],
                },
                skip: 0,
                take: 10,
                orderBy: { name: 'asc' },
                include: { permissions: true },
            });
        });
    });
    describe('findOne', () => {
        it('should return a role by id', async () => {
            const roleId = 'role-123';
            const expectedRole = {
                id: roleId,
                name: 'Admin',
                permissions: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.role.findUnique.mockResolvedValue(expectedRole);
            const result = await service.findOne(roleId);
            expect(result).toEqual(expectedRole);
            expect(prisma.role.findUnique).toHaveBeenCalledWith({
                where: { id: roleId },
                include: { permissions: true },
            });
        });
        it('should throw NotFoundException if role not found', async () => {
            const roleId = 'non-existent';
            mockPrismaService.role.findUnique.mockResolvedValue(null);
            await expect(service.findOne(roleId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('update', () => {
        it('should update a role successfully', async () => {
            const roleId = 'role-123';
            const updateRoleDto = {
                name: 'Super Admin',
            };
            const existingRole = {
                id: roleId,
                name: 'Admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const updatedRole = {
                ...existingRole,
                ...updateRoleDto,
                updatedAt: new Date(),
            };
            mockPrismaService.role.findUnique.mockResolvedValueOnce(existingRole);
            mockPrismaService.role.findUnique.mockResolvedValueOnce(null);
            mockPrismaService.role.update.mockResolvedValue(updatedRole);
            const result = await service.update(roleId, updateRoleDto);
            expect(result).toEqual(updatedRole);
            expect(prisma.role.update).toHaveBeenCalledWith({
                where: { id: roleId },
                data: {
                    name: updateRoleDto.name,
                    permissions: undefined,
                },
                include: { permissions: true },
            });
        });
        it('should throw NotFoundException if role not found', async () => {
            const roleId = 'non-existent';
            const updateRoleDto = { name: 'New Name' };
            mockPrismaService.role.findUnique.mockResolvedValue(null);
            await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('remove', () => {
        it('should delete a role successfully', async () => {
            const roleId = 'role-123';
            const existingRole = {
                id: roleId,
                name: 'Admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.role.findUnique.mockResolvedValue(existingRole);
            mockPrismaService.role.delete.mockResolvedValue(existingRole);
            const result = await service.remove(roleId);
            expect(result).toEqual(existingRole);
            expect(prisma.role.delete).toHaveBeenCalledWith({
                where: { id: roleId },
            });
        });
        it('should throw NotFoundException if role not found', async () => {
            const roleId = 'non-existent';
            mockPrismaService.role.findUnique.mockResolvedValue(null);
            await expect(service.remove(roleId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=roles.service.spec.js.map