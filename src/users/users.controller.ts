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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Auditable } from '../audit/decorators/auditable.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { PaginationDto } from '../common/dto/pagination.dto';
// Novos decorators criados
import {
  RateLimit,
  RateLimitPerUser,
  RateLimitHigh,
  RateLimitMedium,
  Cache,
  CachePerUser,
  CacheMedium,
  CacheInvalidate,
  InvalidateUserCache,
  Metrics,
  MetricsPerformance,
  MetricsPerUser,
  Tenant,
  TenantStrict,
  TenantValidated,
} from '../common/decorators';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RateLimitPerUser(10, 60) // 10 criações por usuário por minuto
  @UseInterceptors(AuditInterceptor)
  @Auditable('CREATE_USER', 'User')
  @CacheInvalidate({ patterns: ['users:*', 'user_stats:*'] })
  @MetricsPerformance('user_creation')
  @TenantStrict()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.tenantId);
  }

  @Get('search')
  @RateLimitHigh() // Rate limit alto para busca
  @CacheMedium({ includeQuery: true, includeTenant: true }) // Cache médio com query e tenant
  @MetricsPerUser('user_search')
  @TenantValidated()
  @ApiOperation({ summary: 'Search users with filters' })
  @ApiResponse({ status: 200, description: 'Paginated search results' })
  async search(@Query() searchDto: SearchUserDto, @Request() req) {
    return this.usersService.search(searchDto, req.user.tenantId);
  }

  @Get('stats')
  @RateLimit(50, 60) // 50 requisições por minuto
  @Cache({ ttl: 300, includeTenant: true }) // Cache por 5 minutos por tenant
  @Metrics('user_stats', { includeTenant: true })
  @Tenant({ isolation: true })
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getStats(@Request() req) {
    return this.usersService.getStats(req.user.tenantId);
  }

  @Get(':id')
  @RateLimitMedium() // Rate limit médio para busca individual
  @CachePerUser({ ttl: 600 }) // Cache por 10 minutos por usuário
  @MetricsPerformance('user_detail')
  @TenantStrict()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @RateLimitPerUser(20, 60) // 20 atualizações por usuário por minuto
  @UseInterceptors(AuditInterceptor)
  @Auditable('UPDATE_USER', 'User')
  @InvalidateUserCache({ patterns: ['users:*', 'user:*'] })
  @MetricsPerformance('user_update')
  @TenantStrict()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user.tenantId);
  }

  @Patch(':id/toggle-status')
  @RateLimitPerUser(10, 60) // 10 alterações de status por usuário por minuto
  @UseInterceptors(AuditInterceptor)
  @Auditable('TOGGLE_USER_STATUS', 'User')
  @InvalidateUserCache({ patterns: ['users:*', 'user:*', 'user_stats:*'] })
  @Metrics('user_status_toggle', { includeTenant: true, includeUser: true })
  @TenantStrict()
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status toggled successfully' })
  async toggleStatus(@Param('id') id: string, @Request() req) {
    return this.usersService.toggleStatus(id, req.user.tenantId);
  }

  @Delete(':id')
  @RateLimit(5, 60) // 5 exclusões por minuto (global)
  @UseInterceptors(AuditInterceptor)
  @Auditable('DELETE_USER', 'User')
  @InvalidateUserCache({ patterns: ['users:*', 'user:*', 'user_stats:*'] })
  @Metrics('user_deletion', { includeTenant: true, includeUser: true })
  @TenantStrict()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.tenantId);
  }
}