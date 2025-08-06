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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Auditable } from '../audit/decorators/auditable.decorator';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseInterceptors(AuditInterceptor)
  @Auditable('CREATE_TENANT', 'Tenant')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of tenants' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.tenantsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(AuditInterceptor)
  @Auditable('UPDATE_TENANT', 'Tenant')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @UseInterceptors(AuditInterceptor)
  @Auditable('DELETE_TENANT', 'Tenant')
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}