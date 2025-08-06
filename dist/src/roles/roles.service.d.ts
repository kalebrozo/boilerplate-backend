import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createRoleDto: CreateRoleDto): Promise<{
        permissions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            action: string;
            subject: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: ({
            permissions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                action: string;
                subject: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
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
        permissions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            action: string;
            subject: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        permissions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            action: string;
            subject: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
