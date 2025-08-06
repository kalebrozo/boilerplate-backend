import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/create-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

const mockPrismaService = {
  tenant: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  $executeRawUnsafe: jest.fn(),
};

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant successfully', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'Test Tenant',
        schema: 'test_schema',
      };

      const expectedTenant = {
        id: 'tenant-123',
        ...createTenantDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(expectedTenant);
      mockPrismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      const result = await service.create(createTenantDto);

      expect(result).toEqual(expectedTenant);
      expect(prisma.tenant.findFirst).toHaveBeenCalled();
      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: createTenantDto,
      });
      expect(prisma.$executeRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      };

      const tenants = [
        {
          id: 'tenant-1',
          name: 'Tenant 1',
          schema: 'tenant1_schema',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tenant-2',
          name: 'Tenant 2',
          schema: 'tenant2_schema',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.tenant.findMany.mockResolvedValue(tenants);
      mockPrismaService.tenant.count.mockResolvedValue(2);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(tenants);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter tenants by search term', async () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        search: 'test',
      };

      const tenants = [
        {
          id: 'tenant-1',
          name: 'Test Tenant',

  
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.tenant.findMany.mockResolvedValue(tenants);
      mockPrismaService.tenant.count.mockResolvedValue(1);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(tenants);
      expect(result.meta.total).toBe(1);
      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { schema: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a tenant by id', async () => {
      const tenantId = 'tenant-123';
      const expectedTenant = {
        id: tenantId,
        name: 'Test Tenant',

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(expectedTenant);

      const result = await service.findOne(tenantId);

      expect(result).toEqual(expectedTenant);
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      const tenantId = 'non-existent';
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.remove(tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a tenant successfully', async () => {
      const tenantId = 'tenant-123';
      const updateTenantDto: UpdateTenantDto = {
        name: 'Updated Tenant',


      };

      const existingTenant = {
        id: tenantId,
        name: 'Test Tenant',

        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTenant = {
        ...existingTenant,
        ...updateTenantDto,
        updatedAt: new Date(),
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(existingTenant);
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.update(tenantId, updateTenantDto);

      expect(result).toEqual(updatedTenant);
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: updateTenantDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a tenant successfully', async () => {
      const tenantId = 'tenant-123';
      const existingTenant = {
        id: tenantId,
        name: 'Test Tenant',
        schema: 'test_schema',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(existingTenant);
      mockPrismaService.tenant.delete.mockResolvedValue(existingTenant);
      mockPrismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      const result = await service.remove(tenantId);

      expect(result).toEqual(existingTenant);
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(`DROP SCHEMA IF EXISTS "test_schema" CASCADE`);
      expect(prisma.tenant.delete).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
    });
  });
});