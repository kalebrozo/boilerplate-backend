import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class PermissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        id: string;
        action: string;
        subject: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: {
            id: string;
            action: string;
            subject: string;
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
        action: string;
        subject: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<{
        id: string;
        action: string;
        subject: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        action: string;
        subject: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
