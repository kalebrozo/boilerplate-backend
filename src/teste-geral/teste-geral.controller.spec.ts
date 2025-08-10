import { Test, TestingModule } from '@nestjs/testing';
import { TesteGeralController } from './teste-geral.controller';
import { TesteGeralService } from './teste-geral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';

const mockTesteGeralService = {
  create: jest.fn(),
  search: jest.fn(),
  getStats: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  toggleStatus: jest.fn(),
};

describe('TesteGeralController', () => {
  let controller: TesteGeralController;
  let service: TesteGeralService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TesteGeralController],
      providers: [
        {
          provide: TesteGeralService,
          useValue: mockTesteGeralService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TesteGeralController>(TesteGeralController);
    service = module.get<TesteGeralService>(TesteGeralService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const createDto = {
        nome: 'Teste Controller',
        valorDecimal: 100.5,
        valorInteiro: 50,
        valorFloat: 2.5,
        email: 'controller@teste.com',
      };
      const expectedResult = { id: '1', ...createDto };
      const mockRequest = { user: { id: 'user-id' } } as any;

      mockTesteGeralService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto, 'user-id');
    });
  });

  describe('findAll', () => {
    it('should return search results', async () => {
      const mockData = [
        { id: '1', nome: 'Teste 1' },
        { id: '2', nome: 'Teste 2' },
      ];
      const mockResult = {
        data: mockData,
        total: 2,
        skip: 0,
        take: 10,
      };

      mockTesteGeralService.search.mockResolvedValue(mockResult);

      const result = await controller.findAll(0, 10, 'teste', 'ATIVO', 'TECNOLOGIA', true, new Date(), new Date(), ['tag1']);

      expect(result).toEqual(mockResult);
      expect(service.search).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        search: 'teste',
        status: 'ATIVO',
        categoria: 'TECNOLOGIA',
        ativo: true,
        dateFrom: expect.any(Date),
        dateTo: expect.any(Date),
        tags: ['tag1'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a record by id', async () => {
      const mockRecord = { id: '1', nome: 'Teste Unitário' };

      mockTesteGeralService.findOne.mockResolvedValue(mockRecord);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockRecord);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      const updateDto = { nome: 'Teste Atualizado' };
      const expectedResult = { id: '1', ...updateDto };
      const mockRequest = { user: { id: 'user-id' } } as any;

      mockTesteGeralService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', updateDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith('1', updateDto, 'user-id');
    });
  });

  describe('remove', () => {
    it('should remove a record', async () => {
      mockTesteGeralService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle status of a record', async () => {
      const expectedResult = { id: '1', nome: 'Teste Toggle', ativo: false };
      const mockRequest = { user: { id: 'user-id' } } as any;

      mockTesteGeralService.toggleStatus.mockResolvedValue(expectedResult);

      const result = await controller.toggleStatus('1', mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.toggleStatus).toHaveBeenCalledWith('1', 'user-id');
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const mockStats = {
        totalRecords: 100,
        activeRecords: 75,
        inactiveRecords: 25,
        averageValue: 50.5,
        categoryCounts: {
          TECNOLOGIA: 40,
          FINANCEIRO: 30,
          OUTRO: 30,
        },
      };

      mockTesteGeralService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(service.getStats).toHaveBeenCalled();
    });
  });
});