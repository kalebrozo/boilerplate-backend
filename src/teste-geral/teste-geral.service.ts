import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTesteGeralDto, UpdateTesteGeralDto } from './dto';
import { Prisma, TesteGeral, Status, Categoria } from '@prisma/client';

@Injectable()
export class TesteGeralService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateTesteGeralDto, userId?: string): Promise<TesteGeral> {
    // Verificar se email já existe
    if (createDto.email) {
      const existing = await this.prisma.testeGeral.findUnique({
        where: { email: createDto.email },
      });
      if (existing) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    return this.prisma.testeGeral.create({
      data: {
        ...createDto,
        criadoPorId: userId,
        atualizadoPorId: userId,
      },
      include: {
        criadoPor: {
          select: { id: true, name: true, email: true },
        },
        atualizadoPor: {
          select: { id: true, name: true, email: true },
        },
        tenant: {
            select: { id: true, name: true },
          },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TesteGeralWhereUniqueInput;
    where?: Prisma.TesteGeralWhereInput;
    orderBy?: Prisma.TesteGeralOrderByWithRelationInput;
  }): Promise<{
    data: TesteGeral[];
    total: number;
    skip: number;
    take: number;
  }> {
    const { skip = 0, take = 10, cursor, where, orderBy } = params;

    const [data, total] = await Promise.all([
      this.prisma.testeGeral.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy: orderBy || { dataCriacao: 'desc' },
        include: {
          criadoPor: {
            select: { id: true, name: true, email: true },
          },
          atualizadoPor: {
            select: { id: true, name: true, email: true },
          },
          tenant: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.testeGeral.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async search(params: {
    search?: string;
    status?: Status;
    categoria?: Categoria;
    ativo?: boolean;
    tenantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
    skip?: number;
    take?: number;
    orderBy?: Prisma.TesteGeralOrderByWithRelationInput;
  }): Promise<{
    data: TesteGeral[];
    total: number;
  }> {
    const {
      search,
      status,
      categoria,
      ativo,
      tenantId,
      dateFrom,
      dateTo,
      tags,
      skip = 0,
      take = 10,
      orderBy,
    } = params;

    const where: Prisma.TesteGeralWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { nome: { contains: search, mode: 'insensitive' } },
                { descricao: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        status ? { status } : {},
        categoria ? { categoria } : {},
        ativo !== undefined ? { ativo } : {},
        tenantId ? { tenantId } : {},
        dateFrom ? { dataCriacao: { gte: dateFrom } } : {},
        dateTo ? { dataCriacao: { lte: dateTo } } : {},
        tags && tags.length > 0 ? { tags: { hasSome: tags } } : {},
      ],
    };

    return this.findAll({ skip, take, where, orderBy });
  }

  async findOne(id: string): Promise<TesteGeral> {
    const testeGeral = await this.prisma.testeGeral.findUnique({
      where: { id },
      include: {
        criadoPor: {
          select: { id: true, name: true, email: true },
        },
        atualizadoPor: {
          select: { id: true, name: true, email: true },
        },
        tenant: {
            select: { id: true, name: true },
          },
      },
    });

    if (!testeGeral) {
      throw new NotFoundException('Registro não encontrado');
    }

    return testeGeral;
  }

  async update(id: string, updateDto: UpdateTesteGeralDto, userId?: string): Promise<TesteGeral> {
    await this.findOne(id);

    // Verificar se email já existe (exceto para o próprio registro)
    if (updateDto.email) {
      const existing = await this.prisma.testeGeral.findFirst({
        where: {
          email: updateDto.email,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    return this.prisma.testeGeral.update({
      where: { id },
      data: {
        ...updateDto,
        atualizadoPorId: userId,
      },
      include: {
        criadoPor: {
          select: { id: true, name: true, email: true },
        },
        atualizadoPor: {
          select: { id: true, name: true, email: true },
        },
        tenant: {
            select: { id: true, name: true },
          },
      },
    });
  }

  async remove(id: string): Promise<TesteGeral> {
    await this.findOne(id);
    return this.prisma.testeGeral.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string, userId?: string): Promise<TesteGeral> {
    const testeGeral = await this.findOne(id);
    
    return this.prisma.testeGeral.update({
      where: { id },
      data: {
        ativo: !testeGeral.ativo,
        atualizadoPorId: userId,
      },
      include: {
        criadoPor: {
          select: { id: true, name: true, email: true },
        },
        atualizadoPor: {
          select: { id: true, name: true, email: true },
        },
        tenant: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getStats(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    porCategoria: { categoria: Categoria; count: number }[];
    porStatus: { status: Status; count: number }[];
  }> {
    const [total, ativos, inativos, porCategoria, porStatus] = await Promise.all([
      this.prisma.testeGeral.count(),
      this.prisma.testeGeral.count({ where: { ativo: true } }),
      this.prisma.testeGeral.count({ where: { ativo: false } }),
      this.prisma.testeGeral.groupBy({
        by: ['categoria'],
        _count: { categoria: true },
      }),
      this.prisma.testeGeral.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    return {
      total,
      ativos,
      inativos,
      porCategoria: porCategoria.map(item => ({
        categoria: item.categoria,
        count: item._count.categoria,
      })),
      porStatus: porStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
    };
  }
}