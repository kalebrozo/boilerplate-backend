import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { ExportService } from '../services/export.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyHandlerImpl } from '../../casl/interfaces/policy-handler.interface';
import { Action } from '../../casl/action.enum';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('users/excel')
  @ApiOperation({ summary: 'Exportar usuários para Excel' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar por status ativo' })
  @ApiResponse({ status: 200, description: 'Arquivo Excel gerado com sucesso' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  async exportUsersToExcel(
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const tenantId = req.user.tenantId;
      
      // Construir filtros
      const where: any = { tenantId };
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      


      // Buscar dados
      const users = await this.prisma.user.findMany({
        where,
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

      // Transformar dados para exportação
      const exportData = users.map(user => ({
        ID: user.id,
        Nome: user.name,
        Email: user.email,
        Role: user.role?.name || 'N/A',
        'Data de Criação': user.createdAt,
        'Última Atualização': user.updatedAt,
      }));

      // Gerar arquivo Excel
      const buffer = await this.exportService.exportToExcel(exportData, {
        title: 'Lista de Usuários',
        worksheetName: 'Usuários',
        includeTimestamp: true,
      });

      // Configurar resposta
      const filename = this.exportService.generateFilename('usuarios', '.xlsx');
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao exportar usuários para Excel');
    }
  }

  @Get('users/pdf')
  @ApiOperation({ summary: 'Exportar usuários para PDF' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar por status ativo' })
  @ApiResponse({ status: 200, description: 'Arquivo PDF gerado com sucesso' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  async exportUsersToPDF(
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const tenantId = req.user.tenantId;
      
      // Construir filtros
      const where: any = { tenantId };
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (active !== undefined) {
        where.isActive = active === 'true';
      }

      // Buscar dados
      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transformar dados para exportação
      const exportData = users.map(user => ({
        ID: user.id.substring(0, 8),
        Nome: user.name,
        Email: user.email,
        Role: user.role?.name || 'N/A',
        'Criado em': user.createdAt.toLocaleDateString('pt-BR'),
      }));

      // Gerar arquivo PDF
      const buffer = await this.exportService.exportToPDF(exportData, {
        title: 'Lista de Usuários',
        fontSize: 10,
        includeTimestamp: true,
      });

      // Configurar resposta
      const filename = this.exportService.generateFilename('usuarios', '.pdf');
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(Buffer.from(buffer));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao exportar usuários para PDF');
    }
  }

  @Get('teste-geral/excel')
  @ApiOperation({ summary: 'Exportar dados de teste geral para Excel' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Filtrar por categoria' })
  @ApiResponse({ status: 200, description: 'Arquivo Excel gerado com sucesso' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'TesteGeral')))
  async exportTesteGeralToExcel(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoria') categoria?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const tenantId = req.user.tenantId;
      
      // Construir filtros
      const where: any = { tenantId };
      
      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (categoria) {
        where.categoria = categoria;
      }

      // Buscar dados
      const testeGeral = await this.prisma.testeGeral.findMany({
        where,
        include: {
          criadoPor: {
            select: { name: true },
          },
          tenant: {
            select: { name: true },
          },
        },
        orderBy: { dataCriacao: 'desc' },
      });

      // Transformar dados para exportação
      const exportData = testeGeral.map(item => ({
        ID: item.id,
        Nome: item.nome,
        Descrição: item.descricao,
        'Valor Decimal': item.valorDecimal,
        'Valor Inteiro': item.valorInteiro,
        'Valor Float': item.valorFloat,
        Ativo: item.ativo ? 'Sim' : 'Não',
        Status: item.status,
        Categoria: item.categoria,
        Email: item.email,
        Tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        'Criado Por': item.criadoPor?.name || 'N/A',
        Tenant: item.tenant?.name || 'N/A',
        'Data de Criação': item.dataCriacao,
        'Data de Atualização': item.dataAtualizacao,
      }));

      // Gerar arquivo Excel
      const buffer = await this.exportService.exportToExcel(exportData, {
        title: 'Dados de Teste Geral',
        worksheetName: 'Teste Geral',
        includeTimestamp: true,
      });

      // Configurar resposta
      const filename = this.exportService.generateFilename('teste-geral', '.xlsx');
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao exportar dados de teste geral para Excel');
    }
  }

  @Get('teste-geral/pdf')
  @ApiOperation({ summary: 'Exportar dados de teste geral para PDF' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Filtrar por categoria' })
  @ApiResponse({ status: 200, description: 'Arquivo PDF gerado com sucesso' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'TesteGeral')))
  async exportTesteGeralToPDF(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoria') categoria?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const tenantId = req.user.tenantId;
      
      // Construir filtros
      const where: any = { tenantId };
      
      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (categoria) {
        where.categoria = categoria;
      }

      // Buscar dados
      const testeGeral = await this.prisma.testeGeral.findMany({
        where,
        include: {
          criadoPor: {
            select: { name: true },
          },
        },
        orderBy: { dataCriacao: 'desc' },
      });

      // Transformar dados para exportação (campos reduzidos para PDF)
      const exportData = testeGeral.map(item => ({
        Nome: item.nome,
        Status: item.status,
        Categoria: item.categoria,
        'Valor Decimal': item.valorDecimal,
        Ativo: item.ativo ? 'Sim' : 'Não',
        'Criado Por': item.criadoPor?.name || 'N/A',
        'Data': item.dataCriacao.toLocaleDateString('pt-BR'),
      }));

      // Gerar arquivo PDF
      const buffer = await this.exportService.exportToPDF(exportData, {
        title: 'Dados de Teste Geral',
        fontSize: 9,
        includeTimestamp: true,
      });

      // Configurar resposta
      const filename = this.exportService.generateFilename('teste-geral', '.pdf');
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(Buffer.from(buffer));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao exportar dados de teste geral para PDF');
    }
  }
}