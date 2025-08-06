import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

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
  let service: RolesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      const createRoleDto: CreateRoleDto = {
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
      const pagination: PaginationDto = {
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
      const pagination: PaginationDto = {
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

      await expect(service.findOne(roleId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a role successfully', async () => {
      const roleId = 'role-123';
      const updateRoleDto: UpdateRoleDto = {
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
      mockPrismaService.role.findUnique.mockResolvedValueOnce(null); // Para verificar conflito de nome
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
      const updateRoleDto: UpdateRoleDto = { name: 'New Name' };
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(NotFoundException);
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

      await expect(service.remove(roleId)).rejects.toThrow(NotFoundException);
    });
  });
});