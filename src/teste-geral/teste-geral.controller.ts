import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TesteGeralService } from './teste-geral.service';
import { CreateTesteGeralDto, UpdateTesteGeralDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import {
  ReadTesteGeralPolicyHandler,
  CreateTesteGeralPolicyHandler,
  UpdateTesteGeralPolicyHandler,
  DeleteTesteGeralPolicyHandler,
} from './teste-geral.policies';

import { TesteGeral } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Teste Geral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('teste-geral')
export class TesteGeralController {
  constructor(private readonly testeGeralService: TesteGeralService) {}

  @Post()
  @CheckPolicies(new CreateTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Criar novo registro' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Conflito - Email já existe' })
  async create(
    @Body() createDto: CreateTesteGeralDto,
    @Req() req: Request & { user: any },
  ) {
    return this.testeGeralService.create(createDto, req.user?.id);
  }

  @Get()
  @CheckPolicies(new ReadTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Listar todos os registros com paginação' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ATIVO', 'INATIVO', 'PENDENTE', 'CANCELADO', 'CONCLUIDO'] })
  @ApiQuery({ name: 'categoria', required: false, enum: ['TECNOLOGIA', 'FINANCEIRO', 'SAUDE', 'EDUCACAO', 'VENDAS', 'MARKETING', 'OPERACOES', 'OUTROS'] })
  @ApiQuery({ name: 'ativo', required: false, type: Boolean })
  @ApiQuery({ name: 'dateFrom', required: false, type: Date })
  @ApiQuery({ name: 'dateTo', required: false, type: Date })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoria') categoria?: string,
    @Query('ativo') ativo?: boolean,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
    @Query('tags') tags?: string[],
  ) {
    return this.testeGeralService.search({
      skip,
      take,
      search,
      status: status as any,
      categoria: categoria as any,
      ativo,
      dateFrom,
      dateTo,
      tags,
    });
  }

  @Get('search')
  @CheckPolicies(new ReadTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Obter estatísticas dos registros' })
  async getStats() {
    return this.testeGeralService.getStats();
  }

  @Get(':id')
  @CheckPolicies(new ReadTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Buscar registro por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.testeGeralService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies(new UpdateTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Atualizar registro' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito - Email já existe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTesteGeralDto,
    @Req() req: Request & { user: any },
  ) {
    return this.testeGeralService.update(id, updateDto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies(new DeleteTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Remover registro' })
  @ApiResponse({ status: 204, description: 'Registro removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.testeGeralService.remove(id);
  }

  @Patch(':id/toggle-status')
  @CheckPolicies(new UpdateTesteGeralPolicyHandler())
  @ApiOperation({ summary: 'Alternar status ativo/inativo' })
  @ApiResponse({ status: 200, description: 'Status alterado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.testeGeralService.toggleStatus(id, req.user?.id);
  }
}