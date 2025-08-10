import { Test, TestingModule } from '@nestjs/testing';
import { TesteGeralService } from './teste-geral.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Status, Categoria } from '@prisma/client';

describe('TesteGeralService', () => {
  let service: TesteGeralService;
  let prisma: PrismaService;

  const mockTesteGeral = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    nome: 'Teste Unitário',
    descricao: 'Descrição do teste',
    valorDecimal: 99.99,
    valorInteiro: 42,
    valorFloat: 3.14159,
    ativo: true,
    status: Status.ATIVO,
    categoria: Categoria.TECNOLOGIA,
    dataCriacao: new Date('2024-01-01'),
    dataAtualizacao: new Date('2024-01-01'),
    tags: ['tag1', 'tag2'],
    email: 'teste@example.com',
  };

  const mockPrismaService = {
    testeGeral: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TesteGeralService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TesteGeralService>(TesteGeralService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      nome: 'Novo Teste',
      valorDecimal: 100.5,
      valorInteiro: 50,
      valorFloat: 2.5,
      email: 'novo@example.com',
    };

    it('should create a new record successfully', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(null);
      mockPrismaService.testeGeral.create.mockResolvedValue(mockTesteGeral);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual(mockTesteGeral);
      expect(prisma.testeGeral.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(prisma.testeGeral.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          criadoPorId: 'user-id',
          atualizadoPorId: 'user-id',
        },
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should create without email', async () => {
      const dtoWithoutEmail = { ...createDto, email: undefined };
      mockPrismaService.testeGeral.create.mockResolvedValue(mockTesteGeral);

      const result = await service.create(dtoWithoutEmail);

      expect(result).toEqual(mockTesteGeral);
      expect(prisma.testeGeral.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockData = [mockTesteGeral];
      const mockTotal = 1;

      mockPrismaService.testeGeral.findMany.mockResolvedValue(mockData);
      mockPrismaService.testeGeral.count.mockResolvedValue(mockTotal);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        skip: 0,
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      mockPrismaService.testeGeral.findMany.mockResolvedValue([]);
      mockPrismaService.testeGeral.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.testeGeral.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        cursor: undefined,
        where: undefined,
        orderBy: { dataCriacao: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('search', () => {
    it('should search with filters', async () => {
      const mockData = [mockTesteGeral];
      const mockTotal = 1;

      mockPrismaService.testeGeral.findMany.mockResolvedValue(mockData);
      mockPrismaService.testeGeral.count.mockResolvedValue(mockTotal);

      const result = await service.search({
        search: 'teste',
        status: Status.ATIVO,
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        skip: 0,
        take: 10,
      });
    });

    it('should handle empty search results', async () => {
      mockPrismaService.testeGeral.findMany.mockResolvedValue([]);
      mockPrismaService.testeGeral.count.mockResolvedValue(0);

      const result = await service.search({ search: 'nonexistent' });

      expect(result).toEqual({
        data: [],
        total: 0,
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a record by id', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(mockTesteGeral);

      const result = await service.findOne('valid-id');

      expect(result).toEqual(mockTesteGeral);
      expect(prisma.testeGeral.findUnique).toHaveBeenCalledWith({
        where: { id: 'valid-id' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { nome: 'Updated Name' };

    it('should update a record successfully', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(mockTesteGeral);
      mockPrismaService.testeGeral.findFirst.mockResolvedValue(null);
      mockPrismaService.testeGeral.update.mockResolvedValue({
        ...mockTesteGeral,
        ...updateDto,
      });

      const result = await service.update('valid-id', updateDto, 'user-id');

      expect(result.nome).toBe('Updated Name');
      expect(prisma.testeGeral.update).toHaveBeenCalledWith({
        where: { id: 'valid-id' },
        data: { ...updateDto, atualizadoPorId: 'user-id' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(mockTesteGeral);
      mockPrismaService.testeGeral.findFirst.mockResolvedValue({ id: 'another-id' });

      await expect(service.update('valid-id', { email: 'taken@example.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a record successfully', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(mockTesteGeral);
      mockPrismaService.testeGeral.delete.mockResolvedValue(mockTesteGeral);

      const result = await service.remove('valid-id');

      expect(result).toEqual(mockTesteGeral);
      expect(prisma.testeGeral.delete).toHaveBeenCalledWith({
        where: { id: 'valid-id' },
      });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockPrismaService.testeGeral.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle status from true to false', async () => {
      const activeRecord = { ...mockTesteGeral, ativo: true };
      const inactiveRecord = { ...activeRecord, ativo: false };

      mockPrismaService.testeGeral.findUnique.mockResolvedValue(activeRecord);
      mockPrismaService.testeGeral.update.mockResolvedValue(inactiveRecord);

      const result = await service.toggleStatus('valid-id', 'user-id');

      expect(result.ativo).toBe(false);
      expect(prisma.testeGeral.update).toHaveBeenCalledWith({
        where: { id: 'valid-id' },
        data: { ativo: false, atualizadoPorId: 'user-id' },
        include: expect.any(Object),
      });
    });

    it('should toggle status from false to true', async () => {
      const inactiveRecord = { ...mockTesteGeral, ativo: false };
      const activeRecord = { ...inactiveRecord, ativo: true };

      mockPrismaService.testeGeral.findUnique.mockResolvedValue(inactiveRecord);
      mockPrismaService.testeGeral.update.mockResolvedValue(activeRecord);

      const result = await service.toggleStatus('valid-id');

      expect(result.ativo).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const mockStats = {
        total: 100,
        ativos: 80,
        inativos: 20,
        porCategoria: [
          { categoria: Categoria.TECNOLOGIA, count: 40 },
          { categoria: Categoria.FINANCEIRO, count: 30 },
        ],
        porStatus: [
          { status: Status.ATIVO, count: 80 },
          { status: Status.INATIVO, count: 20 },
        ],
      };

      mockPrismaService.testeGeral.count.mockResolvedValueOnce(100);
      mockPrismaService.testeGeral.count.mockResolvedValueOnce(80);
      mockPrismaService.testeGeral.count.mockResolvedValueOnce(20);
      mockPrismaService.testeGeral.groupBy.mockResolvedValueOnce([
        { categoria: Categoria.TECNOLOGIA, _count: { categoria: 40 } },
        { categoria: Categoria.FINANCEIRO, _count: { categoria: 30 } },
      ]);
      mockPrismaService.testeGeral.groupBy.mockResolvedValueOnce([
        { status: Status.ATIVO, _count: { status: 80 } },
        { status: Status.INATIVO, _count: { status: 20 } },
      ]);

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
      expect(prisma.testeGeral.count).toHaveBeenCalledTimes(3);
      expect(prisma.testeGeral.groupBy).toHaveBeenCalledTimes(2);
    });
  });
});