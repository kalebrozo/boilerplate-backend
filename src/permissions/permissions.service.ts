import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { 
        action_subject: {
          action: createPermissionDto.action,
          subject: createPermissionDto.subject
        }
      },
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy, search } = pagination;

    const where = search ? {
      OR: [
        { action: { contains: search, mode: 'insensitive' as const } },
        { subject: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: skip + take < total,
        hasPrev: skip > 0,
      },
    };
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (updatePermissionDto.action && updatePermissionDto.subject) {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { 
          action_subject: {
            action: updatePermissionDto.action,
            subject: updatePermissionDto.subject
          }
        },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException('Permission already exists');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.permission.delete({
      where: { id },
    });
  }
}