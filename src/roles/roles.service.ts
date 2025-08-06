import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        permissions: createRoleDto.permissionIds ? {
          connect: createRoleDto.permissionIds.map(id => ({ id })),
        } : undefined,
      },
      include: { permissions: true },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy, search } = pagination;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: { permissions: true },
        skip,
        take,
        orderBy,
      }),
      this.prisma.role.count({ where }),
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
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        permissions: updateRoleDto.permissionIds ? {
          set: updateRoleDto.permissionIds.map(id => ({ id })),
        } : undefined,
      },
      include: { permissions: true },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}