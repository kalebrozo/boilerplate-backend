import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Auditable } from '../audit/decorators/auditable.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseInterceptors(AuditInterceptor)
  @Auditable('CREATE_ROLE', 'Role')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of roles' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.rolesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(AuditInterceptor)
  @Auditable('UPDATE_ROLE', 'Role')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @UseInterceptors(AuditInterceptor)
  @Auditable('DELETE_ROLE', 'Role')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}