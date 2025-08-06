"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const mockPrismaService = {
    user: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};
const mockCaslAbilityFactory = {
    createForUser: jest.fn(),
};
describe('UsersService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: casl_ability_factory_1.CaslAbilityFactory, useValue: mockCaslAbilityFactory },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a user successfully', async () => {
            const createUserDto = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123',
                roleId: 'role-123',
            };
            const expectedUser = {
                id: 'user-123',
                ...createUserDto,
                password: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.user.create.mockResolvedValue(expectedUser);
            const result = await service.create(createUserDto);
            expect(result).toEqual(expectedUser);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    ...createUserDto,
                    password: expect.any(String),
                },
                include: { role: true },
            });
        });
    });
    describe('findAll', () => {
        it('should return paginated users', async () => {
            const pagination = {
                page: 1,
                limit: 10,
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            };
            const users = [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: 'User 1',
                    roleId: 'role-1',
                    tenantId: 'tenant-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'user-2',
                    email: 'user2@example.com',
                    name: 'User 2',
                    roleId: 'role-2',
                    tenantId: 'tenant-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockPrismaService.user.findMany.mockResolvedValue(users);
            mockPrismaService.user.count.mockResolvedValue(2);
            const result = await service.findAll(pagination);
            expect(result.data).toEqual(users);
            expect(result.meta.total).toBe(2);
            expect(result.meta.page).toBe(1);
            expect(result.meta.limit).toBe(10);
        });
        it('should filter users by search term', async () => {
            const pagination = {
                page: 1,
                limit: 10,
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                search: 'test',
            };
            const users = [
                {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User',
                    roleId: 'role-1',
                    tenantId: 'tenant-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockPrismaService.user.findMany.mockResolvedValue(users);
            mockPrismaService.user.count.mockResolvedValue(1);
            const result = await service.findAll(pagination);
            expect(result.data).toEqual(users);
            expect(result.meta.total).toBe(1);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { role: true },
            });
        });
    });
    describe('findOne', () => {
        it('should return a user by id', async () => {
            const userId = 'user-123';
            const expectedUser = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                roleId: 'role-123',
                tenantId: 'tenant-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);
            const result = await service.findOne(userId);
            expect(result).toEqual(expectedUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
                include: { role: { include: { permissions: true } } },
            });
        });
        it('should throw NotFoundException if user not found', async () => {
            const userId = 'non-existent';
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.findOne(userId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('update', () => {
        it('should update a user successfully', async () => {
            const userId = 'user-123';
            const updateUserDto = {
                name: 'Updated Name',
                email: 'updated@example.com',
            };
            const existingUser = {
                id: userId,
                email: 'old@example.com',
                name: 'Old Name',
                password: 'hashedPassword',
                roleId: 'role-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const updatedUser = {
                ...existingUser,
                ...updateUserDto,
                updatedAt: new Date(),
            };
            mockPrismaService.user.findUnique.mockResolvedValueOnce(existingUser);
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            mockPrismaService.user.update.mockResolvedValue(updatedUser);
            const result = await service.update(userId, updateUserDto);
            expect(result).toEqual(updatedUser);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: updateUserDto,
                include: { role: true },
            });
        });
        it('should throw ConflictException if email already in use', async () => {
            const userId = 'user-123';
            const updateUserDto = {
                email: 'existing@example.com',
            };
            const existingUser = {
                id: userId,
                email: 'old@example.com',
                name: 'Test User',
                password: 'hashedPassword',
                roleId: 'role-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const existingUserWithEmail = {
                id: 'another-user',
                email: 'existing@example.com',
                name: 'Another User',
                password: 'hashedPassword',
                roleId: 'role-456',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.user.findUnique
                .mockResolvedValueOnce(existingUser)
                .mockResolvedValueOnce(existingUserWithEmail);
            await expect(service.update(userId, updateUserDto)).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('remove', () => {
        it('should delete a user successfully', async () => {
            const userId = 'user-123';
            const user = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedPassword',
                roleId: 'role-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.user.findUnique.mockResolvedValue(user);
            mockPrismaService.user.delete.mockResolvedValue(user);
            const result = await service.remove(userId);
            expect(result).toEqual(user);
            expect(prisma.user.delete).toHaveBeenCalledWith({
                where: { id: userId },
            });
        });
        it('should throw NotFoundException if user not found', async () => {
            const userId = 'non-existent';
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.remove(userId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=users.service.spec.js.map