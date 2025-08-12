import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from '../services/export.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
import { InternalServerErrorException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';

describe('ExportController', () => {
  let controller: ExportController;
  let exportService: ExportService;
  let prismaService: PrismaService;
  let mockResponse: Partial<Response>;

  const mockExportService = {
    exportToExcel: jest.fn(),
    exportToPDF: jest.fn(),
    generateFilename: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
    testeGeral: {
      findMany: jest.fn(),
    },
  };

  const mockRequest = {
    user: {
      id: 'user1',
      tenantId: 'tenant1',
    },
  };

  beforeEach(async () => {
    mockResponse = {
      set: jest.fn(),
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: ExportService,
          useValue: mockExportService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(PoliciesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<ExportController>(ExportController);
    exportService = module.get<ExportService>(ExportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportUsersToExcel', () => {
    it('should export users to Excel successfully', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: 'João Silva',
          email: 'joao@test.com',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          role: { name: 'Admin' },
        },
      ];

      const mockBuffer = Buffer.from('excel data');
      const mockFilename = 'usuarios_2024-01-01.xlsx';

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockExportService.exportToExcel.mockResolvedValue(mockBuffer);
      mockExportService.generateFilename.mockReturnValue(mockFilename);

      await controller.exportUsersToExcel(
        undefined,
        undefined,
        mockRequest,
        mockResponse as Response,
      );

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(mockExportService.exportToExcel).toHaveBeenCalledWith(
        [
          {
            ID: 'user1',
            Nome: 'João Silva',
            Email: 'joao@test.com',
            Role: 'Admin',
            'Data de Criação': new Date('2024-01-01'),
            'Última Atualização': new Date('2024-01-02'),
          },
        ],
        {
          title: 'Lista de Usuários',
          worksheetName: 'Usuários',
          includeTimestamp: true,
        },
      );

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${mockFilename}"`,
        'Content-Length': mockBuffer.length,
      });

      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should apply search filter', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockExportService.exportToExcel.mockResolvedValue(Buffer.from(''));
      mockExportService.generateFilename.mockReturnValue('test.xlsx');

      await controller.exportUsersToExcel(
        'joão',
        undefined,
        mockRequest,
        mockResponse as Response,
      );

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant1',
            OR: [
              { name: { contains: 'joão', mode: 'insensitive' } },
              { email: { contains: 'joão', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply active filter', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockExportService.exportToExcel.mockResolvedValue(Buffer.from(''));
      mockExportService.generateFilename.mockReturnValue('test.xlsx');

      await controller.exportUsersToExcel(
        undefined,
        'true',
        mockRequest,
        mockResponse as Response,
      );

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant1',
          },
        }),
      );
    });

    it('should handle errors', async () => {
      mockPrismaService.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        controller.exportUsersToExcel(
          undefined,
          undefined,
          mockRequest,
          mockResponse as Response,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('exportUsersToPDF', () => {
    it('should export users to PDF successfully', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: 'João Silva',
          email: 'joao@test.com',
          createdAt: new Date('2024-01-01'),
          role: { name: 'Admin' },
        },
      ];

      const mockBuffer = new Uint8Array([1, 2, 3, 4]);
      const mockFilename = 'usuarios_2024-01-01.pdf';

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockExportService.exportToPDF.mockResolvedValue(mockBuffer);
      mockExportService.generateFilename.mockReturnValue(mockFilename);

      await controller.exportUsersToPDF(
        undefined,
        undefined,
        mockRequest,
        mockResponse as Response,
      );

      expect(mockExportService.exportToPDF).toHaveBeenCalledWith(
        [
          {
            ID: 'user1'.substring(0, 8),
            Nome: 'João Silva',
            Email: 'joao@test.com',
            Role: 'Admin',
            'Criado em': new Date('2024-01-01').toLocaleDateString('pt-BR'),
          },
        ],
        {
          title: 'Lista de Usuários',
          fontSize: 10,
          includeTimestamp: true,
        },
      );

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${mockFilename}"`,
        'Content-Length': mockBuffer.length,
      });

      expect(mockResponse.send).toHaveBeenCalledWith(Buffer.from(mockBuffer));
    });
  });

  describe('exportTesteGeralToExcel', () => {
    it('should export teste geral to Excel successfully', async () => {
      const mockTesteGeral = [
        {
          id: 'test1',
          nome: 'Teste 1',
          descricao: 'Descrição do teste',
          valorDecimal: 99.99,
          valorInteiro: 42,
          valorFloat: 3.14,
          ativo: true,
          status: 'ATIVO',
          categoria: 'TECNOLOGIA',
          email: 'teste@test.com',
          tags: ['tag1', 'tag2'],
          dataCriacao: new Date('2024-01-01'),
          dataAtualizacao: new Date('2024-01-02'),
          criadoPor: { name: 'Admin' },
          tenant: { name: 'Tenant Test' },
        },
      ];

      const mockBuffer = Buffer.from('excel data');
      const mockFilename = 'teste-geral_2024-01-01.xlsx';

      mockPrismaService.testeGeral.findMany.mockResolvedValue(mockTesteGeral);
      mockExportService.exportToExcel.mockResolvedValue(mockBuffer);
      mockExportService.generateFilename.mockReturnValue(mockFilename);

      await controller.exportTesteGeralToExcel(
        undefined,
        undefined,
        undefined,
        mockRequest,
        mockResponse as Response,
      );

      expect(mockExportService.exportToExcel).toHaveBeenCalledWith(
        [
          {
            ID: 'test1',
            Nome: 'Teste 1',
            Descrição: 'Descrição do teste',
            'Valor Decimal': 99.99,
            'Valor Inteiro': 42,
            'Valor Float': 3.14,
            Ativo: 'Sim',
            Status: 'ATIVO',
            Categoria: 'TECNOLOGIA',
            Email: 'teste@test.com',
            Tags: 'tag1, tag2',
            'Criado Por': 'Admin',
            Tenant: 'Tenant Test',
            'Data de Criação': new Date('2024-01-01'),
            'Data de Atualização': new Date('2024-01-02'),
          },
        ],
        {
          title: 'Dados de Teste Geral',
          worksheetName: 'Teste Geral',
          includeTimestamp: true,
        },
      );
    });

    it('should apply filters for teste geral', async () => {
      mockPrismaService.testeGeral.findMany.mockResolvedValue([]);
      mockExportService.exportToExcel.mockResolvedValue(Buffer.from(''));
      mockExportService.generateFilename.mockReturnValue('test.xlsx');

      await controller.exportTesteGeralToExcel(
        'busca',
        'ATIVO',
        'TECNOLOGIA',
        mockRequest,
        mockResponse as Response,
      );

      expect(mockPrismaService.testeGeral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant1',
            OR: [
              { nome: { contains: 'busca', mode: 'insensitive' } },
              { descricao: { contains: 'busca', mode: 'insensitive' } },
              { email: { contains: 'busca', mode: 'insensitive' } },
            ],
            status: 'ATIVO',
            categoria: 'TECNOLOGIA',
          },
        }),
      );
    });
  });

  describe('exportTesteGeralToPDF', () => {
    it('should export teste geral to PDF successfully', async () => {
      const mockTesteGeral = [
        {
          id: 'test1',
          nome: 'Teste 1',
          status: 'ATIVO',
          categoria: 'TECNOLOGIA',
          valorDecimal: 99.99,
          ativo: true,
          dataCriacao: new Date('2024-01-01'),
          criadoPor: { name: 'Admin' },
        },
      ];

      const mockBuffer = new Uint8Array([1, 2, 3, 4]);
      const mockFilename = 'teste-geral_2024-01-01.pdf';

      mockPrismaService.testeGeral.findMany.mockResolvedValue(mockTesteGeral);
      mockExportService.exportToPDF.mockResolvedValue(mockBuffer);
      mockExportService.generateFilename.mockReturnValue(mockFilename);

      await controller.exportTesteGeralToPDF(
        undefined,
        undefined,
        undefined,
        mockRequest,
        mockResponse as Response,
      );

      expect(mockExportService.exportToPDF).toHaveBeenCalledWith(
        [
          {
            Nome: 'Teste 1',
            Ativo: 'Sim',
            Status: 'ATIVO',
            Categoria: 'TECNOLOGIA',
            'Valor Decimal': 99.99,
            'Criado Por': 'Admin',
            'Data': new Date('2024-01-01').toLocaleDateString('pt-BR'),
          },
        ],
        {
          title: 'Dados de Teste Geral',
          fontSize: 9,
          includeTimestamp: true,
        },
      );
    });
  });
});