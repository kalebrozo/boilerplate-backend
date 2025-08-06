import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createTenantDto: CreateTenantDto): Promise<{
        id: string;
        name: string;
        schema: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: {
            id: string;
            name: string;
            schema: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        schema: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<{
        id: string;
        name: string;
        schema: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        schema: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private createTenantSchema;
    private runMigrationsForSchema;
    private dropTenantSchema;
}
