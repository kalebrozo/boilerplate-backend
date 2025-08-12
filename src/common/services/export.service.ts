import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';

export interface ExportOptions {
  title?: string;
  filename?: string;
  headers?: string[];
  includeTimestamp?: boolean;
}

export interface ExcelExportOptions extends ExportOptions {
  worksheetName?: string;
  autoFilter?: boolean;
  freezeHeader?: boolean;
}

export interface PDFExportOptions extends ExportOptions {
  fontSize?: number;
  margin?: number;
  pageSize?: 'A4' | 'Letter';
}

@Injectable()
export class ExportService {
  /**
   * Exporta dados para formato Excel (.xlsx)
   * @param data Array de objetos para exportar
   * @param options Opções de configuração para exportação
   * @returns Buffer contendo o arquivo Excel
   */
  async exportToExcel(data: any[], options: ExcelExportOptions = {}): Promise<Buffer> {
    const {
      title = 'Exported Data',
      worksheetName = 'Data',
      autoFilter = true,
      freezeHeader = true,
      includeTimestamp = true,
    } = options;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);

    if (data.length === 0) {
      // Se não há dados, criar uma planilha vazia com mensagem
      worksheet.addRow(['Nenhum dado disponível para exportação']);
      worksheet.getCell('A1').font = { bold: true };
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    // Adicionar título se especificado
    if (title) {
      worksheet.addRow([title]);
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.addRow([]); // Linha em branco
    }

    // Adicionar timestamp se solicitado
    if (includeTimestamp) {
      const timestamp = new Date().toLocaleString('pt-BR');
      worksheet.addRow([`Exportado em: ${timestamp}`]);
      worksheet.addRow([]); // Linha em branco
    }

    // Obter cabeçalhos dos dados
    const headers = options.headers || Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);

    // Estilizar cabeçalhos
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Adicionar dados
    data.forEach((item) => {
      const row = headers.map(header => {
        const value = item[header];
        // Formatar datas
        if (value instanceof Date) {
          return value.toLocaleString('pt-BR');
        }
        // Formatar valores nulos/undefined
        if (value === null || value === undefined) {
          return '';
        }
        // Formatar arrays
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        // Formatar objetos
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      });
      worksheet.addRow(row);
    });

    // Aplicar auto-filtro
    if (autoFilter && data.length > 0) {
      const headerRowIndex = title || includeTimestamp ? 
        (title && includeTimestamp ? 4 : 3) : 1;
      worksheet.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: headerRowIndex, column: headers.length },
      };
    }

    // Congelar linha de cabeçalho
    if (freezeHeader && data.length > 0) {
      const headerRowIndex = title || includeTimestamp ? 
        (title && includeTimestamp ? 4 : 3) : 1;
      worksheet.views = [{
        state: 'frozen',
        ySplit: headerRowIndex,
      }];
    }

    // Ajustar largura das colunas
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.length || 10;
      data.forEach((item) => {
        const value = String(item[headers[index]] || '');
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = Math.min(maxLength + 2, 50); // Máximo de 50 caracteres
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Exporta dados para formato PDF
   * @param data Array de objetos para exportar
   * @param options Opções de configuração para exportação
   * @returns Buffer contendo o arquivo PDF
   */
  async exportToPDF(data: any[], options: PDFExportOptions = {}): Promise<Buffer> {
    const {
      title = 'Exported Data',
      fontSize = 10,
      margin = 50,
      includeTimestamp = true,
    } = options;

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - margin;

    // Adicionar título
    if (title) {
      page.drawText(title, {
        x: margin,
        y: yPosition,
        size: fontSize + 6,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    }

    // Adicionar timestamp
    if (includeTimestamp) {
      const timestamp = new Date().toLocaleString('pt-BR');
      page.drawText(`Exportado em: ${timestamp}`, {
        x: margin,
        y: yPosition,
        size: fontSize - 2,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 25;
    }

    if (data.length === 0) {
      page.drawText('Nenhum dado disponível para exportação', {
        x: margin,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      return Buffer.from(await pdfDoc.save());
    }

    // Obter cabeçalhos
    const headers = options.headers || Object.keys(data[0]);
    
    // Desenhar cabeçalhos
    const headerText = headers.join(' | ');
    page.drawText(headerText, {
      x: margin,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    // Desenhar linha separadora
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;

    // Adicionar dados
    for (const item of data) {
      // Verificar se precisa de nova página
      if (yPosition < margin + 50) {
        page = pdfDoc.addPage();
        yPosition = height - margin;
      }

      const rowData = headers.map(header => {
        const value = item[header];
        if (value instanceof Date) {
          return value.toLocaleDateString('pt-BR');
        }
        if (value === null || value === undefined) {
          return '';
        }
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      });

      const rowText = rowData.join(' | ');
      
      // Quebrar texto longo em múltiplas linhas
      const maxWidth = width - (2 * margin);
      const words = rowText.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = testLine.length * (fontSize * 0.6); // Aproximação
        
        if (textWidth > maxWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      }
    }

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Gera nome de arquivo com timestamp
   * @param baseName Nome base do arquivo
   * @param extension Extensão do arquivo (com ponto)
   * @returns Nome do arquivo com timestamp
   */
  generateFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${baseName}_${timestamp}${extension}`;
  }

  /**
   * Valida se os dados são exportáveis
   * @param data Dados para validar
   * @returns true se os dados são válidos
   */
  validateExportData(data: any[]): boolean {
    if (!Array.isArray(data)) {
      return false;
    }
    
    if (data.length === 0) {
      return true; // Dados vazios são válidos (gera arquivo vazio)
    }
    
    // Verificar se todos os itens são objetos
    return data.every(item => typeof item === 'object' && item !== null);
  }
}