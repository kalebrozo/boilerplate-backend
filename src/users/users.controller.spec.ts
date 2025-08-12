import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUsersService = {
  create: jest.fn(),
  search: jest.fn(),
  getStats: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  toggleStatus: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockRequest = {
    user: {
      id: 'user-123',
      tenantId: 'tenant-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
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

      const result = await controller.create(createUserDto, mockRequest);

      expect(result).toEqual(expectedUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto, mockRequest.user.tenantId);
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const searchDto = {
        search: 'test',
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        items: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            name: 'User 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockUsersService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(searchDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.search).toHaveBeenCalledWith(searchDto, mockRequest.user.tenantId);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const expectedStats = {
        total: 100,
        active: 80,
        inactive: 20,
      };

      mockUsersService.getStats.mockResolvedValue(expectedStats);

      const result = await controller.getStats(mockRequest);

      expect(result).toEqual(expectedStats);
      expect(service.getStats).toHaveBeenCalledWith(mockRequest.user.tenantId);
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(expectedUser);

      const result = await controller.findOne(userId, mockRequest);

      expect(result).toEqual(expectedUser);
      expect(service.findOne).toHaveBeenCalledWith(userId, mockRequest.user.tenantId);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'user-123';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        roleId: 'new-role-id',
      };

      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        roleId: 'new-role-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto, mockRequest);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto, mockRequest.user.tenantId);
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.remove.mockResolvedValue(deletedUser);

      const result = await controller.remove(userId, mockRequest);

      expect(result).toEqual(deletedUser);
      expect(service.remove).toHaveBeenCalledWith(userId, mockRequest.user.tenantId);
    });
  });
});