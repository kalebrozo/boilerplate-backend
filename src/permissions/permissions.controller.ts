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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Auditable } from '../audit/decorators/auditable.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @UseInterceptors(AuditInterceptor)
  @Auditable('CREATE_PERMISSION', 'Permission')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of permissions' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.permissionsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission details' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(AuditInterceptor)
  @Auditable('UPDATE_PERMISSION', 'Permission')
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @UseInterceptors(AuditInterceptor)
  @Auditable('DELETE_PERMISSION', 'Permission')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}