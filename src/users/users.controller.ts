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
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Auditable } from '../audit/decorators/auditable.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UseCache, InvalidateCache } from '../cache/cache.interceptor';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 criações por minuto
  @UseInterceptors(AuditInterceptor)
  @Auditable('CREATE_USER', 'User')
  @InvalidateCache(['*:tenant:{tenantId}:*user*', '*:tenant:{tenantId}:*list*'])
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseCache(300) // Cache por 5 minutos
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @UseCache(600) // Cache por 10 minutos
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 atualizações por minuto
  @UseInterceptors(AuditInterceptor)
  @Auditable('UPDATE_USER', 'User')
  @InvalidateCache(['*:tenant:{tenantId}:*user*', '*:tenant:{tenantId}:*list*', '*:user:{id}:*'])
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 exclusões por minuto
  @UseInterceptors(AuditInterceptor)
  @Auditable('DELETE_USER', 'User')
  @InvalidateCache(['*:tenant:{tenantId}:*user*', '*:tenant:{tenantId}:*list*', '*:user:{id}:*'])
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}