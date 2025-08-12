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

@ApiTags('Users V1')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller({ path: 'users', version: '1' })
@ApiVersion('1')
export class UsersV1Controller {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário (V1)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Create, 'User')))
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar usuários com filtros (V1)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  search(@Query() searchDto: SearchUserDto, @Request() req) {
    return this.usersService.search(searchDto, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID (V1)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário (V1)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Update, 'User')))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, updateUserDto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário (V1)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Delete, 'User')))
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.tenantId);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Alternar status do usuário (V1)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Update, 'User')))
  toggleStatus(@Param('id') id: string, @Request() req) {
    return this.usersService.toggleStatus(id, req.user.tenantId);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Estatísticas de usuários (V1)' })
  @CheckPolicies(new PolicyHandlerImpl((ability) => ability.can(Action.Read, 'User')))
  getStats(@Request() req) {
    return this.usersService.getStats(req.user.tenantId);
  }
}