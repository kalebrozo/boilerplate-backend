import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { SearchUserDto } from '../dto/search-user.dto';
import { ApiVersion } from '../../common/decorators/api-version.decorator';
import { PolicyHandlerImpl } from '../../casl/policy-handler-impl';
import { Action } from '../../casl/action.enum';

@ApiTags('Users V2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller({ path: 'users', version: '2' })
@ApiVersion('2')
export class UsersV2Controller {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário (V2 - Melhorado)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Create, 'User')))
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const user = await this.usersService.create(createUserDto, req.user.tenantId);
    
    // V2: Retorna dados adicionais
    return {
      user,
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        tenant: req.user.tenantId,
      },
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar usuários com filtros avançados (V2)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  async search(@Query() searchDto: SearchUserDto, @Request() req) {
    const result = await this.usersService.search(searchDto, req.user.tenantId);
    
    // V2: Adiciona metadados de paginação melhorados
    return {
      ...result,
      metadata: {
        version: '2.0',
        searchPerformed: new Date().toISOString(),
        hasNextPage: result.meta.page < result.meta.totalPages,
        hasPreviousPage: result.meta.page > 1,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID com dados expandidos (V2)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  async findOne(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.findOne(id, req.user.tenantId);
    
    // V2: Inclui dados expandidos
    return {
      user,
      metadata: {
        version: '2.0',
        lastAccessed: new Date().toISOString(),
        permissions: user.role?.permissions || [],
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário com auditoria (V2)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Update, 'User')))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    const user = await this.usersService.update(id, updateUserDto, req.user.tenantId);
    
    // V2: Adiciona informações de auditoria
    return {
      user,
      audit: {
        updatedBy: req.user.id,
        updatedAt: new Date().toISOString(),
        version: '2.0',
        changes: Object.keys(updateUserDto),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário (V2)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Delete, 'User')))
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.usersService.remove(id, req.user.tenantId);
    
    // V2: Confirmação de remoção
    return {
      success: true,
      deletedUser: result,
      metadata: {
        version: '2.0',
        deletedBy: req.user.id,
        deletedAt: new Date().toISOString(),
      },
    };
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Alternar status do usuário (V2)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Update, 'User')))
  async toggleStatus(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.toggleStatus(id, req.user.tenantId);
    
    // V2: Histórico de mudanças de status
    return {
      user,
      statusChange: {
        changedBy: req.user.id,
        changedAt: new Date().toISOString(),
        newStatus: user.isActive,
        version: '2.0',
      },
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Estatísticas avançadas de usuários (V2)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  async getStats(@Request() req) {
    const stats = await this.usersService.getStats(req.user.tenantId);
    
    // V2: Estatísticas mais detalhadas
    return {
      ...stats,
      advanced: {
        version: '2.0',
        generatedAt: new Date().toISOString(),
        tenant: req.user.tenantId,
        activePercentage: stats.total > 0 ? (stats.active / stats.total) * 100 : 0,
      },
    };
  }

  // V2: Novo endpoint exclusivo da versão 2
  @Get('profile/me')
  @ApiOperation({ summary: 'Obter perfil do usuário atual (V2 - Novo)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  async getMyProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id, req.user.tenantId);
    
    return {
      profile: user,
      session: {
        version: '2.0',
        loginTime: req.user.iat ? new Date(req.user.iat * 1000).toISOString() : null,
        expiresAt: req.user.exp ? new Date(req.user.exp * 1000).toISOString() : null,
      },
    };
  }

  // V2: Endpoint para bulk operations
  @Post('bulk/status')
  @ApiOperation({ summary: 'Atualizar status em lote (V2 - Novo)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Update, 'User')))
  async bulkUpdateStatus(
    @Body() body: { userIds: string[]; isActive: boolean },
    @Request() req,
  ) {
    const results = [];
    
    for (const userId of body.userIds) {
      try {
        const user = await this.usersService.update(
          userId,
          { isActive: body.isActive },
          req.user.tenantId,
        );
        results.push({ userId, success: true, user });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    return {
      results,
      summary: {
        total: body.userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        version: '2.0',
        processedAt: new Date().toISOString(),
      },
    };
  }
}