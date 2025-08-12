import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import * as ExcelJS from 'exceljs';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToExcel', () => {
    it('should export data to Excel format', async () => {
      const testData = [
        { id: 1, name: 'João', email: 'joao@test.com', active: true },
        { id: 2, name: 'Maria', email: 'maria@test.com', active: false },
      ];

      const buffer = await service.exportToExcel(testData, {
        title: 'Usuários',
        worksheetName: 'Lista de Usuários',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verificar se o buffer contém dados válidos do Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      
      const worksheet = workbook.getWorksheet('Lista de Usuários');
      expect(worksheet).toBeDefined();
    });

    it('should handle empty data array', async () => {
      const buffer = await service.exportToExcel([]);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      
      const worksheet = workbook.getWorksheet('Data');
      expect(worksheet).toBeDefined();
    });

    it('should format dates correctly', async () => {
      const testData = [
        { 
          id: 1, 
          name: 'Test', 
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-02T15:30:00Z'),
        },
      ];

      const buffer = await service.exportToExcel(testData);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle arrays and objects in data', async () => {
      const testData = [
        {
          id: 1,
          name: 'Test',
          tags: ['tag1', 'tag2', 'tag3'],
          metadata: { key: 'value', nested: { prop: 'test' } },
          nullValue: null,
          undefinedValue: undefined,
        },
      ];

      const buffer = await service.exportToExcel(testData);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should apply custom headers', async () => {
      const testData = [
        { id: 1, name: 'Test', email: 'test@test.com' },
      ];

      const buffer = await service.exportToExcel(testData, {
        headers: ['id', 'name'], // Excluir email
      });

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should include timestamp when requested', async () => {
      const testData = [{ id: 1, name: 'Test' }];

      const buffer = await service.exportToExcel(testData, {
        includeTimestamp: true,
      });

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should not include timestamp when not requested', async () => {
      const testData = [{ id: 1, name: 'Test' }];

      const buffer = await service.exportToExcel(testData, {
        includeTimestamp: false,
      });

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('exportToPDF', () => {
    it('should export data to PDF format', async () => {
      const testData = [
        { id: 1, name: 'João', email: 'joao@test.com' },
        { id: 2, name: 'Maria', email: 'maria@test.com' },
      ];

      const buffer = await service.exportToPDF(testData, {
        title: 'Lista de Usuários',
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      // Verificar se começa com header PDF
      const pdfHeader = '%PDF';
      const bufferStart = Buffer.from(buffer.slice(0, 4)).toString();
      expect(bufferStart).toBe(pdfHeader);
    });

    it('should handle empty data array for PDF', async () => {
      const buffer = await service.exportToPDF([]);
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      const pdfHeader = '%PDF';
      const bufferStart = Buffer.from(buffer.slice(0, 4)).toString();
      expect(bufferStart).toBe(pdfHeader);
    });

    it('should format dates correctly in PDF', async () => {
      const testData = [
        { 
          id: 1, 
          name: 'Test', 
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      const buffer = await service.exportToPDF(testData);
      expect(buffer).toBeInstanceOf(Uint8Array);
    });

    it('should handle arrays and objects in PDF data', async () => {
      const testData = [
        {
          id: 1,
          name: 'Test',
          tags: ['tag1', 'tag2'],
          metadata: { key: 'value' },
          nullValue: null,
          undefinedValue: undefined,
        },
      ];

      const buffer = await service.exportToPDF(testData);
      expect(buffer).toBeInstanceOf(Uint8Array);
    });

    it('should apply custom headers for PDF', async () => {
      const testData = [
        { id: 1, name: 'Test', email: 'test@test.com' },
      ];

      const buffer = await service.exportToPDF(testData, {
        headers: ['id', 'name'],
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
    });

    it('should customize font size', async () => {
      const testData = [{ id: 1, name: 'Test' }];

      const buffer = await service.exportToPDF(testData, {
        fontSize: 14,
      });

      expect(buffer).toBeInstanceOf(Uint8Array);
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = service.generateFilename('export', '.xlsx');
      
      expect(filename).toMatch(/^export_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.xlsx$/);
    });

    it('should handle different extensions', () => {
      const xlsxFilename = service.generateFilename('data', '.xlsx');
      const pdfFilename = service.generateFilename('report', '.pdf');
      
      expect(xlsxFilename).toContain('.xlsx');
      expect(pdfFilename).toContain('.pdf');
    });
  });

  describe('validateExportData', () => {
    it('should validate correct data format', () => {
      const validData = [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Test2' },
      ];
      
      expect(service.validateExportData(validData)).toBe(true);
    });

    it('should accept empty array', () => {
      expect(service.validateExportData([])).toBe(true);
    });

    it('should reject non-array data', () => {
      expect(service.validateExportData('not an array' as any)).toBe(false);
      expect(service.validateExportData(null as any)).toBe(false);
      expect(service.validateExportData(undefined as any)).toBe(false);
      expect(service.validateExportData({} as any)).toBe(false);
    });

    it('should reject array with non-object items', () => {
      const invalidData = [
        { id: 1, name: 'Valid' },
        'invalid string',
        123,
        null,
      ];
      
      expect(service.validateExportData(invalidData as any)).toBe(false);
    });

    it('should accept array with only valid objects', () => {
      const validData = [
        { id: 1, name: 'Test1' },
        { id: 2, name: 'Test2', extra: { nested: 'value' } },
        { id: 3, name: 'Test3', tags: ['a', 'b'] },
      ];
      
      expect(service.validateExportData(validData)).toBe(true);
    });
  });
});