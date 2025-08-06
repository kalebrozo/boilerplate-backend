import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto): Promise<{
        permissions: {
            id: string;
            action: string;
            subject: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: ({
            permissions: {
                id: string;
                action: string;
                subject: string;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
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
            action: string;
            subject: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        permissions: {
            id: string;
            action: string;
            subject: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
    }>;
}
