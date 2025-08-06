import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(createTenantDto: CreateTenantDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        schema: string;
        updatedAt: Date;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            name: string;
            schema: string;
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
        createdAt: Date;
        name: string;
        schema: string;
        updatedAt: Date;
    }>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        schema: string;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        schema: string;
        updatedAt: Date;
    }>;
}
