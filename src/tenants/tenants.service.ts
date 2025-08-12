import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    // Verificar se já existe
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { name: createTenantDto.name },
          { schema: createTenantDto.schema },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Tenant name or schema already exists');
    }

    // Criar tenant
    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
    });

    // Skip schema creation in test environment
    if (process.env.NODE_ENV !== 'test') {
      // Criar schema no banco
      await this.createTenantSchema(createTenantDto.schema);

      // Rodar migrações para o novo schema
      await this.runMigrationsForSchema(createTenantDto.schema);
    }

    return tenant;
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy, search } = pagination;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { schema: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        select: {
          id: true,
          name: true,
          schema: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take,
        orderBy,
      }),
      this.prisma.tenant.count({ where }),
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
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        schema: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Remover schema (opcional - cuidado em produção)
    await this.dropTenantSchema(tenant.schema);

    await this.prisma.tenant.delete({
      where: { id },
    });
    
    return { message: 'Tenant deleted successfully' };
  }

  private async createTenantSchema(schemaName: string) {
    // Criar schema
    await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  }

  private async runMigrationsForSchema(schemaName: string) {
    // Criar tabelas no schema do tenant
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT NOT NULL,
        roleId TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createRoleTable = `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Role" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createPermissionTable = `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Permission" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        subject TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(action, subject)
      );
    `;

    await this.prisma.$executeRawUnsafe(createUserTable);
    await this.prisma.$executeRawUnsafe(createRoleTable);
    await this.prisma.$executeRawUnsafe(createPermissionTable);

    // Criar relações
    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "${schemaName}"."User" 
      ADD CONSTRAINT fk_role 
      FOREIGN KEY (roleId) REFERENCES "${schemaName}"."Role"(id);
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."_PermissionToRole" (
        "A" TEXT NOT NULL REFERENCES "${schemaName}"."Permission"(id),
        "B" TEXT NOT NULL REFERENCES "${schemaName}"."Role"(id),
        PRIMARY KEY ("A", "B")
      );
    `);

    // Criar role admin padrão
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${schemaName}"."Role" (id, name) 
      VALUES (gen_random_uuid(), 'admin') 
      ON CONFLICT (name) DO NOTHING;
    `);

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${schemaName}"."Role" (id, name) 
      VALUES (gen_random_uuid(), 'user') 
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  private async dropTenantSchema(schemaName: string) {
    await this.prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  }
}