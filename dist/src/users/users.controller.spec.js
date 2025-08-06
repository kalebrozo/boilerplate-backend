"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};
describe('UsersController', () => {
    let controller;
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [users_controller_1.UsersController],
            providers: [
                { provide: users_service_1.UsersService, useValue: mockUsersService },
                { provide: audit_service_1.AuditService, useValue: { log: jest.fn() } },
                { provide: prisma_service_1.PrismaService, useValue: {} },
            ],
        }).compile();
        controller = module.get(users_controller_1.UsersController);
        service = module.get(users_service_1.UsersService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a user', async () => {
            const createUserDto = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123',
                roleId: 'role-123',
            };
            const expectedUser = {
                id: 'user-123',
                ...createUserDto,
                password: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockUsersService.create.mockResolvedValue(expectedUser);
            const result = await controller.create(createUserDto);
            expect(result).toEqual(expectedUser);
            expect(service.create).toHaveBeenCalledWith(createUserDto);
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
            ];
            const paginatedResult = {
                data: users,
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            };
            mockUsersService.findAll.mockResolvedValue(paginatedResult);
            const result = await controller.findAll(pagination);
            expect(result).toEqual(paginatedResult);
            expect(service.findAll).toHaveBeenCalledWith(pagination);
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
            mockUsersService.findOne.mockResolvedValue(expectedUser);
            const result = await controller.findOne(userId);
            expect(result).toEqual(expectedUser);
            expect(service.findOne).toHaveBeenCalledWith(userId);
        });
    });
    describe('update', () => {
        it('should update a user', async () => {
            const userId = 'user-123';
            const updateUserDto = {
                name: 'Updated Name',
                roleId: 'new-role-id',
            };
            const updatedUser = {
                id: userId,
                email: 'test@example.com',
                name: 'Updated Name',
                roleId: 'new-role-id',
                tenantId: 'tenant-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockUsersService.update.mockResolvedValue(updatedUser);
            const result = await controller.update(userId, updateUserDto);
            expect(result).toEqual(updatedUser);
            expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
        });
    });
    describe('remove', () => {
        it('should delete a user', async () => {
            const userId = 'user-123';
            const deletedUser = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                roleId: 'role-123',
                tenantId: 'tenant-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockUsersService.remove.mockResolvedValue(deletedUser);
            const result = await controller.remove(userId);
            expect(result).toEqual(deletedUser);
            expect(service.remove).toHaveBeenCalledWith(userId);
        });
    });
});
//# sourceMappingURL=users.controller.spec.js.map