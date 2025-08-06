import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto, Action } from './dto/create-permission.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

const mockPrismaService = {
  permission: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a permission successfully', async () => {
      const createPermissionDto: CreatePermissionDto = {
        action: Action.CREATE,
        subject: 'User',

      };

      const expectedPermission = {
        id: 'perm-123',
        ...createPermissionDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.permission.create.mockResolvedValue(expectedPermission);

      const result = await service.create(createPermissionDto);

      expect(result).toEqual(expectedPermission);
      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: createPermissionDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated permissions', async () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      };

      const permissions = [
        {
          id: 'perm-1',
          action: Action.CREATE,
          subject: 'User',
  
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'perm-2',
          action: Action.READ,
          subject: 'User',
  
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.permission.findMany.mockResolvedValue(permissions);
      mockPrismaService.permission.count.mockResolvedValue(2);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(permissions);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter permissions by search term', async () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        search: 'users',
      };

      const permissions = [
        {
          id: 'perm-1',
          action: 'create',
          subject: 'User',
  
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.permission.findMany.mockResolvedValue(permissions);
      mockPrismaService.permission.count.mockResolvedValue(1);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(permissions);
      expect(result.meta.total).toBe(1);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { action: { contains: 'users', mode: 'insensitive' } },
            { subject: { contains: 'users', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      const permissionId = 'perm-123';
      const expectedPermission = {
        id: permissionId,
        action: 'create',
        subject: 'User',

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.permission.findUnique.mockResolvedValue(expectedPermission);

      const result = await service.findOne(permissionId);

      expect(result).toEqual(expectedPermission);
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
    });

    it('should throw NotFoundException if permission not found', async () => {
      const permissionId = 'non-existent';
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.remove(permissionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a permission successfully', async () => {
      const permissionId = 'perm-123';
      const updatePermissionDto: UpdatePermissionDto = {
        action: Action.MANAGE,
        subject: 'User',

      };

      const existingPermission = {
        id: permissionId,
        action: 'create',
        subject: 'User',
        group: 'Users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPermission = {
        ...existingPermission,
        ...updatePermissionDto,
        updatedAt: new Date(),
      };

      mockPrismaService.permission.findUnique.mockResolvedValue(existingPermission);
      mockPrismaService.permission.update.mockResolvedValue(updatedPermission);

      const result = await service.update(permissionId, updatePermissionDto);

      expect(result).toEqual(updatedPermission);
      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: permissionId },
        data: updatePermissionDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a permission successfully', async () => {
      const permissionId = 'perm-123';
      const existingPermission = {
        id: permissionId,
        action: 'create',
        subject: 'User',
        group: 'Users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.permission.findUnique.mockResolvedValue(existingPermission);
      mockPrismaService.permission.delete.mockResolvedValue(existingPermission);

      const result = await service.remove(permissionId);

      expect(result).toEqual(existingPermission);
      expect(prisma.permission.delete).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
    });
  });
});